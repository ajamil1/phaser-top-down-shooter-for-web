// Every upgradable stat, at its base value.
export function makeUpgradeBlock() {
  return {
    spread: 0,
    firerate: 40,
    speed: 0,
    acceleration: 0,
    damage: 1,
    health: 0,
    range: 0.02,
    vision: 50,
    bulletspeed: 0,
    multishot: 0,
    firerateBonus: 0,
    reloadZone: 0,
    ammoBonus: 0,
    accuracy: 0,
    ricochet: 0,
    ammoEfficiency: 0,
    pierce: 0,
    fullAuto: 0,
    doubleBarrel: 0,
    windUp: 0,
  };
}

export const WEAPON_TYPES = ['none', 'pistol', 'dualPistol', 'shieldPistol', 'shotgun', 'ar', 'arc', 'boltRifle', 'sword'];

// Display names shown in the HUD / menu (internal type keys stay unchanged).
export const WEAPON_LABELS = {
  none: 'FISTS',
  pistol: 'PISTOL',
  dualPistol: 'DUAL PISTOLS',
  shieldPistol: 'SHIELD PISTOL',
  shotgun: 'SHOTGUN',
  ar: 'ASSAULT RIFLE',
  arc: 'ARC',
  boltRifle: 'RIFLE',
  sword: 'SWORD',
};

// Difficulty scales how many seconds each kill refunds. state.difficulty indexes this.
// scoreMult: harder modes multiply the final score, so the same performance ranks
//   higher on the shared leaderboard.
// medals: BASE thresholds tuned against the *raw* (pre-multiplier) score. The
//   effective medal thresholds are these × scoreMult, so the raw performance a
//   medal takes stays constant while the displayed numbers track the scaled score.
//   Earning GOLD on a difficulty unlocks the next one (EASY is always unlocked).
export const DIFFICULTIES = [
  { name: 'EASY',   perKill: 1,    scoreMult: 1,   medals: { bronze: 3000, silver: 6000, gold: 10000 } },
  { name: 'NORMAL', perKill: 0.5,  scoreMult: 1.5, medals: { bronze: 2500, silver: 5000, gold: 8000  } },
  { name: 'HARD',   perKill: 0.25, scoreMult: 2,   medals: { bronze: 2000, silver: 4000, gold: 6500  } },
  { name: 'HARDER', perKill: 0.1,  scoreMult: 3,   medals: { bronze: 1500, silver: 3000, gold: 5000  } },
];

export const MEDAL_COLORS = { bronze: '#cd7f32', silver: '#c9c9c9', gold: '#ffd700' };

// Upgrades are global (affect every weapon), but the Tinker's Shop can remove
// specific upgrade types from specific weapons. weaponRemovals holds, per
// weapon, the set of shop upgrade types that are switched off for it.
const globalUpgrades = makeUpgradeBlock();
const weaponRemovals = {};
for (const t of WEAPON_TYPES) weaponRemovals[t] = new Set();

// Which upgrade-block fields each shop upgrade type controls.
export const STAT_FIELDS = {
  multishot:     ['multishot'],
  firerate:      ['firerateBonus'],
  reload:        ['reloadZone'],
  ammo:          ['ammoBonus'],
  accuracy:      ['accuracy'],
  ricochet:      ['ricochet'],
  ammoeff:       ['ammoEfficiency'],
  bulletspeed:   ['bulletspeed'],
  damage:        ['damage'],
  pierce:        ['pierce'],
  fullAuto: ['fullAuto'],
  doubleBarrel:  ['doubleBarrel'],
  windUp:        ['windUp'],
};

const BASE_BLOCK = makeUpgradeBlock();

// Resets all run-specific state at the start of a fresh game.
export function resetRun() {
  state.frames = 0;
  state.xp = 0;
  state.xpToLevel = 100;
  state.level = 1;
  state.kills = 0;
  state.style = 0;
  state.elapsed = 0;
  state.timeLeft = 120;
  state.gameOver = false;
  state.shieldUp = false;
  state.windupAmmoBonus = 0;
  state.globalUpgrades = makeUpgradeBlock();
  for (const t of WEAPON_TYPES) state.weaponRemovals[t].clear();
  state.upgrade = state.globalUpgrades;
}

// Rebuilds state.upgrade as the held weapon's effective view of the global
// upgrades: global values, with any tinkered-off stats reset to base.
export function refreshActiveUpgrades() {
  const removed = state.weaponRemovals[state.weapon.type];
  if (!removed || removed.size === 0) {
    state.upgrade = state.globalUpgrades;
    return;
  }
  const eff = { ...state.globalUpgrades };
  for (const type of removed) {
    for (const field of STAT_FIELDS[type] ?? []) eff[field] = BASE_BLOCK[field];
  }
  state.upgrade = eff;
}

export const state = {
  player: null,
  legs: null,
  cursor: null,
  mainCamera: null,
  frames: 0,
  spaceDown: false,
  angleToPointer: 0,

  // Two weapon slots; the player toggles between them with 1 / 2. The active
  // slot is mirrored into state.weapon (wired up below the literal) so all the
  // existing single-weapon code (combat, reload, HUD) keeps working unchanged.
  weaponSlots: [
    { type: 'pistol', firemode: 'semi', firerate: 90, ammo: 9 },
    { type: 'none',   firemode: 'semi', firerate: 90, ammo: 0 },
  ],
  activeSlot: 0,
  weapon: null, // → weaponSlots[activeSlot]

  xp: 0,
  xpToLevel: 100,
  level: 1,
  kills: 0,
  style: 0,
  elapsed: 0,
  timeLeft: 120,
  gameOver: false,
  difficulty: 0, // index into DIFFICULTIES; chosen in the menu, persists across runs

  globalUpgrades,
  weaponRemovals,
  upgrade: globalUpgrades,

  windupAmmoBonus: 0,
  dualPistolFrame: 8,
  shieldUp: false,
  starterWeapon: 0,

  // physics groups
  bullets: null,
  enemyBullets: null,
  enemySights: null,
  enemyPathScanners: null,
  enemyFighters: null,
  walls: null,
  corpses: null,
  sparks: null,
  weapons: null,
  xpOrbs: null,
  dashLines: null,
  muzzleFlashes: null,

  // audio
  pistol_sfx: null,
  shotgun_sfx: null,
  rifle_sfx: null,
  arc_sfx: null,
  bolt_rifle_sfx: null,
  sword_sfx: null,
  single_reload_sfx: null,
  reload_mag_sfx: null,
  empty_mag_sfx: null,
  banishing: null,

  // collision/overlap handles
  obtainWeapon: null,
};

// state.weapon always points at the active slot object.
state.weapon = state.weaponSlots[state.activeSlot];
