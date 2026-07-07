import * as Phaser from 'phaser';
import { state } from '../state.js';

const MAX_REACH = 400;
const DEFLECT_MS = 1;
const HIT_RADIUS = 35;
const SPLIT_CHANCE = 0.08;
const BULLET_CLEAR_R = 25;

// Spawns a burst of arcs along worldAngle from an origin, scaled by the same
// upgrades the arc gun uses (bulletspeed, damage, accuracy). Shared by the arc
// weapon and the shield-pistol deflect (including deflecting enemy arcs).
export function fireArcBurst(worldAngle, originX, originY, shots, lateralSpread = 0, forwardOffset = 50) {
  const { upgrade, pistol_sfx } = state;
  const speedBonus = upgrade.bulletspeed * 250;
  const damage = upgrade.damage;
  pistol_sfx.play();
  pistol_sfx.setDetune(Phaser.Math.Between(400, 800));
  // perpendicular ("horizontal") axis relative to the aim direction
  const perpX = Math.cos(worldAngle + Math.PI / 2);
  const perpY = Math.sin(worldAngle + Math.PI / 2);
  for (let s = 0; s < shots; s++) {
    const lateral = (Math.random() - 0.5) * lateralSpread;
    const spawnX = originX + Math.cos(worldAngle) * forwardOffset + perpX * lateral;
    const spawnY = originY + Math.sin(worldAngle) * forwardOffset + perpY * lateral;
    const spread = (Math.random() - 0.5) * Math.max(0.05, 0.6 - upgrade.accuracy * 0.05);
    state.arcs.push(new Arc(spawnX, spawnY, worldAngle + spread, 7000 + speedBonus, 0.8 + damage));
  }
}

export class Arc {
  constructor(x, y, rotation, velocity, damage, depth = 0, enemyBullet = false) {
    this.kinks = [{ x, y }];
    this.tipX = x;
    this.tipY = y;
    this.rotation = rotation;
    this.velocity = velocity;
    this.damage = damage;
    this.depth = depth;
    this.enemyBullet = enemyBullet;
    this.active = true;
    this.alpha = 1;
    this._timer = 0;
    this._totalLength = 0;
    this._hitEnemies = new Set();
    this._pierceLeft = state.upgrade?.pierce ?? 0;
    this._bouncesLeft = state.upgrade?.ricochet ?? 0;
    this.children = [];

    if (!enemyBullet && state.player) {
      this._trackX = state.player.x;
      this._trackY = state.player.y;
    } else {
      this._trackX = null;
    }
  }

