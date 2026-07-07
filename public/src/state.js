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

  upgrade: {
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
  },

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
