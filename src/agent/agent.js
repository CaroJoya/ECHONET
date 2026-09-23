// agent/agent.js
// The AI agent: natural language → structured command.
// It does NOT call the simulator directly; it returns a plan,
// and app.js executes it against the ECHONET simulator.

const { askJSON } = require('./llm');
const { listForPrompt, DEVICES } = require('./devices');

/**
 * Ask the LLM to convert natural language into a device action plan.
 * @param {string} userText
 * @returns {Promise<{reply: string, actions: Array<{device_id: string, property: string, value: any}>}>}
 */
async function planFromText(userText) {
  const devices = listForPrompt();

  const prompt = `
You are a smart home AI agent controlling a simulated house.
The user will give a natural-language command. Convert it into device actions.

AVAILABLE DEVICES:
${JSON.stringify(devices, null, 2)}

DEVICE ID MAP (use these exact IDs):
${JSON.stringify(DEVICES, null, 2)}

RULES:
- Only use devices from the list above.
- Only use the actions listed for that device.
- For "on" -> property "operationStatus", value true
- For "off" -> property "operationStatus", value false
- For "lock" -> property "lockStatus", value "lock"
- For "unlock" -> property "lockStatus", value "unlock"
- For "open" -> property "openControl", value "open"
- For "close" -> property "openControl", value "close"
- If the user is just asking a question (no action), return empty actions array.
- If unclear, return empty actions and ask a clarifying question in "reply".

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