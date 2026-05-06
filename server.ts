import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { chromium } from "playwright";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // In-memory data store for the session
  const tasks: any[] = [];
  const proxies: any[] = [];
  const results: any[] = [];

  // API Routes
  app.get("/api/tasks", (req, res) => {
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    const { keyword, engine, proxyId, limit, filters, country } = req.body;
    const taskId = uuidv4();
    const newTask = {
      id: taskId,
      keyword,
      engine,
      country: country || "all",
      status: "pending",
      progress: 0,
      resultsCount: 0,
      limit: limit || 10,
      filters: filters || ["email", "phone", "telegram", "whatsapp"],
      logs: ["Задача создана в очереди"],
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);

    runParser(taskId, keyword, engine, proxyId, newTask.limit, newTask.filters, newTask.country).catch(console.error);

    res.json(newTask);
  });

  app.get("/api/proxies", (req, res) => {
    res.json(proxies);
  });

  // VLESS Link Parser Helper
  function parseVless(link: string) {
    try {
      const url = new URL(link);
      const uuid = url.username;
      const host = url.hostname;
      const port = url.port;
      const params = Object.fromEntries(url.searchParams);
      return { uuid, host, port, ...params };
    } catch (e) {
      return null;
    }
  }

  app.post("/api/proxies", (req, res) => {
    const { name, url } = req.body;
    const parsed = parseVless(url);
    const newProxy = { 
      id: uuidv4(), 
      name, 
      url, 
      status: "active",
      type: url.startsWith("vless://") ? "VLESS" : "SOCKS/HTTP",
      details: parsed
    };
    proxies.push(newProxy);
    res.json(newProxy);
  });

  app.get("/api/results", (req, res) => {
    res.json(results);
  });

  app.get("/api/results/export", (req, res) => {
    let csv = "ID,Тип,Значение,Источник,Дата\n";
    results.forEach(r => {
      csv += `"${r.id}","${r.type}","${r.value}","${r.source}","${r.foundAt}"\n`;
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=results.csv");
    res.send("\uFEFF" + csv); // Adding BOM for Excel Russian support
  });

  // Parser Logic
  async function runParser(taskId: string, keyword: string, engine: string, proxyId: string | undefined, limit: number, filters: string[], country: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const addLog = (msg: string) => {
      if (!task.logs) task.logs = [];
      task.logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
      if (task.logs.length > 50) task.logs.pop();
    };

    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ];

    task.status = "инициализация";
    addLog("Запуск движка Playwright (Stealth)...");
    task.progress = 5;

    const proxy = proxies.find((p) => p.id === proxyId);
    
    let browser: any;
    try {
      browser = await chromium.launch({ 
        headless: true,
        channel: 'msedge',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      addLog("Эмуляция реального пользователя...");
      const context = await browser.newContext({
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      });

      const page = await context.newPage();

      addLog(`Поиск [${country}] в ${engine}: ${keyword}`);
      
      let searchUrl = "";
      const countryParams: Record<string, string> = {
        ru: "&gl=ru&hl=ru",
        us: "&gl=us&hl=en",
        de: "&gl=de&hl=de",
        ua: "&gl=ua&hl=uk",
        kz: "&gl=kz&hl=ru"
      };

      if (engine === "google") {
        const geo = countryParams[country] || "";
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=100${geo}`;
      } else {
        const geo = country === "all" ? "" : `&kl=${country}-${country}`;
        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(keyword)}${geo}`;
      }

      // Случайная задержка перед запросом
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      
      let processedLinks = new Set<string>();
      let maxSearchLoops = 20;
      let currentSearchLoop = 0;
      
      const searchPage = page; // Use the already opened page
      
      task.progress = 10;
      
      while (task.resultsCount < limit && currentSearchLoop < maxSearchLoops) {
        currentSearchLoop++;
        let currentSearchUrl = searchUrl;
        
        if (engine === "google") {
           const offset = (currentSearchLoop - 1) * 100;
           currentSearchUrl = `${searchUrl}&start=${offset}`;
        }
        
        if (currentSearchLoop === 1) {
           await searchPage.goto(currentSearchUrl, { waitUntil: "networkidle", timeout: 45000 });
           const pageTitle = await searchPage.title();
           addLog(`Заголовок страницы: ${pageTitle}`);

           if (pageTitle.toLowerCase().includes("captcha") || pageTitle.toLowerCase().includes("robot") || pageTitle.toLowerCase().includes("security")) {
             addLog("ВНИМАНИЕ: Обнаружена защита от ботов (CAPTCHA). Рекомендуется сменить IP/VLESS.");
           }
        } else if (engine === "google") {
           await searchPage.goto(currentSearchUrl, { waitUntil: "networkidle", timeout: 45000 });
        } else {
           // duckduckgo keeps endless scroll, just scroll more on the same page
        }

        if (engine === "duckduckgo" || engine === "google") {
          addLog("Прокрутка результатов поиска...");
          for (let i = 0; i < 5; i++) {
            await searchPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        const content = await searchPage.content();
        const $ = cheerio.load(content);

        addLog(`Сбор ссылок (Попытка ${currentSearchLoop}/${maxSearchLoops})...`);

        const links: string[] = [];
        
        // Агрессивный сбор ссылок из выдачи
        $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          
          let cleanUrl = href;
          
          // Обработка редиректов Google (/url?q=...)
          if (href.includes("/url?q=")) {
            try {
              const searchParams = new URL(href, "https://google.com").searchParams;
              cleanUrl = searchParams.get("q") || href;
            } catch(e) {}
          }

          // Фильтр мусора и системных ссылок
          const isSystem = [
            "google.", "gstatic.", "duckduckgo.", "bing.", "yandex.", 
            "doubleclick.", "w3.org", "schema.org", "youtube.com", 
            "facebook.com", "instagram.com", "twitter.com", "linkedin.com",
            "apple.com", "microsoft.com", "cloudflare.com", "support.google",
            "accounts.google", "maps.google"
          ].some(d => cleanUrl.toLowerCase().includes(d));

          if (cleanUrl.startsWith("http") && !isSystem) {
            // Убираем параметры из URL для чистоты
            try {
              const urlObj = new URL(cleanUrl);
              links.push(urlObj.origin + urlObj.pathname);
            } catch(e) {
              links.push(cleanUrl);
            }
          }
        });

        if (links.length === 0) {
          // Пробуем искать по упрощенному селектору, если агрессивный не сработал
          $("h3").each((i, el) => {
              const parentA = $(el).closest('a').attr('href');
              if (parentA && parentA.startsWith('http')) links.push(parentA);
          });
        }
        
        const newLinks = Array.from(new Set(links)).filter(l => !processedLinks.has(l));
        
        if (newLinks.length === 0) {
          addLog("Новых ссылок на этой странице не найдено. Пробуем дальше...");
          if (engine === "duckduckgo" && currentSearchLoop >= 8) break; // If we keep scrolling DDG and get nothing, stop
          continue;
        }

        addLog(`УСПЕХ: Взято в работу ${newLinks.length} новых сайтов.`);
        newLinks.forEach(l => processedLinks.add(l));
        task.status = `Парсинг новых сайтов (${newLinks.length})...`;

        // Параллельная обработка пачками (Pool size = 5)
        const CONCURRENCY = 5;
        for (let i = 0; i < newLinks.length; i += CONCURRENCY) {
          if (task.resultsCount >= limit) {
            addLog(`Достигнут лимит контактов (${limit}). Отмена новых переходов...`);
            break;
          }

          const batch = newLinks.slice(i, i + CONCURRENCY);
        
        await Promise.all(batch.map(async (link) => {
          let batchPage;
          try {
            batchPage = await context.newPage();
            // Отключаем лишние ресурсы для скорости
            await batchPage.route('**/*.{png,jpg,jpeg,svg,css,woff,woff2}', route => route.abort());
            
            addLog(`Переход: ${link.split('/')[2]}`);
            await batchPage.goto(link, { waitUntil: "domcontentloaded", timeout: 15000 });
            const pageHtml = await batchPage.content();
            
            const foundItems: {type: string, value: string}[] = [];

            // Email (Более точный regex)
            if (filters.includes("email")) {
              const emails = pageHtml.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+\.[a-zA-Z]{2,6}/g) || [];
              emails.forEach(v => {
                if (!v.includes('.png') && !v.includes('.jpg')) {
                  foundItems.push({type: "Email", value: v.toLowerCase()});
                }
              });
            }

            // Telegram (Улучшенный)
            if (filters.includes("telegram")) {
              const tgLinks = pageHtml.match(/(?:t\.me|telegram\.me|tg:\/\/resolve\?domain=)([a-zA-Z0-9_]{5,})/gi) || [];
              tgLinks.forEach(v => {
                const username = v.split('/').pop()?.replace('resolve?domain=', '');
                if (username) foundItems.push({type: "Telegram", value: `@${username}`});
              });
            }

            // WhatsApp (Улучшенный)
            if (filters.includes("whatsapp")) {
              const wa = pageHtml.match(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=|whatsapp:)(\d{10,15})/g) || [];
              wa.forEach(v => {
                const phone = v.match(/\d+/)?.[0];
                if (phone) foundItems.push({type: "WhatsApp", value: `+${phone}`});
              });
            }

            // Phones (International Support)
            if (filters.includes("phone")) {
              // Находим номера разных стран: +1 (USA), +49 (DE), +7 (RU/KZ) и т.д.
              const intlPhones = pageHtml.match(/(?:\+|00)\d{1,3}[\s\-]?\(?\d{2,5}\)?[\s\-]?\d{3,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4}/g) || [];
              const ruPhones = pageHtml.match(/(?:\+7|8|7)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g) || [];
              
              const allFound = [...intlPhones, ...ruPhones];
              
              allFound.forEach(v => {
                const cleaned = v.replace(/[^\d+]/g, '').replace(/^00/, '+');
                // Валидация длины для исключения мусора
                if (cleaned.length >= 11 && cleaned.length <= 15) {
                  foundItems.push({type: "Телефон", value: cleaned});
                } else if (cleaned.length === 10 && (country === 'us' || country === 'all')) {
                  foundItems.push({type: "Телефон", value: cleaned}); // Local US
                }
              });
            }

            foundItems.forEach(item => {
              if (task.resultsCount >= limit) return; // Проверка лимита внутри результатов сайта
              if (!results.find(r => r.taskId === taskId && r.value === item.value)) {
                results.push({
                  id: uuidv4(),
                  taskId,
                  type: item.type,
                  value: item.value,
                  source: link,
                  foundAt: new Date().toLocaleString("ru-RU")
                });
                task.resultsCount++;
                task.progress = Math.floor((task.resultsCount / limit) * 100);
                addLog(`Найдено [${item.type}]: ${item.value.slice(0, 20)}...`);
              }
            });

          } catch (e) {
            addLog(`Ошибка [${link.split('/')[2]}]: ${String(e).slice(0, 30)}`);
          } finally {
            if (batchPage) await batchPage.close();
          }
        }));
      } // end of batch processing
      
      } // end of while loop (search loop)

      if (searchPage && !searchPage.isClosed()) await searchPage.close();
      await browser.close();
      task.status = "завершено";
      addLog("Парсинг полностью завершен!");
      task.progress = 100;
    } catch (error) {
      addLog(`КРИТИЧЕСКАЯ ОШИБКА: ${error}`);
      if (browser) await browser.close();
      task.status = "ошибка";
      task.error = String(error);
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
