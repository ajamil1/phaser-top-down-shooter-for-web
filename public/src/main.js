import './style.css';
import Phaser, { Tilemaps } from 'phaser';
import {
  dashLine, Wall, Spark,
  Weapon,
  EnemyFighter, EnemyBullet, EnemySight, EnemyPathScan,
  Bullet, Corpse
} from './classes.js'

// Define the Bullet class first

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });  // Unique key for this scene
    this.debug = false
    this.music = 0.5
  }

  preload() {
    this.load.plugin('rexoutlinepipelineplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexoutlinepipelineplugin.min.js', true);
    this.load.audio('shotgun_sfx', '/src/assets/shotgun_sfx.mp3');
    this.load.audio('pistol_sfx', '/src/assets/pistol_sfx.mp3');
    this.load.audio('rifle_sfx', '/src/assets/rifle_sfx.mp3');
    this.load.audio('banishing', '/src/assets/Filmmaker - Great Tribulations - 01 Banishing.mp3');
    this.load.image('background', '/src/assets/tiled-bg.png');
    this.load.spritesheet('legs', '/src/assets/player-walk.png', {
      frameWidth: 49,
      frameHeight: 49,
      margin: 1,
      spacing: 0
    });
    this.load.spritesheet('player', '/src/assets/player-sprites.png', {
      frameWidth: 49,
      frameHeight: 49,
      margin: 0,
      spacing: 0
    });

    this.load.image('enemyBullet', '/src/assets/bullet.png');
    this.load.image('bullet', '/src/assets/bullet2.png');
    this.load.image('arc', '/src/assets/bullet.png');
    this.load.image('dashLine', '/src/assets/dash-line.png');
    this.load.image('basicEnemy', '/src/assets/basic-enemy.png')
    this.load.image('enemyFighter', '/src/assets/enemy-fighter.png');
    this.load.spritesheet('weapon', '/src/assets/weapons.png', {
      frameWidth: 63,
      frameHeight: 63,
      margin: 0,
      spacing: 0
    });
    this.load.spritesheet('spark', '/src/assets/enemy-sparks.png', {
      frameWidth: 5,
      frameHeight: 5,
      margin: 0,
      spacing: 0
    });
    // this.load.spritesheet(key, url, frameConfig, xhrSettings);
    this.load.image('pistol', '/src/assets/pistol.png')
    this.load.image('cursor', '/src/assets/cursor.png')



  }

  create() {
    shotgun_sfx = this.sound.add('shotgun_sfx', {
      loop: false,
      volume: 0.5,
      allowMultiple: true
    });

    pistol_sfx = this.sound.add('pistol_sfx', {
      loop: false,
      volume: 0.5,
      allowMultiple: true
    });
    rifle_sfx = this.sound.add('rifle_sfx', {
      loop: false,
      volume: 0.5,
      allowMultiple: true
    });

    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("legs", { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
      frameRate: 12,
      repeat: -1
    })

    this.anims.create({
      key: "left-punch",
      frames: this.anims.generateFrameNumbers("player", { frames: [2, 1, 1, 0] }),
      frameRate: 8,
      repeat: 0
    })

    this.anims.create({
      key: "right-punch",
      frames: this.anims.generateFrameNumbers("player", { frames: [4, 3, 3, 0] }),
      frameRate: 8,
      repeat: 0
    })

    this.anims.create({
      key: "knockdown",
      frames: this.anims.generateFrameNumbers("player", { frames: [10, 11, 12, 12, 13, 14] }),
      frameRate: 20,
      repeat: 0
    })


    player = this.physics.add.sprite(0, 0, 'player');
    player.setCollideWorldBounds(false);  // Stop player from moving out of bounds
    player.setDamping(true);
    player.setDrag(0.2);  // Simulates space friction
    player.setMaxVelocity(maxVelocity);
    player.setBounce(1.3)
    player.setPosition(0, 0)
    player.setAlpha(0)
    //player.body.setCircle((player.body.width*1.3)/2);
    const camera = this.cameras.main;
    //camera.postFX.addPixelate(1);

    let width = this.cameras.main.width;
    let height = this.cameras.main.height;


    //this.cameras.main.centerOn(width / 2, height / 2);
    //this.cameras.main.startFollow(player);
    cursor = this.physics.add.sprite(0, 0, 'cursor');
    cursor.setTintFill(0xffffff);
    cursor.setDepth(3)
    cursor.x = 0
    cursor.y = 10
    cursor.setAlpha(0)
    // Add a title or logo to the menu
    this.add.text(0, -200, 'Main Menu', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

    // Add a "Start Game" button
    let startButton = this.add.text(0, -100, 'Start Game', { fontSize: '32px', fill: '#fff' })
      .setOrigin(0.5)
      .setInteractive()  // Make the text interactive (clickable)
      .on('pointerdown', () => this.scene.start('MainGameScene'));  // On click, start the game scene

    let debugButton = this.add.text(0, 0, 'Toggle Debug: ' + MainMenuScene.debug, { fontSize: '32px', fill: '#fff' })
      .setOrigin(0.5)
      .setInteractive()  // Make the text interactive (clickable)
      .on('pointerdown', () => {
        MainMenuScene.debug = !MainMenuScene.debug
        this.scene.restart()
      });  // On click, start the game scene

    let musicButton = this.add.text(0, 100, 'Toggle Music: ' + MainMenuScene.music, { fontSize: '32px', fill: '#fff' })
      .setOrigin(0.5)
      .setInteractive()  // Make the text interactive (clickable)
      .on('pointerdown', () => {
        if (MainMenuScene.music == 0.5) {
          MainMenuScene.music = 0
        } else {
          MainMenuScene.music = 0.5
        }

        this.scene.restart()
      });  // On click, start the game scene

    this.input.on(`pointermove`, (pointer) => {
      cursorMoving = true

      player.setRotation(angleToPointer + Math.PI / 2);

      let cursorToPointer = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, cursor.x, cursor.y);

      //cursor.setAlpha((cursorToPointer-50)/70)


    })
    dashLines = this.physics.add.group({
      classType: dashLine,
      maxSize: 100, // Adjust the max size as needed
      runChildUpdate: true,
    });

  }

  update(time, delta) {
    spawndashLine()
    const pointer = this.input.mousePointer;
    let pointerX = pointer.worldX / 6;
    let pointerY = pointer.worldY / 6;
    let midX = (player.x + pointerX) / 2;
    let midY = (player.y + pointerY) / 2;

    const camera = this.cameras.main;
    camera.scrollX = Phaser.Math.Linear(camera.scrollX, midX - camera.width / 2, 1);
    camera.scrollY = Phaser.Math.Linear(camera.scrollY, midY - camera.height / 2, 1);
  }

  openSettings() {
    // You can navigate to a settings scene or show settings here
    console.log('Opening settings...');
  }
}

