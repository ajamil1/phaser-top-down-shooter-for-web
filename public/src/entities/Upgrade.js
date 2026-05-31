import * as Phaser from 'phaser';
import { state } from '../state.js';

const ATTRACT_RADIUS = 240;
const BALL_R = 16;

export const UPGRADE_DEFS = {
  multishot:          { rgb: [180, 60,  255], letter: 'M' },
  ammoeff:            { rgb: [255, 180,  60], letter: 'E' },
  firerate:           { rgb: [60,  220, 255], letter: 'F' },
  reload:             { rgb: [60,  255, 130], letter: 'R' },
  ammo:               { rgb: [255, 210, 50],  letter: 'A' },
  accuracy:           { rgb: [255, 110, 40],  letter: 'A' },
  ricochet:           { rgb: [140, 220, 255], letter: 'R' },
};

export function buildUpgradeTextures() {}

export class Upgrade extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setAlpha(0).setVisible(false).setActive(false);

    this.ballGfx    = scene.add.graphics().setDepth(3).setVisible(false);
    this.letterText = scene.add.text(0, 0, '?', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4).setVisible(false);

    this.upgradeType  = null;
    this.upgradeColor = 0xffffff;
    this.colorStr     = '#ffffff';
    this.rotX = 0;
    this.rotY = 0;
    this.lifespan = 0;
  }

  setActive(value) {
    super.setActive(value);
    if (!value) {
      this.ballGfx?.setVisible(false);
      this.letterText?.setVisible(false);
    }
    return this;
  }

  spawn(x, y, type) {
    const def = UPGRADE_DEFS[type] ?? UPGRADE_DEFS.ammo;
    this.upgradeType  = type;
    const [r, g, b]   = def.rgb;
    this.upgradeColor = (r << 16) | (g << 8) | b;
    this.colorStr     = `#${this.upgradeColor.toString(16).padStart(6, '0')}`;
    this.rotX = Math.random() * Math.PI * 2;
    this.rotY = Math.random() * Math.PI * 2;
    this.lifespan = 12000;

    this.setPosition(x, y);
    this.setActive(true);
    this.ballGfx.setVisible(true);
    this.letterText.setVisible(true).setText(def.letter).setColor(this.colorStr);

    const r2 = 18;
    this.body.setCircle(r2, this.width / 2 - r2, this.height / 2 - r2);
    this.body.setBounce(0.65);
    this.body.setDrag(90, 90);
    this.body.setMaxVelocity(300);
    this.body.checkCollision.none = false;

    const dir = Math.random() * Math.PI * 2;
    const spd = 180 + Math.random() * 160;
    this.body.setVelocity(Math.cos(dir) * spd, Math.sin(dir) * spd);
  }

  update(time, delta) {
    if (!this.active) return;

    const { player, mainCamera } = state;

    this.lifespan -= delta;
    const alpha = Phaser.Math.Clamp(this.lifespan / 400, 0, 1);
    if (this.lifespan <= 0) { this.setActive(false); this.body.setVelocity(0, 0); return; }

    // Attract toward player
    const angle    = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance <= ATTRACT_RADIUS) {
      const t = 1 - distance / ATTRACT_RADIUS;
      this.body.velocity.x += Math.cos(angle) * t * 420 * (delta / 1000);
      this.body.velocity.y += Math.sin(angle) * t * 420 * (delta / 1000);
    }

    // Accumulate rolling rotation from velocity
    const vx = this.body.velocity.x, vy = this.body.velocity.y;
    this.rotX += (vy / (BALL_R * 2)) * (delta / 1000);
    this.rotY -= (vx / (BALL_R * 2)) * (delta / 1000);

    this._drawBall(vx, vy);
    this.ballGfx.setAlpha(alpha);

    this.letterText
      .setPosition(this.x, this.y)
      .setAlpha(alpha);
  }

  _drawBall(vx, vy) {
    const g = this.ballGfx;
    g.clear();
    g.setPosition(this.x, this.y);

    const R = BALL_R;

    // Base circle
    g.fillStyle(0x000000, 1);
    g.lineStyle(2, this.upgradeColor, 1);
    g.fillCircle(0, 0, R);
    g.strokeCircle(0, 0, R);

    // Rolling seam — projected great circle perpendicular to motion
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 8) {
      const moveAngle = Math.atan2(vy, vx);
      const perpAngle = moveAngle + Math.PI / 2;
      const perpX = Math.cos(perpAngle), perpY = Math.sin(perpAngle);
      const moveX = Math.cos(moveAngle), moveY = Math.sin(moveAngle);

      // How much the seam has rotated (scalar projection of accumulated rotation)
      const rollAmt = this.rotX * Math.sin(moveAngle) - this.rotY * Math.cos(moveAngle);
      const seamB   = Math.cos(rollAmt) * R; // minor-axis half-length (can be negative = flipped)

      const STEPS = 36;
      for (let pass = 0; pass < 2; pass++) {
        // pass 0 = back half (faded), pass 1 = front half (solid)
        g.lineStyle(1.5, this.upgradeColor, pass === 0 ? 0.22 : 0.65);
        g.beginPath();
        let open = false;
        for (let i = 0; i <= STEPS; i++) {
          const t     = (i / STEPS) * Math.PI * 2;
          const cosT  = Math.cos(t), sinT = Math.sin(t);
          const zLocal = sinT * seamB;          // z of seam point
          const isFront = zLocal >= 0;
          const draw    = pass === 1 ? isFront : !isFront;
          if (draw) {
            const sx = R * cosT * perpX + seamB * sinT * moveX;
            const sy = R * cosT * perpY + seamB * sinT * moveY;
            if (!open) { g.moveTo(sx, sy); open = true; }
            else        g.lineTo(sx, sy);
          } else if (open) {
            g.strokePath();
            g.beginPath();
            open = false;
          }
        }
        if (open) g.strokePath();
      }
    }

    // Specular highlight
    g.fillStyle(0xffffff, 0.22);
    g.fillCircle(-R * 0.32, -R * 0.32, R * 0.3);
  }
}
