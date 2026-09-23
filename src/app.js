//------------------------------------------------------------------
//
// Smart Home Simualtor(1.1.1)
// file:app.js
//
// 1.0.0   first  version
// 1.0.1   fix bug (miss find local ip)  2024/1/2
// 1.0.2   change listen port 8085 -> 8010  2024/1/10
// 1.0.3   2024/01/21 change connection status:  offline -> online
// 1.0.4   2024/01/21 modify get_properties (change to reply all properties)
// 1.0.5   2024/01/25 modify get_property (change json format)
// 1.0.6   2024/02/18 modify device id for common  e.g. 00000  or 012345
// 1.0.7   2024/03/01 Changed device ID to general ID  (e.g. 012345)
// 1.0.8   2024/06/05 Changed device ID to general ID  (e.g. 012345FF)
// 1.0.9   2024/12/07 support option (--ip,  --port)
// 1.1.0   2025/xx/xx AI agent (Gemini), /chat, /dashboard, /rules, /history
// 1.1.1   2025/xx/xx FIX: unique request_id per call (was fixed 111)
//
//------------------------------------------------------------------

const os = require('os');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// ---- AI agent ----
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
{
  const envCandidates = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'src', '.env')
  ];
  for (const p of envCandidates) {
    if (fs.existsSync(p)) { dotenv.config({ path: p }); break; }
  }
}
const { planFromText } = require('./agent/agent');
const rules = require('./agent/rules');
const history = require('./agent/history');

// setting for parse body of HTTP POST
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set ejs to view engine
const ejs = require('ejs');

const DEFAULT_PORT = 8010;

// Handle string option arguments
const argv = yargs(hideBin(process.argv))
  .option('port', { type: 'string', description: 'port number' })
  .option('ip',   { type: 'string', description: 'ip address' })
  .help()
  .argv;

let listen_ip;
let listen_port;

if (argv.ip != undefined) {
  listen_ip = argv.ip;
} else {
  listen_ip = get_local_ip();
}
if (argv.port != undefined) {
  listen_port = argv.port;
} else {
  listen_port = DEFAULT_PORT;
}

// ---- Static file routes ----
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/js/img', express.static(__dirname + '/public/img'));
app.use('/css', express.static(__dirname + '/public/css'));

const HOMEPAGE_TEMPLATE = fs.readFileSync(path.join(__dirname, 'templates', 'index.ejs'), 'utf-8');

let req_resp = [];
let client_id = null;

// ---- Unique request_id generator ----
let __rid_counter = 0;
function nextRequestId() {
  __rid_counter = (__rid_counter + 1) % 100000;
  return `${Date.now()}${__rid_counter.toString().padStart(5, '0')}`;
}

const DEVICE_NAME_MAP = {
  'fe012345013001012345000000000000ff': 'AC',
  'fe012345026f01012345000000000000ff': 'Lock',
  'fe012345026301012345000000000000ff': 'Shutter'
};

function fmtAction(device_id, property, value) {
  const name = DEVICE_NAME_MAP[device_id] || device_id.slice(0, 8);
  let shortVal;
  if (property === 'operationStatus') shortVal = value ? 'on' : 'off';
  else if (property === 'lockStatus') shortVal = value;
  else if (property === 'openControl') shortVal = value;
  else shortVal = JSON.stringify(value);
  return `${name} \u2192 ${shortVal}`;
}

//----------------------------------------
//  Homepage (ELWebAPI Support Page)
//----------------------------------------
app.get('/', (req, res) => {
  let client_connection = '';
  if (client_id === null) {
    client_connection = 'not connected';
  } else {
    client_connection = 'connected';
  }

  const data = ejs.render(HOMEPAGE_TEMPLATE, {
    connection_status: client_connection,
    server_status: 'ok',
    ip_address: `${listen_ip}:${listen_port}`
  });
  res.send(data);
});

//----------------------------------------
//  IoT House Simulator page
//----------------------------------------
app.get('/iothouse', (req, res) => {
  res.sendFile(__dirname + '/public/iothouse.html');
});

//----------------------------------------
//  AI Dashboard page
//----------------------------------------
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

//---------------------------------------
//   ECHONET Lite Web API (ELWebAPI)
//---------------------------------------
app.get('/elapi', (req, res) => {
  if (client_id === null) {
    res.send('Error!! IoT House Simulator is not connected');
    return;
  }
  const procedure = 'get_api_versions';
  const args = '';
  const request_id = nextRequestId();
  const msg = { procedure_name: procedure, args: args, request_id: request_id };
  io.emit('request', JSON.stringify(msg));
  receive_and_response(res, request_id);
});