export class MainGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainGameScene' });
  }

  preload() {
  }

  create() {

    banishing = this.sound.add('banishing', {
      loop: true,
      volume: 0.5,
      allowMultiple: true
    });

    banishing.play()


    //this.cameras.main.postFX.addPixelate(2);
    //this.cameras.main.postFX.addBokeh(0,1,0);
    const cursorWidth = 40
    const cursorHeight = 40

    angleToPointer = 0

    this.input.setDefaultCursor(`url(/src/assets/cursor.png) ${cursorWidth / 2} ${cursorHeight / 2}, pointer`);

    player.setAlpha(1)
    legs = this.physics.add.sprite(0, 0, "player")
    legs.setDepth(0)
    player = this.physics.add.sprite(0, 0, 'player');
    player.setDepth(1)

    this.background = this.add.tileSprite(-1000, -1000, 5000, 5000, 'background');
    this.background.setOrigin(0, 0);


    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player", { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
      frameRate: 15,
      repeat: -1
    })

    player.setCollideWorldBounds(false);  // Stop player from moving out of bounds
    player.setDamping(true);
    player.setDrag(0.0001);  // Simulates space friction
    player.setMaxVelocity(maxVelocity);
    player.setBounce(1.3)
    player.x = 0
    player.y = 0
    player.body.setCircle(12);
    player.body.setOffset(player.width / 2 - 12, player.height / 2 - 12)
    player.setScale(3)

    legs = this.physics.add.sprite(0, 0, "player")

    legs.setCollideWorldBounds(false);  // Stop player from moving out of bounds
    legs.setDamping(true);
    legs.setDrag(0.0001);  // Simulates space friction
    legs.setMaxVelocity(maxVelocity);
    legs.setBounce(1.3)
    legs.x = 0
    legs.y = 0
    legs.setScale(3)

    meleeHitbox = this.physics.add.sprite(player.x, player.y, null);
    meleeHitbox.body.setCircle(30);
    meleeHitbox.body.setOffset(meleeHitbox.width / 2 - 30, meleeHitbox.height / 2 - 30)
    meleeHitbox.setCollideWorldBounds(false);  // Stop player from moving out of bounds
    meleeHitbox.setDamping(false);
    meleeHitbox.setDrag(0);  // Simulates space friction
    meleeHitbox.setMaxVelocity(maxVelocity);
    meleeHitbox.setBounce(1.3)
    meleeHitbox.setVisible(false); // Invisible
    meleeHitbox.setActive(false)
    meleeHitbox.body.checkCollision.none = true;

    cursor = this.physics.add.sprite(0, 0, 'cursor');
    cursor.setTintFill(0xffffff);
    cursor.setDepth(3)
    cursor.setAlpha(0)


    bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 800, // Adjust the max size as needed
      runChildUpdate: true
    });

    enemyBullets = this.physics.add.group({
      classType: EnemyBullet,
      maxSize: 800, // Adjust the max size as needed
      runChildUpdate: true
    });

    dashLines = this.physics.add.group({
      classType: dashLine,
      maxSize: 1000, // Adjust the max size as needed
      runChildUpdate: true,
    });

    sparks = this.physics.add.group({
      classType: Spark,
      maxSize: 1000, // Adjust the max size as needed
      runChildUpdate: true,
    });

    enemyFighters = this.physics.add.group({
      classType: EnemyFighter,
      maxSize: 30,
      runChildUpdate: true,
    });

    enemySights = this.physics.add.group({
      classType: EnemySight,
      maxSize: -1,
      runChildUpdate: true,
    });

    enemyPathScanners = this.physics.add.group({
      classType: EnemyPathScan,
      maxSize: -1,
      runChildUpdate: true,
    });

    walls = this.physics.add.group({
      classType: Wall,
      maxSize: 1000,
      runChildUpdate: true,
    });

    corpses = this.physics.add.group({
      classType: Corpse,
      maxSize: enemyFighters.maxSize*3,
      runChildUpdate: true,
    });

    weapons = this.physics.add.group({
      classType: Weapon,
      maxSize: 2000,
      runChildUpdate: true,
    });

    this.time.delayedCall(50, () => {
      console.log("Enemy Fighter Collisions Loaded!")
      enemyFighterCollision = this.physics.add.collider(enemyFighters, enemyFighters, function response(e1, e2) {
      });
    })


    this.time.delayedCall(50, () => {
      console.log("Player Weapon Picked Loaded!")
      obtainWeapon = this.physics.add.overlap(player, weapons, function collectWeapon(player, weaponObj) {
        if (weaponObj.selected == true) {
          obtainWeapon.active = false
          switch (weaponObj.id) {
            case 0:
              weapon.type = "pistol"
              weapon.ammo = 9
              weapon.firemode = "semi"
              player.setFrame(5)
              break;
            case 1:
              weapon.type = "shotgun"
              weapon.ammo = 5
              weapon.firemode = "semi"
              player.setFrame(7)
              break;
            case 2:
              weapon.type = "ar"
              weapon.ammo = 25
              weapon.firemode = "auto"
              weapon.firerate = 150
              player.setFrame(6)
              break;
            default:
              weapon.type = "none"
              weapon.ammo = 25
              weapon.firemode = "auto"
              weapon.firerate = 150
              player.setFrame(0)
              break;
          }
          setTimeout(() => {
            weaponObj.destroy()
            obtainWeapon.active = true
            return
          }, 50)
        } else { weaponObj.selected = false }
      })
    })


    this.time.delayedCall(50, () => {
      console.log("Enemy Bullet Damage Loaded!")
      bulletEnemyFighterOverlap = this.physics.add.overlap(enemyFighters, bullets, function hitEnemyFighter(enemy, bullet) {
        enemy.hit(bullet)

      })
    })


    this.time.delayedCall(50, () => {
      console.log("Player Bullet Damage Loaded!")
      playerEnemyBulletOverlap = this.physics.add.overlap(player, bullets, function hitEnemyFighter(player, bullet) {
        bullet.setActive(false)
        bullet.setVisible(false)
        bullet.body.checkCollision.none = true;
        player.setTintFill(0xff0051);
        legs.setTintFill(0xff0051);
        setTimeout(async () => {
          player.clearTint()
          legs.clearTint()
        }, 50);

      })
    })

    this.time.delayedCall(50, () => {
      console.log("Player Enemy Collisions Loaded!")
      playerEnemyFighterCollision = this.physics.add.collider(enemyFighters, player, function hitEnemyFighter(player, enemy) {
        enemy.hit(player)
      })
    })

    this.time.delayedCall(50, () => {
      console.log("Player Wall Collisions Loaded!")
      playerWallCollision = this.physics.add.collider(walls, player)
    })

    this.time.delayedCall(50, () => {
      console.log("Enemy Wall Overlap Loaded!")
      enemyWallCollision = this.physics.add.collider(walls, enemyFighters, function enemyWallOverlap(wall, enemy) {
        //enemy.divert(wall)
      })
    })

     this.time.delayedCall(50, () => {
      //console.log("10")
      enemyWallOverlap = this.physics.add.overlap(walls, enemyFighters, function enemyWallOverlap(wall, enemy) {
        //enemy.divert(wall)
      })
    })

    this.time.delayedCall(50, () => {
      console.log("Bullet Wall Collisions Loaded!")
      bulletWallOverlap = this.physics.add.overlap(walls, bullets, function hitEnemyFighter(wall, bullet) {
        bullet.setActive(false)
        bullet.setVisible(false)
        spawnSpark(bullet.x, bullet.y, bullet.rotation)
        bullet.body.checkCollision.none = true;
      })
    })

    this.time.delayedCall(50, () => {
      console.log("Sight Wall Detection Loaded!")
      enemyCollisionDetection = this.physics.add.overlap(enemySights, walls, function collisionDetection(sight, wall) {
        if (wall && wall != EnemyFighter) {
          sight.detection(wall)
          sight.scanner.setPosition(wall.x, wall.y)
        }
      })
    })

    this.time.delayedCall(50, () => {
      console.log("Wall Scan Detection Loaded!")
      enemyPathScanDetection = this.physics.add.overlap(enemyPathScanners, walls, function collisionDetection(sight, wall) {
        sight.detection(wall)
      })
    })

    

    this.time.delayedCall(50, () => {
      console.log("Sight Fighter Detection Loaded!")
      enemyShootSafety = this.physics.add.overlap(enemySights, enemyFighters, function collisionDetection(sight, enemy) {
        sight.detection(enemy)
      })
    })

    this.time.delayedCall(50, () => {
      console.log("Enemy Melee Collisions Loaded!")
      meleeHitboxEnemyFighterOverlap = this.physics.add.overlap(enemyFighters, meleeHitbox, function hitEnemyFighter(meleeHitbox, enemy) {
        try {
          //console.log(meleeHitbox.constructor.name);
          enemy.hit(meleeHitbox)
        }
        catch (e) {
          console.log(e)
        }
      })
    })

    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);


    this.time.addEvent({
      delay: weapon.firerate,
      loop: true,
      callback: () => {
        if (weapon.firemode == "auto" && shooting == true) {
          shootBullet(player.rotation);
        }
      }
    });

    // this.time.addEvent({
    //   delay: 100,
    //   loop: true,
    //   callback: () => {
    //     spawnWall()
    //   }
    // });

    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.input.keyboard.on('keydown-SHIFT', () => {
      player.setMaxVelocity(maxVelocity * 0.25);
      player.setMaxVelocity(maxVelocity);
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      console.log("DOWN")
      spaceDown = true
    })

    this.input.keyboard.on('keyup-SPACE', () => {
      console.log("UP")
      spaceDown = false
    })

    this.input.on('pointerdown', (pointer) => {

      shooting = true
      if (pointer.leftButtonDown() && weapon.firemode == "semi") {
        shootBullet(player.rotation);
      }
      if (pointer.leftButtonDown() && weapon.type == "none") {
        switch (meleeFrame) {
          case 0:
            if (player.anims.currentAnim?.key !== 'left-punch') {
              meleeHitbox.body.checkCollision.none = false
              meleeComplete = false
              player.setFrame(0)
              player.play("left-punch", true)
              meleeFrame = 1
            }
            break
          case 1:
            if (player.anims.currentAnim?.key !== 'right-punch') {
              meleeHitbox.body.checkCollision.none = false
              meleeComplete = false
              player.setFrame(0)
              player.play("right-punch", true)
              meleeFrame = 0
            }
            break
        }
      }

    });

    player.on('animationcomplete', (animation, frame) => {
      if (animation.key != "left-punch" && animation.key != "right-punch" && weapon.type != "none") {
        setWeapon(weapon.type)
        meleeHitbox.body.checkCollision.none = true;
      } else if (animation.key == "left-punch" || animation.key == "right-punch") {
        console.log(animation.key)
        setWeapon(weapon.type)
        meleeHitbox.body.checkCollision.none = true;
      }
    });

    this.input.on(`pointermove`, (pointer) => {
      cursorMoving = true

      player.setRotation(angleToPointer + Math.PI / 2);

      let cursorToPointer = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, cursor.x, cursor.y);

      if (frames >= 100) {
        cursor.setAlpha((cursorToPointer - 50) / 70)
      }


    })

    this.input.on('pointerup', (pointer) => {
      if (weapon.type != "none") {
        setWeapon(weapon.type)
      }
      if (!pointer.leftButtonDown()) {
      //   if (weapon.type == "pistol") {
      //   shootBullet(player.rotation); 
      // }
        shooting = false
      }
      if (!pointer.leftButtonDown() && weapon.type == "none") {

        //console.log("UP")
      }
    });

    if (this.input.gamepad) {
      // No gamepads connected yet, so we wait for one to be connected
      this.input.gamepad.once('connected', this.onGamepadConnected, this);
      this.onGamepadConnected(this.input.gamepad.pad1);
    }

  }

  update(time, delta) {
    //frames = frames + (Math.ceil(time/100000))
    frames++
    //console.log(delta)

    if (player.anims.isPlaying) {
      //console.log(player.anims.currentAnim?.key)
      meleeHitbox.setActive(true)
      meleeHitbox.x = meleeHitbox.x + 1
      meleeHitbox.y = meleeHitbox.y + 1

    } else if (!player.anims.isPlaying) {
      meleeHitbox.setActive(false)
    }



    if (delta > 10) {
      this.physics.world.smoothStep = false;  // Disable smoothStep
    } else {
      this.physics.world.smoothStep = true;   // Re-enable smoothStep if delta < 10ms
    }
    if (frames <= 100) {
      player.setAlpha(0)
    }
    else {
      player.setAlpha((frames - 100) / 100)
    }
    if (frames >= 50) {
      if (this.input.gamepad && this.input.gamepad.total > 0) {
        const gamepad = this.input.gamepad.getPad(0);
        if (gamepad) {
          this.handleGamepadInput(gamepad, delta);
        }
      }

      const pointer = this.input.mousePointer;
      let pointerX = pointer.worldX;
      let pointerY = pointer.worldY;
      mainCamera = this.cameras.main;

      let centerX
      let centerY
      centerX = (player.x * 1)
      centerY = (player.y * 1)

      nextPosition = { x: centerX - lastPosition.x, y: lastPosition.y - centerY }

      let cameraSmoothFactor = 0.08;
      if (moveToPointer) {
        player.setAcceleration(0);
      }

      let movementSmoothFactor = 1

      let targetX
      let targetY


      // Smoothly move the sprite towards the cursor's position
      if (cursorMoving) {
        cursorDistance = Phaser.Math.Distance.Between(player.x, player.y, cursor.x, cursor.y)
        targetX = Phaser.Math.Linear(cursor.x, pointer.worldX, movementSmoothFactor);
        targetY = Phaser.Math.Linear(cursor.y, pointer.worldY, movementSmoothFactor);
      }
      else {
        targetX = Phaser.Math.Linear(cursor.x, getFacingPosition(player, cursorDistance).x, movementSmoothFactor);
        targetY = Phaser.Math.Linear(cursor.y, getFacingPosition(player, cursorDistance).y, movementSmoothFactor);

      }


      // Calculate the distance from the center point
      var distance = Phaser.Math.Distance.Between(centerX, centerY, targetX, targetY);

      // If the distance is greater than the allowed radius, clamp the position
      if (distance > maxRadius) {
        // Get the angle from the center to the target
        var angle = Phaser.Math.Angle.Between(centerX, centerY, targetX, targetY);

        // Calculate the clamped position along the circle's edge
        targetX = centerX + Math.cos(angle) * (maxRadius);
        targetY = centerY + Math.sin(angle) * (maxRadius);


      }

      if (distance > 0) {

        const absDiff = Math.abs(Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(player.rotation), Phaser.Math.RadToDeg(legs.rotation))); // Absolute difference
        const scale = 1 - (absDiff / 180); // value between 0 and 1

        var angle = Phaser.Math.Angle.Between(centerX, centerY, targetX, targetY);

        meleeX = centerX + Math.cos(angle) * (30 + (40 * scale));
        meleeY = centerY + Math.sin(angle) * (30 + (40 * scale));
      }

      let midX = (player.x + cursor.x) / 2;
      let midY = (player.y + cursor.y) / 2;

      cursor.x = targetX
      cursor.y = targetY
      meleeHitbox.x = meleeX
      meleeHitbox.y = meleeY

      if (cursorMoving == true) {
        angleToPointer = Phaser.Math.Angle.Between(player.x, player.y, cursor.x, cursor.y);
        cursor.x = targetX
        cursor.y = targetY
      }
      else {
        cursor.x = Phaser.Math.Clamp(targetX, player.x - cursorDistance, player.x + cursorDistance)
        cursor.y = Phaser.Math.Clamp(targetY, player.y - cursorDistance, player.y + cursorDistance)
      }

      mainCamera.scrollX = Phaser.Math.Linear(mainCamera.scrollX, midX - mainCamera.width / 2, cameraSmoothFactor);
      mainCamera.scrollY = Phaser.Math.Linear(mainCamera.scrollY, midY - mainCamera.height / 2, cameraSmoothFactor);

      cursorMoving = false

      let direction = new Phaser.Math.Vector2(0, 0);

      if (this.w.isDown) direction.y -= 1
      else direction.y -= 0
      if (this.s.isDown) direction.y += 1
      else direction.y -= 0
      if (this.a.isDown) direction.x -= 1
      else direction.x -= 0
      if (this.d.isDown) direction.x += 1
      else direction.x -= 0

      legs.x = player.x
      legs.y = player.y

      if (direction.lengthSq() > 0) {
        direction.normalize();
      }

      if (this.w.isDown || this.a.isDown || this.s.isDown || this.d.isDown) {
        legs.play("walk", true)
        player_acceleration = 10000 + upgrade.acceleration
        moveToPointer = true

        const vx = player.body.velocity.x;
        const vy = player.body.velocity.y;

        if (vx !== 0 || vy !== 0) {
          legs.rotation = Math.atan2(vy, vx) + Phaser.Math.DegToRad(90);
        }

        player.body.acceleration.x = direction.x * player_acceleration;
        player.body.acceleration.y = direction.y * player_acceleration;

      }
      else {
        legs.play("walk", false)
        legs.setFrame(11)
        player.body.setAcceleration(0, 0);
        legs.body.setAcceleration(0, 0);
      }

      const velocity = (Math.abs(player.body.velocity.x) + Math.abs(player.body.velocity.y))
      if (frames >= 0) {
        spawndashLine(player.rotation / 2 + - Math.PI / 2)
        if (frames % 5 == 0) {
          spawnWall()
        }

      }
      if (frames % spawnRate == 0 && frames >= 500) { getEnemy() }

    }

  }


}
// Game configuration
export const config = {
  type: Phaser.WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {

      fixedStep: false,
      fps: 144,          // Sets the physics update rate to 60 FPS
      timeStep: 1 / 144,  // Defines the fixed timestep as 1/60 seconds (60Hz)
      debug: false   // Enable this to visualize physics objects (optional)
    }
  },
  fps: {
    smoothstep: true,
    target: 144,
    forceSetTimeOut: true,
  },
  render: {
    antialias: true,       // Enable anti-aliasing
    antialiasGL: true      // For WebGL rendering
  },
  pixelArt: true,
  scene: [MainMenuScene, MainGameScene]
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

