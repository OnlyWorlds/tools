#!/usr/bin/env node
// The README's example row is check.mjs's fixture: it must pass, and each mutant below must fail
// alone, naming what it broke. So the documented shape and the check cannot drift apart.
//
//   node test.mjs

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const readme = readFileSync(join(here, 'README.md'), 'utf8');
const block = readme.match(/```jsonc\n([\s\S]*?)```/);
if (!block) { console.log('FAIL: no jsonc example in README.md'); process.exit(1); }
const example = JSON.parse(block[1].replace(/\s+\/\/[^\n]*/g, ''));
if (example.tools.length !== 1) { console.log('FAIL: the README example holds one row'); process.exit(1); }

const dir = mkdtempSync(join(tmpdir(), 'ow-tools-'));
const run = (doc) => {
  const f = join(dir, 'tools.json');
  writeFileSync(f, JSON.stringify(doc));
  try { return { code: 0, out: execFileSync('node', [join(here, 'check.mjs'), f], { encoding: 'utf8' }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout) }; }
};
const row = () => structuredClone(example.tools[0]);
const doc = (...rows) => ({ format: 1, tools: rows });

// [name, document, a word the failure must say]
const MUTANTS = [
  ['unknown row key', (() => { const r = row(); r.stars = 5; return doc(r); })(), 'unknown key `stars`'],
  ['missing key', (() => { const r = row(); delete r.paid; return doc(r); })(), '`paid` missing'],
  ['unknown file key', { ...doc(row()), extra: 1 }, 'unknown key `extra`'],
  ['http url', (() => { const r = row(); r.url = 'http://x.example'; return doc(r); })(), '`url` must be an https URL'],
  ['bad id', (() => { const r = row(); r.id = 'My Tool'; return doc(r); })(), '`id` must be'],
  ['bad door', (() => { const r = row(); r.doors = ['api', 'ftp']; return doc(r); })(), '`doors`'],
  ['bad prefix', (() => { const r = row(); r.prefix = 'mytool_'; return doc(r); })(), '`prefix`'],
  ['duplicate id', (() => { const a = row(), b = row(); b.url = 'https://other.example'; b.client = 'other'; return doc(a, b); })(), '`id` mytool is also row 0'],
  ['duplicate client', (() => { const a = row(), b = row(); b.id = 'other'; b.url = 'https://other.example'; return doc(a, b); })(), '`client` mytool is also row 0'],
  ['no source, no note', (() => { const r = row(); r.source = null; return doc(r); })(), 'source_note'],
  ['listed with a failed line', (() => { const r = row(); r.checks.host.result = 'fail'; return doc(r); })(), 'checks.host fail'],
  ['listed with a line unanswered', (() => { const r = row(); delete r.checks.free_core; return doc(r); })(), 'checks.free_core unanswered'],
  ['an inside line read from outside', (() => { const r = row(); r.checks.keys_stay.how = 'read'; return doc(r); })(), 'cannot be read from outside'],
  ['a line read after its listing', (() => { const r = row(); r.checks.host.on = '2026-10-21'; r.listed_on = '2026-10-20'; return doc(r); })(), 'after its listing'],
  ['a future date', (() => { const r = row(); r.listed_on = '2999-01-01'; return doc(r); })(), 'not in the future'],
  ['listed without the word', (() => { const r = row(); r.listed_by = null; return doc(r); })(), '`listed_by`'],
  ['built with a listing date', (() => { const r = row(); r.rung = 'built'; return doc(r); })(), 'a built row carries no listed'],
  ['delisted without why', (() => { const r = row(); r.rung = 'delisted'; r.delisted_on = r.listed_on; return doc(r); })(), '`delisted_why`'],
  ['unknown check line', (() => { const r = row(); r.checks.vibes = { result: 'pass', how: 'read', on: '2026-10-20' }; return doc(r); })(), 'unknown line `vibes`'],
  ['format 2', { format: 2, tools: [row()] }, '`format` must be 1'],
];

const problems = [];
const clean = run(example);
if (clean.code !== 0) problems.push(`the README example fails:\n${clean.out}`);
const empty = run(doc());
if (empty.code !== 0 || !empty.out.includes('An empty list')) problems.push('an empty list does not pass as empty');
for (const [name, d, word] of MUTANTS) {
  const got = run(d);
  if (got.code !== 1) problems.push(`${name}: exit ${got.code}, expected 1`);
  else if (!got.out.includes(word)) problems.push(`${name}: failed, but did not say "${word}":\n${got.out}`);
}
rmSync(dir, { recursive: true, force: true });
if (problems.length) { for (const p of problems) console.log(`  ${p}`); console.log(`FAIL: ${problems.length} of ${MUTANTS.length + 2}`); process.exit(1); }
console.log(`PASS: the README example passes, an empty list passes as empty, and ${MUTANTS.length} mutants each fail naming their cause.`);
