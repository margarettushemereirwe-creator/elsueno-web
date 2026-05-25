const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const db = require("./db");
const quotesFile = require("./quotes-file");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const CONFIG_FILE = path.join(ROOT, "config.json");

const sessions = new Map();

const BLOCKED_STATIC = [
  "/node_modules",
  "/data",
  "/database",
  "/.git",
  "/server.js",
  "/db.js",
  "/quotes-file.js",
  "/package.json",
  "/package-lock.json",
  "/config.json",
  "/database.json",
  "/render.yaml",
  "/.env",
];

app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-admin-token"
    );
    return res.sendStatus(204);
  }
  next();
});

function storageMode() {
  return db.isReady() ? "mysql" : "file";
}

async function readConfig() {
  if (process.env.ADMIN_PASSWORD) {
    return { adminPassword: process.env.ADMIN_PASSWORD };
  }
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { adminPassword: "elsueno-admin" };
  }
}

function getToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return req.headers["x-admin-token"] || "";
}

function isAuthed(req) {
  const token = getToken(req);
  return token && sessions.has(token);
}

function buildQuotePayload(body) {
  const { name, email, phone, projectType, message } = body || {};
  return {
    name: name.trim(),
    email: email.trim(),
    phone: (phone || "").trim(),
    projectType: projectType.trim(),
    message: message.trim(),
    status: "new",
    createdAt: new Date().toISOString(),
  };
}

async function getAllQuotes() {
  if (db.isReady()) return db.getAllQuotes();
  return quotesFile.getAllQuotes();
}

async function insertQuote(data, id) {
  if (db.isReady()) return db.insertQuote(data, id);
  return quotesFile.insertQuote(data, id);
}

async function updateQuote(id, updates) {
  if (db.isReady()) return db.updateQuoteById(id, updates);
  return quotesFile.updateQuoteById(id, updates);
}

async function deleteQuote(id) {
  if (db.isReady()) return db.deleteQuoteById(id);
  return quotesFile.deleteQuoteById(id);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/status", async (_req, res) => {
  const mode = storageMode();
  if (mode === "mysql") {
    const status = await db.ping();
    return res.status(status.ok ? 200 : 503).json({
      ...status,
      storage: "mysql",
      render: Boolean(process.env.RENDER),
    });
  }
  res.json({
    ok: true,
    storage: "file",
    database: "data/quotes.json",
    message: "MySQL not connected — quotes saved to local file. Set DB_* for MySQL.",
    render: Boolean(process.env.RENDER),
  });
});

app.post("/api/quotes", async (req, res) => {
  const { name, email, phone, projectType, message } = req.body || {};

  if (!name?.trim() || !email?.trim() || !projectType?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }

  try {
    const data = buildQuotePayload(req.body);
    const id = crypto.randomUUID();
    await insertQuote(data, id);
    res.status(201).json({ ok: true, id, storage: storageMode() });
  } catch (err) {
    console.error("POST /api/quotes", err);
    res.status(500).json({ error: "Could not save your request. Please try again." });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const config = await readConfig();
  const { password } = req.body || {};

  if (password !== config.adminPassword) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { createdAt: Date.now() });
  res.json({ ok: true, token, storage: storageMode() });
});

app.get("/api/quotes", async (req, res) => {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  try {
    const quotes = await getAllQuotes();
    res.json(quotes);
  } catch (err) {
    console.error("GET /api/quotes", err);
    res.status(500).json({ error: "Could not load quotes." });
  }
});

app.patch("/api/quotes/:id", async (req, res) => {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    const updated = await updateQuote(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: "Quote not found." });
    res.json(updated);
  } catch (err) {
    console.error("PATCH /api/quotes/:id", err);
    res.status(500).json({ error: "Could not update quote." });
  }
});

app.delete("/api/quotes/:id", async (req, res) => {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const removed = await deleteQuote(req.params.id);
    if (!removed) return res.status(404).json({ error: "Quote not found." });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/quotes/:id", err);
    res.status(500).json({ error: "Could not delete quote." });
  }
});

app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (BLOCKED_STATIC.some((blocked) => p === blocked || p.startsWith(`${blocked}/`))) {
    return res.sendStatus(404);
  }
  if (p.includes("..")) return res.sendStatus(400);
  next();
});

app.use(express.static(ROOT, { index: "index.html", dotfiles: "deny" }));

async function start() {
  app.listen(PORT, HOST, () => {
    console.log(`El Sueño CSLT listening on http://localhost:${PORT}`);
    console.log(`  Quote form: http://localhost:${PORT}/consultation.html`);
    console.log(`  Admin:      http://localhost:${PORT}/admin.html`);
    if (process.env.RENDER) {
      console.log("  Deployed on Render");
    }
  });

  await db.bootstrap();

  if (db.isReady()) {
    const config = await db.loadDbConfig();
    console.log(`  Storage: MySQL (${config.database} @ ${config.host})`);
  } else {
    console.warn("  Storage: data/quotes.json (MySQL not connected)");
    console.warn("  Copy database.json.example → database.json or set DB_* env vars for MySQL");
  }
}

start().catch((err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
