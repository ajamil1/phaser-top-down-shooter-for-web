import * as Phaser from 'phaser';
import { state } from '../state.js';
import { Arc, fireArcBurst } from '../entities/Arc.js';
import { unlockWeapon } from './persistence.js';

export { fireArcBurst };

// Per-weapon muzzle-flash offset from the shooter, in the aim frame:
//   forward = distance along the aim, lateral = perpendicular (aim's right = +).
// Tune live in-game with the muzzle tuner (press M), then paste the printed values.
export const MUZZLE_OFFSETS = {
  pistol:       { forward: 96, lateral: 6 },
  dualPistol:   { forward: 84, lateral: 10 },               // ±lateral: mirrors to the firing pistol
  shieldPistol: { forward: 82, lateral: 8, forwardUp: 64 }, // forwardUp used while the shield is raised
  shotgun:      { forward: 84, lateral: 5 },
  ar:           { forward: 72, lateral: 7 },
  boltRifle:    { forward: 85, lateral: 6 },
};
const DEFAULT_MUZZLE = { forward: 90, lateral: 0 };

// Enemy weapon IDs → weapon types, so enemies reuse the same muzzle offsets.
const ENEMY_WEAPON_TYPE = { 1: 'pistol', 2: 'shotgun', 3: 'ar', 14: 'dualPistol', 15: 'shieldPistol', 17: 'boltRifle' };

function spawnMuzzleFlash(shooter, aimAngle, weaponType) {
  const { muzzleFlashes } = state;
  if (!muzzleFlashes || !shooter) return;
  const base = MUZZLE_OFFSETS[weaponType] ?? DEFAULT_MUZZLE;
  let forward = base.forward;
  let lateral = base.lateral;
  if (weaponType === 'dualPistol') {
    // Flash comes from whichever pistol just fired (enemy tracks its own side).
    const side = shooter.dualPistolSide ?? (state.dualPistolFrame === 8 ? -1 : 1);
    lateral = Math.abs(base.lateral) * side;
  } else if (weaponType === 'shieldPistol' && shooter === state.player && state.shieldUp && base.forwardUp != null) {
    forward = base.forwardUp; // gun sits closer to the body while the shield is raised
  }
  const perp = aimAngle + Math.PI / 2;
  const x = shooter.x + Math.cos(aimAngle) * forward + Math.cos(perp) * lateral;
  const y = shooter.y + Math.sin(aimAngle) * forward + Math.sin(perp) * lateral;
  muzzleFlashes.get(x, y)?.spawn(x, y, aimAngle, shooter);
}

export function getFacingPosition(player, distance) {
  return {
    x: player.x + Math.cos(state.angleToPointer) * distance,
    y: player.y + Math.sin(state.angleToPointer) * distance,
  };
}

export function setWeapon(type) {
  const { player } = state;
  switch (type) {
    case 'pistol':       player.setFrame(5); break;
    case 'dualPistol':   player.setFrame(state.dualPistolFrame ?? 8); break;
    case 'shieldPistol': state.shieldUp = true; player.setFrame(26); break;
    case 'ar':      player.setFrame(6); break;
    case 'arc':     player.setFrame(29); break;
    case 'boltRifle': player.setFrame(30); break;
    case 'shotgun': player.setFrame(7); break;
    case 'sword':   player.setFrame(15); break;
    default:        player.setFrame(0); break;
  }
}

export function angleOffset(s) {
  if (s === 0) return 0;
  return (s % 2 === 1 ? 1 : -1) * Math.ceil(s / 2) * 0.1;
}

