import * as Phaser from 'phaser';
import { state } from '../state.js';

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
    case 'shotgun': player.setFrame(7); break;
    case 'sword':   player.setFrame(15); break;
    default:        player.setFrame(0); break;
  }
}

export function angleOffset(s) {
  if (s === 0) return 0;
  return (s % 2 === 1 ? 1 : -1) * Math.ceil(s / 2) * 0.1;
}

export function shootBullet(rotation) {
  const { weapon, upgrade, bullets, player, mainCamera, pistol_sfx, shotgun_sfx, rifle_sfx } = state;
  const detune = Phaser.Math.Between(-100, 100);
  const speedBonus = upgrade.bulletspeed * 250;
  const spreadMod = upgrade.multishot * 0.015 - upgrade.accuracy * 0.015;
  const damage = upgrade.damage;
  const extraShots = upgrade.multishot;
  const freeShot = Math.random() < Math.log1p(upgrade.ammoEfficiency) * 0.30 + (state.windupAmmoBonus ?? 0);

  switch (weapon.type) {
    case 'shieldPistol':
      if (weapon.ammo > 0) {
        const shots = Math.min(1 + extraShots, weapon.ammo);
        pistol_sfx.play();
        pistol_sfx.setDetune(detune);
        const spread = state.shieldUp
          ? Math.max(0.10, 0.28 + spreadMod)
          : Math.max(0.005, 0.02 + spreadMod);
        for (let s = 0; s < shots; s++) {
          const bullet = bullets.get(player.x, player.y);
          if (!bullet) break;
          bullet.fire(rotation, player.x, player.y, 4000 + speedBonus, 4500 + speedBonus, 0.02, spread, 100, false, damage + 1);
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
        const shots = Math.min(1 + extraShots, weapon.ammo);
        shotgun_sfx.play();
        shotgun_sfx.setDetune(detune);
        for (let s = 0; s < shots; s++) {
          for (let i = 0; i <= 12; i++) {
            const bullet = bullets.get(player.x, player.y);
            if (!bullet) continue;
            bullet.fire(rotation + angleOffset(s) * 1.5, player.x, player.y, 2000 + speedBonus, 4000 + speedBonus, 0.07, Math.max(0.02, 0.2 + spreadMod), 80, false, damage);
          }
        }
        mainCamera.shake(100, 0.004);
        if (!freeShot) weapon.ammo -= shots;
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

    default:
      break;
  }
}

export function getSwordDamage() {
  const u = state.upgrade;
  const bulletBonus = u.bulletspeed + u.pierce + u.multishot + u.ricochet
    + u.ammoEfficiency + u.firerateBonus + u.accuracy
    + u.binaryTrigger + u.chargeShot + u.windUp;
  return u.damage + bulletBonus;
}

export function shootChargeShotgun(rotation, chargeRatio) {
  const { weapon, upgrade, bullets, player, mainCamera, shotgun_sfx } = state;
  const freeShot = Math.random() < Math.log1p(upgrade.ammoEfficiency) * 0.30;
  const maxAmmo = 7 + upgrade.ammoBonus;
  const chargeShells = Math.max(1, Math.round(chargeRatio * maxAmmo));
  const shellsToFire = Math.min(chargeShells, weapon.ammo);
  if (shellsToFire <= 0) return;

  const totalShots = shellsToFire + upgrade.multishot;
  const speedBonus = upgrade.bulletspeed * 250;

  // Spread scales with total clusters; goes tighter below 50% charge
  const chargeSpreadMod = (totalShots - 1) * 0.015
    - (chargeRatio < 0.5 ? (0.5 - chargeRatio) * 0.12 : 0)
    - upgrade.accuracy * 0.015;
  const spread = Math.max(0.02, 0.2 + chargeSpreadMod);

  const detune = Phaser.Math.Between(-100, 100);
  shotgun_sfx.play();
  shotgun_sfx.setDetune(detune);

  for (let s = 0; s < totalShots; s++) {
    for (let i = 0; i <= 12; i++) {
      const bullet = bullets.get(player.x, player.y);
      if (!bullet) continue;
      bullet.fire(rotation + angleOffset(s) * 1.5, player.x, player.y,
        2000 + speedBonus, 4000 + speedBonus, 0.07, spread, 80, false, upgrade.damage);
    }
  }

  mainCamera.shake(100, Math.min(0.02, 0.004 + shellsToFire * 0.002));
  if (!freeShot) weapon.ammo -= shellsToFire;
}

export function enemyShoot(enemy, weaponId, rotation, sound) {
  const { bullets, pistol_sfx, shotgun_sfx, rifle_sfx, player } = state;
  const detune = Phaser.Math.Between(-100, 100);

  switch (weaponId) {
    case 15:
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

    default:
      break;
  }
}
