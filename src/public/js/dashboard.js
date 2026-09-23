// public/js/dashboard.js
// Dashboard frontend: device cards, AI chat, rules, history.

const socket = io();

/* ---------- Device name + action lookup ---------- */
const DEVICE_META = {
  'fe012345013001012345000000000000ff': {
    name: 'Air Conditioner',
    type: 'AC',
    actions: { on: { prop: 'operationStatus', val: true }, off: { prop: 'operationStatus', val: false } },
    stateProp: 'operationStatus',
    isOn: (v) => v === true
  },
  'fe012345026f01012345000000000000ff': {
    name: 'Front Door Lock',
    type: 'Lock',
    actions: { on: { prop: 'lockStatus', val: 'lock' }, off: { prop: 'lockStatus', val: 'unlock' } },
    stateProp: 'lockStatus',
    isOn: (v) => v === 'lock'
  },
  'fe012345026301012345000000000000ff': {
    name: 'Rain Door Shutter',
    type: 'Shutter',
    actions: { on: { prop: 'openControl', val: 'open' }, off: { prop: 'openControl', val: 'close' } },
    stateProp: 'openClosedStatus',
    isOn: (v) => v === 'fullyOpen' || v === 'opening'
  }
};

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
    await renderDevices(data);
  } catch (e) {
    document.getElementById('device-list').innerHTML =
      '<p class="muted">Could not load devices. Is the simulator connected?</p>';
  }
}

async function renderDevices(data) {
  const list = document.getElementById('device-list');
  const devices = Array.isArray(data) ? data : (data.devices || []);
  if (!devices.length) {
    list.innerHTML = '<p class="muted">No devices reported.</p>';
    return;
  }

  // Fetch each device's state in parallel
  const states = await Promise.all(
    devices.map(d => fetchDeviceState(d.device_id || d.id || d.deviceId))
  );

  list.innerHTML = '';
  devices.forEach((d, i) => {
    const id = d.device_id || d.id || d.deviceId;
    const meta = DEVICE_META[id] || { name: id, type: '—', isOn: () => false };
    const isOn = states[i] === true;

    const el = document.createElement('div');
    el.className = 'device';
    el.innerHTML = `
      <h3>${meta.name}</h3>
      <div class="type">${meta.type}</div>
      <div class="state-badge ${isOn ? 'on' : 'off'}">
        ${isOn ? 'On' : 'Off'}
      </div>
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

async function fetchDeviceState(id) {
  const meta = DEVICE_META[id];
  if (!meta) return null;
  try {
    const r = await fetch(`/elapi/v1/devices/${id}/properties/${meta.stateProp}`);
    const j = await r.json();
    const raw = j.value !== undefined ? j.value : j[meta.stateProp];
    return meta.isOn(raw);
  } catch (e) {
    return null;
  }
}

async function sendAction(deviceId, act) {
  const meta = DEVICE_META[deviceId];
  if (!meta) return;
  const { prop, val } = meta.actions[act];
  try {
    await fetch(`/elapi/v1/devices/${deviceId}/properties/${prop}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [prop]: val })
    });
    logHistory('You', `${meta.name} → ${act === 'on' ? 'On' : 'Off'}`);
    setTimeout(loadDevices, 400);
  } catch (e) {
    console.error('[dashboard] sendAction failed:', e);
  }
}

/* ---------- AI chat ---------- */
const chatLog = document.getElementById('chat-log');
const chatText = document.getElementById('chat-text');
let typingEl = null;