export function shootBullet(rotation, firstShot = false) {
  const { weapon, upgrade, bullets, player, mainCamera, pistol_sfx, shotgun_sfx, rifle_sfx, bolt_rifle_sfx } = state;
  unlockWeapon(weapon.type); // using a weapon in a run unlocks it as a starter
  // Muzzle flash on any gun that's actually firing a bullet (not the arc gun / melee).
  if (weapon.type !== 'arc' && weapon.type !== 'sword' && weapon.type !== 'none' && weapon.ammo > 0) {
    spawnMuzzleFlash(player, rotation - Math.PI / 2, weapon.type);
  }
  const detune = Phaser.Math.Between(-100, 100);
  const speedBonus = upgrade.bulletspeed * 250;
  const spreadMod = upgrade.multishot * 0.015 - upgrade.accuracy * 0.015;
  const damage = upgrade.damage;
  const extraShots = upgrade.multishot;
  const freeShot = Math.random() < Math.log1p(upgrade.ammoEfficiency) * 0.30 + (state.windupAmmoBonus ?? 0);

  switch (weapon.type) {
    case 'shieldPistol':
      if (weapon.ammo > 0) {
        const shots = Math.min(1, weapon.ammo);
        pistol_sfx.play();
        pistol_sfx.setDetune(detune);
        const spread = state.shieldUp
          ? Math.max(0.10, 0.28 + spreadMod)
          : Math.max(0.005, 0.02 + spreadMod);
        const spawnX = player.x + Math.cos(rotation) * 8;
        const spawnY = player.y + Math.sin(rotation) * 8;
        for (let s = 0; s < shots; s++) {
          const bullet = bullets.get(spawnX, spawnY);
          if (!bullet) break;
          // Slow, heavy red round that detonates into a 360° ring of arcs on impact.
          bullet.fire(rotation, spawnX, spawnY, 2600 + speedBonus, 3000 + speedBonus, 0.02, spread, 100, false, damage + 3);
          bullet.scaleY = 1;
          bullet.arcBurst = true;
          bullet.setTint(0xff003c); // matches the arc colour
        }
        mainCamera.shake(100, 0.002);
        if (!freeShot) weapon.ammo -= shots;
      }
      break;

    case 'pistol':
      if (weapon.ammo > 0) {
        const shots = Math.min(1 + extraShots, weapon.ammo);
        pistol_sfx.play();
        pistol_sfx.setDetune(detune);
        for (let s = 0; s < shots; s++) {
          const bullet = bullets.get(player.x, player.y);
          if (!bullet) break;
          bullet.fire(rotation, player.x, player.y, 4000 + speedBonus, 4500 + speedBonus, 0.02, Math.max(0.02, 0.07 + spreadMod), 100, false, damage + 1);
        }
        mainCamera.shake(100, 0.002);
        if (!freeShot) weapon.ammo -= shots;
      }
      break;

    case 'dualPistol': {
      if (weapon.ammo > 0) {
        const shots = Math.min(1 + extraShots, weapon.ammo);
        pistol_sfx.play();
        pistol_sfx.setDetune(detune);
        const side = state.dualPistolFrame === 8 ? -1 : 1;
        const spawnX = player.x + Math.cos(rotation) * side * 15;
        const spawnY = player.y + Math.sin(rotation) * side * 15;
        for (let s = 0; s < shots; s++) {
          const bullet = bullets.get(spawnX, spawnY);
          if (!bullet) break;
          bullet.fire(rotation, spawnX, spawnY, 4000 + speedBonus, 4500 + speedBonus, 0.02, Math.max(0.02, 0.07 + spreadMod), 100, false, damage + 1);
        }
        mainCamera.shake(100, 0.002);
        if (!freeShot) weapon.ammo -= shots;
      }
      break;
    }

    case 'shotgun':
      if (weapon.ammo > 0) {
        // Double-barrel upgrade: fixed single shot, no multishot / ammo-efficiency scaling.
        const dbl = upgrade.doubleBarrel > 0;
        const shots = dbl ? 1 : Math.min(1 + extraShots, weapon.ammo);
        const sgSpread = dbl
          ? Math.max(0.02, 0.2 - upgrade.accuracy * 0.015)
          : Math.max(0.02, 0.2 + spreadMod);
        shotgun_sfx.play();
        shotgun_sfx.setDetune(detune);
        for (let s = 0; s < shots; s++) {
          for (let i = 0; i <= 12; i++) {
            const bullet = bullets.get(player.x, player.y);
            if (!bullet) continue;
            bullet.fire(rotation + angleOffset(s) * 1.5, player.x, player.y, 2000 + speedBonus, 4000 + speedBonus, 0.07, sgSpread, 80, false, damage);
          }
        }
        mainCamera.shake(100, 0.004);
        if (dbl || !freeShot) weapon.ammo -= shots;
      }
      break;

    case 'ar':
      if (weapon.ammo > 0) {
        const shots = Math.min(1 + extraShots, weapon.ammo);
        rifle_sfx.play();
        rifle_sfx.setDetune(detune);
        for (let s = 0; s < shots; s++) {
          const bullet = bullets.get(player.x, player.y);
          if (!bullet) break;
          bullet.fire(rotation + angleOffset(s), player.x, player.y, 5000 + speedBonus, 5500 + speedBonus, 0.07, Math.max(0.01, 0.09 + spreadMod), 80, false, damage);
        }
        mainCamera.shake(50, 0.003);
        if (!freeShot) weapon.ammo -= shots;
      }
      break;

    case 'arc':
      if (weapon.ammo > 0) {
        const shots = Math.min(1 + extraShots, weapon.ammo);
        fireArcBurst(rotation + -Math.PI / 2, player.x, player.y, shots);
        mainCamera.shake(60, 0.002);
        if (!freeShot) weapon.ammo -= shots;
      }
      break;

    case 'boltRifle':
      if (weapon.ammo > 0) {
        // Fast, heavy round. Inherent +1 pierce.
        bolt_rifle_sfx.play();
        bolt_rifle_sfx.setDetune(Phaser.Math.Between(-80, 80));
        const spawnX = player.x + Math.cos(rotation) * 10;
        const spawnY = player.y + Math.sin(rotation) * 10;
        const bullet = bullets.get(spawnX, spawnY);
        if (bullet) {
          // Assault-rifle accuracy, but the first shot of a trigger pull is 80% tighter.
          const normalSpread = Math.max(0.01, 0.09 + spreadMod);
          const spread = firstShot ? normalSpread * 0.2 : normalSpread;
          bullet.fire(rotation, spawnX, spawnY, 6000 + speedBonus, 6800 + speedBonus, 0, spread, 100, false, damage + 4);
          bullet.fragSplit = true; // splits into 5 fragments on the first enemy hit
        }
        mainCamera.shake(50, 0.003); // same as the assault rifle
        if (!freeShot) weapon.ammo -= 1;
      }
      break;

    default:
      break;
  }
}

