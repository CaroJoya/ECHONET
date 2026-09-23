// agent/llm.js
// Wrapper around Gemini (Google Generative AI).
// Handles API key, model config, and JSON-safe prompts.

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envCandidates = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'src', '.env')
];
for (const p of envCandidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

const PROVIDER = process.env.LLM_PROVIDER || 'gemini';
const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let model = null;

function init() {
  if (PROVIDER !== 'gemini') {
    throw new Error(`Unsupported LLM_PROVIDER: '${PROVIDER}'. Only 'gemini' is supported in this build.`);
  }
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here' || API_KEY.trim().length < 10) {
    const loadedHint = envCandidates.filter(p => fs.existsSync(p)).join(', ') || '(none found — checked ' + envCandidates.join(', ') + ')';
    throw new Error(`GEMINI_API_KEY is missing or too short. Searched .env files: ${loadedHint}. Place GEMINI_API_KEY=... in src/.env and run "cd src && node app.js" or "node src/app.js".`);
  }
  const genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  });
  console.log(`[llm] Gemini initialized (${MODEL_NAME})`);
}

function extractJSON(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch (_) {}
  const noFences = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(noFences); } catch (_) {}
  const firstBrace = noFences.indexOf('{');
  const lastBrace = noFences.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(noFences.slice(firstBrace, lastBrace + 1)); } catch (_) {}
  }
  const firstBracket = noFences.indexOf('[');
  const lastBracket = noFences.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try { return JSON.parse(noFences.slice(firstBracket, lastBracket + 1)); } catch (_) {}
  }
  return null;
}

/**
 * Send a prompt to Gemini and return parsed JSON.
 * @param {string} prompt
 * @returns {Promise<object>}
 */
async function askJSON(prompt) {
  if (!model) init();
  let text = '';
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (apiErr) {
    const msg = (apiErr && apiErr.message) || String(apiErr);
    console.error('[llm] Gemini API call failed:', msg);
    throw new Error(`Gemini API error: ${msg}`);
  }

  const parsed = extractJSON(text);
  if (parsed && typeof parsed === 'object') {
    return parsed;
  }
  console.error('[llm] Raw LLM output was not JSON:', text);
  throw new Error('LLM did not return valid JSON. Raw output: ' + text.slice(0, 200));
}

module.exports = { askJSON, init };