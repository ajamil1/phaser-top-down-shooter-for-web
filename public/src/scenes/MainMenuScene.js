import * as Phaser from 'phaser';
import { state } from '../state.js';
import { DashLine } from '../entities/DashLine.js';
import { spawnDashLine } from '../utils/spawners.js';
import { MAX_VELOCITY } from '../config.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  preload() {
    this.load.plugin(
      'rexoutlinepipelineplugin',
      'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexoutlinepipelineplugin.min.js',
      true
    );
    this.load.audio('shotgun_sfx', '/src/assets/shotgun_sfx.mp3');
    this.load.audio('pistol_sfx', '/src/assets/pistol_sfx.mp3');
    this.load.audio('rifle_sfx', '/src/assets/rifle_sfx.mp3');
    this.load.audio('sword_sfx', '/src/assets/sword_sfx.mp3');
    this.load.audio('banishing', '/src/assets/Filmmaker - Great Tribulations - 01 Banishing.mp3');
    this.load.image('background', '/src/assets/tiled-bg.png');
    this.load.image('wall', '/src/assets/wall.png');
    this.load.spritesheet('legs', '/src/assets/player-walk.png', { frameWidth: 49, frameHeight: 49, margin: 1, spacing: 0 });
    this.load.spritesheet('player', '/src/assets/player-sprites.png', { frameWidth: 49, frameHeight: 49, margin: 0, spacing: 0 });
    this.load.spritesheet('player-sword', '/src/assets/player-sprites-big.png', { frameWidth: 70, frameHeight: 70, margin: 0, spacing: 0 });
    this.load.image('enemyBullet', '/src/assets/bullet.png');
    this.load.image('bullet', '/src/assets/bullet2.png');
    this.load.image('arc', '/src/assets/bullet.png');
    this.load.image('dashLine', '/src/assets/dash-line.png');
    this.load.image('basicEnemy', '/src/assets/basic-enemy.png');
    this.load.image('enemyFighter', '/src/assets/enemy-fighter.png');
    this.load.spritesheet('weapon', '/src/assets/weapons.png', { frameWidth: 63, frameHeight: 63, margin: 0, spacing: 0 });
    this.load.spritesheet('spark', '/src/assets/enemy-sparks.png', { frameWidth: 5, frameHeight: 5, margin: 0, spacing: 0 });
    this.load.image('pistol', '/src/assets/pistol.png');
    this.load.image('cursor', '/src/assets/cursor.png');
  }

  create() {
    state.pistol_sfx = this.sound.add('pistol_sfx', { loop: false, volume: 0.5, allowMultiple: true });
    state.shotgun_sfx = this.sound.add('shotgun_sfx', { loop: false, volume: 0.5, allowMultiple: true });
    state.rifle_sfx = this.sound.add('rifle_sfx', { loop: false, volume: 0.5, allowMultiple: true });
    state.sword_sfx = this.sound.add('sword_sfx', { loop: false, volume: 0.5, allowMultiple: true });

    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('legs', { frames: [0,1,2,3,4,5,6,7,8,9,10,11] }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'left-punch', frames: this.anims.generateFrameNumbers('player', { frames: [2,2,1,1,1,1,1,1,0] }), frameRate: 32, repeat: 0 });
    this.anims.create({ key: 'right-punch', frames: this.anims.generateFrameNumbers('player', { frames: [4,4,3,3,3,3,3,3,0] }), frameRate: 32, repeat: 0 });
    this.anims.create({ key: 'left-slash', frames: this.anims.generateFrameNumbers('player', { frames: [23,22,21,20,15] }), frameRate: 32, repeat: 0 });
    this.anims.create({ key: 'right-slash', frames: this.anims.generateFrameNumbers('player', { frames: [16,17,18,19,24] }), frameRate: 32, repeat: 0 });
    this.anims.create({ key: 'spin-attack', frames: this.anims.generateFrameNumbers('player', { frames: [20,21,22,23,16,17,18,19,24,15] }), frameRate: 46, repeat: 0 });
    this.anims.create({ key: 'knockdown', frames: this.anims.generateFrameNumbers('player', { frames: [10,11,12,12,13,14] }), frameRate: 20, repeat: 0 });

    state.player = this.physics.add.sprite(0, 0, 'player');
    state.player.setCollideWorldBounds(false);
    state.player.setDamping(true);
    state.player.setDrag(0.2);
    state.player.setMaxVelocity(MAX_VELOCITY);
    state.player.setBounce(1.3);
    state.player.setPosition(0, 0);
    state.player.setAlpha(0);

    state.cursor = this.physics.add.sprite(0, 0, 'cursor');
    state.cursor.setTintFill(0xffffff);
    state.cursor.setDepth(3);
    state.cursor.setAlpha(0);

    this._buildMenu();

    this.input.on('pointermove', () => {
      state.player.setRotation(state.angleToPointer + Math.PI / 2);
    });

    state.dashLines = this.physics.add.group({
      classType: DashLine,
      maxSize: 100,
      runChildUpdate: true,
    });
  }

  _buildMenu() {
    const textStyle = (color = '#ffffffff') => ({ fontSize: '32px', fontFamily: 'sans-serif', fill: color, align: 'center' });

    this.add.text(0, -200, 'top-down-shooter-v2', textStyle())
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MainGameScene'));

    this.add.text(0, 300, 'START', { ...textStyle(), backgroundColor: '#310000ff' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MainGameScene'));

    this.add.text(-100, -100, 'MOVEMENT:', textStyle()).setOrigin(0.5);
    this.add.text(100, -100, '[W]\n[A][S][D]', textStyle('#00ff2aff')).setOrigin(0.5);
    this.add.text(-120, 0, 'ATTACK:', textStyle()).setOrigin(0.5);
    this.add.text(100, 0, '[LEFT CLICK]', textStyle('#00ff2aff')).setOrigin(0.5);
    this.add.text(-112, 100, 'COLLECT:', textStyle()).setOrigin(0.5);
    this.add.text(100, 100, '[SPACEBAR]', textStyle('#00ff2aff')).setOrigin(0.5);
  }

  update(time, delta) {
    spawnDashLine();
    const pointer = this.input.mousePointer;
    const midX = (state.player.x + pointer.worldX / 6) / 2;
    const midY = (state.player.y + pointer.worldY / 6) / 2;
    const camera = this.cameras.main;
    camera.scrollX = Phaser.Math.Linear(camera.scrollX, midX - camera.width / 2, 1);
    camera.scrollY = Phaser.Math.Linear(camera.scrollY, midY - camera.height / 2, 1);
  }
}
