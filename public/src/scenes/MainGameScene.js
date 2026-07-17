import * as Phaser from 'phaser';
import { state, refreshActiveUpgrades, resetRun } from '../state.js';
import { unlockWeapon, computeScore, getLeaderboard, submitScore } from '../utils/persistence.js';
import { DashLine } from '../entities/DashLine.js';
import { Wall } from '../entities/Wall.js';
import { Weapon } from '../entities/Weapon.js';
import { UPGRADE_DEFS, UPGRADE_TYPES } from '../entities/Upgrade.js';
import { XPOrb } from '../entities/XPOrb.js';
import { EnemyFighter } from '../entities/EnemyFighter.js';
import { Bullet } from '../entities/Bullet.js';
import { Arc } from '../entities/Arc.js';
import { EnemyBullet } from '../entities/EnemyBullet.js';
import { Corpse } from '../entities/Corpse.js';
import { Spark } from '../entities/Spark.js';
import { EnemySight } from '../entities/EnemySight.js';
import { EnemyPathScan } from '../entities/EnemyPathScan.js';
import { shootBullet, setWeapon, getFacingPosition, fireArcBurst } from '../utils/combat.js';
import { spawnDashLine, spawnWall, getEnemy, spawnSpark, getStage } from '../utils/spawners.js';
import { MAX_VELOCITY, MAX_RADIUS, SPAWN_RATE } from '../config.js';

// An upgrade box spawns every this-many enemy kills.
const KILLS_PER_BOX = 12;
// Tinker's Shop is temporarily disabled (code kept for later re-enable).
const TINKER_SHOP_ENABLED = false;

const UPGRADE_NAMES = {
  firerate:      'FIRE RATE',   reload:        'RELOAD',
  ammo:          'AMMO',        accuracy:      'ACCURACY',
  multishot:     'MULTISHOT',   ricochet:      'RICOCHET',
  ammoeff:       'AMMO EFF.',   bulletspeed:   'BULLET SPD',
  damage:        'DAMAGE',      pierce:        'PIERCE',
  binaryTrigger: 'BIN. TRIG.',  doubleBarrel:  'DBL BARREL',
  windUp:        'WIND UP',
};
const UPGRADE_DESCS = {
  firerate:      '+fire speed',    reload:        '+reload zone',
  ammo:          '+3 max ammo',    accuracy:      '+accuracy',
  multishot:     '+1 bullet',      ricochet:      '+1 bounce',
  ammoeff:       '+ammo eff.',     bulletspeed:   '+bullet spd',
  damage:        '+1 damage',      pierce:        '+1 pierce',
  binaryTrigger: 'fire on release',doubleBarrel:  'shotgun 2-shot',
  windUp:        'AR spins up',
};

