#!/usr/bin/env node
// Checks tools.json against its shape (README § The file). No dependencies.
// Exit 0 on a clean file, 1 on any problem, each named with the row and the key.
//
//   node check.mjs [path/to/tools.json]
//
// What it does not check: whether a row's answers are true. That is the reading (README § The
// checklist) and Boss's daily gate over every row's URL, which writes nothing here.

import { readFileSync } from 'node:fs';

const path = process.argv[2] ?? new URL('./tools.json', import.meta.url);
const problems = [];
const say = (where, msg) => problems.push(`${where}: ${msg}`);

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9-]{1,32}$/;
const RUNGS = ['built', 'listed', 'delisted'];
const DOORS = ['api', 'folder', 'owworld', 'mcp'];
const HOW = ['read', 'read in source', 'claimed'];
const RESULTS = ['pass', 'fail'];
// The checklist's seven lines a row answers (line 8, the crawl rule, is ours, not the tool's).
const LINES = ['what_it_says', 'keys_stay', 'names_itself', 'speaks_the_wire', 'what_leaves', 'host', 'free_core'];
// Lines that can only be claimed or read in source, never read from outside (README).
const INSIDE = ['keys_stay', 'what_leaves'];
const ROW = {
  id: 'id', name: 'text', sentence: 'text', url: 'https', source: 'https|null', source_note: 'text|null',
  maker: 'text', doors: 'doors', client: 'id|null', prefix: 'prefix|null', free_core: 'text', paid: 'text|null',
  rung: 'rung', listed_on: 'date|null', listed_by: 'text|null', delisted_on: 'date|null', delisted_why: 'text|null',
  submission: 'https|null', checks: 'checks',
};
const today = new Date().toISOString().slice(0, 10);

function kind(where, key, v, spec) {
  const okNull = spec.endsWith('|null');
  const k = spec.replace('|null', '');
  if (v === null) { if (!okNull) say(where, `\`${key}\` is null, and may not be`); return; }
  const str = typeof v === 'string' && v.trim() !== '' && v === v.trim();
  const bad = (what) => say(where, `\`${key}\` must be ${what}, got ${JSON.stringify(v)}`);
  if (k === 'text') { if (!str) bad('a non-empty string with no outer spaces'); }
  else if (k === 'id') { if (typeof v !== 'string' || !ID.test(v)) bad('[a-z0-9-], 1 to 32'); }
  else if (k === 'https') { if (!str || !/^https:\/\/[^\s]+$/.test(v)) bad('an https URL'); }
  else if (k === 'date') { if (typeof v !== 'string' || !DATE.test(v) || v > today) bad('a date, YYYY-MM-DD, not in the future'); }
  // `atlas_` is the one older prefix keel keeps as written (before `x_<tool>_` existed); no new tool takes it.
  else if (k === 'prefix') { if (typeof v !== 'string' || !(v === 'atlas_' || /^x_[a-z0-9]+(?:-[a-z0-9]+)*_$/.test(v))) bad('x_<tool>_'); }
  else if (k === 'rung') { if (!RUNGS.includes(v)) bad(RUNGS.join(' | ')); }
  else if (k === 'doors') {
    if (!Array.isArray(v) || v.length === 0 || v.some(d => !DOORS.includes(d)) || new Set(v).size !== v.length) bad(`a non-empty list of distinct ${DOORS.join(', ')}`);
  } else if (k === 'checks') checks(where, v);
}

function checks(where, v) {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) { say(where, '`checks` must be an object'); return; }
  for (const line of Object.keys(v)) if (!LINES.includes(line)) say(where, `checks: unknown line \`${line}\``);
  for (const line of LINES) {
    const c = v[line];
    if (c === undefined) continue;
    const w = `${where} checks.${line}`;
    if (typeof c !== 'object' || c === null || Array.isArray(c)) { say(w, 'must be an object'); continue; }
    for (const k of Object.keys(c)) if (!['result', 'how', 'on', 'note'].includes(k)) say(w, `unknown key \`${k}\``);
    if (!RESULTS.includes(c.result)) say(w, `\`result\` must be ${RESULTS.join(' | ')}`);
    if (!HOW.includes(c.how)) say(w, `\`how\` must be ${HOW.join(' | ')}`);
    else if (c.how === 'read' && INSIDE.includes(line)) say(w, 'cannot be read from outside: `claimed` or `read in source`');
    if (typeof c.on !== 'string' || !DATE.test(c.on) || c.on > today) say(w, '`on` must be a date, not in the future');
    if (c.note !== undefined && (typeof c.note !== 'string' || c.note.trim() === '')) say(w, '`note`, when present, is text');
  }
}

