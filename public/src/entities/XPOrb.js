import * as Phaser from 'phaser';
import { state } from '../state.js';

// Small green square tilted 45°, with a glowing trail while it moves.
const GREEN = 0x00ff66;
const CORE  = 0xccffdd;
const HALF  = 5;      // half-diagonal of the tilted square
const TRAIL_MAX = 8;  // positions remembered for the trail

// Square rotated 45° (diamond) centred on (x, y) with half-diagonal r.
function fillSquare45(g, x, y, r) {
  g.fillPoints([
    { x,        y: y - r },
    { x: x + r, y        },
    { x,        y: y + r },
    { x: x - r, y        },
  ], true);
}

export class XPOrb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setAlpha(0).setVisible(false).setActive(false);
    // Graphics stays at (0,0); everything is drawn in world space so the
    // trail can lag behind the orb.
    this.gfx = scene.add.graphics().setDepth(3).setVisible(false);
    this.lifespan = 0;
    this.speed = 0;
    this.linkedEnemy = null;
    this.trail = [];
    this.pulse = Math.random() * Math.PI * 2;
  }

  setActive(value) {
    super.setActive(value);
    if (!value) this.gfx?.setVisible(false);
    return this;
  }

  spawn(x, y, linkedEnemy = null, amount = 10) {
    this.lifespan = 12000;
    this.speed = 0;
    this.amount = amount;
    this.linkedEnemy = linkedEnemy;
    this.trail.length = 0;
    this.setPosition(x, y);
    this.setActive(true);
    this.gfx.setVisible(true);
    const R = HALF + 4;
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

    this.pulse += delta / 260;

    const g = this.gfx;
    g.clear();

    // Trail — sample while moving, decay one step per frame when still.
    if (this.speed > 1.2) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > TRAIL_MAX) this.trail.shift();
    } else if (this.trail.length) {
      this.trail.shift();
    }

    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const t = (i + 1) / (this.trail.length + 1); // 0 oldest → 1 newest
      g.fillStyle(GREEN, 0.28 * t * alpha);
      fillSquare45(g, p.x, p.y, 2 + HALF * (0.3 + 0.7 * t));
    }

    // Glow halo — pulses gently while idle.
    const halo = HALF + 4 + Math.sin(this.pulse) * 1.2;
    g.fillStyle(GREEN, 0.14 * alpha);
    fillSquare45(g, this.x, this.y, halo + 3);
    g.fillStyle(GREEN, 0.28 * alpha);
    fillSquare45(g, this.x, this.y, halo);

    // Body + bright core.
    g.fillStyle(GREEN, alpha);
    fillSquare45(g, this.x, this.y, HALF);
    g.fillStyle(CORE, 0.9 * alpha);
    fillSquare45(g, this.x, this.y, HALF * 0.45);
  }
}
