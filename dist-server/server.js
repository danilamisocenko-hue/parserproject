// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { chromium } from "playwright";
import * as cheerio from "cheerio";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = 3e3;
  try {
    const { execSync } = await import("child_process");
    console.log("Checking/Installing Playwright browsers...");
    execSync("npx playwright install chromium", { stdio: "ignore", windowsHide: true });
  } catch (e) {
    console.warn("Could not auto-install Playwright browsers:", e);
  }
  app.use(express.json());
  const tasks = [];
  const proxies = [];
  const results = [];
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
      logs: ["\u0417\u0430\u0434\u0430\u0447\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0430 \u0432 \u043E\u0447\u0435\u0440\u0435\u0434\u0438"],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    tasks.push(newTask);
    runParser(taskId, keyword, engine, proxyId, newTask.limit, newTask.filters, newTask.country).catch(console.error);
    res.json(newTask);
  });
  app.get("/api/proxies", (req, res) => {
    res.json(proxies);
  });
  function parseVless(link) {
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
    let csv = "ID,\u0422\u0438\u043F,\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435,\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A,\u0414\u0430\u0442\u0430\n";
    results.forEach((r) => {
      csv += `"${r.id}","${r.type}","${r.value}","${r.source}","${r.foundAt}"
`;
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=results.csv");
    res.send("\uFEFF" + csv);
  });
  async function runParser(taskId, keyword, engine, proxyId, limit, filters, country) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const addLog = (msg) => {
      if (!task.logs) task.logs = [];
      task.logs.unshift(`[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${msg}`);
      if (task.logs.length > 50) task.logs.pop();
    };
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ];
    task.status = "\u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F";
    addLog("\u0417\u0430\u043F\u0443\u0441\u043A \u0434\u0432\u0438\u0436\u043A\u0430 Playwright (Stealth)...");
    task.progress = 5;
    const proxy = proxies.find((p) => p.id === proxyId);
    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-blink-features=AutomationControlled"
        ]
      });
      addLog("\u042D\u043C\u0443\u043B\u044F\u0446\u0438\u044F \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F...");
      const context = await browser.newContext({
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1
      });
      const page = await context.newPage();
      addLog(`\u041F\u043E\u0438\u0441\u043A [${country}] \u0432 ${engine}: ${keyword}`);
      let searchUrl = "";
      const countryParams = {
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
      await new Promise((r) => setTimeout(r, 1e3 + Math.random() * 2e3));
      let processedLinks = /* @__PURE__ */ new Set();
      let maxSearchLoops = 20;
      let currentSearchLoop = 0;
      const searchPage = page;
      task.progress = 10;
      while (task.resultsCount < limit && currentSearchLoop < maxSearchLoops) {
        currentSearchLoop++;
        let currentSearchUrl = searchUrl;
        if (engine === "google") {
          const offset = (currentSearchLoop - 1) * 100;
          currentSearchUrl = `${searchUrl}&start=${offset}`;
        }
        if (currentSearchLoop === 1) {
          await searchPage.goto(currentSearchUrl, { waitUntil: "networkidle", timeout: 45e3 });
          const pageTitle = await searchPage.title();
          addLog(`\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B: ${pageTitle}`);
          if (pageTitle.toLowerCase().includes("captcha") || pageTitle.toLowerCase().includes("robot") || pageTitle.toLowerCase().includes("security")) {
            addLog("\u0412\u041D\u0418\u041C\u0410\u041D\u0418\u0415: \u041E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u0430 \u0437\u0430\u0449\u0438\u0442\u0430 \u043E\u0442 \u0431\u043E\u0442\u043E\u0432 (CAPTCHA). \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F \u0441\u043C\u0435\u043D\u0438\u0442\u044C IP/VLESS.");
          }
        } else if (engine === "google") {
          await searchPage.goto(currentSearchUrl, { waitUntil: "networkidle", timeout: 45e3 });
        } else {
        }
        if (engine === "duckduckgo" || engine === "google") {
          addLog("\u041F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0430 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432 \u043F\u043E\u0438\u0441\u043A\u0430...");
          for (let i = 0; i < 5; i++) {
            await searchPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise((r) => setTimeout(r, 1e3));
          }
        }
        const content = await searchPage.content();
        const $ = cheerio.load(content);
        addLog(`\u0421\u0431\u043E\u0440 \u0441\u0441\u044B\u043B\u043E\u043A (\u041F\u043E\u043F\u044B\u0442\u043A\u0430 ${currentSearchLoop}/${maxSearchLoops})...`);
        const links = [];
        $("a").each((i, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          let cleanUrl = href;
          if (href.includes("/url?q=")) {
            try {
              const searchParams = new URL(href, "https://google.com").searchParams;
              cleanUrl = searchParams.get("q") || href;
            } catch (e) {
            }
          }
          const isSystem = [
            "google.",
            "gstatic.",
            "duckduckgo.",
            "bing.",
            "yandex.",
            "doubleclick.",
            "w3.org",
            "schema.org",
            "youtube.com",
            "facebook.com",
            "instagram.com",
            "twitter.com",
            "linkedin.com",
            "apple.com",
            "microsoft.com",
            "cloudflare.com",
            "support.google",
            "accounts.google",
            "maps.google"
          ].some((d) => cleanUrl.toLowerCase().includes(d));
          if (cleanUrl.startsWith("http") && !isSystem) {
            try {
              const urlObj = new URL(cleanUrl);
              links.push(urlObj.origin + urlObj.pathname);
            } catch (e) {
              links.push(cleanUrl);
            }
          }
        });
        if (links.length === 0) {
          $("h3").each((i, el) => {
            const parentA = $(el).closest("a").attr("href");
            if (parentA && parentA.startsWith("http")) links.push(parentA);
          });
        }
        const newLinks = Array.from(new Set(links)).filter((l) => !processedLinks.has(l));
        if (newLinks.length === 0) {
          addLog("\u041D\u043E\u0432\u044B\u0445 \u0441\u0441\u044B\u043B\u043E\u043A \u043D\u0430 \u044D\u0442\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E. \u041F\u0440\u043E\u0431\u0443\u0435\u043C \u0434\u0430\u043B\u044C\u0448\u0435...");
          if (engine === "duckduckgo" && currentSearchLoop >= 8) break;
          continue;
        }
        addLog(`\u0423\u0421\u041F\u0415\u0425: \u0412\u0437\u044F\u0442\u043E \u0432 \u0440\u0430\u0431\u043E\u0442\u0443 ${newLinks.length} \u043D\u043E\u0432\u044B\u0445 \u0441\u0430\u0439\u0442\u043E\u0432.`);
        newLinks.forEach((l) => processedLinks.add(l));
        task.status = `\u041F\u0430\u0440\u0441\u0438\u043D\u0433 \u043D\u043E\u0432\u044B\u0445 \u0441\u0430\u0439\u0442\u043E\u0432 (${newLinks.length})...`;
        const CONCURRENCY = 5;
        for (let i = 0; i < newLinks.length; i += CONCURRENCY) {
          if (task.resultsCount >= limit) {
            addLog(`\u0414\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442 \u043B\u0438\u043C\u0438\u0442 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u0432 (${limit}). \u041E\u0442\u043C\u0435\u043D\u0430 \u043D\u043E\u0432\u044B\u0445 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u043E\u0432...`);
            break;
          }
          const batch = newLinks.slice(i, i + CONCURRENCY);
          await Promise.all(batch.map(async (link) => {
            let batchPage;
            try {
              batchPage = await context.newPage();
              await batchPage.route("**/*.{png,jpg,jpeg,svg,css,woff,woff2}", (route) => route.abort());
              addLog(`\u041F\u0435\u0440\u0435\u0445\u043E\u0434: ${link.split("/")[2]}`);
              await batchPage.goto(link, { waitUntil: "domcontentloaded", timeout: 15e3 });
              const pageHtml = await batchPage.content();
              const foundItems = [];
              if (filters.includes("email")) {
                const emails = pageHtml.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+\.[a-zA-Z]{2,6}/g) || [];
                emails.forEach((v) => {
                  if (!v.includes(".png") && !v.includes(".jpg")) {
                    foundItems.push({ type: "Email", value: v.toLowerCase() });
                  }
                });
              }
              if (filters.includes("telegram")) {
                const tgLinks = pageHtml.match(/(?:t\.me|telegram\.me|tg:\/\/resolve\?domain=)([a-zA-Z0-9_]{5,})/gi) || [];
                tgLinks.forEach((v) => {
                  const username = v.split("/").pop()?.replace("resolve?domain=", "");
                  if (username) foundItems.push({ type: "Telegram", value: `@${username}` });
                });
              }
              if (filters.includes("whatsapp")) {
                const wa = pageHtml.match(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=|whatsapp:)(\d{10,15})/g) || [];
                wa.forEach((v) => {
                  const phone = v.match(/\d+/)?.[0];
                  if (phone) foundItems.push({ type: "WhatsApp", value: `+${phone}` });
                });
              }
              if (filters.includes("phone")) {
                const intlPhones = pageHtml.match(/(?:\+|00)\d{1,3}[\s\-]?\(?\d{2,5}\)?[\s\-]?\d{3,4}[\s\-]?\d{2,4}[\s\-]?\d{2,4}/g) || [];
                const ruPhones = pageHtml.match(/(?:\+7|8|7)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g) || [];
                const allFound = [...intlPhones, ...ruPhones];
                allFound.forEach((v) => {
                  const cleaned = v.replace(/[^\d+]/g, "").replace(/^00/, "+");
                  if (cleaned.length >= 11 && cleaned.length <= 15) {
                    foundItems.push({ type: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", value: cleaned });
                  } else if (cleaned.length === 10 && (country === "us" || country === "all")) {
                    foundItems.push({ type: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", value: cleaned });
                  }
                });
              }
              foundItems.forEach((item) => {
                if (task.resultsCount >= limit) return;
                if (!results.find((r) => r.taskId === taskId && r.value === item.value)) {
                  results.push({
                    id: uuidv4(),
                    taskId,
                    type: item.type,
                    value: item.value,
                    source: link,
                    foundAt: (/* @__PURE__ */ new Date()).toLocaleString("ru-RU")
                  });
                  task.resultsCount++;
                  task.progress = Math.floor(task.resultsCount / limit * 100);
                  addLog(`\u041D\u0430\u0439\u0434\u0435\u043D\u043E [${item.type}]: ${item.value.slice(0, 20)}...`);
                }
              });
            } catch (e) {
              addLog(`\u041E\u0448\u0438\u0431\u043A\u0430 [${link.split("/")[2]}]: ${String(e).slice(0, 30)}`);
            } finally {
              if (batchPage) await batchPage.close();
            }
          }));
        }
      }
      if (searchPage && !searchPage.isClosed()) await searchPage.close();
      await browser.close();
      task.status = "\u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E";
      addLog("\u041F\u0430\u0440\u0441\u0438\u043D\u0433 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D!");
      task.progress = 100;
    } catch (error) {
      addLog(`\u041A\u0420\u0418\u0422\u0418\u0427\u0415\u0421\u041A\u0410\u042F \u041E\u0428\u0418\u0411\u041A\u0410: ${error}`);
      if (browser) await browser.close();
      task.status = "\u043E\u0448\u0438\u0431\u043A\u0430";
      task.error = String(error);
    }
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
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
