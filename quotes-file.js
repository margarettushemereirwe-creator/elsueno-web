const fs = require("fs").promises;
const path = require("path");

const QUOTES_FILE = path.join(__dirname, "data", "quotes.json");

function sortQuotes(quotes) {
  return quotes.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

async function readAll() {
  try {
    const raw = await fs.readFile(QUOTES_FILE, "utf8");
    return sortQuotes(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function writeAll(quotes) {
  await fs.mkdir(path.dirname(QUOTES_FILE), { recursive: true });
  await fs.writeFile(QUOTES_FILE, JSON.stringify(sortQuotes(quotes), null, 2), "utf8");
}

async function getAllQuotes() {
  return readAll();
}

async function insertQuote(data, id) {
  const record = { ...data, id };
  const quotes = await readAll();
  quotes.unshift(record);
  await writeAll(quotes);
  return record;
}

async function updateQuoteById(id, updates) {
  const quotes = await readAll();
  const index = quotes.findIndex((q) => q.id === id);
  if (index === -1) return null;
  Object.assign(quotes[index], updates);
  await writeAll(quotes);
  return quotes[index];
}

async function deleteQuoteById(id) {
  const quotes = await readAll();
  const filtered = quotes.filter((q) => q.id !== id);
  if (filtered.length === quotes.length) return false;
  await writeAll(filtered);
  return true;
}

module.exports = {
  getAllQuotes,
  insertQuote,
  updateQuoteById,
  deleteQuoteById,
};
