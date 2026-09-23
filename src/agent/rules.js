// agent/rules.js
// Simple in-memory automation rules engine.
// Rule shape: { id, device, property, op, value, action }
// Example: { device: 'homeAirConditioner', property: 'roomTemperature', op: '>', value: 30, action: 'on' }

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'rules.json');
let rules = [];
let nextId = 1;

function load() {
  try {
    if (fs.existsSync(FILE)) {
      rules = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
      nextId = rules.reduce((m, r) => Math.max(m, r.id), 0) + 1;
    }
  } catch (e) { console.warn('[rules] load failed:', e.message); }
}
function save() {
  try { fs.writeFileSync(FILE, JSON.stringify(rules, null, 2)); } catch (e) {}
}

function list() { return rules; }

function add({ device, property, op, value, action }) {
  if (!device || !property || !op || !action) throw new Error('Missing fields');
  const rule = { id: nextId++, device, property, op, value, action, lastFired: 0 };
  rules.push(rule);
  save();
  return rule;
}

function remove(id) {
  rules = rules.filter(r => r.id !== Number(id));
  save();
}

/**
 * Evaluate all rules against a device state snapshot.
 * @param {(deviceName: string, property: string) => Promise<any>} readValue
 * @param {(deviceName: string, action: string) => Promise<void>} execute
 */
async function tick(readValue, execute) {
  for (const rule of rules) {
    try {
      const current = await readValue(rule.device, rule.property);
      if (current === undefined || current === null) continue;
      const lhs = parseFloat(current);
      const rhs = parseFloat(rule.value);
      let hit = false;
      if (rule.op === '>') hit = lhs > rhs;
      else if (rule.op === '<') hit = lhs < rhs;
      else if (rule.op === '=') hit = String(current) === String(rule.value);

      const now = Date.now();
      if (hit && now - rule.lastFired > 30_000) { // 30s cooldown
        await execute(rule.device, rule.action);
        rule.lastFired = now;
        console.log(`[rules] fired: ${rule.device}.${rule.property} ${rule.op} ${rule.value} → ${rule.action}`);
      }
    } catch (e) {
      console.warn('[rules] tick error:', e.message);
    }
  }
}

load();
module.exports = { list, add, remove, tick };