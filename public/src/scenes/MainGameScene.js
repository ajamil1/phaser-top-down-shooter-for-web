import * as Phaser from 'phaser';
import { state } from '../state.js';
import { DashLine } from '../entities/DashLine.js';
import { Wall } from '../entities/Wall.js';
import { Weapon } from '../entities/Weapon.js';
import { Upgrade, buildUpgradeTextures } from '../entities/Upgrade.js';
import { EnemyFighter } from '../entities/EnemyFighter.js';
import { Bullet } from '../entities/Bullet.js';
import { EnemyBullet } from '../entities/EnemyBullet.js';
import { Corpse } from '../entities/Corpse.js';
import { Spark } from '../entities/Spark.js';
import { EnemySight } from '../entities/EnemySight.js';
import { EnemyPathScan } from '../entities/EnemyPathScan.js';
import { shootBullet, setWeapon, getFacingPosition } from '../utils/combat.js';
import { spawnDashLine, spawnWall, getEnemy, spawnSpark } from '../utils/spawners.js';
import { MAX_VELOCITY, MAX_RADIUS, SPAWN_RATE } from '../config.js';

export class MainGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainGameScene' });
    this.meleeFrame = 0;
    this.meleeHitbox = null;
    this.meleeX = 0;
    this.meleeY = 0;
    this.cursorDistance = 0;
    this.cursorMoving = false;
    this.shooting = false;
    this.moveToPointer = false;
    this.playerAcceleration = 0;
    this._lastAutoShot = 0;
    this.dashCharges = 3;
    this.maxDashCharges = 3;
    this.dashing = false;
    this.dashTimer = 0;
    this.dashStunTimer = 0;
    this.dashVx = 0;
    this.dashVy = 0;
    this.dashRechargeTimes = [];
    this._afterImages = [];
    this._lastAfterImageTime = 0;
    this._dashPips = [];
    this.reload = {
      active: false,
      ejecting: false,
      qteActive: false,
      indicator: 0,
      sweetMin: 0,
      sweetMax: 0,
      delay: 0,
      result: null,
      shellsLeft: 0,
      ejectElapsed: 0,
      weaponType: null,
      windowMs: 700,
    };
  }

  preload() {}

  create() {
    state.banishing = this.sound.add('banishing', { loop: true, volume: 0.5 });
    state.banishing.play();

    state.angleToPointer = 0;
    this.input.setDefaultCursor(`url(/src/assets/cursor.png) 20 20, pointer`);

    state.legs = this.physics.add.sprite(0, 0, 'player');
    state.legs.setDepth(0);
    state.player = this.physics.add.sprite(0, 0, 'player');
    state.player.setDepth(1);

    this.background = this.add.tileSprite(-2500, -2500, 5000, 5000, 'background');
    this.background.setOrigin(0, 0);

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player', { frames: [0,1,2,3,4,5,6,7,8,9,10] }),
      frameRate: 15,
      repeat: -1,
    });

    this.anims.create({
      key: 'knockdown',
      frames: this.anims.generateFrameNumbers('player', { frames: [10,11,12,12,13,14] }),
      frameRate: 20,
      repeat: 0,
    });

    const p = state.player;
    p.setCollideWorldBounds(false);
    p.setDamping(true);
    p.setDrag(0.0001);
    p.setMaxVelocity(MAX_VELOCITY);
    p.setBounce(1.3);
    p.setPosition(0, 0);
    p.body.setCircle(12);
    p.body.setOffset(p.width / 2 - 12, p.height / 2 - 12);
    p.setScale(3);
    p.setAlpha(1);

    const l = state.legs;
    l.setCollideWorldBounds(false);
    l.setDamping(true);
    l.setDrag(0.0001);
    l.setMaxVelocity(MAX_VELOCITY);
    l.setBounce(1.3);
    l.setPosition(0, 0);
    l.setScale(3);

    this.meleeHitbox = this.physics.add.sprite(0, 0, null);
    this.meleeHitbox.body.setCircle(30);
    this.meleeHitbox.body.setOffset(this.meleeHitbox.width / 2 - 30, this.meleeHitbox.height / 2 - 30);
    this.meleeHitbox.setCollideWorldBounds(false);
    this.meleeHitbox.setDamping(false);
    this.meleeHitbox.setDrag(0);
    this.meleeHitbox.setMaxVelocity(MAX_VELOCITY);
    this.meleeHitbox.setVisible(false);
    this.meleeHitbox.setActive(false);
    this.meleeHitbox.body.checkCollision.none = true;
    this.meleeHitbox.isPlayerMelee = true;

    state.cursor = this.physics.add.sprite(0, 0, 'cursor');
    state.cursor.setTintFill(0xffffff);
    state.cursor.setDepth(3);
    state.cursor.setAlpha(0);

    state.bullets = this.physics.add.group({ classType: Bullet, maxSize: 800, runChildUpdate: true });
    state.enemyBullets = this.physics.add.group({ classType: EnemyBullet, maxSize: 800, runChildUpdate: true });
    state.dashLines = this.physics.add.group({ classType: DashLine, maxSize: 1000, runChildUpdate: true });
    state.sparks = this.physics.add.group({ classType: Spark, maxSize: 1000, runChildUpdate: true });
    state.enemyFighters = this.physics.add.group({ classType: EnemyFighter, maxSize: 30, runChildUpdate: true });
    state.walls = this.physics.add.group({ classType: Wall, maxSize: 600, runChildUpdate: true });
    state.corpses = this.physics.add.group({ classType: Corpse, maxSize: state.enemyFighters.maxSize * 3, runChildUpdate: true });
    state.weapons = this.physics.add.group({ classType: Weapon, maxSize: 2000, runChildUpdate: true });
    state.upgrades = this.physics.add.group({ classType: Upgrade, maxSize: 200, runChildUpdate: true });
    state.enemySights = this.physics.add.group({ classType: EnemySight, maxSize: -1, runChildUpdate: true });
    state.enemyPathScanners = this.physics.add.group({ classType: EnemyPathScan, maxSize: -1, runChildUpdate: true });

    this._setupCollisions();
    this._setupInput();

    const hudStyle = { fontSize: '20px', fontFamily: 'monospace', fill: '#ffffff' };
    this.ammoText = this.add.text(20, this.scale.height - 60, '', hudStyle).setScrollFactor(0).setDepth(10);
    this.ammoGfx = this.add.graphics().setDepth(2);
    this.reloadGfx = this.add.graphics().setDepth(2);
    this.reloadLabel = this.add.text(0, 0, '', {
      fontSize: '13px', fontFamily: 'monospace', fill: '#aaaaaa',
    }).setOrigin(0.5, 1).setDepth(2);

    this.clickText = this.add.text(0, 0, 'click', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#888888',
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this._dryFireCooldown = 0;
    for (let i = 0; i < 3; i++) {
      this._dashPips.push(
        this.add.rectangle(20 + i * 16, this.scale.height - 30, 11, 11, 0x44aaff)
          .setScrollFactor(0).setDepth(10).setOrigin(0)
      );
    }

  }

  _setupCollisions() {
    const delay = 50;
    const mh = this.meleeHitbox;

    this.time.delayedCall(delay, () => {
      this.physics.add.collider(state.enemyFighters, state.enemyFighters);
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.collider(state.upgrades, state.walls);
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.collider(state.upgrades, state.upgrades);
    });

    this.time.delayedCall(delay, () => {
      const weaponDefs = {
        0: { type: 'pistol',  ammo: 9,  firemode: 'semi', frame: 5 },
        1: { type: 'shotgun', ammo: 7, firemode: 'semi', frame: 7 },
        2: { type: 'ar',      ammo: 25, firemode: 'auto', firerate: 80,  frame: 6 },
        3: { type: 'sword',   ammo: 25, firemode: 'auto', firerate: 150, frame: 15 },
      };
      const PRIORITY = { none: -1, sword: 0, pistol: 1, ar: 2, shotgun: 3 };

      let lastPickupTime = 0;

      this.physics.add.overlap(state.player, state.weapons, (player, weaponObj) => {
        if (!weaponObj.selected || !weaponObj.active) return;
        weaponObj.setActive(false);
        weaponObj.body.checkCollision.none = true;

        const def = weaponDefs[weaponObj.id];
        if (!def) { setTimeout(() => weaponObj.destroy(), 50); return; }

        const now = Date.now();
        const inSuccession = (now - lastPickupTime) < 100;
        const incoming = PRIORITY[def.type] ?? -1;
        const current  = PRIORITY[state.weapon.type] ?? -1;

        if (!inSuccession || incoming >= current) {
          Object.assign(state.weapon, def);
          player.setFrame(def.frame);
          lastPickupTime = now;
        }

        setTimeout(() => weaponObj.destroy(), 50);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.player, state.upgrades, (player, upgradeObj) => {
        if (!upgradeObj.active) return;
        upgradeObj.setActive(false);
        upgradeObj.setVisible(false);
        upgradeObj.body.checkCollision.none = true;
        switch (upgradeObj.upgradeType) {
          case 'multishot': state.upgrade.multishot++; break;
          case 'firerate':  state.upgrade.firerateBonus++; break;
          case 'reload':    state.upgrade.reloadZone++; break;
          case 'ammo':      state.upgrade.ammoBonus += 3; break;
          case 'accuracy':  state.upgrade.accuracy++; break;
          case 'ricochet':     state.upgrade.ricochet++; break;
          case 'ammoeff':      state.upgrade.ammoEfficiency++; break;
        }
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.enemyFighters, state.bullets, (enemy, bullet) => {
        enemy.hit(bullet);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.player, state.bullets, (player, bullet) => {
        if (this.dashing) return;
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.checkCollision.none = true;
        player.setTintFill(0xff0051);
        state.legs.setTintFill(0xff0051);
        setTimeout(() => { player.clearTint(); state.legs.clearTint(); }, 50);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.collider(state.enemyFighters, state.player, (player, enemy) => {
        if (this.dashing) return;
        enemy.hit(player);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.collider(state.walls, state.player);
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.collider(state.walls, state.enemyFighters);
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.walls, state.bullets, (wall, bullet) => {
        if (bullet.bounces > 0 && bullet.bounceCooldown === 0) {
          bullet.bounces--;
          bullet.bounceCooldown = 12;
          bullet.scaleX = Math.sign(bullet.scaleX) * 3.5;
          spawnSpark(bullet.x, bullet.y, bullet.rotation);
          const dx = bullet.x - wall.x;
          const dy = bullet.y - wall.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            bullet.body.velocity.x *= -1;
            bullet.x += Math.sign(dx) * 10;
          } else {
            bullet.body.velocity.y *= -1;
            bullet.y += Math.sign(dy) * 10;
          }
          // Each bounce loses 35% speed so ricochets bleed out naturally
          bullet.body.velocity.x *= 0.65;
          bullet.body.velocity.y *= 0.65;
          bullet.velocity *= 0.65;
          bullet.setRotation(Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x));
          return;
        }
        if (bullet.bounceCooldown > 0) return;
        bullet.setActive(false);
        bullet.setVisible(false);
        spawnSpark(bullet.x, bullet.y, bullet.rotation);
        bullet.body.checkCollision.none = true;
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.enemyFighters, mh, (hitbox, enemy) => {
        try { enemy.hit(hitbox); } catch (e) { console.error(e); }
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(mh, state.bullets, (hitbox, bullet) => {
        try {
          if (state.weapon.type === 'sword') bullet.bulletReflected();
        } catch (e) { console.error(e); }
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.enemySights, state.walls, (sight, wall) => {
        sight.detection(wall);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.enemySights, state.enemyFighters, (sight, enemy) => {
        sight.detection(enemy);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.enemyPathScanners, state.walls, (scanner) => {
        scanner.detection();
      });
    });
  }

  _setupInput() {
    this.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.input.keyboard.on('keydown-SHIFT', () => this._tryDash());


    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.reload.active) {
        if (this.reload.ejecting) this._onEjectKey();
        else if (this.reload.qteActive) this._resolveQTE();
      } else {
        state.spaceDown = true;
      }
    });
    this.input.keyboard.on('keyup-SPACE', () => { state.spaceDown = false; });
    this.input.keyboard.on('keydown-R', () => {
      if (this.reload.active) {
        if (this.reload.ejecting) this._onEjectKey();
        else if (this.reload.qteActive) this._resolveQTE();
      } else {
        const { weapon } = state;
        if (weapon.type !== 'none' && weapon.type !== 'sword' && weapon.ammo < this._maxAmmo(weapon.type)) {
          this._startReload();
        }
      }
    });

    this.input.on('pointerdown', (pointer) => {
      this.shooting = true;
      if (!pointer.leftButtonDown()) return;
      if (state.weapon.firemode === 'semi') {
        if (state.weapon.ammo <= 0 && state.weapon.type !== 'none' && state.weapon.type !== 'sword') {
          this._dryFire();
        } else {
          if (this.reload.active && state.weapon.ammo > 0) this._cancelReload();
          shootBullet(state.player.rotation);
        }
      }
      if (state.weapon.type === 'none') this._doMeleePunch();
      if (state.weapon.type === 'sword') this._doMeleeSword();
    });

    state.player.on('animationcomplete', (animation) => {
      this.meleeHitbox.body.setCircle(30);
      this.meleeHitbox.body.setOffset(this.meleeHitbox.width / 2 - 30, this.meleeHitbox.height / 2 - 30);

      const isPunch = animation.key === 'left-punch' || animation.key === 'right-punch';
      const isSlash = animation.key === 'left-slash' || animation.key === 'right-slash';

      if (isPunch || (!isSlash && state.weapon.type !== 'none' && state.weapon.type !== 'sword')) {
        setWeapon(state.weapon.type);
      }
      if (!isSlash) {
        this.meleeHitbox.body.checkCollision.none = true;
      }
    });

    this.input.on('pointermove', (pointer) => {
      this.cursorMoving = true;
      state.player.setRotation(state.angleToPointer + Math.PI / 2);
      const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, state.cursor.x, state.cursor.y);
      if (state.frames >= 100) state.cursor.setAlpha((dist - 50) / 70);
    });

    this.input.on('pointerup', (pointer) => {
      if (!pointer.leftButtonDown()) this.shooting = false;
      if (state.weapon.type !== 'none' && state.weapon.type !== 'sword') {
        setWeapon(state.weapon.type);
      }
    });
  }

  _doMeleePunch() {
    const { player } = state;
    const nextAnim = this.meleeFrame === 0 ? 'left-punch' : 'right-punch';
    if (player.anims.currentAnim?.key !== nextAnim) {
      this.meleeHitbox.body.checkCollision.none = false;
      player.setFrame(0);
      player.play(nextAnim, true);
      this.meleeFrame = this.meleeFrame === 0 ? 1 : 0;
    }
  }

  _doMeleeSword() {
    const { player, sword_sfx } = state;
    sword_sfx.play();
    sword_sfx.setDetune(Phaser.Math.Between(-300, 300));
    this.meleeHitbox.body.setCircle(70);
    this.meleeHitbox.body.setOffset(this.meleeHitbox.width / 2 - 70, this.meleeHitbox.height / 2 - 70);
    const nextAnim = this.meleeFrame === 0 ? 'left-slash' : 'right-slash';
    const startFrame = this.meleeFrame === 0 ? 19 : 20;
    if (player.anims.currentAnim?.key !== nextAnim) {
      this.meleeHitbox.body.checkCollision.none = false;
      player.setFrame(startFrame);
      player.play(nextAnim, true);
      this.meleeFrame = this.meleeFrame === 0 ? 1 : 0;
    }
  }

  _tryDash() {
    if (this.dashing || this.dashCharges <= 0) return;
    const { player } = state;
    const dir = new Phaser.Math.Vector2(
      (this.d.isDown ? 1 : 0) - (this.a.isDown ? 1 : 0),
      (this.s.isDown ? 1 : 0) - (this.w.isDown ? 1 : 0)
    );
    if (dir.lengthSq() === 0) {
      const angle = player.rotation - Math.PI / 2;
      dir.set(Math.cos(angle), Math.sin(angle));
    } else {
      dir.normalize();
    }
    this.dashing = true;
    this.dashTimer = 160;
    this.dashVx = dir.x * 1800;
    this.dashVy = dir.y * 1800;
    this.dashCharges--;
    this.dashRechargeTimes.push(this.time.now);
    player.setMaxVelocity(2000);
  }

  _spawnAfterImage() {
    const { player } = state;
    const img = this.add.image(player.x, player.y, 'player')
      .setFrame(player.frame.name)
      .setRotation(player.rotation)
      .setScale(player.scaleX)
      .setAlpha(0.6)
      .setDepth(0.5)
      .setTint(0x44aaff);
    this._afterImages.push(img);
  }

  update(time, delta) {
    state.frames++;
    const { player, legs, cursor } = state;

    if (player.anims.isPlaying) {
      this.meleeHitbox.setActive(true);
      this.meleeHitbox.x += 1;
      this.meleeHitbox.y += 1;
    } else {
      this.meleeHitbox.setActive(false);
    }

    this.physics.world.smoothStep = delta <= 10;

    player.setAlpha(state.frames <= 100 ? 0 : Math.min((state.frames - 100) / 100, 1));

    if (state.frames < 50) return;

    const pointer = this.input.mousePointer;
    state.mainCamera = this.cameras.main;

    let targetX, targetY;
    if (this.cursorMoving) {
      this.cursorDistance = Phaser.Math.Distance.Between(player.x, player.y, cursor.x, cursor.y);
      targetX = pointer.worldX;
      targetY = pointer.worldY;
    } else {
      const facing = getFacingPosition(player, this.cursorDistance);
      targetX = facing.x;
      targetY = facing.y;
    }

    const distToTarget = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);
    if (distToTarget > MAX_RADIUS) {
      const clampAngle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
      targetX = player.x + Math.cos(clampAngle) * MAX_RADIUS;
      targetY = player.y + Math.sin(clampAngle) * MAX_RADIUS;
    }

    if (distToTarget > 0) {
      const absDiff = Math.abs(Phaser.Math.Angle.ShortestBetween(
        Phaser.Math.RadToDeg(player.rotation),
        Phaser.Math.RadToDeg(legs.rotation)
      ));
      const scale = 1 - absDiff / 180;
      const angle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
      this.meleeX = player.x + Math.cos(angle) * (30 + 40 * scale);
      this.meleeY = player.y + Math.sin(angle) * (30 + 40 * scale);
    }

    cursor.x = targetX;
    cursor.y = targetY;
    this.meleeHitbox.x = this.meleeX;
    this.meleeHitbox.y = this.meleeY;

    if (this.cursorMoving) {
      state.angleToPointer = Phaser.Math.Angle.Between(player.x, player.y, cursor.x, cursor.y);
    } else {
      cursor.x = Phaser.Math.Clamp(targetX, player.x - this.cursorDistance, player.x + this.cursorDistance);
      cursor.y = Phaser.Math.Clamp(targetY, player.y - this.cursorDistance, player.y + this.cursorDistance);
    }

    const midX = (player.x + cursor.x) / 2;
    const midY = (player.y + cursor.y) / 2;
    const camSmooth = 0.08;
    state.mainCamera.scrollX = Phaser.Math.Linear(state.mainCamera.scrollX, midX - state.mainCamera.width / 2, camSmooth);
    state.mainCamera.scrollY = Phaser.Math.Linear(state.mainCamera.scrollY, midY - state.mainCamera.height / 2, camSmooth);

    this.cursorMoving = false;

    // ── Dash ─────────────────────────────────────────────────────────────────────
    if (this.dashing) {
      this.dashTimer -= delta;
      player.body.velocity.x = this.dashVx;
      player.body.velocity.y = this.dashVy;
      player.body.setAcceleration(0, 0);
      if (time - this._lastAfterImageTime > 35) {
        this._spawnAfterImage();
        this._lastAfterImageTime = time;
      }
      if (this.dashTimer <= 0) {
        this.dashing = false;
        player.setMaxVelocity(MAX_VELOCITY);
      }
    }

    // After-image fade
    for (let i = this._afterImages.length - 1; i >= 0; i--) {
      const img = this._afterImages[i];
      img.alpha -= delta / 250;
      if (img.alpha <= 0) { img.destroy(); this._afterImages.splice(i, 1); }
    }

    // Recharge a charge every 3 s
    while (this.dashCharges < this.maxDashCharges &&
           this.dashRechargeTimes.length > 0 &&
           time - this.dashRechargeTimes[0] >= 3000) {
      this.dashRechargeTimes.shift();
      this.dashCharges++;
    }

    // Pip HUD
    for (let i = 0; i < this._dashPips.length; i++)
      this._dashPips[i].setFillStyle(i < this.dashCharges ? 0x44aaff : 0x1a2233);

    // ── Movement ─────────────────────────────────────────────────────────────────
    const dir = new Phaser.Math.Vector2(0, 0);
    if (this.w.isDown) dir.y -= 1;
    if (this.s.isDown) dir.y += 1;
    if (this.a.isDown) dir.x -= 1;
    if (this.d.isDown) dir.x += 1;

    legs.x = player.x;
    legs.y = player.y;

    const moving = this.w.isDown || this.a.isDown || this.s.isDown || this.d.isDown;

    if (!this.dashing) {
      if (moving) {
        if (dir.lengthSq() > 0) dir.normalize();
        this.playerAcceleration = 10000 + state.upgrade.acceleration;
        legs.play('walk', true);
        const vx = player.body.velocity.x;
        const vy = player.body.velocity.y;
        if (vx !== 0 || vy !== 0) legs.rotation = Math.atan2(vy, vx) + Phaser.Math.DegToRad(90);
        player.body.acceleration.x = dir.x * this.playerAcceleration;
        player.body.acceleration.y = dir.y * this.playerAcceleration;
      } else {
        legs.play('walk', false);
        legs.setFrame(11);
        player.body.setAcceleration(0, 0);
        legs.body.setAcceleration(0, 0);
      }
    }

    spawnDashLine();
    if (state.frames % 3 === 0) spawnWall();
    if (state.frames % SPAWN_RATE === 0 && state.frames >= 500) getEnemy();

    if (state.weapon.firemode === 'auto' && this.shooting) {
      const rate = Math.max(50, (state.weapon.firerate ?? 150) - state.upgrade.firerateBonus * 15);
      if (time - this._lastAutoShot >= rate) {
        if (state.weapon.ammo <= 0) this._dryFire();
        else { shootBullet(player.rotation); this._lastAutoShot = time; }
      }
    }

    this._updateReload(delta);
    this._drawReloadBar();
    this._drawAmmoBlocks();
    this._updateHUD();
  }

  _drawAmmoBlocks() {
    const g = this.ammoGfx;
    g.clear();

    const { weapon, player } = state;
    const max = this._maxAmmo(weapon.type);
    if (max === 0) return; // sword / fists — nothing to draw

    const BW = 7;
    const BH = 5;
    const GAP = 2;
    const ROW_GAP = 3;
    const COLS = weapon.type === 'pistol' ? max
               : weapon.type === 'ar'     ? Math.ceil(max / 2)
               : max;
    const rows = Math.ceil(max / COLS);
    const gridW = COLS * (BW + GAP) - GAP;
    const startX = player.x - gridW / 2;
    const startY = player.y + 48;

    const ratio = weapon.ammo / max;
    let filledColor;
    if (weapon.ammo === 0)      filledColor = 0xff3333;
    else if (ratio <= 0.25)     filledColor = 0xff8800;
    else if (ratio <= 0.5)      filledColor = 0xffdd00;
    else                        filledColor = 0xdddddd;

    for (let i = 0; i < max; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const bx = startX + col * (BW + GAP);
      const by = startY + row * (BH + ROW_GAP);
      const filled = i < weapon.ammo;
      g.fillStyle(filled ? filledColor : 0x222222, filled ? 0.9 : 0.5);
      g.fillRect(bx, by, BW, BH);
    }
  }

  _dryFire() {
    const now = this.time.now;
    if (now - this._dryFireCooldown < 300) return;
    this._dryFireCooldown = now;
    const { player } = state;
    this.clickText.setPosition(player.x, player.y - 30);
    this.clickText.setRotation(Phaser.Math.FloatBetween(-0.3, 0.3));
    this.clickText.setAlpha(1);
    this.tweens.add({
      targets: this.clickText,
      alpha: 0,
      y: player.y - 60,
      duration: 500,
      ease: 'Power2',
    });
  }

  _updateHUD() {
    const { weapon } = state;
    let ammoStr;
    if (weapon.type === 'none') {
      ammoStr = 'FISTS';
    } else if (weapon.type === 'sword') {
      ammoStr = 'SWORD  ∞';
    } else {
      const name = weapon.type.toUpperCase();
      const empty = weapon.ammo <= 0 ? '  [EMPTY]' : '';
      ammoStr = `${name}  ${weapon.ammo}${empty}`;
    }
    this.ammoText.setText(ammoStr);
  }

  // ── Reload ─────────────────────────────────────────────────────────────────

  _maxAmmo(type) {
    const base = { pistol: 9, shotgun: 7, ar: 25 }[type] ?? 0;
    return base + state.upgrade.ammoBonus;
  }

  _onReloadKey() {
    const { weapon } = state;
    if (weapon.type === 'none' || weapon.type === 'sword') return;

    // During active QTE: second R press resolves it
    if (this.reload.qteActive) {
      this._resolveQTE();
      return;
    }

    // Start a fresh reload if not already in loading delay and not full
    if (!this.reload.active && weapon.ammo < this._maxAmmo(weapon.type)) {
      this._startReload();
    }
  }

  _startReload() {
    const { weapon } = state;
    const max = this._maxAmmo(weapon.type);
    this.reload.active = true;
    this.reload.ejecting = weapon.type !== 'shotgun';
    this.reload.weaponType = weapon.type;
    this.reload.indicator = 0;
    const jitter = weapon.type === 'shotgun' ? 0.03 : 0.08;
    this.reload.sweetMin = 0.39 + Phaser.Math.FloatBetween(-jitter, jitter);
    this.reload.sweetMax = Math.min(0.95, this.reload.sweetMin + 0.22 + state.upgrade.reloadZone * 0.08);
    this.reload.result = null;
    this.reload.qteActive = weapon.type === 'shotgun';
    this.reload.delay = 0;
    this.reload.shellsLeft = weapon.type === 'shotgun' ? max - weapon.ammo : 0;
    this.reload.ejectElapsed = 0;
    this.reload.windowMs = weapon.type === 'shotgun'
      ? Math.max(240, 630 + state.upgrade.ammoBonus * 20 - state.upgrade.reloadZone * 60)
      : Math.max(250, 700 + state.upgrade.ammoBonus * 20 - state.upgrade.reloadZone * 60);
  }

  _onEjectKey() {
    if (!this.reload.ejecting) return;
    this.reload.ejecting = false;
    this.reload.qteActive = true;
  }

  _resolveQTE(expired = false) {
    if (!this.reload.qteActive) return;
    const hit = this.reload.indicator >= this.reload.sweetMin &&
                this.reload.indicator <= this.reload.sweetMax;
    if (!hit && !expired) return; // missed keypress — ignore, let bar run out
    this.reload.result = hit ? 'hit' : 'miss';
    this.reload.qteActive = false;
    this.reload.delay = hit ? 120 : 300;
  }

  _loadAmmo() {
    const { weapon } = state;
    const max = this._maxAmmo(weapon.type);

    if (weapon.type === 'shotgun') {
      const shellsPerLoad = 1 + Math.floor(state.upgrade.ammoBonus / 3);
      const load = Math.min(shellsPerLoad, this.reload.shellsLeft, max - weapon.ammo);
      weapon.ammo = Math.min(weapon.ammo + load, max);
      this.reload.shellsLeft -= load;

      if (this.reload.shellsLeft > 0 && weapon.ammo < max) {
        // Next shell — new QTE
        this.reload.indicator = 0;
        this.reload.sweetMin = 0.39 + Phaser.Math.FloatBetween(-0.03, 0.03);
        this.reload.sweetMax = Math.min(0.95, this.reload.sweetMin + 0.22 + state.upgrade.reloadZone * 0.08);
        this.reload.result = null;
        this.reload.qteActive = true;
        this.reload.delay = 0;
      } else {
        this.reload.active = false;
      }
    } else {
      weapon.ammo = max;
      this.reload.active = false;
    }
  }

  _cancelReload() {
    this.reload.active = false;
    this.reload.ejecting = false;
    this.reload.qteActive = false;
    this.reload.delay = 0;
    this.reload.result = null;
  }

  _updateReload(delta) {
    const { weapon } = state;
    if (!this.reload.active) {
      if (weapon.ammo <= 0 && weapon.type !== 'none' && weapon.type !== 'sword' && weapon.type !== 'shotgun') {
        this._startReload();
      }
      return;
    }

    // Cancel silently if weapon was swapped
    if (weapon.type !== this.reload.weaponType) {
      this._cancelReload();
      return;
    }

    if (this.reload.ejecting) {
      this.reload.ejectElapsed += delta;
    }

    if (this.reload.qteActive) {
      this.reload.indicator += delta / this.reload.windowMs;
      if (this.reload.indicator >= 1) {
        this.reload.indicator = 1;
        this._resolveQTE(true);
      }
    } else if (this.reload.delay > 0) {
      this.reload.delay -= delta;
      if (this.reload.delay <= 0) {
        this.reload.delay = 0;
        this._loadAmmo();
      }
    }
  }

  _drawReloadBar() {
    const g = this.reloadGfx;
    g.clear();

    if (!this.reload.active) {
      if (state.weapon.type === 'shotgun' && state.weapon.ammo <= 0) {
        this.reloadLabel.setPosition(state.player.x, state.player.y + 82).setText('[ R ]  RELOAD').setColor('#ff4444');
      } else {
        this.reloadLabel.setText('');
      }
      return;
    }

    const { player, weapon } = state;
    const W = 120;
    const H = 10;
    const bx = player.x - W / 2;
    const by = player.y + 85;
    this.reloadLabel.setPosition(player.x, player.y + 82);

    // Background
    g.fillStyle(0x111111, 0.92);
    g.fillRect(bx - 2, by - 2, W + 4, H + 4);

    if (this.reload.ejecting) {
      const t = Math.min(this.reload.ejectElapsed / 160, 1);
      const fill = Math.pow(1 - t, 2); // ease-out: fast drain, decelerates to empty
      g.fillStyle(0x444444, 0.3);
      g.fillRect(bx, by, W, H);
      g.fillStyle(0xffcc00, 0.85);
      g.fillRect(bx, by, W * fill, H);
      this.reloadLabel.setText('[ SPACE ]  EJECT MAG').setColor('#ffcc00');
    } else if (this.reload.qteActive) {
      // Sweet spot
      g.fillStyle(0x00cc44, 0.75);
      g.fillRect(bx + this.reload.sweetMin * W, by,
                 (this.reload.sweetMax - this.reload.sweetMin) * W, H);
      // Moving indicator line
      const ix = bx + this.reload.indicator * W;
      g.fillStyle(0xffffff, 1);
      g.fillRect(ix - 2, by - 3, 4, H + 6);
      this.reloadLabel.setText('[ SPACE / R ]').setColor('#aaaaaa');
    } else {
      // Loading phase — flash result colour
      g.fillStyle(this.reload.result === 'hit' ? 0x00cc44 : 0xff3333, 0.45);
      g.fillRect(bx, by, W, H);
      this.reloadLabel.setText(this.reload.result === 'hit' ? 'PERFECT' : 'MISS')
        .setColor(this.reload.result === 'hit' ? '#00ff66' : '#ff4444');
    }

    // Shotgun: per-shell pip row
    if (weapon.type === 'shotgun') {
      const max = this._maxAmmo('shotgun');
      const pw = (W - (max - 1)) / max;
      const py = by + H + 5;
      for (let i = 0; i < max; i++) {
        g.fillStyle(i < weapon.ammo ? 0xffaa00 : 0x444444, 1);
        g.fillRect(bx + i * (pw + 1), py, pw, 5);
      }
    }
  }
}
