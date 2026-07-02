import * as Phaser from 'phaser';
import { state } from '../state.js';

// hot pink → red → yellow → cyan → indigo → hot pink
const STOPS = [
  { r: 255, g: 20,  b: 147 }, // hot pink
  { r: 255, g: 0,   b: 0   }, // red
  { r: 255, g: 220, b: 0   }, // yellow
  { r: 0,   g: 230, b: 255 }, // cyan
  { r: 75,  g: 0,   b: 210 }, // indigo
];

function paletteColor(t) {
  const n = STOPS.length;
  const scaled = ((t % 1) + 1) % 1 * n;
  const i = Math.floor(scaled) % n;
  const j = (i + 1) % n;
  const f = scaled - Math.floor(scaled);
  const r = Math.round(STOPS[i].r + (STOPS[j].r - STOPS[i].r) * f);
  const g = Math.round(STOPS[i].g + (STOPS[j].g - STOPS[i].g) * f);
  const b = Math.round(STOPS[i].b + (STOPS[j].b - STOPS[i].b) * f);
  return (r << 16) | (g << 8) | b;
}

const BASE_R = 7;

export class XPOrb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setAlpha(0).setVisible(false).setActive(false);
    this.gfx = scene.add.graphics().setDepth(3).setVisible(false);
    this.lifespan = 0;
    this.hue = Math.random();
    this.speed = 0;
    this.linkedEnemy = null;
  }

  setActive(value) {
    super.setActive(value);
    if (!value) this.gfx?.setVisible(false);
    return this;
  }

  spawn(x, y, linkedEnemy = null, amount = 10) {
    this.lifespan = 12000;
    this.hue = Math.random();
    this.speed = 0;
    this.amount = amount;
    this.linkedEnemy = linkedEnemy;
    this.setPosition(x, y);
    this.setActive(true);
    this.gfx.setVisible(true);
    const R = BASE_R + 2;
    this.body.setCircle(R, this.width / 2 - R, this.height / 2 - R);
    this.body.velocity.set(0, 0);
    this.body.checkCollision.none = false;
  }

  update(_time, delta) {
    if (!this.active) return;

    this.lifespan -= delta;
    const alpha = Phaser.Math.Clamp(this.lifespan / 700, 0, 1);
    if (this.lifespan <= 0) {
      this.setActive(false);
      return;
    }

    const { player } = state;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    const restricted = this.linkedEnemy && !this.linkedEnemy.death;
    if (!restricted || dist < 80 || this.speed > 0) {
      this.linkedEnemy = null;
      this.speed += 0.1;
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    }

    // Cycle through custom palette
    this.hue = (this.hue + delta / 1800) % 1;
    const color = paletteColor(this.hue);

    const vx = Math.cos(angle) * this.speed;
    const vy = Math.sin(angle) * this.speed;
    const spd = this.speed;

    const g = this.gfx;
    g.clear();
    g.setPosition(this.x, this.y);

    if (spd > 8) {
      const nx = vx / spd;
      const ny = vy / spd;
      const px = -ny;
      const py =  nx;

      // Subtle stretch — much less than before
      const halfLen = Math.min(spd / 10, 50);
      const halfW   = BASE_R * 0.65;

      // Soft outer glow
      const glow = Math.min(halfLen * 0.4, 10);
      g.fillStyle(color, 0.12 * alpha);
      g.fillPoints([
        { x:  nx * (halfLen + glow) + px * (halfW + glow), y:  ny * (halfLen + glow) + py * (halfW + glow) },
        { x:  nx * (halfLen + glow) - px * (halfW + glow), y:  ny * (halfLen + glow) - py * (halfW + glow) },
        { x: -nx * (halfLen + glow) - px * (halfW + glow), y: -ny * (halfLen + glow) - py * (halfW + glow) },
        { x: -nx * (halfLen + glow) + px * (halfW + glow), y: -ny * (halfLen + glow) + py * (halfW + glow) },
      ], true);

      // Core capsule
      g.fillStyle(color, alpha);
      g.fillPoints([
        { x:  nx * halfLen + px * halfW, y:  ny * halfLen + py * halfW },
        { x:  nx * halfLen - px * halfW, y:  ny * halfLen - py * halfW },
        { x: -nx * halfLen - px * halfW, y: -ny * halfLen - py * halfW },
        { x: -nx * halfLen + px * halfW, y: -ny * halfLen + py * halfW },
      ], true);
      g.fillCircle( nx * halfLen,  ny * halfLen, halfW);
      g.fillCircle(-nx * halfLen, -ny * halfLen, halfW);

      g.fillStyle(0xffffff, 0.4 * alpha);
      g.fillCircle(-nx * 2 - 1.5, -ny * 2 - 1.5, 1.8);
    } else {
      // Round when slow/stationary
      g.lineStyle(2, color, 0.3 * alpha);
      g.strokeCircle(0, 0, BASE_R + 4);
      g.fillStyle(color, alpha);
      g.fillCircle(0, 0, BASE_R);
      g.fillStyle(0xffffff, 0.45 * alpha);
      g.fillCircle(-2, -2, 2.5);
    }
  }
}
