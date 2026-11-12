#!/usr/bin/env node
/** Source-event economy probes. Initial states exist only in this interpreter.
 * This never loads a ROM, writes emulator memory, or substitutes for ROM QA.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const manifest = read('gameplay-source.json');
const vars = Object.fromEntries(Object.entries(manifest.variables).map(([name, v]) => [name, v.id]));
const scripts = new Map(fs.readdirSync(path.join(root, 'project/scripts')).filter(p => p.endsWith('.gbsres')).map(p => {
  const data = read('project/scripts/' + p);
  return [data.id, data.script];
}));
const actor = (scene, id) => read(`project/scenes/${scene}/actors/${id}.gbsres`).script;
const tests = [];
const test = (name, run) => { run(); tests.push(name); };

function machine(initial = {}) {
  const state = Object.fromEntries(Object.entries(initial).map(([k, v]) => [vars[k], v]));
  let answers = [];
  const value = v => v.type === 'variable' ? (state[v.value] ?? 0) : v.value;
  const run = events => { for (const e of events) {
    const a = e.args;
    switch (e.command) {
      case 'EVENT_GROUP': run(e.children.true); break;
      case 'EVENT_HIDE_SPRITES': case 'EVENT_SHOW_SPRITES':
      case 'EVENT_TEXT': case 'EVENT_SOUND_PLAY_EFFECT': case 'EVENT_ACTOR_SET_SPRITE': break;
      case 'EVENT_MENU': assert(answers.length, 'Unexpected menu'); state[a.variable] = answers.shift(); break;
      case 'EVENT_SET_VALUE': state[a.variable] = value(a.value); break;
      case 'EVENT_VARIABLE_MATH': {
        const x = state[a.vectorX] ?? 0, y = a.other === 'var' ? (state[a.vectorY] ?? 0) : a.value;
        assert(['add', 'sub'].includes(a.operation), 'Unsupported math ' + a.operation);
        state[a.vectorX] = a.operation === 'add' ? x + y : x - y;
        break;
      }
      case 'EVENT_IF': {
        const c = a.condition, x = value(c.valueA), y = value(c.valueB);
        const pass = {eq:x === y, ne:x !== y, gt:x > y, gte:x >= y, lt:x < y, lte:x <= y}[c.type];
        assert.notEqual(pass, undefined, 'Unsupported condition ' + c.type);
        run(e.children[pass ? 'true' : 'false']); break;
      }
      case 'EVENT_CALL_CUSTOM_EVENT': assert(scripts.has(a.customEventId)); run(scripts.get(a.customEventId)); break;
      default: throw Error('Unsupported event ' + e.command);
    }
  }};
  return {
    get: name => state[vars[name]] ?? 0,
    snapshot: () => Object.fromEntries(Object.entries(state).filter(([k, v]) => k !== vars.choice && v !== 0).sort()),
    execute: (events, choices = []) => { answers = [...choices]; run(events); assert.equal(answers.length, 0, 'Unused answers'); },
  };
}

const board = actor('frostwick', 'frostwick_board');
const full = {coins:9800, salvage:79, cocoa:1, parcel:1, toolworks:1, flats:1,
  workshop:1, crew_enabled:1, crew_mode:1,
  ...Object.fromEntries(['courier','listing','neighbors','rivals','cocoa','parcel','toolworks','flats'].map(p => ['perk_' + p, 1]))};

test('all perks and recycler: first full salvage banks 79 + 20 = 99', () => {
  const m = machine(full);
  m.execute(board, [1]); assert.equal(m.get('job'), 1);
  m.execute(actor('frostwick', 'salvage'));
  m.execute(actor('frostwick', 'bonus_cache')); assert.equal(m.get('carried'), 14);
  m.execute(board, [3]);
  assert.equal(m.get('salvage'), 99); assert.equal(m.get('coins'), 9849);
  assert.equal(m.get('cycles'), 1); assert.equal(m.get('salvage_runs'), 1); assert.equal(m.get('job'), 0);
  const before = m.snapshot(); m.execute(board, [3]); assert.deepEqual(m.snapshot(), before);
});

test('all perks and maker: delivery max 104 Coins stays below wallet cap', () => {
  const m = machine({...full, crew_mode:0});
  m.execute(board, [2]); assert.equal(m.get('crew_reserved'), 2);
  m.execute(actor('frostwick', 'cocoa_delivery'));
  assert.equal(m.get('coins'), 9904); assert.equal(m.get('salvage'), 80);
  assert.equal(m.get('cycles'), 1); assert.equal(m.get('deliveries'), 1); assert.equal(m.get('job'), 0);
  const before = m.snapshot(); m.execute(actor('frostwick', 'cocoa_delivery')); assert.deepEqual(m.snapshot(), before);
});

test('dispatch rejects 80 scrap or 9801 Coins without reserving work', () => {
  for (const state of [{...full, salvage:80}, {...full, coins:9801}]) {
    const m = machine(state), before = m.snapshot(); m.execute(board, [1]); assert.deepEqual(m.snapshot(), before);
  }
});

test('listing discount: each property purchase costs exactly 20 fewer Coins', () => {
  const propertyIds = {cocoa:'cocoa', parcel:'parcel_palace', toolworks:'toolworks', flats:'lantern_flats'};
  const prices = {cocoa:[100,4], parcel:[260,8], toolworks:[220,8], flats:[240,8]};
  for (const [key, [coins, scrap]] of Object.entries(prices)) {
    const site = manifest.sites.find(s => s.id === propertyIds[key]); assert(site);
    for (const perk_listing of [0, 1]) {
      const cost = coins - 20 * perk_listing;
      const m = machine({coins:cost, salvage:scrap, perk_listing});
      m.execute(actor(site.scene, site.id), [1]);
      assert.equal(m.get(key), 1); assert.equal(m.get('coins'), 0); assert.equal(m.get('salvage'), 0);
      const before = m.snapshot(); m.execute(actor(site.scene, site.id)); assert.deepEqual(m.snapshot(), before);
    }
    for (const state of [{coins:coins-21, salvage:scrap}, {coins:coins-20, salvage:scrap-1}]) {
      const m = machine({...state, perk_listing:1}), before = m.snapshot();
      m.execute(actor(site.scene, site.id), [1]); assert.deepEqual(m.snapshot(), before);
    }
  }
});

test('neighbor donations add two Cheer and saturate at 100', () => {
  for (const cheer of [0, 98, 99, 100]) {
    const m = machine({coins:100, cheer, perk_neighbors:1}); m.execute(board, [6,1]);
    assert.equal(m.get('coins'), 0); assert.equal(m.get('cheer'), Math.min(100, cheer+2)); assert.equal(m.get('cycles'), 0);
  }
  const m = machine({coins:100, cheer:99, perk_neighbors:1, job:1}), before = m.snapshot();
  m.execute(board, [6]); assert.deepEqual(m.snapshot(), before);
});

// There currently are no loose-cache actors in world-layout.json. Evaluate the
// exact dormant generator branch so later placement cannot break dispatch room.
test('dormant loose-cache branch preserves resources and cache flag during jobs', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/create-game.mjs'), 'utf8');
  const branch = source.split('\n').find(line => line.trim().startsWith("if(type==='cache')")); assert(branch);
  const ev = (command, args = {}, children) => ({command, args, ...(children ? {children} : {})});
  const iff = (name, type, value, yes, no = []) => ev('EVENT_IF', {condition:{type,valueA:{type:'variable',value:vars[name]},valueB:{type:'number',value}}}, {true:yes,false:no});
  const text = (...text) => ev('EVENT_TEXT', {text});
  const set = (name, value) => ev('EVENT_SET_VALUE', {variable:vars[name],value:{type:'number',value}});
  const add = (name, value) => ev('EVENT_VARIABLE_MATH', {vectorX:vars[name],operation:'add',other:'val',value});
  const noActive = script => [iff('job','eq',0,script,[text('Job active')])];
  const events = new Function('type','wid','vars','canonical','iff','noActive','set','add','text', branch)('cache','frostwick',vars,s=>s,iff,noActive,set,add,text);
  assert(events);
  for (const job of [1, 2]) {
    const m = machine({salvage:79,job}), before = m.snapshot(); m.execute(events); assert.deepEqual(m.snapshot(), before);
  }
  const m = machine({salvage:97}); m.execute(events); assert.equal(m.get('salvage'),99); assert.equal(m.get('cache_frostwick'),1);
  const before = m.snapshot(); m.execute(events); assert.deepEqual(m.snapshot(),before);
  const full = machine({salvage:98}); const snapshot = full.snapshot(); full.execute(events); assert.deepEqual(full.snapshot(),snapshot);
});

console.log(JSON.stringify({passed:true, method:'Source-event interpreter only; no ROM or emulator writes', tests}, null, 2));