function addMsg(who, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = (who === 'user' ? 'You: ' : 'AI: ') + text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function showTyping() {
  typingEl = addMsg('typing', 'AI is thinking');
  typingEl.textContent = 'AI is thinking';
}

function hideTyping() {
  if (typingEl) { typingEl.remove(); typingEl = null; }
}

async function sendChat(text) {
  if (!text.trim()) return;
  addMsg('user', text);
  chatText.value = '';
  showTyping();
  try {
    const r = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await r.json();
    hideTyping();
    addMsg('ai', data.reply || '(no reply)');
    logHistory('AI', data.reply || '');
    setTimeout(loadDevices, 500);
  } catch (e) {
    hideTyping();
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
  voiceHint.textContent = 'Voice not supported in this browser. Use Chrome or Edge.';
} else {
  voiceHint.textContent = 'Hold the Mic button to speak.';
}

let holding = false;
function startVoice(e) {
  e.preventDefault();
  if (holding) return;
  holding = true;
  voiceBtn.classList.add('listening');
  voiceBtn.textContent = 'Listening';
  window.voice.start(
    (interim) => { voiceHint.textContent = interim || 'Listening…'; },
    (final) => {
      voiceHint.textContent = 'Heard: ' + final;
      sendChat(final);
      // Clear hint after 3 seconds
      setTimeout(() => { voiceHint.textContent = 'Hold the Mic button to speak.'; }, 3000);
    }
  );
}
function stopVoice() {
  if (!holding) return;
  holding = false;
  voiceBtn.classList.remove('listening');
  voiceBtn.textContent = 'Mic';
  window.voice.stop();
}
voiceBtn.addEventListener('pointerdown', startVoice);
voiceBtn.addEventListener('pointerup', stopVoice);
voiceBtn.addEventListener('pointerleave', stopVoice);

/* ---------- Rules ---------- */
async function loadRules() {
  try {
    const r = await fetch('/rules');
    const rules = await r.json();
    const ul = document.getElementById('rules-list');
    ul.innerHTML = rules.map(rr =>
      `<li>
        <span class="rule-text">${rr.device}.${rr.property} ${rr.op} ${rr.value} → ${rr.action}</span>
        <button class="ghost" onclick="deleteRule('${rr.id}')">Delete</button>
      </li>`
    ).join('') || '<li class="muted">No rules yet.</li>';
  } catch (e) {
    console.error('[dashboard] loadRules failed:', e);
  }
}

document.getElementById('rule-add').onclick = async () => {
  const body = {
    device: document.getElementById('rule-device').value.trim(),
    property: document.getElementById('rule-prop').value.trim(),
    op: document.getElementById('rule-op').value.trim(),
    value: document.getElementById('rule-value').value.trim(),
    action: document.getElementById('rule-action').value.trim()
  };
  if (!body.device || !body.property || !body.op || !body.value || !body.action) {
    alert('Please fill in all fields to add a rule.');
    return;
  }
  try {
    await fetch('/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    ['rule-device','rule-prop','rule-op','rule-value','rule-action'].forEach(id =>
      document.getElementById(id).value = '');
    loadRules();
  } catch (e) {
    alert('Failed to add rule: ' + e.message);
  }
};

window.deleteRule = async (id) => {
  if (!confirm('Delete this rule?')) return;
  await fetch('/rules/' + id, { method: 'DELETE' });
  loadRules();
};

/* ---------- History ---------- */
function renderHistoryEntry(entry) {
  const li = document.createElement('li');
  const time = new Date(entry.ts || Date.now()).toLocaleTimeString();
  const src = entry.source || '—';
  const srcClass = src === 'rule' ? 'rule' : (src === 'ai' || src === 'ai-action') ? 'ai' : '';
  li.innerHTML = `
    <span class="time">${time}</span>
    <span class="src ${srcClass}">${src}</span>
    <span>${entry.text || ''}</span>
  `;
  return li;
}

async function loadHistory() {
  try {
    const r = await fetch('/history');
    const entries = await r.json();
    const ul = document.getElementById('history-list');
    if (!entries.length) {
      ul.innerHTML = '<li class="muted">No activity yet.</li>';
      return;
    }
    ul.innerHTML = '';
    entries.forEach(e => ul.appendChild(renderHistoryEntry(e)));
  } catch (e) {
    console.error('[dashboard] loadHistory failed:', e);
  }
}

function logHistory(source, text) {
  const ul = document.getElementById('history-list');
  if (ul.querySelector('.muted')) ul.innerHTML = '';
  const li = renderHistoryEntry({ ts: new Date().toISOString(), source, text });
  ul.prepend(li);
}

/* ---------- Init ---------- */
loadDevices();
loadRules();
loadHistory();
setInterval(loadDevices, 5000);
setInterval(loadHistory, 10000);