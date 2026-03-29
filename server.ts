import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "database", "clipboard.json");

async function ensureDb() {
  const dir = path.dirname(DB_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({}));
  }
}

async function readDb() {
  await ensureDb();
  const data = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(compression());
  app.use(express.json());

  // SEO Files
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nAllow: /\nSitemap: " + req.protocol + "://" + req.get("host") + "/sitemap.xml");
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    const host = req.protocol + "://" + req.get("host");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  });

  app.get("/manifest.json", (req, res) => {
    res.sendFile(path.join(__dirname, "manifest.json"));
  });

  // API Routes
  app.get("/api/clipboard", async (req, res) => {
    try {
      const db = await readDb();
      // Add a small cache for the list to improve speed
      res.set('Cache-Control', 'public, max-age=5');
      res.json(db);
    } catch (error) {
      res.status(500).json({ error: "Failed to read database" });
    }
  });

  app.get("/api/clipboard/:key", async (req, res) => {
    try {
      const db = await readDb();
      const key = req.params.key;
      if (db[key]) {
        res.json({ key, message: db[key] });
      } else {
        res.status(404).json({ error: "Key not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to read database" });
    }
  });

  app.post("/api/clipboard", async (req, res) => {
    try {
      const { key, message } = req.body;
      if (!key || !message) {
        return res.status(400).json({ error: "Key and message are required" });
      }
      const db = await readDb();
      db[key] = message;
      await writeDb(db);
      res.json({ success: true, key, message });
    } catch (error) {
      res.status(500).json({ error: "Failed to save to database" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
