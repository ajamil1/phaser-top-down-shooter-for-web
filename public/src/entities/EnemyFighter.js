import * as Phaser from 'phaser';
import { state } from '../state.js';
import { spawnSpark, spawnCorpse, spawnWeapon, spawnXP } from '../utils/spawners.js';
import { enemyShoot, getSwordDamage } from '../utils/combat.js';
import { hasLineOfSight } from '../utils/pathfinding.js';

export class EnemyFighter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);

    this.pistol_sfx = scene.sound.add('pistol_sfx', { loop: false, volume: 0.4, allowMultiple: true });
    this.shotgun_sfx = scene.sound.add('shotgun_sfx', { loop: false, volume: 0.4, allowMultiple: true });
    this.rifle_sfx = scene.sound.add('rifle_sfx', { loop: false, volume: 0.4, allowMultiple: true });
    this.sword_sfx = scene.sound.add('sword_sfx', { loop: false, volume: 0.5, allowMultiple: true });

    scene.physics.add.existing(this);
    this.legs = scene.add.sprite(this.x, this.y, 'legs');
    this.legs.setOrigin(0.5);
    this.legs.setScale(3);
    this.legs.setDepth(0);

    this.setActive(false);
    this.setVisible(false);
    this.setDepth(1);
    this.setBounce(1);
    this.setDamping(true);
    this.setDrag(0.01, 0.01);
    this.body.setMass(0);

    this.health = 2;
    this.turnScale = 1;
    this.weapon = 0;
    this.melee = true;
    this.wallCount = 0;
    this.distance = 9999;
    this.speed = 0;
    this.power = 1;
    this.birth = true;
    this.death = false;
    this.lifespan = 0;
    this.angleToPlayer = 0;
    this.loop = false;
    this.wall = null;
    this.swing = Phaser.Math.Between(0, 1);
    this.scan = 0;
    this.sights = [];
    this.turnFactor = 0;
    this.fill = 0;
    this.meleeBuffer = 0;
    this.polarity = 1;
    this.turnSpeed = 1;
    this.turnAngle = 1;
    this._stuckTime = 0;
    this._stuckX = 0;
    this._stuckY = 0;
    this.deflecting = false;
    this.stunTimer = 0;
    this._targetWeapon = null;
    this.dualPistolSide = 1;

    const angleCount = 7;
    for (let i = 0; i < angleCount; i++) {
      const factor = 210 + (140 / angleCount) * i;
      const polarity = factor <= 270 ? 1 : -1;
      this.sights[i] = {
        sight: state.enemySights.getFirstDead(this.x, this.y),
        factor,
        polarity,
      };
    }
    for (let i = 0; i < this.sights.length; i++) {
      if (this.sights[i]?.sight) {
        this.sights[i].sight.spawn(this, this.sights[i].factor, this.sights[i].polarity);
      }
    }

    this.on('animationcomplete', () => {
      this.swing = this.swing === 0 ? 1 : 0;
      this.setWeapon(this.weapon);
      this.deflecting = false;
    });

    scene.time.addEvent({
      delay: 300,
      callback: () => {
        if (this.loop && this.weapon === 1 && !this.death) {
          enemyShoot(this, this.weapon, this.rotation, this.pistol_sfx);
        }
      },
      loop: true,
    });

    scene.time.addEvent({
      delay: 700,
      callback: () => {
        if (!this.loop || this.weapon !== 14 || this.death) return;
        const burstSide = this.dualPistolSide ?? 1;
        this.setFrame(burstSide === 1 ? 8 : 9);
        const fireNext = (count) => {
          if (!this.active || this.death || !this.loop) return;
          enemyShoot(this, 14, this.rotation, this.pistol_sfx);
          if (count > 1) {
            setTimeout(() => fireNext(count - 1), 70);
          } else {
            this.dualPistolSide = -burstSide;
            const nextFrame = this.dualPistolSide === 1 ? 8 : 9;
            this.setFrame(25);
            setTimeout(() => { if (this.active && !this.death) this.setFrame(nextFrame); }, 80);
          }
        };
        fireNext(3);
      },
      loop: true,
    });

    scene.time.addEvent({
      delay: 800,
      callback: () => {
        if (this.loop && this.weapon === 2 && !this.death) {
          enemyShoot(this, this.weapon, this.rotation, this.shotgun_sfx);
        }
      },
      loop: true,
    });

    scene.time.addEvent({
      delay: 800,
      callback: () => {
        if (!this.loop || this.weapon !== 3 || this.death) return;
        const fireNext = (count) => {
          if (!this.active || this.death || !this.loop) return;
          enemyShoot(this, 3, this.rotation, this.rifle_sfx);
          if (count > 1) setTimeout(() => fireNext(count - 1), 80);
        };
        fireNext(5);
      },
      loop: true,
    });
  }

  async hit(that) {
    const objectType = that.constructor.name;

    switch (objectType) {
      case 'Bullet': {
        if (!that.visible) return;
        if (this.deflecting && Phaser.Math.Between(0, 2) !== 0) {
          that.bulletReflected();
          return;
        }
        const piercing = that.pierceLeft > 0;
        if (piercing) {
          that.pierceLeft--;
          that.body.checkCollision.none = true;
          setTimeout(() => { if (that.active) that.body.checkCollision.none = false; }, 60);
        } else {
          that.setVisible(false);
        }
        setTimeout(async () => {
          if (!piercing) {
            that.setActive(false);
            that.setVisible(false);
            that.body.checkCollision.none = true;
          }
          const hpBefore = this.health;
          this.health -= that.damage;
          await spawnSpark(that.x, that.y, that.rotation + Phaser.Math.DegToRad(180));
          if (hpBefore > 0 && !this.death) spawnXP(this.x, this.y, this);
          if (this.health <= 0) {
            this.legs.setActive(false);
            this.legs.setVisible(false);
            this.setTintFill(0xff0051);
            if (!this.death) {
              this.loop = false;
              spawnCorpse(this.x, this.y, that.rotation, this.body.velocity.x, this.body.velocity.y);
              spawnWeapon(this.x, this.y, this.weapon);
            }
            this.death = true;
          } else {
            this.setTintFill(0xffffff);
          }
        }, 5);
        setTimeout(() => {
          if (this.health <= 0) {
            this.legs.setActive(false);
            this.legs.setVisible(false);
            this.setActive(false);
            this.setVisible(false);
            this.body.checkCollision.none = true;
          }
          this.clearTint();
        }, 50);
        break;
      }

      case 'ArcadeSprite2':
        setTimeout(async () => {
          that.body.checkCollision.none = true;
          const hpBeforeSword = this.health;
          this.health -= getSwordDamage();
          if (hpBeforeSword > 0) spawnXP(this.x, this.y, this);
          // Knockback away from player
          const kAngle = Phaser.Math.Angle.Between(state.player.x, state.player.y, this.x, this.y);
          this.body.velocity.x = Math.cos(kAngle) * 900;
          this.body.velocity.y = Math.sin(kAngle) * 900;
          if (this.health <= 0) {
            this.legs.setActive(false);
            this.legs.setVisible(false);
            this.setTintFill(0xff0051);
            if (!this.death && that !== state.player) {
              this.loop = false;
              spawnCorpse(this.x, this.y, this.rotation + Phaser.Math.DegToRad(90), this.body.velocity.x, this.body.velocity.y);
              spawnWeapon(this.x, this.y, this.weapon);
            }
            this.death = true;
            that.body.checkCollision.none = false;
          } else {
            this.setTintFill(0xffffff);
            this.stunTimer = 500;
            // 40% chance to disarm gun-carrying enemies
            if (this.weapon >= 1 && this.weapon <= 3 && Math.random() < 0.4) {
              spawnWeapon(this.x, this.y, this.weapon);
              this.weapon = 11;
              this.setWeapon(11);
              this._targetWeapon = null;
            }
          }
        }, 5);
        setTimeout(() => {
          if (this.health <= 0) {
            this.legs.setActive(false);
            this.legs.setVisible(false);
            this.setActive(false);
            this.setVisible(false);
            this.loop = false;
            this.body.checkCollision.none = true;
          }
          this.clearTint();
        }, 50);
        break;

      default:
        this.health--;
        state.player.setTint(0xff0051);
        if (this.health <= 0) this.setTintFill(0xff0051);
        else this.setTintFill(0xffffff);
        setTimeout(async () => {
          if (this.health <= 0) {
            this.legs.setActive(false);
            this.legs.setVisible(false);
            this.setActive(false);
            this.setVisible(false);
            this.loop = false;
            this.body.checkCollision.none = true;
            if (!this.death && that.isPlayerMelee) {
              spawnCorpse(this.x, this.y, this.rotation + Phaser.Math.DegToRad(90), this.body.velocity.x, this.body.velocity.y);
              spawnWeapon(this.x, this.y, this.weapon);
              spawnXP(this.x, this.y);
            }
            this.death = true;
          }
          this.clearTint();
          state.player.clearTint();
        }, 50);
        break;
    }
  }

  setWeapon(weapon) {
    this.melee = false;
    switch (weapon) {
      case 1:  this.setFrame(5); break;
      case 14: this.setFrame(8); break;
      case 2:  this.setFrame(7); break;
      case 3:  this.setFrame(6); break;
      default:
        if (weapon >= 4 && weapon <= 10) {
          this.setFrame(this.swing === 0 ? 24 : 15);
        } else {
          this.setFrame(0);
        }
        this.melee = true;
        break;
    }
  }

  eyeLogic() {
    this.scan += 10;
    if (this.scan >= 300) {
      this.scan = 0;
      this.wall = null;
    }
  }

  meleeAttack() {
    if (this.melee && this.weapon >= 4 && this.weapon <= 10 && this.meleeBuffer >= 50 && this.distance <= 200) {
      this.sword_sfx.play();
      this.sword_sfx.setDetune(Phaser.Math.Between(-300, 300));
      this.play(this.swing === 1 ? 'right-slash' : 'left-slash', true);
      this.meleeBuffer = 0;
      this.deflecting = true;
    } else if (this.melee && this.weapon >= 11 && this.meleeBuffer >= 10 && this.distance <= 200) {
      this.play(this.swing === 1 ? 'right-punch' : 'left-punch', true);
      this.meleeBuffer = 0;
    }
  }

  spawn(x, y, r) {
    this.meleeBuffer = 0;
    this.data = 'Enemy';
    this.lifespan = 0;
    this.turnScale = 1;
    this.loop = false;
    this.wallCount = 0;
    // Weighted weapon pool — sword IDs (4-10) kept to 2 entries (~14%) vs the old 7/16 (~44%)
    const WEAPON_POOL = [0, 1, 1, 1, 2, 2, 3, 3, 5, 6, 11, 11, 12, 13, 14];
    this.weapon = WEAPON_POOL[Phaser.Math.Between(0, WEAPON_POOL.length - 1)];
    this.death = false;
    this.body.checkCollision.none = false;
    this.setActive(true);
    this.setVisible(true);
    this.clearTint();
    this.setScale(3);
    this.speed = Phaser.Math.Between(400, 550);
    this.setMaxVelocity(this.speed);
    this.power = Math.floor(this.scale);
    this.legs.play('walk', true);
    this.turnSpeed = 1;
    this.turnAngle = 1;

    if (this.birth) {
      this.body.setCircle(12);
      this.body.setOffset(this.width / 2 - 12, this.height / 2 - 12);
      this.birth = false;
    }

    this.health = 1 + Math.floor(state.frames / 3600);
    this.stunTimer = 0;
    this._targetWeapon = null;
    this.dualPistolSide = 1;
    this._stuckTime = 0;
    this._stuckX = this.x;
    this._stuckY = this.y;
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    this.setPosition(x + r * Math.cos(angle), y + r * Math.sin(angle));
    this.setWeapon(this.weapon);
  }

  divert(wall, polarity, angle) {
    this.polarity = polarity;
    if (wall !== this) {
      this.wallCount += 1;
      this.turnFactor = Math.max(1, Math.abs(240 - angle)); // guard against /0 when angle === 240
      this.wall = wall;
    }
  }

  clear() {
    this.wall = null;
    this.wallCount = 0;
    this.polarity = 1;
  }

  rotate(currentAngle, inputAngle, turnSpeed) {
    const calcTurnSpeed = Phaser.Math.Clamp(turnSpeed * (30 / this.turnFactor), 0, 0.08);
    const targetAngle = Phaser.Math.RadToDeg(inputAngle);

    if (this.wall !== null) {
      let angleClamp = 0;
      if (targetAngle >= -45 && targetAngle <= 45) angleClamp = Phaser.Math.DegToRad(0);
      else if (targetAngle > 0 && targetAngle <= 90) angleClamp = Phaser.Math.DegToRad(45);
      else if (targetAngle > 45 && targetAngle <= 135) angleClamp = Phaser.Math.DegToRad(90);
      else if (targetAngle > 90 && targetAngle <= 180) angleClamp = Phaser.Math.DegToRad(135);
      else if (targetAngle > 135 && targetAngle <= 225) angleClamp = Phaser.Math.DegToRad(180);
      else if (targetAngle > 180 && targetAngle <= 270) angleClamp = Phaser.Math.DegToRad(225);
      else if (targetAngle > 225) angleClamp = Phaser.Math.DegToRad(270);
      else angleClamp = Phaser.Math.DegToRad(-45);
      if (this.fill <= 50) this.fill += 10;
    } else {
      if (this.fill > 0) this.fill--;
    }

    this.lifespan++;

    const ax = Math.cos(inputAngle - Phaser.Math.DegToRad(90)) * this.speed;
    const ay = Math.sin(inputAngle - Phaser.Math.DegToRad(90)) * this.speed;

    if (this.fill <= 0) {
      this.body.velocity.x += (ax - this.body.velocity.x) * 0.12;
      this.body.velocity.y += (ay - this.body.velocity.y) * 0.12;
    } else {
      const blend = calcTurnSpeed * (this.fill / 60);
      this.body.velocity.x += blend * ax;
      this.body.velocity.y += blend * ay;
    }

    if ((this.distance <= 300 || !this.melee) && this._hasLOS) {
      this.setRotation(Phaser.Math.Angle.RotateTo(currentAngle, Phaser.Math.DegToRad(this.angleToPlayer + 90), 0.022));
    } else {
      this.setRotation(this.legs.rotation); // face movement direction
    }
  }

  update(time, delta) {
    const { player } = state;
    this.eyeLogic();
    this.meleeBuffer += 1;

    // Unstick: fire if wallCount spikes (corner thrashing) or barely moved in 280ms
    const thrashing = this.wallCount > 8;
    if (thrashing || time - this._stuckTime > 280) {
      const moved = Phaser.Math.Distance.Between(this.x, this.y, this._stuckX, this._stuckY);
      if (thrashing || moved < 50) {
        const unstickTarget = this._targetWeapon?.active ? this._targetWeapon : player;
        const toTarget = Phaser.Math.Angle.Between(this.x, this.y, unstickTarget.x, unstickTarget.y);
        const jitter = Phaser.Math.FloatBetween(-0.45, 0.45);
        this.body.velocity.x = Math.cos(toTarget + jitter) * this.speed * 1.4;
        this.body.velocity.y = Math.sin(toTarget + jitter) * this.speed * 1.4;
        this.clear();
        this.fill = 0;
        this.turnFactor = 30;
      }
      this._stuckTime = time;
      this._stuckX = this.x;
      this._stuckY = this.y;
    }

    if (this.wall !== null) {
      this.turnSpeed = 0.05;
      this.turnAngle = -1;
    }

    this.setActive(true);
    this.setVisible(true);
    this.legs.setPosition(this.x, this.y);
    this.legs.setActive(true);
    this.legs.setVisible(true);

    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    if (vx !== 0 || vy !== 0) {
      this.legs.rotation = Math.atan2(vy, vx) + Phaser.Math.DegToRad(90);
    }

    // Stun: freeze AI, bleed off knockback momentum
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      this.body.velocity.x *= 0.88;
      this.body.velocity.y *= 0.88;
      this.loop = false;
      return;
    }

    this.angleToPlayer = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y));
    this.distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Fist fighters scan for nearby weapons and divert to grab them
    const isFistFighter = this.weapon === 0 || (this.weapon >= 11 && this.weapon !== 14);
    if (isFistFighter && !this.death) {
      if (!this._targetWeapon?.active) {
        this._targetWeapon = null;
        const groundWeapons = state.weapons.getChildren();
        let nearest = null, nearestDist = 350;
        for (const w of groundWeapons) {
          if (!w.active) continue;
          const d = Phaser.Math.Distance.Between(this.x, this.y, w.x, w.y);
          if (d < nearestDist) { nearestDist = d; nearest = w; }
        }
        this._targetWeapon = nearest;
      }
      if (this._targetWeapon) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this._targetWeapon.x, this._targetWeapon.y);
        if (dist < 70) {
          const C2E = { 0: 1, 1: 2, 2: 3, 3: 5, 4: 14 };
          this.weapon = C2E[this._targetWeapon.id] ?? 11;
          this.setWeapon(this.weapon);
          this._targetWeapon.setActive(false);
          this._targetWeapon.setVisible(false);
          this._targetWeapon = null;
        } else {
          const angle = Phaser.Math.Angle.Between(this.x, this.y, this._targetWeapon.x, this._targetWeapon.y);
          this.rotate(this.rotation, angle + Phaser.Math.DegToRad(90), 1);
          this.loop = false;
          return;
        }
      }
    } else {
      this._targetWeapon = null; // armed enemies ignore ground weapons
    }

    if (this.distance <= 1400) {
      if (this.lifespan % 6 === 0) this._hasLOS = hasLineOfSight(this.x, this.y);

      if (this.wall === null) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.rotate(this.rotation, angle + Phaser.Math.DegToRad(90), 1);
      } else {
        const angle = Phaser.Math.Angle.Between(this.wall.x, this.wall.y, this.x, this.y);
        this.rotate(this.rotation, angle * this.polarity * this.turnAngle + Phaser.Math.DegToRad(90), this.turnSpeed);
      }
    } else {
      this._hasLOS = false;
      this.body.velocity.x *= 0.85;
      this.body.velocity.y *= 0.85;
    }

    if (this.distance <= 900 && this.wall === null && this._hasLOS) {
      this.loop = true;
      this.meleeAttack();
    } else {
      this.loop = false;
    }

    // Sword enemies reactively deflect incoming bullets — only notice ~55% of the time
    if (this.melee && this.weapon >= 4 && this.weapon <= 10 && this.meleeBuffer >= 30 && !this.death && this.distance <= 1400 && this.lifespan % 5 === 0) {
      const bullets = state.bullets.getChildren();
      for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        if (!b.active) continue;
        if (Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y) < 90) {
          if (Phaser.Math.Between(0, 1) === 0) {
            this.sword_sfx.play();
            this.sword_sfx.setDetune(Phaser.Math.Between(-300, 300));
            this.play(this.swing === 1 ? 'right-slash' : 'left-slash', true);
            this.meleeBuffer = 0;
            this.deflecting = true;
          }
          break;
        }
      }
    }

  }
}
