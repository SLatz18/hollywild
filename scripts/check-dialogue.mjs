#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { layoutDialogue, renderedWidth, dialogueProblems, gameVariableWidths } from './dialogue-layout.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function checkEvents(value, options = {}, location = '$', problems = []) {
  if (Array.isArray(value)) value.forEach((item, i) => checkEvents(item, options, `${location}[${i}]`, problems));
  else if (value && typeof value === 'object') {
    if (value.command === 'EVENT_TEXT') {
      for (const problem of dialogueProblems(value.args?.text, options)) problems.push(`${location}: ${problem}`);
    }
    if (value.command === 'EVENT_MENU') {
      const { args } = value;
      if (!Number.isInteger(args.items) || args.items < 1 || args.items > 8) problems.push(`${location}: menu must have 1..8 options`);
      for (let i = 1; i <= args.items; i++) {
        const label = args[`option${i}`];
        if (typeof label !== 'string' || /[^\x20-\x7e]/.test(label) || label.length > 7 || label.includes('$')) problems.push(`${location}: invalid menu label ${i}: ${label}`);
      }
    }
    for (const [key, item] of Object.entries(value)) checkEvents(item, options, `${location}.${key}`, problems);
  }
  return problems;
}
function resources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(dir, entry.name);
    return entry.isDirectory() ? resources(filename) : filename.endsWith('.gbsres') ? [filename] : [];
  });
}
export function checkGenerated(root = ROOT) {
  const variables = JSON.parse(fs.readFileSync(path.join(root, 'project/variables.gbsres'))).variables;
  const options = { variableWidths: gameVariableWidths(variables) };
  return resources(path.join(root, 'project')).flatMap(filename => checkEvents(JSON.parse(fs.readFileSync(filename)), options, path.relative(root, filename)));
}
export function regressionTests() {
  const intro = 'PIP: Good news!\nYou own a garage.\nMost is still indoors.';
  assert.match(dialogueProblems(intro).join('\n'), /22 glyphs/);
  const fitted = layoutDialogue(intro);
  assert.deepEqual(fitted, ['PIP: Good news!\nYou own a garage.\nMost is still\nindoors.']);
  assert.deepEqual(dialogueProblems(fitted), []);
  const opts = { variableWidths: { '1': 4, '2': 2 } };
  assert.equal(renderedWidth('COINS $1$', opts), 10);
  assert.equal(renderedWidth('SCRAP $2$', opts), 8);
  assert.equal(renderedWidth('$999$'), 6);
  assert.equal(renderedWidth('Jobs done: $999$'), 17);
  const stats = layoutDialogue('Balance: $1$ coins $2$ scrap', opts);
  assert.deepEqual(dialogueProblems(stats, opts), []);
  assert.equal(stats.join(' ').replace(/\s+/g, ' '), 'Balance: $1$ coins $2$ scrap');
  const signed = layoutDialogue('123456789012 $77$ tail');
  assert.deepEqual(signed, ['123456789012\n$77$ tail']);
  for (const page of [...stats, ...signed]) {
    const expanded = page.replace(/\$1\$/g, '9999').replace(/\$2\$/g, '99').replace(/\$77\$/g, '-32768');
    for (const line of expanded.split('\n')) assert.ok(line.length <= 18, `Rendered overflow: ${line}`);
  }
  const sixLines = 'one\ntwo\nthree\nfour\nfive\nsix';
  assert.deepEqual(layoutDialogue([sixLines, 'next page']), ['one\ntwo\nthree\nfour\nfive', 'six', 'next page']);
  assert.deepEqual(layoutDialogue('one\n\nthree'), ['one\n\nthree']);
  assert.deepEqual(layoutDialogue('abcdefghijklmnopqrs'), ['abcdefghijklmnopqr\ns']);
  assert.throws(() => layoutDialogue('caf\u00e9'), /ASCII/);
  assert.throws(() => layoutDialogue('$1$', { variableWidths: { '1': 19 } }), /exceeds/);
  assert.equal(checkEvents({command:'EVENT_MENU',args:{items:2,option1:'Confirm',option2:'Back'}}).length, 0);
  assert.equal(checkEvents({command:'EVENT_MENU',args:{items:1,option1:'Too long label'}}).length, 1);
  assert.ok(checkEvents({command:'EVENT_TEXT',args:{text:[intro]}}).length);
  assert.equal(checkEvents({command:'EVENT_TEXT',args:{text:fitted}}).length, 0);
  // Diverse deterministic inputs exercise word preservation and pagination together.
  for (let count = 1; count <= 60; count++) {
    const input = Array.from({length:count}, (_, i) => i % 4 === 0 ? '$1$' : `word${i}`).join(' ');
    const output = layoutDialogue(input, opts);
    assert.deepEqual(dialogueProblems(output, opts), []);
    assert.equal(output.join(' ').replace(/\s+/g,' '), input);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  regressionTests();
  if (process.argv.includes('--self-test')) console.log('Dialogue layout regressions passed.');
  else {
    const problems = checkGenerated();
    if (problems.length) { console.error(problems.join('\n')); console.error(`${problems.length} dialogue/menu fit problems`); process.exitCode = 1; }
    else console.log('All generated dialogue pages and menu labels fit.');
  }
}
