// public/js/dashboard.js
// Dashboard frontend: device cards, AI chat, rules, history.

const socket = io();

/* ---------- Connection status ---------- */
const statusEl = document.getElementById('conn-status');
socket.on('connect', () => {
  statusEl.textContent = '● online';
  statusEl.className = 'status online';
});
socket.on('disconnect', () => {
  statusEl.textContent = '● offline';
  statusEl.className = 'status offline';
});

/* ---------- Device list ---------- */
async function loadDevices() {
  try {
    const r = await fetch('/elapi/v1/devices');
    const data = await r.json();
    renderDevices(data);
  } catch (e) {
    document.getElementById('device-list').innerHTML =
      '<p class="muted">Could not load devices. Is the simulator connected?</p>';
  }
}

function renderDevices(data) {
  const list = document.getElementById('device-list');
  const devices = Array.isArray(data) ? data : (data.devices || []);
  if (!devices.length) {
    list.innerHTML = '<p class="muted">No devices reported.</p>';
    return;
  }
  list.innerHTML = '';
  devices.forEach((d) => {
    const id = d.device_id || d.id || d.deviceId;
    const name = d.name || d.device_name || id;
    const el = document.createElement('div');
    el.className = 'device';
    el.innerHTML = `
      <h3>${name}</h3>
      <div class="state" data-id="${id}">—</div>
      <div class="actions">
        <button data-act="on">On</button>
        <button class="ghost" data-act="off">Off</button>
      </div>
    `;
    el.querySelectorAll('button').forEach((b) => {
      b.onclick = () => sendAction(id, b.dataset.act);
    });
    list.appendChild(el);
  });
}

async function sendAction(deviceId, act) {
  const map = { on: true, off: false, lock: 'lock', unlock: 'unlock' };
  const prop = act === 'lock' || act === 'unlock' ? 'lockStatus' : 'operationStatus';
  const value = map[act];
  await fetch(`/elapi/v1/devices/${deviceId}/properties/${prop}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [prop]: value })
  });
  logHistory('You', `set ${deviceId} → ${act}`);
  setTimeout(loadDevices, 400);
}

/* ---------- AI chat ---------- */
const chatLog = document.getElementById('chat-log');
const chatText = document.getElementById('chat-text');

function addMsg(who, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = (who === 'user' ? 'You: ' : 'AI: ') + text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function sendChat(text) {
  if (!text.trim()) return;
  addMsg('user', text);
  chatText.value = '';
  try {
    const r = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await r.json();
    addMsg('ai', data.reply || '(no reply)');
    logHistory('AI', data.reply || '');
    setTimeout(loadDevices, 500);
  } catch (e) {
    addMsg('ai', 'Error: ' + e.message);
  }
}

document.getElementById('chat-send').onclick = () => sendChat(chatText.value);
chatText.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(chatText.value); });

/* ---------- Voice button ---------- */
const voiceBtn = document.getElementById('voice-btn');
const voiceHint = document.getElementById('voice-hint');
if (!window.voiceSupported) {
  voiceBtn.disabled = true;
  voiceHint.textContent = 'Voice not supported in this browser.';
} else {
  voiceHint.textContent = 'Hold the mic button to speak.';
}

let holding = false;
function startVoice(e) {
  e.preventDefault();
  if (holding) return;
  holding = true;
  voiceBtn.textContent = '🔴';
  window.voice.start(
    (interim) => { voiceHint.textContent = interim; },
    (final) => {
      voiceHint.textContent = 'Heard: ' + final;
      sendChat(final);
    }
  );
}
function stopVoice() {
  if (!holding) return;
  holding = false;
  voiceBtn.textContent = '🎤';
  window.voice.stop();
}
voiceBtn.addEventListener('pointerdown', startVoice);
voiceBtn.addEventListener('pointerup', stopVoice);
voiceBtn.addEventListener('pointerleave', stopVoice);

/* ---------- Rules ---------- */
async function loadRules() {
  const r = await fetch('/rules');
  const rules = await r.json();
  const ul = document.getElementById('rules-list');
  ul.innerHTML = rules.map(r =>
    `<li>${r.device}.${r.property} ${r.op} ${r.value} → ${r.action}
     <button class="ghost" onclick="deleteRule('${r.id}')">x</button></li>`
  ).join('') || '<li class="muted">No rules yet.</li>';
}

document.getElementById('rule-add').onclick = async () => {
  const body = {
    device: document.getElementById('rule-device').value,
    property: document.getElementById('rule-prop').value,
    op: document.getElementById('rule-op').value,
    value: document.getElementById('rule-value').value,
    action: document.getElementById('rule-action').value
  };
  await fetch('/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  ['rule-device','rule-prop','rule-op','rule-value','rule-action'].forEach(id =>
    document.getElementById(id).value = '');
  loadRules();
};

window.deleteRule = async (id) => {
  await fetch('/rules/' + id, { method: 'DELETE' });
  loadRules();
};

/* ---------- History ---------- */
function logHistory(source, text) {
  const ul = document.getElementById('history-list');
  if (ul.querySelector('.muted')) ul.innerHTML = '';
  const li = document.createElement('li');
  li.innerHTML = `<span class="time">${new Date().toLocaleTimeString()}</span>
                  <strong>${source}:</strong> ${text}`;
  ul.prepend(li);
}

/* ---------- Init ---------- */
loadDevices();
loadRules();
setInterval(loadDevices, 5000);