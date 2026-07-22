import * as Phaser from 'phaser';
import { state, DIFFICULTIES } from '../state.js';

// ── Stage system ──────────────────────────────────────────────────────────────
// Enemy weapon composition escalates in discrete stages, gated by time survived.
// Evenly spaced (every 45s) so the ramp is gradual and slow, not compounding.
const STAGE_TIME_THRESHOLDS = [0, 45, 90, 135, 180, 225]; // seconds

// Enemy weapon pools per stage. Repeated IDs = higher spawn weight.
//   1 pistol · 2 shotgun · 3 assault rifle · 5/6 sword · 0/11/12 fists
//   14 dual pistol · 15 shield pistol · 16 arc
const STAGE_POOLS = [
  // 1 — pistols, swords, fists
  [1, 1, 5, 6, 0, 11, 12],
  // 2 — pistols, fists, swords, some dual pistols
  [1, 1, 1, 5, 6, 0, 11, 12, 14],
  // 3 — dual pistols, some pistols, some swords, a few assault rifles
  [14, 14, 14, 1, 1, 5, 6, 3],
  // 4 — assault rifles, shotguns, pistols, swords
  [3, 3, 2, 2, 1, 1, 5, 6],
  // 5 — all of them + a few shield pistols
  [1, 1, 5, 6, 2, 3, 14, 14, 15, 0],
  // 6 — everything, including the arc gun
  [1, 5, 6, 2, 3, 14, 15, 16, 0, 11],
];

// Chance an enemy drops its weapon on death (not guaranteed).
const WEAPON_DROP_CHANCE = 0.35;

export function getStage() {
  let s = 0;
  for (let i = 0; i < STAGE_TIME_THRESHOLDS.length; i++) {
    if (state.elapsed >= STAGE_TIME_THRESHOLDS[i]) s = i;
  }
  return s;
}

export function stageWeapon() {
  const pool = STAGE_POOLS[getStage()];
  return pool[Phaser.Math.Between(0, pool.length - 1)];
}

// Maps enemy weapon IDs to collectible weapon IDs (returns null for unarmed enemies)
function enemyWeaponToCollectible(enemyWeaponId) {
  if (enemyWeaponId === 1) return 0; // pistol
  if (enemyWeaponId === 2) return 1; // shotgun
  if (enemyWeaponId === 3) return 2; // ar
  if (enemyWeaponId >= 4 && enemyWeaponId <= 10) return 3; // sword
  if (enemyWeaponId === 14) return 4; // akimbo pistols
  if (enemyWeaponId === 15) return 5; // shield + pistol
  if (enemyWeaponId === 16) return 6; // arc
  return null; // unarmed / punch-only
}

export function getEnemy() {
  spawnEnemyFighter();
}

export function spawnEnemyFighter() {
  const { player, enemyFighters } = state;
  const radius = 200;
  let enemyX = player.x;
  let enemyY = player.y;

  const leader = enemyFighters.getFirstDead(player.x, player.y);
  if (leader) {
    leader.spawn(player.x, player.y, 2000);
    enemyX = leader.x;
    enemyY = leader.y;
  }

  // Cluster size grows with the stage — stage 1 spawns far fewer enemies.
  const maxExtra = 1 + getStage();
  let extras = 0;
  let reroll = Phaser.Math.Between(0, 5);
  while (reroll >= 2 && extras < maxExtra) {
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    const posX = enemyX + radius * Math.cos(angle);
    const posY = enemyY + radius * Math.sin(angle);
    const extra = enemyFighters.get(player.x, player.y);
    if (extra) extra.spawn(posX, posY, radius);
    extras++;
    reroll = Phaser.Math.Between(0, 5);
  }
}

export function spawnEnemySight() {
  // placeholder — sight spawning handled inside EnemyFighter constructor
}

export function spawnDashLine() {
  const { player, dashLines } = state;
  const line = dashLines.get(player.x, player.y);
  if (line) line.spawn(player.rotation / 2 + -Math.PI / 2);
}

const GAP = 66;

