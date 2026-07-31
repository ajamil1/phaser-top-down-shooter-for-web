import { state, DIFFICULTIES } from '../state.js';

// LocalStorage-backed persistence for weapon unlocks and the leaderboard.
// (The leaderboard will move to a real database later — same API surface.)

const UNLOCK_KEY = 'tds_unlockedWeapons';
const LEADERBOARD_KEY = 'tds_leaderboard';
const DIFFICULTY_KEY = 'tds_difficulty';
const MEDALS_KEY = 'tds_medals';
const UNLOCK_ALL_KEY = 'tds_unlockAllTest';

// Testing override: when on, every weapon reads as unlocked.
export function getUnlockAll() {
  return _read(UNLOCK_ALL_KEY, false) === true;
}
export function setUnlockAll(on) {
  _write(UNLOCK_ALL_KEY, !!on);
}

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
  if (getUnlockAll()) return true; // testing override
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

// ── Medals / difficulty unlocks ───────────────────────────────────────────────
// Best medal earned per difficulty index: { 0: 'gold', 1: 'bronze', ... }.
// GOLD on a difficulty unlocks the next one; EASY is always open.

const MEDAL_RANK = { bronze: 1, silver: 2, gold: 3 };

export function getMedals() {
  const m = _read(MEDALS_KEY, {});
  return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
}

// Effective bronze/silver/gold cutoffs for a difficulty — the base thresholds
// scaled by the same score multiplier applied in computeScore(), so they line up
// with the numbers the player actually sees.
export function getMedalThresholds(difficultyIndex) {
  const d = DIFFICULTIES[difficultyIndex];
  if (!d?.medals) return null;
  const m = d.scoreMult ?? 1;
  return {
    bronze: Math.round(d.medals.bronze * m),
    silver: Math.round(d.medals.silver * m),
    gold:   Math.round(d.medals.gold   * m),
  };
}

export function medalForScore(difficultyIndex, score) {
  const t = getMedalThresholds(difficultyIndex);
  if (!t) return null;
  if (score >= t.gold)   return 'gold';
  if (score >= t.silver) return 'silver';
  if (score >= t.bronze) return 'bronze';
  return null;
}

export function isDifficultyUnlocked(index) {
  if (index <= 0) return true;
  if (index >= DIFFICULTIES.length) return false;
  return getMedals()[index - 1] === 'gold';
}

// Records the run's medal (if it beats the stored best) and reports whether
// this run's gold just opened up the next difficulty.
export function recordMedal(difficultyIndex, score) {
  const medal = medalForScore(difficultyIndex, score);
  const medals = getMedals();
  const prev = medals[difficultyIndex] ?? null;
  const hasNext = difficultyIndex + 1 < DIFFICULTIES.length;
  const unlockedNext = hasNext && medal === 'gold' && prev !== 'gold';
  if (medal && MEDAL_RANK[medal] > (MEDAL_RANK[prev] ?? 0)) {
    medals[difficultyIndex] = medal;
    _write(MEDALS_KEY, medals);
  }
  return { medal, unlockedNext };
}

// ── Difficulty ────────────────────────────────────────────────────────────────

export function getDifficulty() {
  const idx = _read(DIFFICULTY_KEY, 0);
  const valid = Number.isInteger(idx) && idx >= 0 && idx < DIFFICULTIES.length ? idx : 0;
  // Never restore a difficulty the player hasn't unlocked (fall back to the
  // highest unlocked one at or below the stored choice).
  let d = valid;
  while (d > 0 && !isDifficultyUnlocked(d)) d--;
  return d;
}

export function setDifficulty(index) {
  _write(DIFFICULTY_KEY, index);
}

// ── Score / leaderboard ─────────────────────────────────────────────────────

export function computeScore() {
  const raw = state.kills * 100 + (state.level - 1) * 300;
  const mult = DIFFICULTIES[state.difficulty]?.scoreMult ?? 1;
  return Math.round(raw * mult);
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
