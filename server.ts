import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { chromium } from "playwright-core";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { Telegraf } from "telegraf";
import crypto from "crypto";
import { getDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "fresko-super-secret-key-parser";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "fresko_parser_bot";
const CRYPTO_BOT_TOKEN = process.env.CRYPTO_BOT_TOKEN || "";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Initialize DB
  const db = await getDb();

  // Initialize Telegraf Bot
  if (TELEGRAM_BOT_TOKEN) {
    const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
    bot.start(async (ctx) => {
      const payload = ctx.payload;
      
      if (payload.startsWith("login_")) {
        const code = payload.replace("login_", "");
        const telegramId = ctx.from.id.toString();
        const username = ctx.from.username || ctx.from.first_name;
        
        let user = await db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
        if (!user) {
          const id = uuidv4();
          await db.run(
            `INSERT INTO users (id, username, telegram_id, plan) VALUES (?, ?, ?, ?)`,
            [id, username, telegramId, 'NONE']
          );
          user = { id, username, telegram_id: telegramId, plan: 'NONE' };
        }
        
        await db.run(`UPDATE telegram_auth_requests SET status = 'completed', user_id = ? WHERE code = ?`, [user.id, code]);
        ctx.reply("Успешная авторизация! Вернитесь на сайт.");
      } else if (payload.startsWith("link_")) {
        const code = payload.replace("link_", "");
        const telegramId = ctx.from.id.toString();
        
        const req = await db.get(`SELECT * FROM telegram_auth_requests WHERE code = ?`, [code]);
        if (req && req.user_id) {
          await db.run(`UPDATE users SET telegram_id = ? WHERE id = ?`, [telegramId, req.user_id]);
          await db.run(`UPDATE telegram_auth_requests SET status = 'completed' WHERE code = ?`, [code]);
          ctx.reply("Telegram успешно привязан! Вернитесь на сайт.");
        } else {
          ctx.reply("Недействительный или устаревший код привязки.");
        }
      } else {
        ctx.reply("Добро пожаловать в бота Parser!");
      }
    });

    bot.launch().then(() => {
      console.log("Telegram bot launched!");
    }).catch((e) => {
      console.log("Failed to launch bot:", e);
    });
  }

  // Middleware for Auth
  const requireAuth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch(e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // In-memory data store for the session
  const tasks: any[] = [];
  const proxies: any[] = [];
  const results: any[] = [];

  // API Routes
  
  // -- AUTH ROUTES --
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Missing fields" });

      const existingParams = email ? [username, email] : [username];
      const existingQuery = email ? `username = ? OR email = ?` : `username = ?`;
      const existing = await db.get(`SELECT id FROM users WHERE ${existingQuery}`, existingParams);
      if (existing) return res.status(400).json({ error: "User already exists" });

      const id = uuidv4();
      const hash = await bcrypt.hash(password, 10);
      
      await db.run(
        `INSERT INTO users (id, email, username, password) VALUES (?, ?, ?, ?)`,
        [id, email || null, username, hash]
      );

      const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, user: { id, username, email } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { login, password } = req.body;
      if (!login || !password) return res.status(400).json({ error: "Missing fields" });

      const user = await db.get(`SELECT * FROM users WHERE username = ? OR email = ?`, [login, login]);
      if (!user) return res.status(400).json({ error: "Invalid credentials" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, plan: user.plan } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    const user = await db.get(`SELECT id, username, email, telegram_id, plan FROM users WHERE id = ?`, [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  });

  // BILLING ROUTES
  app.post("/api/billing/invoice", requireAuth, async (req: any, res) => {
    try {
      const { planId } = req.body;
      const plans = {
        "1m": { amount: 30, asset: "USDT" },
        "3m": { amount: 60, asset: "USDT" },
        "1y": { amount: 200, asset: "USDT" },
        "forever": { amount: 150, asset: "USDT" }
      };
      
      const plan = plans[planId as keyof typeof plans];
      if (!plan) return res.status(400).json({ error: "Invalid plan" });

      const cryptoBotToken = process.env.CRYPTO_BOT_TOKEN;

      if (!cryptoBotToken) {
        // Return placeholder or manual payment link since no token provided yet
        return res.json({ pay_url: `https://t.me/Fresko_CT?text=Хочу+оплатить+план+${planId}` });
      }

      const response = await fetch("https://pay.crypt.bot/api/createInvoice", {
        method: "POST",
        headers: {
          "Crypto-Pay-API-Token": cryptoBotToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          asset: plan.asset,
          amount: plan.amount.toString(),
          description: `Оплата тарифа ${planId} для пользователя ${req.user.username}`,
          payload: `${req.user.id}:${planId}` // We will process this on webhook
        })
      });

      const data = await response.json();
      if (data.ok) {
        res.json({ pay_url: data.result.pay_url });
      } else {
        res.status(500).json({ error: "Ошибка создания инвойса (CryptoBot)" });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/billing/webhook", async (req, res) => {
    try {
      const signature = req.headers["crypto-pay-api-signature"];
      if (!signature || !CRYPTO_BOT_TOKEN) {
        return res.status(400).send("No signature or token");
      }

      // Verify signature
      const secret = crypto.createHash('sha256').update(CRYPTO_BOT_TOKEN).digest();
      const checkString = JSON.stringify(req.body);
      const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

      if (hmac !== signature) {
        return res.status(401).send("Invalid signature");
      }

      const update = req.body;
      if (update.update_type === "invoice_paid") {
        const payload = update.payload.payload;
        if (payload) {
          const [userId, planId] = payload.split(":");
          if (userId && planId) {
            await db.run(`UPDATE users SET plan = ? WHERE id = ?`, [planId, userId]);
            console.log(`Updated user ${userId} to plan ${planId}`);
          }
        }
      }
      
      res.sendStatus(200);
    } catch(e) {
      console.error("Webhook error:", e);
      res.sendStatus(500);
    }
  });

  // ADMIN ROUTES
  app.post("/api/admin/grant-plan", requireAuth, async (req: any, res) => {
    try {
      const user = await db.get(`SELECT plan FROM users WHERE id = ?`, [req.user.id]);
      if (user?.plan !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { targetId, planId } = req.body;
      if (!targetId || !planId) return res.status(400).json({ error: "Missing parameters" });

      // Find user by ID or username or telegram_id
      const targetUser = await db.get(`SELECT id FROM users WHERE id = ? OR username = ? OR email = ?`, [targetId, targetId, targetId]);
      if (!targetUser) return res.status(404).json({ error: "User not found" });

      await db.run(`UPDATE users SET plan = ? WHERE id = ?`, [planId, targetUser.id]);
      res.json({ success: true, message: `План ${planId} выдан пользователю` });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // TELEGRAM ROUTES
  app.post("/api/auth/telegram/request", async (req, res) => {
    const code = uuidv4();
    await db.run(
      `INSERT INTO telegram_auth_requests (id, code, status) VALUES (?, ?, 'pending')`,
      [uuidv4(), code]
    );
    res.json({ code, botUsername: TELEGRAM_BOT_USERNAME });
  });

  app.get("/api/auth/telegram/status/:code", async (req, res) => {
    const request = await db.get(`SELECT * FROM telegram_auth_requests WHERE code = ?`, [req.params.code]);
    if (!request) return res.status(404).json({ error: "Not found" });
    
    if (request.status === "completed" && request.user_id) {
      const user = await db.get(`SELECT id, username, email, plan FROM users WHERE id = ?`, [request.user_id]);
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ status: "completed", user });
    } else {
      res.json({ status: "pending" });
    }
  });

  app.post("/api/auth/telegram/link", requireAuth, async (req: any, res) => {
    const code = uuidv4();
    await db.run(
      `INSERT INTO telegram_auth_requests (id, user_id, code, status) VALUES (?, ?, ?, 'pending')`,
      [uuidv4(), req.user.id, code]
    );
    res.json({ code, botUsername: TELEGRAM_BOT_USERNAME });
  });

  app.get("/api/auth/telegram/link-status/:code", requireAuth, async (req, res) => {
    const request = await db.get(`SELECT * FROM telegram_auth_requests WHERE code = ?`, [req.params.code]);
    if (!request) return res.status(404).json({ error: "Not found" });
    
    if (request.status === "completed") {
      res.json({ status: "completed" });
    } else {
      res.json({ status: "pending" });
    }
  });

  // -- APP ROUTES --
  app.get("/api/tasks", requireAuth, (req, res) => {
    res.json(tasks.filter(t => t.userId === (req as any).user.id));
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    const { keyword, engine, proxyId, limit, filters, country } = req.body;
    const userId = (req as any).user.id;
    const taskId = uuidv4();
    const newTask = {
      id: taskId,
      userId,
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

  app.get("/api/proxies", requireAuth, (req, res) => {
    res.json(proxies.filter(p => p.userId === (req as any).user.id));
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

  app.post("/api/proxies", requireAuth, (req, res) => {
    const { name, url } = req.body;
    const parsed = parseVless(url);
    const newProxy = { 
      id: uuidv4(), 
      userId: (req as any).user.id,
      name, 
      url, 
      status: "active",
      type: url.startsWith("vless://") ? "VLESS" : "SOCKS/HTTP",
      details: parsed
    };
    proxies.push(newProxy);
    res.json(newProxy);
  });

  app.get("/api/results", requireAuth, (req, res) => {
    // Only return results that belong to the user's tasks
    const userTaskIds = tasks.filter(t => t.userId === (req as any).user.id).map(t => t.id);
    res.json(results.filter(r => userTaskIds.includes(r.taskId)));
  });

  app.get("/api/results/export", requireAuth, (req, res) => {
    const { taskId } = req.query;
    const userTaskIds = tasks.filter(t => t.userId === (req as any).user.id).map(t => t.id);

    let csv = "ID,Тип,Значение,Запрос (Ключ),Источник,Дата\\n";
    let exportResults = results.filter(r => userTaskIds.includes(r.taskId));
    
    if (taskId && taskId !== "all") {
        exportResults = exportResults.filter(r => r.taskId === taskId);
    }
    
    exportResults.forEach(r => {
      const task = tasks.find(t => t.id === r.taskId);
      const keyword = task ? task.keyword : "Неизвестно";
      csv += `"${r.id}","${r.type}","${r.value}","${keyword}","${r.source}","${r.foundAt}"\n`;
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=results_${taskId !== "all" ? taskId : "all"}.csv`);
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
    const { createServer: createViteServer } = await import("vite");
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

startServer().catch(console.error);