let doc;
try { doc = JSON.parse(readFileSync(path, 'utf8')); }
catch (e) { console.log(`FAIL: tools.json unreadable: ${e.message}`); process.exit(1); }

if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) say('file', 'must be an object');
else {
  for (const k of Object.keys(doc)) if (!['format', 'tools'].includes(k)) say('file', `unknown key \`${k}\``);
  if (doc.format !== 1) say('file', '`format` must be 1');
  if (!Array.isArray(doc.tools)) say('file', '`tools` must be a list');
}
const rows = Array.isArray(doc?.tools) ? doc.tools : [];
const seen = new Map();
rows.forEach((r, i) => {
  const where = `row ${i}${typeof r?.id === 'string' ? ` (${r.id})` : ''}`;
  if (typeof r !== 'object' || r === null || Array.isArray(r)) { say(where, 'must be an object'); return; }
  for (const k of Object.keys(r)) if (!(k in ROW)) say(where, `unknown key \`${k}\``);
  for (const [k, spec] of Object.entries(ROW)) {
    if (!(k in r)) say(where, `\`${k}\` missing (null when it does not apply)`);
    else kind(where, k, r[k], spec);
  }
  for (const k of ['id', 'url', 'client']) {
    if (r[k] == null) continue;
    const key = `${k}:${String(r[k]).toLowerCase()}`;
    if (seen.has(key)) say(where, `\`${k}\` ${r[k]} is also row ${seen.get(key)}'s`);
    else seen.set(key, i);
  }
  if (r.source === null && r.source_note == null) say(where, 'no `source`: `source_note` says why (line 1)');
  const listedFields = r.listed_on != null || r.listed_by != null;
  if (r.rung === 'built' && (listedFields || r.delisted_on != null || r.delisted_why != null)) say(where, 'a built row carries no listed or delisted fields');
  if (r.rung === 'listed' || r.rung === 'delisted') {
    if (r.listed_on == null || r.listed_by == null) say(where, `a ${r.rung} row says \`listed_on\` and \`listed_by\` (the maintainer's word)`);
    if (r.submission == null) say(where, `a ${r.rung} row links its \`submission\``);
  }
  if (r.rung === 'listed') {
    if (r.delisted_on != null || r.delisted_why != null) say(where, 'a listed row carries no delisted fields');
    for (const line of LINES) {
      const c = r.checks?.[line];
      if (!c) say(where, `listed with checks.${line} unanswered`);
      else if (c.result !== 'pass') say(where, `listed with checks.${line} ${c.result}`);
      else if (r.listed_on && c.on > r.listed_on) say(where, `checks.${line} read ${c.on}, after its listing ${r.listed_on}`);
    }
  }
  if (r.rung === 'delisted' && (r.delisted_on == null || r.delisted_why == null)) say(where, 'a delisted row says `delisted_on` and `delisted_why`');
  if (r.delisted_on && r.listed_on && r.delisted_on < r.listed_on) say(where, '`delisted_on` before `listed_on`');
});

if (problems.length) {
  for (const p of problems) console.log(`  ${p}`);
  console.log(`FAIL: ${problems.length} problem(s) in ${rows.length} row(s).`);
  process.exit(1);
}
const by = Object.fromEntries(RUNGS.map(x => [x, rows.filter(r => r.rung === x).length]));
console.log(`PASS: ${rows.length} row(s): ${by.listed} listed, ${by.built} built, ${by.delisted} delisted.${rows.length === 0 ? ' An empty list: nothing to rate yet.' : ''}`);
