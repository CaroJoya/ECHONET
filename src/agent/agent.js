// agent/agent.js
// The AI agent: natural language → structured command.

const { askJSON } = require('./llm');
const { listForPrompt, DEVICES } = require('./devices');

async function planFromText(userText) {
  const devices = listForPrompt();

  // Build a compact action reference so the LLM sees every valid (device, action) pair
  const actionLines = [];
  for (const [id, d] of Object.entries(DEVICES)) {
    for (const act of d.actions) {
      const map = d.actionMap[act];
      actionLines.push(
        `- ${d.name} (${id}) | action "${act}" → property "${map.property}" = ${JSON.stringify(map.value)}`
      );
    }
  }

  const prompt = `
You are a smart home AI agent controlling a simulated house.
The user will give a natural-language command. Convert it into device actions.

AVAILABLE DEVICES:
${JSON.stringify(devices, null, 2)}

EXACT ACTION REFERENCE — use ONLY these combinations:
${actionLines.join('\n')}

RULES:
- Only use devices and actions from the reference above.
- Do NOT invent device IDs, properties, or values.
- For a simple question with no action, return empty "actions".
- If the request is unclear, return empty "actions" and ask a clarifying question in "reply".

Respond with ONLY valid JSON in this exact shape:
{
  "reply": "short friendly text to say to the user",
  "actions": [
    { "device_id": "...", "property": "...", "value": ... }
  ]
}

USER COMMAND: "${userText}"
`;

  return await askJSON(prompt);
}

module.exports = { planFromText };