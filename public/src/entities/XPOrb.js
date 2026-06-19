import * as Phaser from 'phaser';
import { state } from '../state.js';

const ATTRACT_RADIUS = 250;

export class XPOrb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setAlpha(0).setVisible(false).setActive(false);
    this.gfx = scene.add.graphics().setDepth(3).setVisible(false);
    this.lifespan = 0;
  }

  setActive(value) {
    super.setActive(value);
    if (!value) this.gfx?.setVisible(false);
    return this;
  }

  spawn(x, y) {
    this.lifespan = 9000;
    this.setPosition(x, y);
    this.setActive(true);
    this.gfx.setVisible(true);
    const R = 9;
    this.body.setCircle(R, this.width / 2 - R, this.height / 2 - R);
    this.body.setBounce(0.5);
    this.body.setDrag(60, 60);
    this.body.setMaxVelocity(400);
    this.body.checkCollision.none = false;
    const dir = Math.random() * Math.PI * 2;
    const spd = 80 + Math.random() * 80;
    this.body.setVelocity(Math.cos(dir) * spd, Math.sin(dir) * spd);
  }

  update(time, delta) {
    if (!this.active) return;
    this.lifespan -= delta;
    const alpha = Phaser.Math.Clamp(this.lifespan / 700, 0, 1);
    if (this.lifespan <= 0) {
      this.setActive(false);
      this.body.setVelocity(0, 0);
      return;
    }
    const { player } = state;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const dist  = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist <= ATTRACT_RADIUS) {
      const t = 1 - dist / ATTRACT_RADIUS;
      this.body.velocity.x += Math.cos(angle) * t * 500 * (delta / 1000);
      this.body.velocity.y += Math.sin(angle) * t * 500 * (delta / 1000);
    }
    const g = this.gfx;
    g.clear();
    g.setPosition(this.x, this.y);
    g.lineStyle(3, 0x00ff88, 0.35 * alpha);
    g.strokeCircle(0, 0, 14);
    g.fillStyle(0x00ff88, alpha);
    g.fillCircle(0, 0, 8);
    g.fillStyle(0xffffff, 0.55 * alpha);
    g.fillCircle(-2.5, -2.5, 3);
  }
}