export let player;
export let weapon = {
  type: "none",
  firemode: "semi",
  firerate: 90,
  ammo: 4,
}

export let upgrade = {
  spread: 0,
  firerate: 40,
  speed: 0,
  acceleration: 0,
  damage: 1,
  health: 0,
  range: 0.02,
  vision: 50,
  bulletspeed: 0,
}

let meleeFrame = 0
let meleeComplete = true
let meleeHitbox
let meleeX
let meleeY

export let enemyFighterCollision
export let enemyWallOverlap
export let playerEnemyFighterCollision
export let bulletEnemyFighterOverlap
export let playerEnemyBulletOverlap
export let meleeHitboxEnemyFighterOverlap
export let enemyPathScanDetection
export let enemyLegs
export let corpses
export let bullets
export let frames = 0
export let mainCamera
export let cursor;
export let spaceDown = false
export let enemySights
export let enemyPathScanners
let sparks

let enemyCollisionDetection
let enemyShootSafety
let bulletWallOverlap
let playerWallCollision
let enemyWallCollision
let walls
let banishing
let obtainWeapon



let angleToPointer
let cursorDistance
let legs
let pad;
let xAxis
let yAxis
var maxRadius = 1000
let lastPosition = { x: 0, y: 0 }
let nextPosition = { x: 0, y: 0 }
let cursorMoving
let weapons
let dashLines;
let enemyFighters
let pistol_sfx
let shotgun_sfx
let rifle_sfx
let worldBounds = { width: 10000, height: 10000 };  // Large world size
let moveToPointer = false;
let shooting = false
let player_acceleration = 0
let player_speed = 1800

