import * as Phaser from 'phaser';
import { state } from '../state.js';

const TYPES = ['damage', 'bulletspeed', 'accuracy', 'ammo'];
const TINTS = { damage: 0xff4444, bulletspeed: 0x44aaff, accuracy: 0xffaa00, ammo: 0x44ff88 };

export class UpgradePickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setScale(2);
    this.upgradeType = null;
    this.selected = false;
    this.highlighted = false;
    this.lifespan = 0;
    this.speed = 0;
    this.body.setCircle(this.body.width / 2);
  }

  spawn(x, y) {
    this.upgradeType = Phaser.Utils.Array.GetRandom(TYPES);
    this.setFrame(0);
    this.setTint(TINTS[this.upgradeType]);
    this.selected = false;
    this.highlighted = false;
    this.lifespan = 800;
    this.speed = 0;
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
    this.body.maxVelocity.set(2000);
  }

  apply() {
    switch (this.upgradeType) {
      case 'damage':      state.upgrade.damage += 0.5; break;
      case 'bulletspeed': state.upgrade.bulletspeed += 500; break;
      case 'accuracy':    state.upgrade.spread += 0.005; break;
      case 'ammo':        state.weapon.ammo += 10; break;
    }
    this.setActive(false);
    this.setVisible(false);
  }

  update() {
    const { player } = state;

    this.lifespan--;
    this.setAlpha(this.lifespan / 800);

    if (this.lifespan <= 0) {
      this.setActive(false);
      this.setVisible(false);
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

    if (this.highlighted) {
      this.setTint(0xffffff);
    } else {
      this.setTint(TINTS[this.upgradeType]);
    }

    this.rotation += this.speed / 100;
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;

    if (!this.selected) {
      this.speed = 0;
    } else {
      this.speed += 0.1;
    }
  }
}
