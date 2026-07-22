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
    binaryTrigger: 0,
    doubleBarrel: 0,
    windUp: 0,
  };
}

export const WEAPON_TYPES = ['none', 'pistol', 'dualPistol', 'shieldPistol', 'shotgun', 'ar', 'arc', 'sword'];

// Difficulty scales how many seconds each kill refunds. state.difficulty indexes this.
export const DIFFICULTIES = [
  { name: 'EASY',   perKill: 1 },
  { name: 'NORMAL', perKill: 0.5 },
  { name: 'HARD',   perKill: 0.25 },
  { name: 'HARDER', perKill: 0.1 },
];

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
  binaryTrigger: ['binaryTrigger'],
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

  weapon: {
    type: 'pistol',
    firemode: 'semi',
    firerate: 90,
    ammo: 9,
  },

  xp: 0,
  xpToLevel: 100,
  level: 1,
  kills: 0,
  style: 0,
  elapsed: 0,
  timeLeft: 120,
  gameOver: false,
  difficulty: 1, // index into DIFFICULTIES; chosen in the menu, persists across runs

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

  // audio
  pistol_sfx: null,
  shotgun_sfx: null,
  rifle_sfx: null,
  sword_sfx: null,
  single_reload_sfx: null,
  reload_mag_sfx: null,
  empty_mag_sfx: null,
  banishing: null,

  // collision/overlap handles
  obtainWeapon: null,
};