function _wallAt(children, x, y) {
  for (let i = 0; i < children.length; i++) {
    const w = children[i];
    if (w.active && Math.abs(w.x - x) < 2 && Math.abs(w.y - y) < 2) return true;
  }
  return false;
}

// Fill any cardinal-direction 1-block gaps adjacent to the freshly placed wall.
function _fillGaps(walls, x, y) {
  const ch = walls.getChildren();
  const dirs = [[GAP, 0], [-GAP, 0], [0, GAP], [0, -GAP]];
  for (const [ddx, ddy] of dirs) {
    if (_wallAt(ch, x + ddx * 2, y + ddy * 2) && !_wallAt(ch, x + ddx, y + ddy)) {
      const w = walls.get(x + ddx, y + ddy);
      if (w) w.spawn(x + ddx, y + ddy, 200, 200);
    }
  }
}

function _place(walls, x, y) {
  const w = walls.get(x, y);
  if (w) { w.spawn(x, y, 200, 200); _fillGaps(walls, x, y); }
}

function _startChain(walls, x0, y0, roll) {
  const dx = (roll === 0 || roll === 2) ? GAP : 0;
  const dy = (roll === 1 || roll === 3) ? GAP : 0;
  for (let i = 0; i < 3; i++) {
    _place(walls, x0 + dx * i, y0 + dy * i);
  }
  _recursiveSpawnWall(walls, x0 + dx * 2, y0 + dy * 2, roll);
}

export function spawnWall() {
  const { walls } = state;
  const roll = Phaser.Math.Between(0, 3);
  _startChain(walls, GAP * Phaser.Math.Between(-65, 65), GAP * Phaser.Math.Between(-65, 65), roll);
}

async function _recursiveSpawnWall(walls, x, y, roll) {
  const wall = await walls.get(x, y);
  const loop = Phaser.Math.Between(0, 20);
  const dx = (roll === 0 || roll === 2) ? GAP : 0;
  const dy = (roll === 1 || roll === 3) ? GAP : 0;
  if (wall) {
    x += dx; y += dy;
    wall.spawn(x, y, 200, 200);
    _fillGaps(walls, x, y);
  }
  if (loop <= 12) {
    _recursiveSpawnWall(walls, x, y, roll);
  } else if (loop <= 19) {
    _startChain(walls, GAP * Phaser.Math.Between(-65, 65), GAP * Phaser.Math.Between(-65, 65), Phaser.Math.Between(0, 3));
  }
}

// ── Arena layout system (unused — available for future use) ───────────────────

const G = 200;

// Each layout is an array of [col, row] offsets from the arena center.
// Rows/cols with adjacent cells are touching walls; leave empty cells for corridors.
const LAYOUTS = [
  // 0 — scattered: independent clusters scattered around center
  [
    [-4,-3],[-3,-3],
    [2,-3],[3,-3],[2,-2],
    [-4,-1],[-3,-1],[-4,0],
    [2,0],[3,0],[3,1],
    [-1,3],[0,3],[1,3],
    [-1,-4],[0,-4],
    [0,-1],[0,1],
  ],

  // 1 — halls: top/bottom borders + inner lane dividers creating three corridors
  [
    [-5,-4],[-4,-4],[-3,-4],[-2,-4],[-1,-4], [1,-4],[2,-4],[3,-4],[4,-4],[5,-4],
    [-5, 4],[-4, 4],[-3, 4],[-2, 4],[-1, 4], [1, 4],[2, 4],[3, 4],[4, 4],[5, 4],
    [-5,-3],[-5,-2],                           [-5, 2],[-5, 3],
    [ 5,-3],[ 5,-2],                           [ 5, 2],[ 5, 3],
    [-2,-3],[-2,-2],                           [-2, 2],[-2, 3],
    [ 2,-3],[ 2,-2],                           [ 2, 2],[ 2, 3],
  ],

  // 2 — crossroads: four corner rooms connected by a + corridor
  [
    [-5,-5],[-4,-5],[-5,-4],[-4,-4],
    [ 4,-5],[ 5,-5],[ 4,-4],[ 5,-4],
    [-5, 4],[-4, 4],[-5, 5],[-4, 5],
    [ 4, 4],[ 5, 4],[ 4, 5],[ 5, 5],
    [-1,-5],[0,-5],[1,-5],
    [-1, 5],[0, 5],[1, 5],
    [-5,-1],[-5,0],[-5,1],
    [ 5,-1],[ 5,0],[ 5,1],
    [-2,-2],[2,-2],[-2,2],[2,2],
    [-3,0],[3,0],[0,-3],[0,3],
  ],

  // 3 — maze: asymmetric interior walls creating winding paths
  [
    [-4,-5],[-3,-5],[-2,-5], [2,-5],[3,-5],[4,-5],
    [-4, 5],[-3, 5],[-2, 5], [2, 5],[3, 5],[4, 5],
    [-5,-4],[-5,-3],         [-5,3],[-5,4],
    [ 5,-4],[ 5,-3],         [ 5,3],[ 5,4],
    [-3,-3],[-2,-3],[-1,-3],
    [ 1,-3],[ 2,-3],
    [-3,-1],
    [ 1,-1],[ 2,-1],[ 3,-1],
    [-2, 1],[-1, 1],
    [ 1, 2],[ 2, 2],[ 3, 2],
    [-3, 2],[-4, 2],
    [-1, 3],
    [ 3,-3],
  ],
];