let maxVelocity = 700 + upgrade.speed
let enemyBullets
let spawnRate = 100

function getFacingPosition(player, distance) {

  // Calculate the new position 100 units in front of the player based on rotation
  let facingX = player.x + Math.cos(angleToPointer) * distance;
  let facingY = player.y + Math.sin(angleToPointer) * distance;

  // Return the calculated coordinates
  return { x: facingX, y: facingY };
}

function getEnemy() {
  let random = Phaser.Math.Between(1, 10);
  switch (random) {
    case 1:
      spawnEnemyFighter()
      break
    case 2:
      spawnEnemyFighter()
      break
    case 3:
      spawnEnemyFighter()
      break
    case 4:
      spawnEnemyFighter()
      break

    default:
      spawnEnemyFighter()
      break
  }


}

function spawnEnemyFighter() {
  let radius = 200;
  let enemyX
  let enemyY
  let angle
  let offsetX
  let offsetY
  let posX
  let posY
  let reroll = Phaser.Math.Between(0, 5)

  let enemy = enemyFighters.getFirstDead(player.x, player.y)

  if (enemy) {
    enemy.spawn(player.x, player.y, 2000)
    enemyX = enemy.x
    enemyY = enemy.y

  }
  while (reroll >= 2) {
    angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    offsetX = radius * Math.cos(angle);
    offsetY = radius * Math.sin(angle);
    posX = enemyX + offsetX;
    posY = enemyY + offsetY;
    enemy = enemyFighters.get(player.x, player.y)

    if (enemy) {
      enemy.spawn(posX, posY, radius)
    }
    reroll = Phaser.Math.Between(0, 5)
  }

}

