const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

const ROOT = __dirname;
const DATABASE_CONFIG_FILE = path.join(ROOT, "database.json");
const LEGACY_QUOTES_FILE = path.join(ROOT, "data", "quotes.json");

let pool = null;
let dbReady = false;
let dbError = null;

function envFlag(name) {
  const v = process.env[name];
  return v === "1" || v === "true" || v === "TRUE";
}

async function loadDbConfig() {
  const fromEnv = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL,
  };

  let fromFile = {};
  try {
    const raw = await fs.readFile(DATABASE_CONFIG_FILE, "utf8");
    fromFile = JSON.parse(raw);
  } catch {
    /* optional local file */
  }

  const config = {
    host: fromEnv.host || fromFile.host || "localhost",
    port: fromEnv.port || fromFile.port || 3306,
    user: fromEnv.user || fromFile.user || "root",
    password: fromEnv.password ?? fromFile.password ?? "",
    database: fromEnv.database || fromFile.database || "elsueno_cslt",
    ssl:
      fromEnv.ssl !== undefined
        ? envFlag("DB_SSL") || fromEnv.ssl === "true"
        : fromFile.ssl === true,
  };

  if (!config.user || !config.database) {
    throw new Error(
      "MySQL is not configured. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME on Render (or use database.json locally)."
    );
  }

  return config;
}

function buildPoolOptions(config) {
  const options = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
  };

  if (config.ssl) {
    options.ssl = { rejectUnauthorized: true };
  }

  return options;
}

async function getPool() {
  if (!dbReady) {
    throw dbError || new Error("Database is not connected yet.");
  }
  return pool;
}

async function connectDatabase() {
  const config = await loadDbConfig();
  pool = mysql.createPool(buildPoolOptions(config));
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  dbReady = true;
  dbError = null;
  return config;
}

function rowToQuote(row) {
  const createdAt = row.created_at;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    projectType: row.project_type,
    message: row.message,
    status: row.status,
    createdAt:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : new Date(createdAt).toISOString(),
  };
}

async function initDatabase() {
  const p = await getPool();
  await p.execute(`
    CREATE TABLE IF NOT EXISTS quotes (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL DEFAULT '',
      project_type VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status ENUM('new', 'reviewed') NOT NULL DEFAULT 'new',
      created_at DATETIME(3) NOT NULL,
      INDEX idx_quotes_created_at (created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function migrateFromJsonIfEmpty() {
  const p = await getPool();
  const [rows] = await p.execute("SELECT COUNT(*) AS count FROM quotes");
  if (Number(rows[0].count) > 0) return 0;

  let legacy = [];
  try {
    const raw = await fs.readFile(LEGACY_QUOTES_FILE, "utf8");
    legacy = JSON.parse(raw);
  } catch {
    return 0;
  }

  if (!Array.isArray(legacy) || legacy.length === 0) return 0;

  let imported = 0;
  for (const q of legacy) {
    if (!q?.id || !q?.name || !q?.email || !q?.projectType || !q?.message) continue;
    const status = q.status === "reviewed" ? "reviewed" : "new";
    const createdAt = q.createdAt ? new Date(q.createdAt) : new Date();
    await p.execute(
      `INSERT IGNORE INTO quotes
        (id, name, email, phone, project_type, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.id,
        q.name.trim(),
        q.email.trim(),
        (q.phone || "").trim(),
        q.projectType.trim(),
        q.message.trim(),
        status,
        createdAt,
      ]
    );
    imported += 1;
  }

  if (imported > 0) {
    console.log(`Imported ${imported} quote(s) from data/quotes.json into MySQL`);
  }
  return imported;
}

async function getAllQuotes() {
  const p = await getPool();
  const [rows] = await p.execute(
    "SELECT id, name, email, phone, project_type, message, status, created_at FROM quotes ORDER BY created_at DESC"
  );
  return rows.map(rowToQuote);
}

async function insertQuote(data, id) {
  const p = await getPool();
  const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  await p.execute(
    `INSERT INTO quotes (id, name, email, phone, project_type, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.email,
      data.phone || "",
      data.projectType,
      data.message,
      data.status || "new",
      createdAt,
    ]
  );
  return { ...data, id, createdAt: createdAt.toISOString() };
}

async function updateQuoteById(id, updates) {
  const p = await getPool();
  const fields = [];
  const values = [];

  if (updates.status) {
    fields.push("status = ?");
    values.push(updates.status);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const [result] = await p.execute(
    `UPDATE quotes SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  if (result.affectedRows === 0) return null;

  const [rows] = await p.execute(
    "SELECT id, name, email, phone, project_type, message, status, created_at FROM quotes WHERE id = ?",
    [id]
  );
  return rows[0] ? rowToQuote(rows[0]) : null;
}

async function deleteQuoteById(id) {
  const p = await getPool();
  const [result] = await p.execute("DELETE FROM quotes WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

async function ping() {
  if (!dbReady) {
    return {
      ok: false,
      database: null,
      error: dbError?.message || "Database not connected",
    };
  }
  const p = await getPool();
  await p.query("SELECT 1");
  const config = await loadDbConfig();
  return { ok: true, database: config.database };
}

async function bootstrap() {
  try {
    const config = await connectDatabase();
    await initDatabase();
    await migrateFromJsonIfEmpty();
    console.log(`MySQL ready (${config.database} @ ${config.host})`);
    return config;
  } catch (err) {
    dbReady = false;
    dbError = err;
    pool = null;
    console.error("MySQL connection failed:", err.message);
    console.error(
      "On Render: set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (and DB_SSL=true for cloud MySQL)."
    );
    return null;
  }
}

function isReady() {
  return dbReady;
}

module.exports = {
  bootstrap,
  isReady,
  getAllQuotes,
  insertQuote,
  updateQuoteById,
  deleteQuoteById,
  ping,
  loadDbConfig,
};