export function getSwordDamage() {
  const u = state.upgrade;
  // Every upgrade the player owns adds to sword damage, regardless of type.
  const otherUpgrades = u.bulletspeed + u.pierce + u.multishot + u.ricochet
    + u.ammoEfficiency + u.firerateBonus + u.accuracy
    + u.fullAuto + u.doubleBarrel + u.windUp
    + u.reloadZone + Math.floor(u.ammoBonus / 3);
  return u.damage + otherUpgrades;
}

export function enemyShoot(enemy, weaponId, rotation, sound) {
  const { bullets, pistol_sfx, shotgun_sfx, rifle_sfx, arc_sfx, bolt_rifle_sfx, player } = state;
  const detune = Phaser.Math.Between(-100, 100);
  if (weaponId !== 16) spawnMuzzleFlash(enemy, rotation - Math.PI / 2, ENEMY_WEAPON_TYPE[weaponId]); // not the arc gun



  switch (weaponId) {
    case 16: {
      // Same arc burst as the player's arc gun, but as enemy arcs.
      fireArcBurst(rotation + -Math.PI / 2, enemy.x, enemy.y, 1, 0, 50, true);
      break;
    }
    case 15: {
      // Same slow, red arc-burst round the player's shield pistol fires (nova on impact).
      sound.play();
      pistol_sfx.setDetune(detune);
      const spawnX = enemy.x + Math.cos(rotation) * 8;
      const spawnY = enemy.y + Math.sin(rotation) * 8;
      const bullet = bullets.get(spawnX, spawnY);
      if (bullet) {
        bullet.fire(rotation, spawnX, spawnY, 2600, 3000, 0.02, 0.02, 100, true, 4);
        bullet.scaleY = 1;
        bullet.arcBurst = true;
        bullet.setTint(0xff003c);
      }
      break;
    }

    case 1:
      sound.play();
      pistol_sfx.setDetune(detune);
      bullets.get(player.x, player.y)?.fire(rotation, enemy.x, enemy.y, 4000, 4500, 0.07, 0.09, 100, true);
      break;

    case 14: {
      sound.play();
      pistol_sfx.setDetune(detune);
      const side = enemy.dualPistolSide ?? 1;
      const spawnX = enemy.x + Math.cos(enemy.rotation) * side * 8;
      const spawnY = enemy.y + Math.sin(enemy.rotation) * side * 8;
      bullets.get(player.x, player.y)?.fire(rotation, spawnX, spawnY, 4000, 4500, 0.07, 0.09, 100, true);
      break;
    }

    case 2:
      for (let i = 0; i <= 12; i++) {
        sound.play();
        shotgun_sfx.setDetune(detune);
        bullets.get(player.x, player.y)?.fire(rotation, enemy.x, enemy.y, 2000, 4000, 0.04, 0.2, 80, true);
      }
      break;

    case 3:
      sound.play();
      rifle_sfx.setDetune(detune);
      bullets.get(player.x, player.y)?.fire(rotation, enemy.x, enemy.y, 5000, 5500, 0.07, 0.09, 80, true);
      break;

    case 17: // bolt rifle — fast heavy round
      bolt_rifle_sfx.play();
      bolt_rifle_sfx.setDetune(detune);
      bullets.get(player.x, player.y)?.fire(rotation, enemy.x, enemy.y, 5500, 6000, 0.03, 0.05, 100, true, 3);
      break;

    default:
      break;
  }
}
