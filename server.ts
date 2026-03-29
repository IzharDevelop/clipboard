import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbClient: MongoClient | null = null;
let database: Db | null = null;

async function getDb(): Promise<Db> {
  if (database) return database;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is required");
  }

  try {
    dbClient = new MongoClient(uri);
    await dbClient.connect();
    database = dbClient.db();
    console.log("Connected to MongoDB");
    return database;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

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
      const db = await getDb();
      const clips = await db.collection("clips").find({}).toArray();
      // Convert array to the old object format for compatibility if needed, 
      // but since we are moving to privacy-first, maybe we don't even need this route 
      // to return everything. However, let's keep it working for now.
      const result: Record<string, string> = {};
      clips.forEach(clip => {
        result[clip.key] = clip.message;
      });
      res.set('Cache-Control', 'public, max-age=5');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to read database" });
    }
  });

  app.get("/api/clipboard/:key", async (req, res) => {
    try {
      const db = await getDb();
      const key = req.params.key;
      const clip = await db.collection("clips").findOne({ key });
      if (clip) {
        res.json({ key, message: clip.message });
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
      const db = await getDb();
      
      // Check if key already exists to prevent modification (paten)
      const existing = await db.collection("clips").findOne({ key });
      if (existing) {
        return res.status(409).json({ 
          error: "This key is already in use and its content cannot be changed (Paten)." 
        });
      }

      await db.collection("clips").insertOne({ 
        key, 
        message, 
        createdAt: new Date() 
      });
      
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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
