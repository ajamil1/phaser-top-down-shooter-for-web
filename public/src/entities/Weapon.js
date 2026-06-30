import * as Phaser from 'phaser';
import { state } from '../state.js';

export class Weapon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.speed = 0;
    this.setScale(2);
    this.selected = false;
    this.lifespan = 0;
    this.id = Phaser.Math.Between(0, 3);
    this.body.setCircle(this.body.width / 2);
    this.overlay = scene.add.image(x, y, 'weapon').setScale(2).setVisible(false).setDepth(3);
  }

  setActive(value) {
    super.setActive(value);
    if (!value && this.overlay) this.overlay.setVisible(false);
    return this;
  }

  sprite() {
    const frames = [0, 1, 2, 3];
    if (this.id === 4) {
      this.setFrame(0);
      this.overlay.setFrame(0).setVisible(true);
    } else if (this.id === 5) {
      this.setFrame(0);
      this.setTint(0x44aaff);
      this.overlay.setVisible(false);
    } else if (this.id >= 0 && this.id <= 3) {
      this.setFrame(frames[this.id]);
      this.overlay.setVisible(false);
    } else {
      this.setTint(0xed00ff);
      this.overlay.setVisible(false);
    }
  }

  spawn(x, y, id) {
    if (id !== undefined) this.id = id;
    this.speed = 0;
    this.selected = false;
    this.sprite();
    this.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.lifespan = 1000;
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.body.maxVelocity.set(2000);
  }

  update() {
    const { player, cursor, spaceDown } = state;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

    this.setAlpha(this.lifespan / 1000);
    this.lifespan--;
    if (this.alpha <= 0) {
      this.setActive(false);
      this.setVisible(false);
      return;
    }

    const distanceToCursor = Phaser.Math.Distance.Between(this.x, this.y, cursor.x, cursor.y);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distanceToCursor <= 200 && distance <= 3000) {
      this.setTint(0xff0051);
      if (this.id === 4) this.overlay.setTint(0xff0051);
      if (spaceDown) this.selected = true;
    } else {
      this.clearTint();
      if (this.id === 4) this.overlay.clearTint();
    }

    this.rotation += this.speed / 100;
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;

    if (this.id === 4) {
      this.overlay.setPosition(this.x + 5, this.y + 5);
      this.overlay.setRotation(this.rotation);
      this.overlay.setAlpha(this.alpha);
    }

    if (!this.selected) {
      this.speed = 0;
    } else {
      this.speed += 0.1;
    }
  }
}