function _placeWall(x, y) {
  const w = state.walls.get(x, y);
  if (w) w.spawn(x, y, 200, 200);
}

export function buildArena(cx, cy, arenaNum) {
  const cells = LAYOUTS[arenaNum % LAYOUTS.length];
  for (const [col, row] of cells) {
    _placeWall(cx + col * G, cy + row * G);
  }
}

export function clearArena() {
  const { walls, enemyFighters, corpses, upgrades, weapons, bullets, enemyBullets } = state;

  walls.getChildren().forEach(w => {
    if (w.active) { w.setActive(false); w.setVisible(false); }
  });

  enemyFighters.getChildren().forEach(e => {
    e.death = true;
    e.loop = false;
    e.setActive(false);
    e.setVisible(false);
    if (e.body) e.body.checkCollision.none = true;
    if (e.legs) { e.legs.setActive(false); e.legs.setVisible(false); }
  });

  for (const group of [corpses, upgrades, weapons, bullets, enemyBullets]) {
    group.getChildren().forEach(obj => {
      if (obj.active) {
        obj.setActive(false);
        obj.setVisible(false);
        if (obj.body) obj.body.checkCollision.none = true;
      }
    });
  }
}

// ── Upgrades ───────────────────────────────────────────────────────────────────

export function spawnXP(x, y, linkedEnemy = null, amount = 10) {
  const { xpOrbs } = state;
  state.style = Math.min(1000, state.style + 6); // damaging enemies feeds the style meter
  const orb = xpOrbs.get(x, y);
  if (orb) orb.spawn(x, y, linkedEnemy, amount);
}

export function spawnWeapon(x, y, enemyWeaponId, chance = 1) {
  if (chance < 1 && Math.random() > chance) return;
  const { weapons, player } = state;
  const collectibleId = enemyWeaponToCollectible(enemyWeaponId);
  if (collectibleId === null) return;
  const weapon = weapons.get(player.x, player.y);
  if (weapon) weapon.spawn(x, y, collectibleId);
}

export function spawnSpark(x, y, r) {
  const { sparks } = state;
  let loop;
  do {
    const spark = sparks.get(x, y);
    if (spark) spark.spawn(x, y, r);
    loop = Phaser.Math.Between(0, 100);
  } while (loop >= 3);
}

export function spawnCorpse(x, y, r, vx, vy) {
  const { corpses, player } = state;
  state.kills++; // every enemy death spawns exactly one corpse
  state.timeLeft += (DIFFICULTIES[state.difficulty] ?? DIFFICULTIES[1]).perKill; // difficulty-scaled time refund
  state.style = Math.min(1000, state.style + 60); // kills feed the style meter
  const corpse = corpses.get(player.x, player.y);
  if (corpse) corpse.spawn(x, y, r, vx, vy);
}