  update(delta) {
    if (this._trackX !== null && state.player) {
      const dx = state.player.x - this._trackX;
      const dy = state.player.y - this._trackY;
      if (dx !== 0 || dy !== 0) {
        for (const k of this.kinks) { k.x += dx; k.y += dy; }
        this.tipX += dx;
        this.tipY += dy;
        this._trackX = state.player.x;
        this._trackY = state.player.y;
      }
    }

    for (const child of this.children) child.update(delta);

    if (!this.active) {
      this.alpha = 0;
      return;
    }

    const speed = this.velocity * delta / 1000;
    const newX = this.tipX + Math.cos(this.rotation) * speed;
    const newY = this.tipY + Math.sin(this.rotation) * speed;
    this._totalLength += speed;

    if (this._totalLength > MAX_REACH) {
      this.active = false;
      return;
    }

    if (state.walls) {
      for (const w of state.walls.getChildren()) {
        if (!w.active) continue;
        const b = w.body;
        if (newX >= b.left && newX <= b.right && newY >= b.top && newY <= b.bottom) {
          if (this._bouncesLeft > 0) {
            this._bouncesLeft--;
            this.kinks.push({ x: this.tipX, y: this.tipY });
            const fromSide = this.tipX < b.left || this.tipX > b.right;
            const fromTopBot = this.tipY < b.top || this.tipY > b.bottom;
            if (fromSide && !fromTopBot) {
              this.rotation = Math.PI - this.rotation;
            } else if (fromTopBot && !fromSide) {
              this.rotation = -this.rotation;
            } else {
              this.rotation += Math.PI;
            }
          } else {
            this.active = false;
            return;
          }
          break;
        }
      }
    }

    // Any arc zaps oncoming bullets from the opposing team out of the air.
    if (state.bullets) {
      for (const bul of state.bullets.getChildren()) {
        if (!bul.active || bul.enemyBullet === this.enemyBullet) continue;
        const bdx = newX - bul.x;
        const bdy = newY - bul.y;
        if (bdx * bdx + bdy * bdy < BULLET_CLEAR_R * BULLET_CLEAR_R) {
          bul.setActive(false);
          bul.setVisible(false);
          bul.body.checkCollision.none = true;
        }
      }
    }

    // Any arc (player or enemy) damages enemies it passes over.
    if (state.enemyFighters) {
      for (const e of state.enemyFighters.getChildren()) {
        if (!e.active || e.death || this._hitEnemies.has(e)) continue;
        const dx = newX - e.x;
        const dy = newY - e.y;
        if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
          this._hitEnemies.add(e);
          e.hitByArcLine(newX, newY, this.damage);
          if (this._pierceLeft > 0) {
            this._pierceLeft--;
          } else {
            this.active = false;
            return;
          }
        }
      }
    }

    // Enemy arcs also damage the player (shield pistol can deflect them).
    if (this.enemyBullet && state.player) {
      const dx = newX - state.player.x;
      const dy = newY - state.player.y;
      if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
        if (state.weapon?.type === 'shieldPistol' && state.shieldUp) {
          const facing = state.angleToPointer;
          const dot = Math.cos(facing) * Math.cos(this.rotation) + Math.sin(facing) * Math.sin(this.rotation);
          if (dot < 0) {
            fireArcBurst(facing, state.player.x, state.player.y, 1 + (state.upgrade?.multishot ?? 0), 60, 20);
            this.active = false;
            return;
          }
        }
        this.tipX = newX;
        this.tipY = newY;
        state.player.setTintFill(0xff0051);
        if (state.legs) state.legs.setTintFill(0xff0051);
        setTimeout(() => {
          if (state.player) state.player.clearTint();
          if (state.legs) state.legs.clearTint();
        }, 50);
        this.active = false;
        return;
      }
    }

    this.tipX = newX;
    this.tipY = newY;

    this._timer += delta;
    if (this._timer >= DEFLECT_MS) {
      this._timer = 0;
      this.kinks.push({ x: this.tipX, y: this.tipY });

      const deflectRange = Math.max(0.25, 1.4 - (state.upgrade?.accuracy ?? 0) * 0.08);
      const deflection = (Math.random() - 0.5) * deflectRange;

      if (this.depth < 2 && Math.random() < SPLIT_CHANCE) {
        const child = new Arc(
          this.tipX, this.tipY,
          this.rotation + deflection / 2,
          this.velocity, this.damage,
          this.depth + 1, this.enemyBullet
        );
        this.children.push(child);
        this.rotation -= deflection / 2;
      } else {
        this.rotation += deflection;
      }
    }
  }

  draw(graphics) {
    if (this.alpha > 0) {
      graphics.lineStyle(2, 0xFF003C, this.alpha);
      graphics.beginPath();
      graphics.moveTo(this.kinks[0].x, this.kinks[0].y);
      for (let i = 1; i < this.kinks.length; i++) {
        graphics.lineTo(this.kinks[i].x, this.kinks[i].y);
      }
      graphics.lineTo(this.tipX, this.tipY);
      graphics.strokePath();
    }

    for (const child of this.children) child.draw(graphics);
  }

  isFullyDead() {
    return !this.active && this.alpha <= 0 && this.children.every(c => c.isFullyDead());
  }
}