app.get('/elapi/v1', (req, res) => {
  if (client_id === null) {
    res.send('Error!! IoT House Simulator is not connected');
    return;
  }
  const procedure = 'get_v1_descriptions';
  const args = '';
  const request_id = nextRequestId();
  const msg = { procedure_name: procedure, args: args, request_id: request_id };
  io.emit('request', JSON.stringify(msg));
  receive_and_response(res, request_id);
});

app.get('/elapi/v1/devices', (req, res) => {
  if (client_id === null) {
    res.send('Error!! IoT House Simulator is not connected');
    return;
  }
  const procedure = 'get_devices';
  const args = '';
  const request_id = nextRequestId();
  const msg = { procedure_name: procedure, args: args, request_id: request_id };
  io.emit('request', JSON.stringify(msg));
  receive_and_response(res, request_id);
});

// Get Device Description
app.get('/elapi/v1/devices/:device_id', (req, res) => {
  const device_id = req.params.device_id;
  if (client_id === null) {
    res.send('Error!! IoT House Simulator is not connected');
    return;
  }
  const procedure = 'get_description';
  const args = { device_id: device_id };
  const request_id = nextRequestId();
  const msg = { procedure_name: procedure, args: args, request_id: request_id };
  io.emit('request', JSON.stringify(msg));
  receive_and_response(res, request_id);
});

// Get Properties of Device
app.get('/elapi/v1/devices/:device_id/properties', (req, res) => {
  const device_id = req.params.device_id;
  if (client_id === null) {
    res.send('Error!! IoT House Simulator is not connected');
    return;
  }
  const procedure = 'get_properties';
  const args = { device_id: device_id };
  const request_id = nextRequestId();
  const msg = { procedure_name: procedure, args: args, request_id: request_id };
  io.emit('request', JSON.stringify(msg));
  receive_and_response(res, request_id);
});

// Get Property of Device
app.get('/elapi/v1/devices/:device_id/properties/:property_name', (req, res) => {
  const device_id = req.params.device_id;
  const property_name = req.params.property_name;
  if (client_id === null) {
    res.send('Error!! IoT House Simulator is not connected');
    return;
  }
  const procedure = 'get_property_value';
  const args = { device_id: device_id, property_name: property_name };
  const request_id = nextRequestId();
  const msg = { procedure_name: procedure, args: args, request_id: request_id };
  io.emit('request', JSON.stringify(msg));
  receive_and_response(res, request_id);
});

// PUT set property
app.put('/elapi/v1/devices/:device_id/properties/:property_name', (req, res) => {
  const device_id = req.params.device_id;
  const property_name = req.params.property_name;
  const property_value = req.body[property_name];

  if (client_id === null) {
    res.send('Error!! IoT House Simulator is not connected');
    return;
  }

  const procedure = 'set_property_value';
  const args = {
    device_id: device_id,
    property_name: property_name,
    property_value: property_value
  };
  const request_id = nextRequestId();
  const msg = { procedure_name: procedure, args: args, request_id: request_id };
  io.emit('request', JSON.stringify(msg));

  console.log(`\u2713 ${fmtAction(device_id, property_name, property_value)}`);
  history.log('http', `PUT ${device_id}.${property_name} = ${JSON.stringify(property_value)}`);

  receive_and_response(res, request_id);
});