export function spawnEnemySight(enemy) {
  let sight = enemySights.getFirstDead(enemy.x, enemy.y)
  // if (sight) {
  //   //console.log(enemy.sight)
  //   sight.spawn(enemy, 270)
  // }
}

function spawndashLine() {
  const dashLine = dashLines.get(player.x, player.y)
  if (dashLine) {
    dashLine.spawn(player.rotation / 2 + - Math.PI / 2)
  }
}

function spawnWall() {
  const wall = walls.get(1000, 1000)
  const x = 200 * (Phaser.Math.Between(player.x - 200, player.x + 200))
  const y = 200 * (Phaser.Math.Between(player.y - 200, player.y + 200))
  const w = 5000
  const roll = Phaser.Math.Between(0, 3)
  const loop = Phaser.Math.Between(0, 10)

  if (wall) {
    wall.spawn(x, y, 200, 200)
  }
  if (loop <= 10) {
    recursiveSpawnWall(x, y, loop, roll)
  }

}

async function recursiveSpawnWall(x, y, loop, roll) {
  const wall = await walls.get(x, y)
  const axis = Phaser.Math.Between(0, 1)
  //const roll = Phaser.Math.Between(0, 3)
  loop = Phaser.Math.Between(0, 20)
  const gap = 66

  if (wall) {
    switch (roll) {
      case 0:
        x += gap
        break
      case 1:
        y += gap
        break
      case 2:
        x += gap
        break
      case 3:
        y += gap
        break
    }
    wall.spawn(x, y, 200, 200)
  }

  if (loop <= 14) {
    recursiveSpawnWall(x, y, loop, roll)
  } else if (loop <= 19) {
    recursiveSpawnWall(gap * Phaser.Math.Between(-65, 65), gap * Phaser.Math.Between(-65, 65), loop, roll)
  }
}

