import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from '../index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(here, '../data/state.json');
let originalState;
let server;
let base;

before(async () => {
  originalState = fs.readFileSync(statePath, 'utf8');
  fs.writeFileSync(statePath, JSON.stringify({ swipes: [] }, null, 2));
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  fs.writeFileSync(statePath, originalState);
});

test('feed contains 30 profiles and does not disclose incoming likes', async () => {
  const response = await fetch(`${base}/feed`);
  const profiles = await response.json();
  assert.equal(response.status, 200);
  assert.equal(profiles.length, 30);
  assert.equal(profiles.some(p => Object.hasOwn(p, 'likesYou')), false);
});

test('a mutual like creates a match and persists after feed reload', async () => {
  const response = await fetch(`${base}/swipe`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ profileId: 'p01', action: 'like' }) });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.match, true);
  const feed = await (await fetch(`${base}/feed`)).json();
  assert.equal(feed.some(p => p.id === 'p01'), false);
  const matches = await (await fetch(`${base}/matches`)).json();
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, 'p01');
});

test('one-sided likes never appear in matches', async () => {
  const response = await fetch(`${base}/swipe`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ profileId: 'p02', action: 'like' }) });
  const result = await response.json();
  assert.equal(result.match, false);
  const matches = await (await fetch(`${base}/matches`)).json();
  assert.equal(matches.some(p => p.id === 'p02'), false);
});

test('duplicate swipes are rejected', async () => {
  const response = await fetch(`${base}/swipe`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ profileId: 'p01', action: 'pass' }) });
  assert.equal(response.status, 409);
});

test('invalid actions are rejected', async () => {
  const response = await fetch(`${base}/swipe`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ profileId: 'p03', action: 'maybe' }) });
  assert.equal(response.status, 400);
});
