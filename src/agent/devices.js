// agent/devices.js
// Central device registry for the AI agent.
// The AI uses this to know what devices exist and what actions are allowed.
//
// These device IDs come from templates/index.ejs (the API page) and match
// the three devices the simulator exposes:
//   1. homeAirConditioner  (fe012345013001012345000000000000ff)
//   2. electricLock        (fe012345026f01012345000000000000ff)
//   3. electricRainDoor    (fe012345026301012345000000000000ff)
//
// Property names come from the API page:
//   - AC:      operationStatus (true/false), roomTemperature, outdoorTemperature (read-only)
//   - Lock:    lockStatus ("lock" / "unlock")
//   - Shutter: openClosedStatus (read-only), openControl ("open" / "close" / "stop" / "halfopen")

const DEVICES = {
  'fe012345013001012345000000000000ff': {
    name: 'homeAirConditioner',
    type: 'air_conditioner',
    room: 'living_room',
    actions: ['on', 'off'],
    // property used to SET the device state
    statusProperty: 'operationStatus',
    // properties you can READ from this device
    readableProperties: ['operationStatus', 'roomTemperature', 'outdoorTemperature'],
    // how to translate an "action" keyword into a property + value pair
    actionMap: {
      on:  { property: 'operationStatus', value: true },
      off: { property: 'operationStatus', value: false }
    }
  },

  'fe012345026f01012345000000000000ff': {
    name: 'electricLock',
    type: 'lock',
    room: 'front_door',
    actions: ['lock', 'unlock'],
    statusProperty: 'lockStatus',
    readableProperties: ['lockStatus'],
    actionMap: {
      lock:   { property: 'lockStatus', value: 'lock' },
      unlock: { property: 'lockStatus', value: 'unlock' }
    }
  },

  'fe012345026301012345000000000000ff': {
    name: 'electricRainDoor',
    type: 'shutter',
    room: 'front_door',
    actions: ['open', 'close', 'stop', 'halfopen'],
    // NOTE: this device's SET property is openControl,
    //       but its READ property is openClosedStatus.
    statusProperty: 'openControl',
    readableProperties: ['openClosedStatus'],
    actionMap: {
      open:     { property: 'openControl', value: 'open' },
      close:    { property: 'openControl', value: 'close' },
      stop:     { property: 'openControl', value: 'stop' },
      halfopen: { property: 'openControl', value: 'halfopen' }
    }
  }
};

/**
 * Return a simplified list of devices for the LLM prompt.
 * Only the fields the AI needs to make a decision.
 */
function listForPrompt() {
  return Object.entries(DEVICES).map(([id, d]) => ({
    id,
    name: d.name,
    type: d.type,
    room: d.room,
    actions: d.actions
  }));
}

/**
 * Find a device by friendly name or type (case-insensitive, partial match).
 * Example: findByName('AC') -> homeAirConditioner
 *          findByName('lock') -> electricLock
 *          findByName('shutter') -> electricRainDoor
 */
function findByName(query) {
  if (!query) return null;
  const q = String(query).toLowerCase().trim();

  // Direct ID match first
  if (DEVICES[q]) return { id: q, ...DEVICES[q] };

  for (const [id, d] of Object.entries(DEVICES)) {
    if (
      d.name.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      (d.room && d.room.toLowerCase().includes(q))
    ) {
      return { id, ...d };
    }
  }

  // Common aliases
  const aliases = {
    ac: 'homeAirConditioner',
    air: 'homeAirConditioner',
    aircon: 'homeAirConditioner',
    cooler: 'homeAirConditioner',
    door: 'electricLock',
    frontdoor: 'electricLock',
    shutter: 'electricRainDoor',
    blinds: 'electricRainDoor',
    raindoor: 'electricRainDoor'
  };
  if (aliases[q]) {
    const id = Object.keys(DEVICES).find(k => DEVICES[k].name === aliases[q]);
    if (id) return { id, ...DEVICES[id] };
  }

  return null;
}

/**
 * Get the property/value to send for a device action.
 * Returns null if the device or action is unknown.
 */
function resolveAction(deviceName, action) {
  const dev = findByName(deviceName);
  if (!dev) return null;
  const key = String(action).toLowerCase().trim();
  const mapping = dev.actionMap && dev.actionMap[key];
  if (!mapping) return null;
  return {
    device_id: dev.id,
    property: mapping.property,
    value: mapping.value
  };
}

module.exports = { DEVICES, listForPrompt, findByName, resolveAction };