function setWeapon(id) {
  console.log(id)
  switch (id) {
    case "pistol":
      player.setFrame(5)
      break;
    case "ar":
      player.setFrame(6)
      break;
    case "shotgun":
      player.setFrame(7)
      break;
    default:
      player.setFrame(0)
      break;
  }
}

function shootBullet(rotation) {
  let random = Phaser.Math.Between(-100, 100);

  switch (weapon.type) {
    case "pistol":
      if (weapon.ammo > 0) {
        const bullet = bullets.get(player.x, player.y);
        pistol_sfx.play()
        bullet.fire(rotation, player.x, player.y, 4000, 4500, 0.02, 0.04, 100, false);

        mainCamera.shake(100, 0.002);
        weapon.ammo++

        pistol_sfx.setDetune(random);
      }
      break
    case "shotgun":
      if (weapon.ammo > 0) {
        for (let i = 0; i <= 12; i++) {
          const bullet = bullets.get(player.x, player.y);
          mainCamera.shake(100, 0.004);
          shotgun_sfx.play()
          bullet.fire(rotation, player.x, player.y, 2000, 4000, 0.07, 0.2, 80, false);
          weapon.ammo++

          shotgun_sfx.setDetune(random);
        }
      }
      break
    case "ar":
      if (weapon.ammo > 0) {
        if (weapon.ammo > 0) {
          const bullet = bullets.get(player.x, player.y);
          mainCamera.shake(50, 0.003);
          rifle_sfx.play()
          bullet.fire(rotation, player.x, player.y, 5000, 5500, 0.07, 0.09, 80, false);
          weapon.ammo++

          rifle_sfx.setDetune(random);
        }
      }
      break
    default:
      console.log(weapon.type)
      break
  }
}