// Ultrakill-style rank thresholds for the style meter (0–1000).
const STYLE_RANKS = [
  { min: 900, grade: 'SSS', color: '#ff44ff' },
  { min: 750, grade: 'SS',  color: '#ff4444' },
  { min: 600, grade: 'S',   color: '#ff8800' },
  { min: 450, grade: 'A',   color: '#ffdd00' },
  { min: 300, grade: 'B',   color: '#44dd66' },
  { min: 150, grade: 'C',   color: '#44aaff' },
  { min: 0,   grade: 'D',   color: '#888888' },
];

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
    this._swordSwingCooldown = 0;
    this._swordSpinCooldown = 0;
    this._spinning = false;
    this._modalActive = false;
    this._modalObjects = [];
    this._shopOpen = false;
    this._shopWeapon = null;
    this._upgradeBox = null;
    this._gameOverActive = false;
    this._nameInput = null;
    this._finalScore = 0;
    this._pendingUpgrades = 0;
    this._upgradeBtnObjs = null;
    this._nextBoxKills = KILLS_PER_BOX;
    this._arWindup = 0;
    this._arcCharge = 0;
    this._shieldRestoreTimer = null;
    this._reflectSlowUntil = 0;
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
    resetRun();
    this._gameOverActive = false;

    // Safety: never leave the name-input DOM element behind if the scene tears down.
    this.events.once('shutdown', () => {
      if (this._nameInput) { this._nameInput.remove(); this._nameInput = null; }
    });

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
    state.xpOrbs = this.physics.add.group({ classType: XPOrb, maxSize: 200, runChildUpdate: true });
    state.enemySights = this.physics.add.group({ classType: EnemySight, maxSize: -1, runChildUpdate: true });
    state.enemyPathScanners = this.physics.add.group({ classType: EnemyPathScan, maxSize: -1, runChildUpdate: true });

    state.arcs = [];
    this.arcGraphics = this.add.graphics().setDepth(2);

    const STARTER_DEFS = [
      { type: 'pistol',      ammo: 9,  firemode: 'semi', firerate: 90 },
      { type: 'shotgun',     ammo: 7,  firemode: 'semi', firerate: 90 },
      { type: 'ar',          ammo: 25, firemode: 'auto', firerate: 80 },
      { type: 'sword',       ammo: 0,  firemode: 'semi', firerate: 90 },
      { type: 'dualPistol',  ammo: 18, firemode: 'semi', firerate: 90 },
      { type: 'shieldPistol',ammo: 6,  firemode: 'semi', firerate: 90 },
      { type: 'arc',         ammo: 60, firemode: 'auto', firerate: 80 },
    ];
    Object.assign(state.weapon, STARTER_DEFS[state.starterWeapon ?? 0]);
    refreshActiveUpgrades();
    setWeapon(state.weapon.type);

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

    this.stageText = this.add.text(12, 12, 'STAGE 1', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ff8844',
    }).setScrollFactor(0).setDepth(10);

    // Survival countdown — top-center, console/terminal style.
    this.timerText = this.add.text(this.scale.width / 2, 12, '[ 2:00 ]', {
      fontSize: '30px', fontFamily: '"Courier New", Courier, monospace', fontStyle: 'bold',
      fill: '#33ff66', backgroundColor: '#001100', padding: { x: 10, y: 4 },
    }).setScrollFactor(0).setDepth(10).setOrigin(0.5, 0);

    this.xpBarGfx = this.add.graphics().setScrollFactor(0).setDepth(10);

    // Ultrakill-style rank in the top-right corner, with a progress meter.
    this.styleText = this.add.text(this.scale.width - 12, 10, '', {
      fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#888888',
    }).setScrollFactor(0).setDepth(10).setOrigin(1, 0);
    this.styleGfx = this.add.graphics().setScrollFactor(0).setDepth(10);

    this.levelText = this.add.text(this.scale.width - 12, 66, 'LVL 1', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#00ff88',
    }).setScrollFactor(0).setDepth(10).setOrigin(1, 0);

    this.upgradeListText = this.add.text(this.scale.width - 12, 86, '', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#888888', align: 'right',
      lineSpacing: 3,
    }).setScrollFactor(0).setDepth(10).setOrigin(1, 0);

    // Screen-edge arrow pointing at the upgrade box when it's off-screen.
    this._boxArrow = this.add.graphics().setScrollFactor(0).setDepth(15).setVisible(false);
    this._boxArrow.fillStyle(0xaa44ff, 0.95);
    this._boxArrow.fillTriangle(12, 0, -5, -8, -5, 8);
    this._boxArrowText = this.add.text(0, 0, 'U', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#cc88ff',
    }).setScrollFactor(0).setDepth(15).setOrigin(0.5).setVisible(false);
  }

  _setupCollisions() {
    const delay = 50;
    const mh = this.meleeHitbox;

    this.time.delayedCall(delay, () => {
      this.physics.add.collider(state.enemyFighters, state.enemyFighters);
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.collider(state.xpOrbs, state.walls);
    });

    this.time.delayedCall(delay, () => {
      const weaponDefs = {
        0: { type: 'pistol',     ammo: 9,  firemode: 'semi', frame: 5 },
        1: { type: 'shotgun',    ammo: 7,  firemode: 'semi', frame: 7 },
        2: { type: 'ar',         ammo: 25, firemode: 'auto', firerate: 80,  frame: 6 },
        3: { type: 'sword',      ammo: 25, firemode: 'auto', firerate: 80, frame: 15 },
        4: { type: 'dualPistol',    ammo: 18, firemode: 'semi', frame: 8 },
        5: { type: 'shieldPistol', ammo: 6,  firemode: 'semi', frame: 26 },
        6: { type: 'arc',          ammo: 60, firemode: 'auto', firerate: 80, frame: 29 },
      };
      const PRIORITY = { none: -1, sword: 0, pistol: 1, dualPistol: 1.5, shieldPistol: 1.8, ar: 2, arc: 2.5, shotgun: 3 };

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
          state.shieldUp = def.type === 'shieldPistol';
          Object.assign(state.weapon, def);
          refreshActiveUpgrades();
          if (def.type === 'shotgun') state.weapon.ammo = Math.min(state.weapon.ammo, this._maxAmmo('shotgun'));
          if (def.type === 'dualPistol') state.dualPistolFrame = 8;
          player.setFrame(def.frame);
          player.body.setMaxVelocity(MAX_VELOCITY);
          lastPickupTime = now;
        }

        setTimeout(() => weaponObj.destroy(), 50);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.player, state.xpOrbs, (_player, orb) => {
        if (!orb.active) return;
        orb.setActive(false);
        orb.body.checkCollision.none = true;
        this._addXP(orb.amount ?? 10);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.enemyFighters, state.bullets, (enemy, bullet) => {
        enemy.hit(bullet);
      });
    });

    this.time.delayedCall(delay, () => {
      this.physics.add.overlap(state.player, state.bullets, (player, bullet) => {
        if (this.dashing || !bullet.enemyBullet) return;

        if (state.weapon.type === 'shieldPistol' && state.shieldUp) {
          const facing = state.angleToPointer;
          const dot = Math.cos(facing) * bullet.body.velocity.x + Math.sin(facing) * bullet.body.velocity.y;
          if (dot < 0) {
            // Consume the incoming bullet and fire an arc back in the aimed
            // direction, scaling with upgrades like the arc gun.
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.checkCollision.none = true;
            this._reflectSlowUntil = this.time.now + 500;
            fireArcBurst(state.angleToPointer, player.x, player.y, 1 + state.upgrade.multishot, 60, 20);
            this.cameras.main.shake(60, 0.002);
            return;
          }
        }

        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.checkCollision.none = true;
        state.style = Math.max(0, state.style - 120); // taking a hit tanks the style meter
        state.timeLeft = Math.max(0, state.timeLeft - 1); // and costs a second
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
    // enableCapture=false so these letters still reach the game-over name input
    this.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W, false);
    this.a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, false);
    this.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S, false);
    this.d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, false);
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
    this.input.keyboard.on('keydown-ESC', () => {
      if (this._shopOpen) { this._closeShop(); return; }
      this._openLevelUp();
    });

    this.input.on('pointerdown', (pointer) => {
      if (this._modalActive) return;
      if (pointer.button === 2) {
        if (state.weapon.type === 'sword') this._doSpinAttack();
        return;
      }
      this.shooting = true;
      if (!pointer.leftButtonDown()) return;
      if (state.weapon.firemode === 'semi') {
        if (state.weapon.ammo <= 0 && state.weapon.type !== 'none' && state.weapon.type !== 'sword') {
          this._dryFire();
        } else {
          if (this.reload.active && state.weapon.ammo > 0) this._cancelReload();
          const burstDelay = Math.max(30, 70 - state.upgrade.firerateBonus * 8);
          if (state.weapon.type === 'dualPistol') {
            const burstFrame = state.dualPistolFrame;
            state.player.setFrame(burstFrame);
            const fireOne = (count) => {
              if (state.weapon.type !== 'dualPistol' || state.weapon.ammo <= 0) return;
              shootBullet(state.player.rotation);
              this._updateLowAmmoSound();
              if (count > 1) {
                setTimeout(() => fireOne(count - 1), burstDelay);
              } else {
                const nextFrame = burstFrame === 8 ? 9 : 8;
                state.dualPistolFrame = nextFrame;
                state.player.setFrame(25);
                setTimeout(() => state.player.setFrame(nextFrame), 80);
              }
            };
            fireOne(3);
          } else if (state.weapon.type === 'shieldPistol') {
            if (state.shieldUp) state.player.setFrame(27);
            if (this._shieldRestoreTimer) this._shieldRestoreTimer.remove();
            if (state.weapon.ammo > 0) {
              shootBullet(state.player.rotation);
              this._updateLowAmmoSound();
              if (state.shieldUp) {
                this._shieldRestoreTimer = this.time.delayedCall(500, () => {
                  this._shieldRestoreTimer = null;
                  if (state.weapon.type === 'shieldPistol' && state.shieldUp) state.player.setFrame(26);
                });
              }
            }
          } else {
            shootBullet(state.player.rotation);
            this._updateLowAmmoSound();
          }
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
      const isSpin  = animation.key === 'spin-attack';

      if (isSpin) {
        this._spinning = false;
        this.meleeHitbox.body.checkCollision.none = true;
        setWeapon(state.weapon.type);
        return;
      }

      if (isPunch || (!isSlash && state.weapon.type !== 'none' && state.weapon.type !== 'sword')) {
        setWeapon(state.weapon.type);
      }
      this.meleeHitbox.body.checkCollision.none = true;
    });

    this.input.on('pointermove', (pointer) => {
      this.cursorMoving = true;
      state.player.setRotation(state.angleToPointer + Math.PI / 2);
      const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, state.cursor.x, state.cursor.y);
      if (state.frames >= 100) state.cursor.setAlpha((dist - 50) / 70);
    });

    this.input.on('pointerup', (pointer) => {
      if (!pointer.leftButtonDown()) {
        this.shooting = false;
        if (state.weapon.type === 'pistol' && state.upgrade.binaryTrigger > 0 && !this._modalActive && state.weapon.ammo > 0) {
          shootBullet(state.player.rotation);
          this._updateLowAmmoSound();
        }
      }
      if (state.weapon.type !== 'none' && state.weapon.type !== 'sword' && state.weapon.type !== 'shieldPistol') {
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
    if (this._swordSwingCooldown > 0 || this._swordSpinCooldown > 0 || this._spinning) return;
    unlockWeapon('sword');
    const { player, sword_sfx } = state;
    sword_sfx.play();
    sword_sfx.setDetune(Phaser.Math.Between(-300, 300));
    this.meleeHitbox.body.setCircle(70);
    this.meleeHitbox.body.setOffset(this.meleeHitbox.width / 2 - 70, this.meleeHitbox.height / 2 - 70);
    const nextAnim = this.meleeFrame === 0 ? 'left-slash' : 'right-slash';
    const startFrame = this.meleeFrame === 0 ? 23 : 16;
    if (player.anims.currentAnim?.key !== nextAnim) {
      this.meleeHitbox.body.checkCollision.none = false;
      player.setFrame(startFrame);
      player.play(nextAnim, true);
      this.meleeFrame = this.meleeFrame === 0 ? 1 : 0;
      this._swordSwingCooldown = 200;
    }
  }

  _doSpinAttack() {
    if (this._swordSpinCooldown > 0 || this._spinning) return;
    const { player, sword_sfx } = state;
    sword_sfx.play();
    sword_sfx.setDetune(Phaser.Math.Between(-200, 200));
    this._spinning = true;
    this._swordSpinCooldown = 1200;
    this._swordSwingCooldown = 1200;
    this.meleeHitbox.body.setCircle(110);
    this.meleeHitbox.body.setOffset(this.meleeHitbox.width / 2 - 110, this.meleeHitbox.height / 2 - 110);
    this.meleeHitbox.body.checkCollision.none = false;
    player.play('spin-attack', true);
  }

  _tryDash() {
    if (this.dashing || this.dashCharges <= 0) return;
    if (state.weapon.type === 'shieldPistol') return;
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
    // While the level-up modal is open, freeze all gameplay progression.
    if (this._modalActive) return;
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

    if (this._swordSwingCooldown > 0) this._swordSwingCooldown -= delta;
    if (this._swordSpinCooldown > 0) this._swordSpinCooldown -= delta;

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
    this.meleeHitbox.x = this._spinning ? player.x : this.meleeX;
    this.meleeHitbox.y = this._spinning ? player.y : this.meleeY;

    if (this.cursorMoving) {
      state.angleToPointer = Phaser.Math.Angle.Between(player.x, player.y, cursor.x, cursor.y);
    } else {
      cursor.x = Phaser.Math.Clamp(targetX, player.x - this.cursorDistance, player.x + this.cursorDistance);
      cursor.y = Phaser.Math.Clamp(targetY, player.y - this.cursorDistance, player.y + this.cursorDistance);
    }

    // Shield pistol: cursor distance controls the shield — pull in close to raise it,
    // reach out far to lower it and aim. Replaces the old shift-click toggle.
    if (state.weapon.type === 'shieldPistol') {
      const desiredUp = this.cursorDistance < 450;
      if (desiredUp !== state.shieldUp) {
        state.shieldUp = desiredUp;
        if (this._shieldRestoreTimer) { this._shieldRestoreTimer.remove(); this._shieldRestoreTimer = null; }
        state.player.setFrame(state.shieldUp ? 26 : 28);
      }
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
      const aimSlow = (state.weapon.type === 'shieldPistol' && state.player.frame.name !== 26) || time < this._reflectSlowUntil;
      player.body.setMaxVelocity(aimSlow ? MAX_VELOCITY * 0.75 : MAX_VELOCITY);
      if (moving) {
        if (dir.lengthSq() > 0) dir.normalize();
        this.playerAcceleration = (10000 + state.upgrade.acceleration) * (aimSlow ? 0.75 : 1);
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

    state.windupAmmoBonus = 0;
    if (state.weapon.firemode === 'auto' && this.shooting) {
      let rate = Math.max(50, (state.weapon.firerate ?? 150) - state.upgrade.firerateBonus * 15);
      if (state.weapon.type === 'ar' && state.upgrade.windUp > 0) {
        if (state.weapon.ammo > 0) {
          this._arWindup = Math.min(1, this._arWindup + delta / 3000);
        } else {
          this._arWindup = Math.max(0, this._arWindup - delta / 2000);
        }
        const slowRate = rate * 3;
        rate = Math.max(rate, slowRate * Math.pow(1 / 3, this._arWindup));
        state.windupAmmoBonus = Math.pow(this._arWindup, 2) * 0.65;
      }
      if (state.weapon.type === 'arc') {
        // Fire rate sags as the mag drains: 100% cadence full → 50% cadence empty.
        const max = this._maxAmmo('arc');
        const ammoRatio = max > 0 ? Phaser.Math.Clamp(state.weapon.ammo / max, 0, 1) : 1;
        rate = rate / (0.5 + 0.5 * ammoRatio);
      }
      if (time - this._lastAutoShot >= rate) {
        if (state.weapon.ammo <= 0) this._dryFire();
        else { shootBullet(player.rotation); this._lastAutoShot = time; this._updateLowAmmoSound(); }
      }
    } else if (state.weapon.type === 'ar' && state.upgrade.windUp > 0) {
      this._arWindup = Math.max(0, this._arWindup - delta / 800);
      state.windupAmmoBonus = Math.pow(this._arWindup, 2) * 0.65;
    }

    this.arcGraphics.clear();
    for (let i = state.arcs.length - 1; i >= 0; i--) {
      const arc = state.arcs[i];
      arc.update(delta);
      arc.draw(this.arcGraphics);
      if (arc.isFullyDead()) state.arcs.splice(i, 1);
    }

    this._updateReload(delta);
    this._drawReloadBar();
    this._drawAmmoBlocks();
    this._updateHUD();
    this._maybeSpawnUpgradeBox();
    this._updateBoxIndicator();

    // Style meter decays constantly, faster the higher it is.
    state.style = Math.max(0, state.style - (delta / 1000) * (20 + state.style * 0.05));
    this._drawStyleMeter();

    this._updateTimer(delta);
    this.stageText.setText(`STAGE ${getStage() + 1}`);

    this._drawXPBar();
    this._drawUpgradeList();
  }

  // ── XP (currency) / Upgrade box ────────────────────────────────────────────────

  _addXP(amount) {
    state.xp += amount;
    if (!this._modalActive) this._checkLevelUp();
  }

  _checkLevelUp() {
    while (state.xp >= state.xpToLevel) {
      state.xp -= state.xpToLevel;
      state.level++;
      state.xpToLevel = 100 + state.level * 30;
      state.timeLeft += 30; // each level up buys 30 more seconds
      this._pendingUpgrades++;
    }
    if (this._pendingUpgrades > 0 && !this._upgradeBtnObjs) this._showUpgradeButton();
  }

  _showUpgradeButton() {
    this._upgradeBtnObjs = [];
    const push = obj => { this._upgradeBtnObjs.push(obj); return obj; };
    const W = this.scale.width, H = this.scale.height;
    const bx = W / 2, by = H - 38;

    const countStr = this._pendingUpgrades > 1 ? `  [${this._pendingUpgrades}]` : '';
    const bg = push(this.add.rectangle(bx, by, 250, 30, 0x110022, 0.92)
      .setScrollFactor(0).setDepth(15).setStrokeStyle(1.5, 0xaa44ff, 0.9));
    push(this.add.text(bx, by, `▲  LEVEL UP [ESC]${countStr}`, {
      fontSize: '13px', fontFamily: 'monospace', fill: '#cc88ff',
    }).setScrollFactor(0).setDepth(16).setOrigin(0.5));

    this.tweens.add({
      targets: this._upgradeBtnObjs,
      alpha: 0.45,
      duration: 520,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    const zone = push(this.add.zone(bx, by, 250, 30)
      .setScrollFactor(0).setDepth(17).setInteractive());
    zone.on('pointerover', () => bg.setFillStyle(0x220044, 0.95));
    zone.on('pointerout',  () => bg.setFillStyle(0x110022, 0.92));
    zone.on('pointerdown', () => this._openLevelUp());
  }

  _hideUpgradeButton() {
    if (!this._upgradeBtnObjs) return;
    this.tweens.killTweensOf(this._upgradeBtnObjs);
    for (const obj of this._upgradeBtnObjs) { try { obj.destroy(); } catch (_) {} }
    this._upgradeBtnObjs = null;
  }

  _openLevelUp() {
    if (this._modalActive || this._pendingUpgrades <= 0) return;
    this._pendingUpgrades--;
    this._hideUpgradeButton();
    this._showLevelUpModal(this._pickUpgradeChoices());
  }

  _pickUpgradeChoices() {
    const NON_STACKABLE = ['binaryTrigger', 'doubleBarrel', 'windUp'];
    const pool = [...UPGRADE_TYPES].filter(t => !NON_STACKABLE.includes(t) || state.globalUpgrades[t] === 0);
    const choices = [];
    while (choices.length < 3 && pool.length > 0) {
      const idx = Phaser.Math.Between(0, pool.length - 1);
      const type = pool[idx];
      if (!choices.includes(type)) choices.push(type);
      for (let i = pool.length - 1; i >= 0; i--) {
        if (pool[i] === type) pool.splice(i, 1);
      }
    }
    return choices;
  }

  // Spawns a purple wall-sprite box with a "U" on it every KILLS_PER_BOX kills.
  // Touching it opens the upgrade shop.
  _maybeSpawnUpgradeBox() {
    if (!TINKER_SHOP_ENABLED) return;
    if (this._upgradeBox || state.kills < this._nextBoxKills) return;
    this._nextBoxKills = state.kills + KILLS_PER_BOX;

    const { player } = state;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(250, 450);
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    const box = this.physics.add.image(x, y, 'wall')
      .setDisplaySize(52, 52).setTint(0xaa44ff).setDepth(3);
    box.body.setImmovable(true);
    const letter = this.add.text(x, y, 'U', {
      fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(4);

    const tween = this.tweens.add({
      targets: [box, letter],
      alpha: 0.55,
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    const overlap = this.physics.add.overlap(player, box, () => {
      overlap.destroy();
      tween.stop();
      box.destroy();
      letter.destroy();
      this._upgradeBox = null;
      this._showUpgradeShop();
    });

    this._upgradeBox = box;
  }

  // Points a screen-edge arrow at the upgrade box while it's outside the camera view.
  _updateBoxIndicator() {
    const box = this._upgradeBox;
    const cam = this.cameras.main;
    if (!box || !box.active || cam.worldView.contains(box.x, box.y)) {
      this._boxArrow.setVisible(false);
      this._boxArrowText.setVisible(false);
      return;
    }

    // Direction from screen center toward the box, in screen space.
    const cx = cam.width / 2, cy = cam.height / 2;
    const sx = box.x - cam.worldView.x;
    const sy = box.y - cam.worldView.y;
    const angle = Math.atan2(sy - cy, sx - cx);
    const dx = Math.cos(angle), dy = Math.sin(angle);

    // Clamp to the screen edge with a margin.
    const margin = 36;
    const scale = Math.min(
      (cx - margin) / Math.max(Math.abs(dx), 1e-6),
      (cy - margin) / Math.max(Math.abs(dy), 1e-6),
    );
    const ex = cx + dx * scale;
    const ey = cy + dy * scale;

    this._boxArrow.setPosition(ex, ey).setRotation(angle).setVisible(true);
    this._boxArrowText.setPosition(ex - dx * 20, ey - dy * 20).setVisible(true);
  }

  _upgradeLevelOf(type, u = state.upgrade) {
    switch (type) {
      case 'firerate':      return u.firerateBonus;
      case 'reload':        return u.reloadZone;
      case 'ammo':          return Math.floor(u.ammoBonus / 3);
      case 'accuracy':      return u.accuracy;
      case 'multishot':     return u.multishot;
      case 'ricochet':      return u.ricochet;
      case 'ammoeff':       return u.ammoEfficiency;
      case 'bulletspeed':   return u.bulletspeed;
      case 'damage':        return u.damage - 1;
      case 'pierce':        return u.pierce;
      case 'binaryTrigger': return u.binaryTrigger;
      case 'doubleBarrel':  return u.doubleBarrel;
      case 'windUp':        return u.windUp;
      default: return 0;
    }
  }

  // Tinkering fee for removing (or restoring) an upgrade on one specific weapon.
  _tinkerCost(type) {
    const lvl = this._upgradeLevelOf(type, state.globalUpgrades);
    return Math.max(10, 10 + lvl * 5);
  }

  // Freeze / unfreeze every real-time system so nothing progresses behind the modal.
  _setGameplayPaused(paused) {
    if (paused) {
      this.physics.world.pause();     // freeze bullets & collision checks
      this.time.paused = true;        // stop enemy fire timers & delayed calls
      this.anims.globalTimeScale = 0; // freeze all sprite animations
    } else {
      this.physics.world.resume();
      this.time.paused = false;
      this.anims.globalTimeScale = 1;
    }
    // Halt per-entity update loops (enemy AI/health, movement, lifespans, arcs feed off update()).
    const groups = [
      state.bullets, state.enemyBullets, state.dashLines, state.sparks,
      state.enemyFighters, state.walls, state.corpses, state.weapons,
      state.xpOrbs, state.enemySights, state.enemyPathScanners,
    ];
    for (const grp of groups) {
      if (grp) grp.runChildUpdate = !paused;
    }
  }

  _showLevelUpModal(choices) {
    this._modalActive = true;
    this._setGameplayPaused(true);
    this._modalObjects = [];
    const push = obj => { this._modalObjects.push(obj); return obj; };
    const W = this.scale.width, H = this.scale.height;

    push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78)
      .setScrollFactor(0).setDepth(20).setInteractive());

    push(this.add.text(W / 2, H * 0.18, `LEVEL  ${state.level}`, {
      fontSize: '40px', fontFamily: 'monospace', fill: '#ffffff', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(21).setOrigin(0.5));

    push(this.add.text(W / 2, H * 0.27, 'choose an upgrade — applies to all weapons', {
      fontSize: '15px', fontFamily: 'monospace', fill: '#666666',
    }).setScrollFactor(0).setDepth(21).setOrigin(0.5));

    const cardW = 180, cardH = 240, gap = 28;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = (W - totalW) / 2;

    const PIP_W = 11, PIP_H = 4, PIP_GAP = 3, MAX_PIPS = 10;

    choices.forEach((type, i) => {
      const def = UPGRADE_DEFS[type];
      const [r, g, b] = def.rgb;
      const color = (r << 16) | (g << 8) | b;
      const colorHex = `#${color.toString(16).padStart(6, '0')}`;
      const cx = startX + i * (cardW + gap) + cardW / 2;
      const cy = H * 0.57;

      const bg = push(this.add.rectangle(cx, cy, cardW, cardH, 0x0a0a0a, 0.98)
        .setScrollFactor(0).setDepth(21).setStrokeStyle(2, color, 0.55));

      push(this.add.rectangle(cx, cy - cardH / 2 + 20, cardW, 40, color, 0.9)
        .setScrollFactor(0).setDepth(22));

      push(this.add.text(cx, cy - cardH / 2 + 20, def.letter, {
        fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      }).setScrollFactor(0).setDepth(23).setOrigin(0.5));

      push(this.add.text(cx, cy + 6, UPGRADE_NAMES[type] ?? type.toUpperCase(), {
        fontSize: '15px', fontFamily: 'monospace', fill: colorHex, align: 'center',
        wordWrap: { width: cardW - 20 },
      }).setScrollFactor(0).setDepth(22).setOrigin(0.5));

      push(this.add.text(cx, cy + 38, UPGRADE_DESCS[type] ?? '', {
        fontSize: '12px', fontFamily: 'monospace', fill: '#777777', align: 'center',
      }).setScrollFactor(0).setDepth(22).setOrigin(0.5));

      const level = this._upgradeLevelOf(type, state.globalUpgrades);
      const pipsW = MAX_PIPS * (PIP_W + PIP_GAP) - PIP_GAP;
      const pipsX = cx - pipsW / 2;
      const pipsY = cy + 68;
      for (let p = 0; p < MAX_PIPS; p++) {
        const filled = p < level;
        push(this.add.rectangle(
          pipsX + p * (PIP_W + PIP_GAP) + PIP_W / 2, pipsY,
          PIP_W, PIP_H,
          filled ? color : 0x2a2a2a,
          filled ? 0.9 : 0.5,
        ).setScrollFactor(0).setDepth(22));
      }

      const zone = push(this.add.zone(cx, cy, cardW, cardH)
        .setScrollFactor(0).setDepth(24).setInteractive());
      zone.on('pointerover', () => bg.setFillStyle(0x1e1e1e, 0.98));
      zone.on('pointerout',  () => bg.setFillStyle(0x0a0a0a, 0.98));
      zone.on('pointerdown', () => this._applyLevelUpChoice(type));
    });
  }

  _applyLevelUpChoice(type) {
    const u = state.globalUpgrades;
    switch (type) {
      case 'multishot':   u.multishot++; break;
      case 'firerate':    u.firerateBonus++; break;
      case 'reload':      u.reloadZone++; break;
      case 'ammo':        u.ammoBonus += 3; break;
      case 'accuracy':    u.accuracy++; break;
      case 'ricochet':    u.ricochet++; break;
      case 'ammoeff':       u.ammoEfficiency++; break;
      case 'bulletspeed':   u.bulletspeed++; break;
      case 'damage':        u.damage++; break;
      case 'pierce':        u.pierce++; break;
      case 'binaryTrigger': u.binaryTrigger = 1; break;
      case 'doubleBarrel':  u.doubleBarrel = 1; break;
      case 'windUp':        u.windUp = 1; break;
    }
    refreshActiveUpgrades();
    if (state.weapon.type === 'shotgun') {
      state.weapon.ammo = Math.min(state.weapon.ammo, this._maxAmmo('shotgun'));
    }

    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    this._modalActive = false;
    this._setGameplayPaused(false);

    // Drain any XP accumulated while the modal was open
    while (state.xp >= state.xpToLevel) {
      state.xp -= state.xpToLevel;
      state.level++;
      state.xpToLevel = 100 + state.level * 30;
      state.timeLeft += 30;
      this._pendingUpgrades++;
    }

    // Chain directly to the next screen if more are pending
    if (this._pendingUpgrades > 0) {
      this._pendingUpgrades--;
      this._showLevelUpModal(this._pickUpgradeChoices());
    } else {
      this._hideUpgradeButton();
    }
  }

  _showUpgradeShop() {
    this._modalActive = true;
    this._shopOpen = true;
    this._setGameplayPaused(true);
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    const push = obj => { this._modalObjects.push(obj); return obj; };
    const W = this.scale.width, H = this.scale.height;

    // Default the tab to the held weapon on first open (fists → pistol).
    if (!this._shopWeapon) {
      this._shopWeapon = state.weapon.type === 'none' ? 'pistol' : state.weapon.type;
    }
    const wtype = this._shopWeapon;
    const removals = state.weaponRemovals[wtype];

    push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78)
      .setScrollFactor(0).setDepth(20).setInteractive());

    push(this.add.text(W / 2, H * 0.09, "TINKER'S SHOP", {
      fontSize: '34px', fontFamily: 'monospace', fill: '#ffffff', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(21).setOrigin(0.5));

    push(this.add.text(W / 2, H * 0.155, `XP: ${Math.floor(state.xp)}`, {
      fontSize: '17px', fontFamily: 'monospace', fill: '#00ff88',
    }).setScrollFactor(0).setDepth(21).setOrigin(0.5));

    // ── Weapon tabs — pick which gun to tinker (removals are per-weapon) ──
    const SHOP_WEAPONS = [
      { type: 'pistol',       label: 'PISTOL'  },
      { type: 'dualPistol',   label: 'DUAL'    },
      { type: 'shieldPistol', label: 'SHIELD'  },
      { type: 'shotgun',      label: 'SHOTGUN' },
      { type: 'ar',           label: 'AR'      },
      { type: 'arc',          label: 'ARC'     },
      { type: 'sword',        label: 'SWORD'   },
    ];
    const tabW = 96, tabH = 28, tabGap = 8;
    const tabsTotal = SHOP_WEAPONS.length * tabW + (SHOP_WEAPONS.length - 1) * tabGap;
    const tabY = H * 0.215;
    SHOP_WEAPONS.forEach((w, i) => {
      const tx = (W - tabsTotal) / 2 + i * (tabW + tabGap) + tabW / 2;
      const selected = w.type === wtype;
      const held = w.type === state.weapon.type;
      const tabBg = push(this.add.rectangle(tx, tabY, tabW, tabH,
        selected ? 0x2a1a44 : 0x0a0a0a, 0.96)
        .setScrollFactor(0).setDepth(21)
        .setStrokeStyle(1.5, selected ? 0xaa44ff : 0x444444, selected ? 1 : 0.6));
      push(this.add.text(tx, tabY, w.label + (held ? ' •' : ''), {
        fontSize: '11px', fontFamily: 'monospace', fontStyle: selected ? 'bold' : 'normal',
        fill: selected ? '#cc88ff' : held ? '#00ff88' : '#888888',
      }).setScrollFactor(0).setDepth(22).setOrigin(0.5));
      if (!selected) {
        const tz = push(this.add.zone(tx, tabY, tabW, tabH)
          .setScrollFactor(0).setDepth(24).setInteractive());
        tz.on('pointerover', () => tabBg.setFillStyle(0x1e1e1e, 0.96));
        tz.on('pointerout',  () => tabBg.setFillStyle(0x0a0a0a, 0.96));
        tz.on('pointerdown', () => {
          this._shopWeapon = w.type;
          this._showUpgradeShop();
        });
      }
    });

    push(this.add.text(W / 2, tabY + 26, 'upgrades come from LEVEL UPS and affect all weapons — REMOVE switches one off for the selected gun  ( • = held )', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#666666',
    }).setScrollFactor(0).setDepth(21).setOrigin(0.5));

    // Weapon-exclusive ultimates only show for their weapon.
    const ULTIMATE_FOR = { binaryTrigger: 'pistol', doubleBarrel: 'shotgun', windUp: 'ar' };
    const types = [...new Set(UPGRADE_TYPES)].filter(t => {
      const only = ULTIMATE_FOR[t];
      return !only || only === wtype;
    });

    const rowW = 440, rowH = 42, rowGap = 10;
    const perCol = Math.ceil(types.length / 2);
    const colX = [W / 2 - rowW / 2 - 14, W / 2 + rowW / 2 + 14];
    const startY = H * 0.30;

    // Small labelled button inside a row; returns nothing, wires its own zone.
    const addButton = (bx, by, bw, label, strokeColor, textColor, enabled, onClick) => {
      const btnBg = push(this.add.rectangle(bx, by, bw, 24, 0x111111, 0.95)
        .setScrollFactor(0).setDepth(23)
        .setStrokeStyle(1.2, strokeColor, enabled ? 0.9 : 0.25));
      push(this.add.text(bx, by, label, {
        fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
        fill: enabled ? textColor : '#555555',
      }).setScrollFactor(0).setDepth(24).setOrigin(0.5));
      if (enabled) {
        const bz = push(this.add.zone(bx, by, bw, 24)
          .setScrollFactor(0).setDepth(25).setInteractive());
        bz.on('pointerover', () => btnBg.setFillStyle(0x2a2a2a, 0.95));
        bz.on('pointerout',  () => btnBg.setFillStyle(0x111111, 0.95));
        bz.on('pointerdown', onClick);
      }
    };

    types.forEach((type, i) => {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const cx = colX[col];
      const cy = startY + row * (rowH + rowGap) + rowH / 2;

      const def = UPGRADE_DEFS[type];
      const [r, g, b] = def.rgb;
      const color = (r << 16) | (g << 8) | b;
      const colorHex = `#${color.toString(16).padStart(6, '0')}`;

      const lvl = this._upgradeLevelOf(type, state.globalUpgrades);
      const tinkerCost = this._tinkerCost(type);
      const isUltimate = type in ULTIMATE_FOR;
      const removedHere = removals.has(type);

      // Removing needs something to remove; restoring is always meaningful.
      const canTinker = state.xp >= tinkerCost && (removedHere || lvl > 0);

      push(this.add.rectangle(cx, cy, rowW, rowH, 0x0a0a0a, 0.96)
        .setScrollFactor(0).setDepth(21)
        .setStrokeStyle(1.5, color, removedHere ? 0.15 : lvl > 0 ? 0.7 : 0.35));

      push(this.add.rectangle(cx - rowW / 2 + 21, cy, 26, 26, color, removedHere ? 0.25 : 0.9)
        .setScrollFactor(0).setDepth(22));
      push(this.add.text(cx - rowW / 2 + 21, cy, def.letter, {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      }).setScrollFactor(0).setDepth(23).setOrigin(0.5));

      const lvlStr = isUltimate ? (lvl > 0 ? '  [OWNED]' : '') : (lvl > 0 ? `  ×${lvl}` : '');
      const offStr = removedHere ? '  [OFF]' : '';
      push(this.add.text(cx - rowW / 2 + 42, cy - 9, `${UPGRADE_NAMES[type] ?? type}${lvlStr}${offStr}`, {
        fontSize: '13px', fontFamily: 'monospace',
        fill: removedHere ? '#aa4444' : lvl > 0 ? colorHex : '#888888',
      }).setScrollFactor(0).setDepth(22).setOrigin(0, 0.5));
      push(this.add.text(cx - rowW / 2 + 42, cy + 9, UPGRADE_DESCS[type] ?? '', {
        fontSize: '10px', fontFamily: 'monospace', fill: '#666666',
      }).setScrollFactor(0).setDepth(22).setOrigin(0, 0.5));

      // REMOVE / RESTORE — tinker this stat for the selected gun only.
      addButton(cx + rowW / 2 - 50, cy, 90,
        removedHere ? `RESTORE ${tinkerCost}` : `REMOVE ${tinkerCost}`,
        0xffaa44, removedHere ? '#ffdd88' : '#ffaa44', canTinker, () => this._toggleTinker(type));
    });

    const doneY = startY + perCol * (rowH + rowGap) + 34;
    const doneBg = push(this.add.rectangle(W / 2, doneY, 180, 36, 0x220000, 0.95)
      .setScrollFactor(0).setDepth(21).setStrokeStyle(1.5, 0xff4444, 0.8));
    push(this.add.text(W / 2, doneY, 'DONE  [ESC]', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#ff8888',
    }).setScrollFactor(0).setDepth(22).setOrigin(0.5));
    const doneZone = push(this.add.zone(W / 2, doneY, 180, 36)
      .setScrollFactor(0).setDepth(24).setInteractive());
    doneZone.on('pointerover', () => doneBg.setFillStyle(0x440000, 0.95));
    doneZone.on('pointerout',  () => doneBg.setFillStyle(0x220000, 0.95));
    doneZone.on('pointerdown', () => this._closeShop());
  }

  // Toggle a stat off/on for the selected gun only, for an XP fee.
  _toggleTinker(type) {
    const removals = state.weaponRemovals[this._shopWeapon];
    if (!removals) return;
    const cost = this._tinkerCost(type);
    if (state.xp < cost) return;
    state.xp -= cost;
    if (removals.has(type)) removals.delete(type);
    else removals.add(type);
    refreshActiveUpgrades();
    if (state.weapon.type === 'shotgun') {
      state.weapon.ammo = Math.min(state.weapon.ammo, this._maxAmmo('shotgun'));
    }
    this._showUpgradeShop();
  }

  _closeShop() {
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    this._shopOpen = false;
    this._shopWeapon = null;
    this._modalActive = false;
    this._setGameplayPaused(false);
  }

  _drawUpgradeList() {
    const u = state.upgrade;
    const lines = [];
    if (u.firerateBonus > 0)            lines.push(`FIRE RATE   ×${u.firerateBonus}`);
    if (u.reloadZone > 0)               lines.push(`RELOAD      ×${u.reloadZone}`);
    if (Math.floor(u.ammoBonus / 3) > 0) lines.push(`AMMO        ×${Math.floor(u.ammoBonus / 3)}`);
    if (u.accuracy > 0)                 lines.push(`ACCURACY    ×${u.accuracy}`);
    if (u.bulletspeed > 0)              lines.push(`BULLET SPD  ×${u.bulletspeed}`);
    if (u.multishot > 0)                lines.push(`MULTISHOT   ×${u.multishot}`);
    if (u.ricochet > 0)                 lines.push(`RICOCHET    ×${u.ricochet}`);
    if (u.ammoEfficiency > 0)           lines.push(`AMMO EFF.   ×${u.ammoEfficiency}`);
    if (u.damage > 1)                   lines.push(`DAMAGE      ×${u.damage - 1}`);
    if (u.pierce > 0)                   lines.push(`PIERCE      ×${u.pierce}`);
    if (u.binaryTrigger > 0)            lines.push(`BIN. TRIG.`);
    if (u.doubleBarrel > 0)             lines.push(`DBL BARREL`);
    if (u.windUp > 0)                   lines.push(`WIND UP`);
    this.upgradeListText.setText(lines.join('\n'));
  }

  _drawXPBar() {
    const g = this.xpBarGfx;
    g.clear();
    const W = this.scale.width;
    const ratio = state.xpToLevel > 0 ? Phaser.Math.Clamp(state.xp / state.xpToLevel, 0, 1) : 0;
    g.fillStyle(0x111111, 0.8);
    g.fillRect(0, 0, W, 6);
    g.fillStyle(0x00ff88, 1);
    g.fillRect(0, 0, W * ratio, 6);
    this.levelText.setText(`LVL ${state.level}`);
  }

  // Ultrakill-style rank readout: letter grade + progress bar within the rank.
  _drawStyleMeter() {
    const s = state.style;
    const g = this.styleGfx;
    g.clear();
    if (s <= 0) { this.styleText.setText(''); return; }

    const idx = STYLE_RANKS.findIndex(r => s >= r.min);
    const rank = STYLE_RANKS[idx];
    this.styleText.setText(rank.grade).setColor(rank.color);

    const bandMin = rank.min;
    const bandMax = idx === 0 ? 1000 : STYLE_RANKS[idx - 1].min;
    const t = Phaser.Math.Clamp((s - bandMin) / (bandMax - bandMin), 0, 1);

    const W = this.scale.width;
    const BAR_W = 120, BAR_H = 5;
    const bx = W - 12 - BAR_W, by = 52;
    g.fillStyle(0x222222, 0.7);
    g.fillRect(bx, by, BAR_W, BAR_H);
    g.fillStyle(parseInt(rank.color.slice(1), 16), 0.95);
    g.fillRect(bx, by, BAR_W * t, BAR_H);
  }

  // ── Survival timer / game over ─────────────────────────────────────────────

  _updateTimer(delta) {
    if (state.gameOver) return;
    state.timeLeft -= delta / 1000;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      this._triggerGameOver();
    }
    const t = Math.max(0, Math.ceil(state.timeLeft));
    const m = Math.floor(t / 60);
    const s = t % 60;
    this.timerText.setText(`[ ${m}:${s.toString().padStart(2, '0')} ]`);
    this.timerText.setColor(state.timeLeft <= 10 ? '#ff4444' : state.timeLeft <= 30 ? '#ffcc44' : '#33ff66');
  }

  _triggerGameOver() {
    if (this._gameOverActive) return;
    this._gameOverActive = true;
    this._modalActive = true;
    state.gameOver = true;
    this._setGameplayPaused(true);
    this._showGameOverScreen();
  }

  _showGameOverScreen() {
    this._finalScore = computeScore();
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    const push = obj => { this._modalObjects.push(obj); return obj; };
    const W = this.scale.width, H = this.scale.height;

    push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(30).setInteractive());

    push(this.add.text(W / 2, H * 0.16, 'GAME OVER', {
      fontSize: '52px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ff4444',
    }).setScrollFactor(0).setDepth(31).setOrigin(0.5));

    push(this.add.text(W / 2, H * 0.28, `SCORE  ${this._finalScore}`, {
      fontSize: '28px', fontFamily: 'monospace', fill: '#ffcc44',
    }).setScrollFactor(0).setDepth(31).setOrigin(0.5));

    push(this.add.text(W / 2, H * 0.35, `${state.kills} kills · level ${state.level}`, {
      fontSize: '15px', fontFamily: 'monospace', fill: '#888888',
    }).setScrollFactor(0).setDepth(31).setOrigin(0.5));

    push(this.add.text(W / 2, H * 0.44, 'enter your name:', {
      fontSize: '15px', fontFamily: 'monospace', fill: '#aaaaaa',
    }).setScrollFactor(0).setDepth(31).setOrigin(0.5));

    // Real HTML input overlaid on the canvas.
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 12;
    input.placeholder = 'YOUR NAME';
    Object.assign(input.style, {
      position: 'fixed', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)', width: '260px', padding: '10px',
      fontSize: '22px', fontFamily: 'monospace', textAlign: 'center',
      background: '#111111', color: '#ffffff', border: '2px solid #ffcc44',
      outline: 'none', textTransform: 'uppercase', zIndex: '1000',
    });
    document.body.appendChild(input);
    setTimeout(() => input.focus(), 0);
    this._nameInput = input;
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this._submitScore();
    });

    const submitBg = push(this.add.rectangle(W / 2 - 90, H * 0.62, 150, 40, 0x113311, 0.95)
      .setScrollFactor(0).setDepth(31).setStrokeStyle(1.5, 0x44ff88, 0.9));
    push(this.add.text(W / 2 - 90, H * 0.62, 'SUBMIT', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#88ffaa',
    }).setScrollFactor(0).setDepth(32).setOrigin(0.5));
    const submitZone = push(this.add.zone(W / 2 - 90, H * 0.62, 150, 40)
      .setScrollFactor(0).setDepth(33).setInteractive());
    submitZone.on('pointerover', () => submitBg.setFillStyle(0x225522, 0.95));
    submitZone.on('pointerout',  () => submitBg.setFillStyle(0x113311, 0.95));
    submitZone.on('pointerdown', () => this._submitScore());

    const skipBg = push(this.add.rectangle(W / 2 + 90, H * 0.62, 150, 40, 0x222222, 0.95)
      .setScrollFactor(0).setDepth(31).setStrokeStyle(1.5, 0x888888, 0.7));
    push(this.add.text(W / 2 + 90, H * 0.62, 'SKIP', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#aaaaaa',
    }).setScrollFactor(0).setDepth(32).setOrigin(0.5));
    const skipZone = push(this.add.zone(W / 2 + 90, H * 0.62, 150, 40)
      .setScrollFactor(0).setDepth(33).setInteractive());
    skipZone.on('pointerover', () => skipBg.setFillStyle(0x444444, 0.95));
    skipZone.on('pointerout',  () => skipBg.setFillStyle(0x222222, 0.95));
    skipZone.on('pointerdown', () => this._returnToMenu());
  }

  _submitScore() {
    const name = (this._nameInput?.value || '').trim() || 'ANON';
    submitScore(name, this._finalScore);
    this._showLeaderboard();
  }

  _showLeaderboard() {
    if (this._nameInput) { this._nameInput.remove(); this._nameInput = null; }
    for (const obj of this._modalObjects) obj.destroy();
    this._modalObjects = [];
    const push = obj => { this._modalObjects.push(obj); return obj; };
    const W = this.scale.width, H = this.scale.height;

    push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9)
      .setScrollFactor(0).setDepth(30).setInteractive());
    push(this.add.text(W / 2, H * 0.14, 'LEADERBOARD', {
      fontSize: '40px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffcc44',
    }).setScrollFactor(0).setDepth(31).setOrigin(0.5));

    const scores = getLeaderboard();
    scores.slice(0, 10).forEach((row, i) => {
      const mine = row.score === this._finalScore;
      const y = H * 0.26 + i * 34;
      push(this.add.text(W / 2, y, `${(i + 1).toString().padStart(2)}.  ${row.name.padEnd(12)}  ${row.score}`, {
        fontSize: '18px', fontFamily: 'monospace', fill: mine ? '#00ff88' : '#cccccc',
      }).setScrollFactor(0).setDepth(31).setOrigin(0.5));
    });

    const menuBg = push(this.add.rectangle(W / 2, H * 0.9, 200, 44, 0x220000, 0.95)
      .setScrollFactor(0).setDepth(31).setStrokeStyle(1.5, 0xff4444, 0.8));
    push(this.add.text(W / 2, H * 0.9, 'MAIN MENU', {
      fontSize: '18px', fontFamily: 'monospace', fill: '#ff8888',
    }).setScrollFactor(0).setDepth(32).setOrigin(0.5));
    const menuZone = push(this.add.zone(W / 2, H * 0.9, 200, 44)
      .setScrollFactor(0).setDepth(33).setInteractive());
    menuZone.on('pointerover', () => menuBg.setFillStyle(0x440000, 0.95));
    menuZone.on('pointerout',  () => menuBg.setFillStyle(0x220000, 0.95));
    menuZone.on('pointerdown', () => this._returnToMenu());
  }

  _returnToMenu() {
    if (this._nameInput) { this._nameInput.remove(); this._nameInput = null; }
    this._setGameplayPaused(false); // restore global anim/physics/time state before leaving
    if (state.banishing) state.banishing.stop();
    this.scene.start('MainMenuScene');
  }

  _drawAmmoBlocks() {
    const g = this.ammoGfx;
    g.clear();

    const { weapon, player } = state;
    if (weapon.type === 'sword' || weapon.type === 'none') return;
    const max = this._maxAmmo(weapon.type);
    if (max === 0) return;

    const ammo = Math.min(weapon.ammo, max);
    const ratio = ammo / max;
    let filledColor;
    if (ammo === 0)         filledColor = 0xff3333;
    else if (ratio <= 0.25) filledColor = 0xff8800;
    else if (ratio <= 0.5)  filledColor = 0xffdd00;
    else                    filledColor = 0xdddddd;

    const BAR_W = 110;
    const BAR_H = 7;
    const sx = player.x - BAR_W / 2;
    const sy = player.y + 48;

    g.fillStyle(0x222222, 0.5);
    g.fillRect(sx, sy, BAR_W, BAR_H);

    const fillW = Math.round(BAR_W * ammo / max);
    if (fillW > 0) { g.fillStyle(filledColor, 0.9); g.fillRect(sx, sy, fillW, BAR_H); }

    if (max <= 50) {
      g.lineStyle(1, 0x000000, 0.5);
      for (let i = 1; i < max; i++) {
        const lx = sx + BAR_W * i / max;
        g.beginPath(); g.moveTo(lx, sy); g.lineTo(lx, sy + BAR_H); g.strokePath();
      }
    }
  }

  _playEmptyMagSfx(volume) {
    const sfx = state.empty_mag_sfx;
    if (!sfx) return;
    if (sfx.isPlaying) sfx.stop();
    sfx.setVolume(volume);
    sfx.play();
  }

  // Called after each shot — ramps volume and pitch from 50% ammo down to 0%
  _updateLowAmmoSound() {
    const { weapon } = state;
    const max = this._maxAmmo(weapon.type);
    if (max === 0) return;
    const ratio = weapon.ammo / max;
    if (ratio > 0.5) return;
    const t = 1 - ratio / 0.5; // 0 at 50% ammo → 1 at 0% ammo
    state.empty_mag_sfx.setDetune(-500 + t * 400); // -500 cents (low) → -100 cents (slightly below base)
    this._playEmptyMagSfx(t * 0.3);
  }

  _dryFire() {
    const now = this.time.now;
    if (now - this._dryFireCooldown < 300) return;
    this._dryFireCooldown = now;
    this._playEmptyMagSfx(0.65);
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
    // Double-barrel locks the shotgun to 2 shells, ignoring ammo-count upgrades.
    if (type === 'shotgun' && state.upgrade.doubleBarrel > 0) return 2;
    const base = { pistol: 9, dualPistol: 18, shieldPistol: 6, shotgun: 7, ar: 25, arc: 60 }[type] ?? 0;
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
    this.reload.magsLeft = weapon.type === 'dualPistol' ? 2 : 0;
    this.reload.ejectElapsed = 0;
    this.reload.windowMs = weapon.type === 'shotgun'
      ? Math.max(200, 630 + (state.upgrade.doubleBarrel > 0 ? 0 : state.upgrade.ammoBonus * 20) - state.upgrade.reloadZone * 80)
      : weapon.type === 'shieldPistol'
      ? Math.max(200, 1050 + state.upgrade.ammoBonus * 20 - state.upgrade.reloadZone * 80)
      : Math.max(200, 700 + state.upgrade.ammoBonus * 20 - state.upgrade.reloadZone * 80);
  }

  _onEjectKey() {
    if (!this.reload.ejecting) return;
    this.reload.ejecting = false;
    this.reload.qteActive = true;
    const wt = state.weapon.type;
    if (wt === 'pistol' || wt === 'dualPistol' || wt === 'shieldPistol' || wt === 'ar' || wt === 'arc') {
      state.empty_mag_sfx.setDetune(wt === 'ar' || wt === 'arc' ? Phaser.Math.Between(-500, -200) : Phaser.Math.Between(-300, 0));
      this._playEmptyMagSfx(0.55);
    }
  }

  _resolveQTE(expired = false) {
    if (!this.reload.qteActive) return;
    const hit = this.reload.indicator >= this.reload.sweetMin &&
                this.reload.indicator <= this.reload.sweetMax;
    if (!hit && !expired) return; // missed keypress — ignore, let bar run out
    this.reload.result = hit ? 'hit' : 'miss';
    this.reload.qteActive = false;
    this.reload.delay = hit ? 120 : 300;
    if (hit) {
      const wt = state.weapon.type;
      if (wt === 'shotgun') {
        state.empty_mag_sfx.setVolume(0.5);
        state.empty_mag_sfx.setDetune(Phaser.Math.Between(-200, 200));
        state.empty_mag_sfx.play();
      } else if (wt === 'pistol' || wt === 'dualPistol' || wt === 'shieldPistol') {
        state.reload_mag_sfx.setDetune(Phaser.Math.Between(-200, 200));
        state.reload_mag_sfx.play();
      } else if (wt === 'ar' || wt === 'arc') {
        state.reload_mag_sfx.setDetune(Phaser.Math.Between(-600, -200));
        state.reload_mag_sfx.play();
      }
    }
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
    } else if (weapon.type === 'dualPistol') {
      weapon.ammo = Math.min(weapon.ammo + Math.floor(max / 2), max);
      this.reload.magsLeft--;
      state.dualPistolFrame = state.dualPistolFrame === 8 ? 9 : 8;
      state.player.setFrame(25);
      setTimeout(() => state.player.setFrame(state.dualPistolFrame), 80);
      if (this.reload.magsLeft > 0) {
        this.reload.indicator = 0;
        this.reload.sweetMin = 0.39 + Phaser.Math.FloatBetween(-0.08, 0.08);
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
