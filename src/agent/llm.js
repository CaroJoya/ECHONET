// agent/llm.js
// Wrapper around Gemini (Google Generative AI).
// Handles API key, model config, and JSON-safe prompts.

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const PROVIDER = process.env.LLM_PROVIDER || 'gemini';
const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let model = null;

function init() {
  if (PROVIDER !== 'gemini') {
    throw new Error(`Unsupported LLM_PROVIDER: ${PROVIDER}. Only 'gemini' is supported in this build.`);
  }
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing. Set it in src/.env');
  }
  const genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json' // ask Gemini for JSON directly
    }
  });
  console.log(`[llm] Gemini initialized (${MODEL_NAME})`);
}

/**
 * Send a prompt to Gemini and return parsed JSON.
 * @param {string} prompt
 * @returns {Promise<object>}
 */
async function askJSON(prompt) {
  if (!model) init();
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    // Sometimes Gemini wraps JSON in ```json fences — strip them.
    const cleaned = text.replace(/```json|```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error('[llm] Failed to parse JSON:', text);
      throw new Error('LLM did not return valid JSON');
    }
  }
}

module.exports = { askJSON, init };