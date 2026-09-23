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
const API_VERSION = process.env.GEMINI_API_VERSION || 'v1';
const MODEL_CANDIDATES = (process.env.GEMINI_MODEL || 'gemini-1.5-flash')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat([
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-002',
    'gemini-1.0-pro-latest',
    'gemini-pro'
  ]);

let model = null;
let activeModelName = null;

function init() {
  if (PROVIDER !== 'gemini') {
    throw new Error(`Unsupported LLM_PROVIDER: '${PROVIDER}'. Only 'gemini' is supported in this build.`);
  }
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here' || API_KEY.trim().length < 10) {
    const loadedHint = envCandidates.filter(p => fs.existsSync(p)).join(', ') || '(none found — checked ' + envCandidates.join(', ') + ')';
    throw new Error(`GEMINI_API_KEY is missing or too short. Searched .env files: ${loadedHint}. Place GEMINI_API_KEY=... in src/.env and run "cd src && node app.js" or "node src/app.js".`);
  }
}

async function pickWorkingModel(promptSanityCheck = 'reply with JSON {"ok":true}') {
  init();
  const genAI = new GoogleGenerativeAI(API_KEY);
  let lastErr = null;
  for (const candidate of MODEL_CANDIDATES) {
    try {
      const candidateModel = genAI.getGenerativeModel(
        {
          model: candidate,
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        },
        { apiVersion: API_VERSION }
      );
      const r = await candidateModel.generateContent(promptSanityCheck);
      const _ = r.response.text();
      model = candidateModel;
      activeModelName = candidate;
      console.log(`[llm] Gemini initialized (model=${activeModelName}, apiVersion=${API_VERSION})`);
      return model;
    } catch (err) {
      lastErr = err;
      const msg = (err && err.message) || String(err);
      console.warn(`[llm] model ${candidate} (apiVersion=${API_VERSION}) failed: ${msg.split('\n')[0]}`);
    }
  }
  const msg = (lastErr && lastErr.message) || String(lastErr);
  throw new Error(
    `No working Gemini model found for apiVersion=${API_VERSION}. Tried: ${MODEL_CANDIDATES.join(', ')}. ` +
    `Last error: ${msg}. Suggest: set GEMINI_API_VERSION=v1beta in .env or update GEMINI_MODEL to a model your key has access to.`
  );
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
  if (!model) {
    await pickWorkingModel(prompt.slice(0, 120) + ' (sanity-check: reply valid JSON only)');
  }
  let text = '';
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (apiErr) {
    const msg = (apiErr && apiErr.message) || String(apiErr);
    const modelNotFound = /404.*models\/.*is not found|NOT_FOUND|model.*not.*supported/i.test(msg);
    if (modelNotFound) {
      console.warn(`[llm] current model ${activeModelName} is not available; probing fallback list.`);
      const fallback = await pickWorkingModel(prompt.slice(0, 120));
      const result2 = await fallback.generateContent(prompt);
      text = result2.response.text();
    } else {
      console.error('[llm] Gemini API call failed:', msg);
      throw new Error(`Gemini API error: ${msg}`);
    }
  }

  const parsed = extractJSON(text);
  if (parsed && typeof parsed === 'object') {
    return parsed;
  }
  console.error('[llm] Raw LLM output was not JSON:', text);
  throw new Error('LLM did not return valid JSON. Raw output: ' + text.slice(0, 200));
}

module.exports = { askJSON, init };