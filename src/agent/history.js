// agent/history.js
// In-memory + on-disk log of commands and device events.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'history.json');
const MAX = 200;
let entries = [];

function load() {
  try {
    if (fs.existsSync(FILE)) entries = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch (e) { entries = []; }
}
function save() {
  try { fs.writeFileSync(FILE, JSON.stringify(entries.slice(-MAX), null, 2)); } catch (e) {}
}

function log(source, text, meta = {}) {
  entries.push({ ts: new Date().toISOString(), source, text, meta });
  if (entries.length > MAX) entries = entries.slice(-MAX);
  save();
}

function list(limit = 50) {
  return entries.slice(-limit).reverse();
}

load();
module.exports = { log, list };