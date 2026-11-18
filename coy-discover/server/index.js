import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const profiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/profiles.json'), 'utf8'));
const statePath = path.join(__dirname, 'data/state.json');
app.use(cors());
app.use(express.json());

function readState() { return JSON.parse(fs.readFileSync(statePath, 'utf8')); }
function writeState(state) { fs.writeFileSync(statePath, JSON.stringify(state, null, 2)); }
function publicProfile(profile) {
  const { likesYou, ...safe } = profile;
  return safe; // Incoming likes are deliberately never exposed by the API.
}

app.get('/feed', (_req, res) => {
  const { swipes } = readState();
  const seen = new Set(swipes.map(s => s.profileId));
  res.json(profiles.filter(p => !seen.has(p.id)).map(publicProfile));
});

app.post('/swipe', (req, res) => {
  const { profileId, action } = req.body || {};
  if (!profileId || !['like', 'pass'].includes(action)) {
    return res.status(400).json({ error: 'profileId and action (like or pass) are required.' });
  }
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });
  const state = readState();
  if (state.swipes.some(s => s.profileId === profileId)) {
    return res.status(409).json({ error: 'This profile has already been swiped on.' });
  }
  state.swipes.push({ profileId, action, createdAt: new Date().toISOString() });
  writeState(state);
  const isMatch = action === 'like' && profile.likesYou === true;
  res.json({ success: true, match: isMatch, profile: isMatch ? publicProfile(profile) : null });
});

app.get('/matches', (_req, res) => {
  const { swipes } = readState();
  const likedIds = new Set(swipes.filter(s => s.action === 'like').map(s => s.profileId));
  res.json(profiles.filter(p => likedIds.has(p.id) && p.likesYou).map(publicProfile));
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
export { app };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => console.log(`Coy Discover API running at http://localhost:${PORT}`));
}