//---------------------------------------
//   AI Agent endpoint (natural language)
//   POST /chat  { "message": "turn on the AC" }
//---------------------------------------
app.post('/chat', async (req, res) => {
  const userText = (req.body && req.body.message) || '';
  if (!userText.trim()) {
    return res.status(400).json({ error: 'Missing "message" in body' });
  }

  try {
    history.log('user', userText);
    const plan = await planFromText(userText);

    if (!plan || typeof plan !== 'object') {
      throw new Error('AI returned an invalid plan (not an object).');
    }

    const actions = Array.isArray(plan.actions) ? plan.actions : [];
    const reply = typeof plan.reply === 'string' && plan.reply.trim() ? plan.reply : 'Okay.';

    const results = [];
    const simOffline = client_id === null;
    if (simOffline && actions.length > 0) {
      console.warn('[chat] simulator not connected; actions planned but not delivered. Open /iothouse to connect.');
    }

    for (const action of actions) {
      if (!action || !action.device_id || !action.property || action.value === undefined) {
        continue;
      }
      const msg = {
        procedure_name: 'set_property_value',
        args: {
          device_id: action.device_id,
          property_name: action.property,
          property_value: action.value
        },
        request_id: nextRequestId()
      };
      io.emit('request', JSON.stringify(msg));
      results.push({ sent: action });
      console.log(`\u2713 ${fmtAction(action.device_id, action.property, action.value)}`);
      history.log('ai-action', `${action.device_id}.${action.property} = ${JSON.stringify(action.value)}`);
    }

    let finalReply = reply;
    if (simOffline && actions.length > 0) {
      finalReply = reply + ' (Note: IoT House simulator is not open; open /iothouse in another tab to see device changes.)';
    }

    history.log('ai', finalReply);
    res.json({
      reply: finalReply,
      actions_sent: results,
      simulator_online: !simOffline
    });
  } catch (e) {
    console.error('[chat] error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

//---------------------------------------
//   Automation Rules API
//---------------------------------------
app.get('/rules', (req, res) => res.json(rules.list()));

app.post('/rules', (req, res) => {
  try {
    res.json(rules.add(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/rules/:id', (req, res) => {
  rules.remove(req.params.id);
  res.json({ ok: true });
});

//---------------------------------------
//   History API
//---------------------------------------
app.get('/history', (req, res) => res.json(history.list(50)));

//---------------------------------------
//   Wait for simulator response, send back to HTTP caller
//   Matches by request_id so concurrent calls don't collide.
//---------------------------------------
async function receive_and_response(res, request_id) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50));

    // Look for the entry that matches OUR request_id
    const idx = req_resp.findIndex(entry => String(entry.response_id) === String(request_id));
    if (idx !== -1) {
      const report = req_resp.splice(idx, 1)[0];
      const body = JSON.stringify(report.value);
      res.set({ 'content-type': 'application/json; charset=utf-8' });
      res.send(body);
      return true;
    }
  }
  res.send('Error!! no response from [IoT Home Simulator]');
  return true;
}

//---------------------------------------
//   WebSocket: Server <---> IoT House Simulator
//---------------------------------------
io.on('connection', (socket) => {
  socket.on('hello', (msg) => {
    console.log('hello from client');
    client_id = socket.id;
    io.emit('ack', 'received');
  });

  socket.on('response', (msg) => {
    try {
      req_resp.push(JSON.parse(msg));
    } catch (e) {
      console.error('bad response payload:', e.message);
    }
    io.emit('ack', 'received');
  });

  socket.on('disconnect', () => {
    if (socket.id === client_id) {
      console.log('simulator disconnected');
      client_id = null;
    }
  });
});

//---------------------------------------
//   Rules tick loop (every 15s)
//---------------------------------------
setInterval(async () => {
  await rules.tick(
    // readValue — reads a property from a device via HTTP loopback
    async (deviceName, property) => {
      const dev = require('./agent/devices').findByName(deviceName);
      if (!dev) return null;
      const url = `http://${listen_ip}:${listen_port}/elapi/v1/devices/${dev.id}/properties/${property}`;
      try {
        const r = await fetch(url);
        const j = await r.json();
        return j.value ?? j[property] ?? null;
      } catch (e) {
        return null;
      }
    },
    // execute — resolves the correct property + value for the device/action
    async (deviceName, action) => {
      const { resolveAction } = require('./agent/devices');
      const resolved = resolveAction(deviceName, action);
      if (!resolved) {
        console.warn(`[rules] unknown action: ${deviceName} → ${action}`);
        return;
      }
      const msg = {
        procedure_name: 'set_property_value',
        args: {
          device_id: resolved.device_id,
          property_name: resolved.property,
          property_value: resolved.value
        },
        request_id: nextRequestId()
      };
      io.emit('request', JSON.stringify(msg));
      console.log(`\u2713 [rule] ${fmtAction(resolved.device_id, resolved.property, resolved.value)}`);
      history.log('rule', `${deviceName} → ${action}`);
    }
  );
}, 15000);

//---------------------------------------
//   Start server
//---------------------------------------
server.listen(listen_port, listen_ip, () => {
  console.log(`listen on ${listen_ip}:${listen_port}`);
  console.log(`\u2713 Ready at http://${listen_ip}:${listen_port}`);
});

//---------------------------------------
//   Helpers
//---------------------------------------
function get_local_ip() {
  let ip_addr = null;
  let find_flag = false;
  const info = os.networkInterfaces();
  for (let key of Object.keys(info)) {
    if (key === 'lo') continue;
    for (let obj of info[key]) {
      if (obj.family === 'IPv4') {
        ip_addr = obj.address;
        if (ip_addr === '127.0.0.1') {
          continue;
        } else {
          find_flag = true;
          break;
        }
      }
    }
    if (find_flag === true) break;
  }
  if (!ip_addr) ip_addr = '127.0.0.1';
  return ip_addr;
}