export function enemyShoot(enemy, weapon, rotation, sound) {
  let random = Phaser.Math.Between(-100, 100);
  let bullet
  switch (weapon) {
    case 1:
      sound.play()
      bullet = bullets.get(player.x, player.y);
      bullet.fire(rotation, enemy.x, enemy.y, 4000, 4500, 0.07, 0.09, 100, true);
      pistol_sfx.setDetune(random);

      break
    case 2:
      for (let i = 0; i <= 12; i++) {
        sound.play()
        bullet = bullets.get(player.x, player.y);
        bullet.fire(rotation, enemy.x, enemy.y, 2000, 4000, 0.04, 0.2, 80, true);
        shotgun_sfx.setDetune(random);
      }
      break
    case 3:
      sound.play()
      bullet = bullets.get(player.x, player.y);
      bullet.fire(rotation, enemy.x, enemy.y, 5000, 5500, 0.07, 0.09, 80, true);
      rifle_sfx.setDetune(random);
      break
    default:
      break
  }
  // //var effect = enemy.postFX.addShine(1, 1, 3, true);
  // //enemy.effect.active = true

  // setTimeout(() => {
  //   enemy.effect.setActive(false)
  // }, 100)

}

export function spawnWeapon(x, y) {
  let roll = Phaser.Math.Between(1, 10)
  if (roll <= 1) {
    const weapon = weapons.get(player.x, player.y);
    if (weapon) {
      weapon.spawn(x, y)
    }
  }

}
export function spawnSpark(x, y, r) {
  let spark = sparks.get(x, y);
  let loop = Phaser.Math.Between(0, 10)

  do {
    if (spark) {
      spark.spawn(x, y, r)
    }
    loop = Phaser.Math.Between(0, 100)
    spark = sparks.get(x, y);
  } while (loop >= 3)

}

export function spawnCorpse(x, y, r, vx, vy) {
  const corpse = corpses.get(player.x, player.y);
  if (corpse) {
    corpse.spawn(x, y, r, vx, vy)
  }
}


