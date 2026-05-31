import * as Phaser from 'phaser';
import { state } from '../state.js';

// Maps enemy weapon IDs to collectible weapon IDs (returns null for unarmed enemies)
function enemyWeaponToCollectible(enemyWeaponId) {
  if (enemyWeaponId === 1) return 0; // pistol
  if (enemyWeaponId === 2) return 1; // shotgun
  if (enemyWeaponId === 3) return 2; // ar
  if (enemyWeaponId >= 4 && enemyWeaponId <= 10) return 3; // sword
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

  let reroll = Phaser.Math.Between(0, 5);
  while (reroll >= 2) {
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    const posX = enemyX + radius * Math.cos(angle);
    const posY = enemyY + radius * Math.sin(angle);
    const extra = enemyFighters.get(player.x, player.y);
    if (extra) extra.spawn(posX, posY, radius);
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

function _startChain(walls, x0, y0, roll) {
  const gap = 66;
  const dx = (roll === 0 || roll === 2) ? gap : 0;
  const dy = (roll === 1 || roll === 3) ? gap : 0;
  for (let i = 0; i < 3; i++) {
    const w = walls.get(x0 + dx * i, y0 + dy * i);
    if (w) w.spawn(x0 + dx * i, y0 + dy * i, 200, 200);
  }
  const loop = Phaser.Math.Between(0, 10);
  _recursiveSpawnWall(walls, x0 + dx * 2, y0 + dy * 2, roll);
}

export function spawnWall() {
  const { walls } = state;
  const roll = Phaser.Math.Between(0, 3);
  const gap = 66;
  _startChain(walls, gap * Phaser.Math.Between(-65, 65), gap * Phaser.Math.Between(-65, 65), roll);
}

async function _recursiveSpawnWall(walls, x, y, roll) {
  const wall = await walls.get(x, y);
  const loop = Phaser.Math.Between(0, 20);
  const gap = 66;
  if (wall) {
    switch (roll) {
      case 0: x += gap; break;
      case 1: y += gap; break;
      case 2: x += gap; break;
      case 3: y += gap; break;
    }
    wall.spawn(x, y, 200, 200);
  }
  if (loop <= 12) {
    _recursiveSpawnWall(walls, x, y, roll);
  } else if (loop <= 19) {
    // New chain at a fresh position — minimum 3 tiles, gap guaranteed by new anchor
    _startChain(walls, gap * Phaser.Math.Between(-65, 65), gap * Phaser.Math.Between(-65, 65), Phaser.Math.Between(0, 3));
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

// Common appear twice, rare appear once
const UPGRADE_TYPES = [
  'firerate', 'firerate',
  'reload',   'reload',
  'ammo',     'ammo',
  'accuracy', 'accuracy',
  'multishot',
  'ricochet',
  'ammoeff',
];

export function spawnUpgrade(x, y) {
  const { upgrades, player } = state;
  const type = UPGRADE_TYPES[Phaser.Math.Between(0, UPGRADE_TYPES.length - 1)];
  const upgrade = upgrades.get(player.x, player.y);
  if (upgrade) upgrade.spawn(x, y, type);
}

export function spawnWeapon(x, y, enemyWeaponId) {
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
  const corpse = corpses.get(player.x, player.y);
  if (corpse) corpse.spawn(x, y, r, vx, vy);
}
