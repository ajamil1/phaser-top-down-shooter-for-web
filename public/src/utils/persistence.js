import { state, DIFFICULTIES } from '../state.js';

// LocalStorage-backed persistence for weapon unlocks and the leaderboard.
// (The leaderboard will move to a real database later — same API surface.)

const UNLOCK_KEY = 'tds_unlockedWeapons';
const LEADERBOARD_KEY = 'tds_leaderboard';
const DIFFICULTY_KEY = 'tds_difficulty';

// Pistol is always available as the free starter.
const DEFAULT_UNLOCKED = ['pistol'];

function _read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function _write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) { /* storage unavailable — silently ignore */ }
}

// ── Weapon unlocks ──────────────────────────────────────────────────────────

export function getUnlockedWeapons() {
  const stored = _read(UNLOCK_KEY, []);
  const set = new Set([...DEFAULT_UNLOCKED, ...(Array.isArray(stored) ? stored : [])]);
  return [...set];
}

export function isWeaponUnlocked(type) {
  return getUnlockedWeapons().includes(type);
}

// Marks a weapon type unlocked (called when the player actually uses it in a run).
export function unlockWeapon(type) {
  if (!type || DEFAULT_UNLOCKED.includes(type)) return;
  const unlocked = getUnlockedWeapons();
  if (unlocked.includes(type)) return;
  unlocked.push(type);
  _write(UNLOCK_KEY, unlocked.filter(t => !DEFAULT_UNLOCKED.includes(t)));
}

// ── Difficulty ────────────────────────────────────────────────────────────────

export function getDifficulty() {
  const idx = _read(DIFFICULTY_KEY, 1);
  return Number.isInteger(idx) && idx >= 0 && idx < DIFFICULTIES.length ? idx : 1;
}

export function setDifficulty(index) {
  _write(DIFFICULTY_KEY, index);
}

// ── Score / leaderboard ─────────────────────────────────────────────────────

export function computeScore() {
  return state.kills * 100 + (state.level - 1) * 300;
}

export function getLeaderboard() {
  const list = _read(LEADERBOARD_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.slice().sort((a, b) => b.score - a.score);
}

export function submitScore(name, score) {
  const list = getLeaderboard();
  list.push({ name: (name || 'ANON').slice(0, 12), score, date: Date.now() });
  list.sort((a, b) => b.score - a.score);
  _write(LEADERBOARD_KEY, list.slice(0, 10));
  return getLeaderboard();
}
