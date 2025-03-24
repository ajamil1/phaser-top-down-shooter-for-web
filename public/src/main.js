import './style.css';
import Phaser from 'phaser';

// Define the Bullet class first

class MainMenuScene extends Phaser.Scene {
  constructor() {
      super({ key: 'MainMenuScene' });  // Unique key for this scene
  }

  preload() {

    this.load.glsl('bloom', '/src/assets/shaders/shader0.frag');
    this.load.glsl('pixelate', '/src/assets/shaders/pixelate.frag');
    this.load.image('background', '/src/assets/tiled-bg.png');
    this.load.image('playerShip', '/src/assets/player.png');
    this.load.image('enemyBullet', '/src/assets/bullet.png'); 
    this.load.image('bullet', '/src/assets/bullet.png'); 
    this.load.image('dashLine', '/src/assets/dash-line.png');
    this.load.image('basicEnemy', '/src/assets/basic-enemy.png')
    this.load.image('enemyFighter', '/src/assets/enemy-fighter.png');
    this.load.image('upgrade', '/src/assets/upgrade-base.png')
    this.load.image('cursor', '/src/assets/cursor.png')
    
  }

  create() {
    player = this.physics.add.sprite(0, 0, 'playerShip');
      player.setCollideWorldBounds(false);  // Stop player from moving out of bounds
      player.setDamping(true);
      player.setDrag(0.2 );  // Simulates space friction
      player.setMaxVelocity(maxVelocity);
      player.setBounce(1.3)
      player.setPosition(0,0)
      player.setAlpha(0)
      player.body.setCircle((player.body.width*1.3)/2);
    const camera = this.cameras.main;

    let width = this.cameras.main.width;
        let height = this.cameras.main.height;


        //this.cameras.main.centerOn(width / 2, height / 2);
        //this.cameras.main.startFollow(player);
        cursor = this.physics.add.sprite(0, 0, 'cursor');
        cursor.setTintFill(0xffffff);
        cursor.setDepth(3)
        cursor.x=0
        cursor.y = 10
        cursor.setAlpha(0)
      // Add a title or logo to the menu
      this.add.text(0, -200, 'Main Menu', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

      // Add a "Start Game" button
      let startButton = this.add.text(0, -100, 'Start Game', { fontSize: '32px', fill: '#fff' })
          .setOrigin(0.5)
          .setInteractive()  // Make the text interactive (clickable)
          .on('pointerdown', () => this.scene.start('MainGameScene'));  // On click, start the game scene

      // Optionally, you can add more buttons, e.g., "Settings" or "Exit"
      // let settingsButton = this.add.text(0, 0, 'Settings', { fontSize: '32px', fill: '#fff' })
      //     .setOrigin(0.5)
      //     .setInteractive()
      //     .on('pointerdown', () => this.openSettings());

      // let exitButton = this.add.text(0, 100, 'Exit Game', { fontSize: '32px', fill: '#fff' })
      //     .setOrigin(0.5)
      //     .setInteractive()
      //     .on('pointerdown', () => {
      //         console.log('Exit Game'); // You can't actually exit the browser, but this could quit an app
      //     });

          this.input.on(`pointermove`, (pointer) => {
            cursorMoving = true
            
            player.setRotation(angleToPointer + Math.PI / 2);
        
            let cursorToPointer = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, cursor.x, cursor.y);
        
            //cursor.setAlpha((cursorToPointer-50)/70)
            
            
          })
          dashLines = this.physics.add.group({
            classType: dashLine,
            maxSize: 1000, // Adjust the max size as needed
            runChildUpdate: true,
          });
  }

  update(time, delta) {
    spawndashLine()
    const pointer = this.input.mousePointer;
      let pointerX = pointer.worldX/6;
      let pointerY = pointer.worldY/6;
    let midX = (player.x + pointerX) / 2;
      let midY = (player.y + pointerY) / 2;
    
      const camera = this.cameras.main;
      camera.scrollX = Phaser.Math.Linear(camera.scrollX, midX - camera.width / 2, 0.1);
      camera.scrollY = Phaser.Math.Linear(camera.scrollY, midY - camera.height / 2, 0.1);
  }

  openSettings() {
      // You can navigate to a settings scene or show settings here
      console.log('Opening settings...');
  }
}

class MainGameScene extends Phaser.Scene {
  constructor() {
      super({ key: 'MainGameScene' });
  }

  preload() {
  }

  create() {
      // Main game setup
     
        //this.add.text(400, 300, 'Main Game', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        const cursorWidth = 40
      const cursorHeight = 40

      angleToPointer = 0
    
      this.input.setDefaultCursor(`url(/src/assets/cursor.png) ${cursorWidth/2} ${cursorHeight/2}, pointer`);
    
      player.setAlpha(1)
      // Create player ship
      player = this.physics.add.sprite(0, 0, 'playerShip');
      player.setCollideWorldBounds(false);  // Stop player from moving out of bounds
      player.setDamping(true);
      player.setDrag(0.2 );  // Simulates space friction
      player.setMaxVelocity(maxVelocity);
      player.setBounce(1.3)
      player.x = 0
      player.y = 0
      player.body.setCircle((player.body.width*1.3)/2);


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

      arcs = this.physics.add.group({
        classType: Arc,
        maxSize: 1600, // Adjust the max size as needed
        runChildUpdate: true
      });
    
      dashLines = this.physics.add.group({
        classType: dashLine,
        maxSize: 1000, // Adjust the max size as needed
        runChildUpdate: true,
      });
    
      basicEnemies = this.physics.add.group({
        classType: BasicEnemy,
        maxSize: 200,
        runChildUpdate: true,
      });

      enemyFighters =  this.physics.add.group({
        classType: EnemyFighter,
        maxSize: 200,
        runChildUpdate: true,
      });
    
      upgrades = this.physics.add.group({
        classType: Upgrade,
        maxSize: 2000,
        runChildUpdate: true,
      });
    
      cursor = this.physics.add.sprite(0, 0, 'cursor');
      cursor.setTintFill(0xffffff);
      cursor.setDepth(3)
      cursor.setAlpha(0)

    basicEnemyCollision = this.physics.add.collider(basicEnemies, basicEnemies, function response (e1, e2) {
      if(e1.scale> e2.scale) {e1.hit(e2)} 
      else {e2.hit(e1)}
    });

    enemyFighterCollision = this.physics.add.collider(enemyFighters, enemyFighters, function response (e1, e2) {
    });

    let upgradePlayer = this.physics.add.overlap(player, upgrades, function collectUpgrade(player, upgradeObj) {
      let power = Math.floor(upgradeObj.power)
      upgradePlayer.active = false
      //console.log(upgrade)
      switch(upgradeObj.id){
        case 0:
          upgrade.spread = upgrade.spread + (0.05*power)
          break;
        case 1:
          upgrade.firerate = Phaser.Math.Clamp(upgrade.firerate - (1*power), 10, 40)
          break;
        case 2:
          if (maxVelocity <= 1800) {
            upgrade.speed = upgrade.speed + (50*power);
            maxVelocity =  Phaser.Math.Clamp(maxVelocity + upgrade.speed, 0, 1800)
            player.setMaxVelocity(maxVelocity);
          }
          break;
        case 3:
            upgrade.acceleration = Phaser.Math.Clamp(upgrade.acceleration + (100*power), 0, 5000)
          break;
        case 4:
          upgrade.damage = upgrade.damage + (0.05*power)
          break;
        case 5:
          upgrade.health = upgrade.health + (1*power)
          break;
        case 6:
            upgrade.range =  Phaser.Math.Clamp(upgrade.range - (0.005*power),0.005, 1 )
          
          break;
        case 7: 
          upgrade.vision = upgrade.vision + (10*power)
          maxRadius = maxRadius + upgrade.vision
          break;
          case 8: 
          upgrade.bulletspeed= Phaser.Math.Clamp(upgrade.bulletspeed + (50*power), 0, 1000)
        default:
          break;
      }
    
      setTimeout(() => {
        upgradeObj.destroy()
        upgradePlayer.active = true
      return
      },50)
    })
    
    bulletBasicEnemyOverlap = this.physics.add.overlap(basicEnemies, bullets, function hitBasicEnemy(enemy, bullet) {
      console.log("COLLISION: enemy + bullet")
      enemy.hit(bullet)
    })

    bulletEnemyFighterOverlap = this.physics.add.overlap(enemyFighters, bullets, function hitEnemyFighter(enemy, bullet) {
      console.log("COLLISION: enemy + bullet")
      enemy.hit(bullet)
    })
    
    arcBasicEnemyOverlap = this.physics.add.overlap(basicEnemies, arcs, function hitBasicEnemy(enemy, arc) {
      console.log("COLLISION: enemy + arc")
      enemy.hit(arc)
    })
    
    playerBasicEnemyCollision = this.physics.add.collider(basicEnemies, player, function hitBasicEnemy(player, enemy) {
      console.log("COLLISION: player + enemy")
      enemy.hit(player)
    })

    basicEnemyFighterCollision = this.physics.add.collider(basicEnemies, enemyFighters)

    playerEnemyBulletOverlap = this.physics.add.overlap(enemyBullets, player, function hitPlayer(player, bullet) {
      console.log("COLLISION: player. + bullet")
      bullet.hit()
    })

    playerEnemyFighterCollision = this.physics.add.collider(enemyFighters, player, function hitEnemyFighter(player, enemy) {
      console.log("COLLISION: player + enemy")
      enemy.hit(player)
    })

      this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
      this.input.on('pointerdown', (pointer) => {
        if (pointer.leftButtonDown()) {
          shooting = true
          shootBullet.call(this);
        }
      });
    
      this.input.on(`pointermove`, (pointer) => {
        cursorMoving = true
        
        player.setRotation(angleToPointer + Math.PI / 2);
    
        let cursorToPointer = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, cursor.x, cursor.y);
    
        if (frames >= 100) {
          cursor.setAlpha((cursorToPointer-50)/70)
        }
        
        
      })
    
      this.input.on('pointerup', (pointer) => {
        if (!pointer.leftButtonDown()) {
          shooting = false
          //frames = 15
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
    if (delta > 10) {
      this.physics.world.smoothStep = false;  // Disable smoothStep
  } else {
      this.physics.world.smoothStep = true;   // Re-enable smoothStep if delta < 10ms
  }
    if (frames <= 100) {
      player.setAlpha(0)
    }
    else {
      player.setAlpha((frames-100)/100)
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
      const camera = this.cameras.main;
      let centerX
      let centerY
      centerX = (player.x * 1)
      centerY = (player.y * 1)
    
      nextPosition = {x: centerX - lastPosition.x, y: lastPosition.y - centerY}
    
      let cameraSmoothFactor = 0.08;
      if (moveToPointer) {
        player.setAcceleration(0);
      }
      
      let movementSmoothFactor = 1
    
      let targetX
      let targetY
      
      
      // Smoothly move the sprite towards the cursor's position
      if (cursorMoving){
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
    
      let midX = (player.x + cursor.x) / 2;
      let midY = (player.y + cursor.y) / 2;
    
      cursor.x = targetX
      cursor.y = targetY
    
      if (cursorMoving == true) {
        angleToPointer = Phaser.Math.Angle.Between(player.x, player.y, cursor.x, cursor.y);
        cursor.x = targetX
        cursor.y = targetY
      }
      else {
        cursor.x = Phaser.Math.Clamp(targetX, player.x-cursorDistance, player.x+cursorDistance)
        cursor.y = Phaser.Math.Clamp(targetY, player.y-cursorDistance, player.y+cursorDistance)
      }
    
      camera.scrollX = Phaser.Math.Linear(camera.scrollX, midX - camera.width / 2, cameraSmoothFactor);
      camera.scrollY = Phaser.Math.Linear(camera.scrollY, midY - camera.height / 2, cameraSmoothFactor);
    
      cursorMoving = false
    
      if (this.spacebar.isDown) {
        
        player_acceleration = 900 + upgrade.acceleration
        //player_speed = 38000
        moveToPointer = true
        this.physics.velocityFromRotation(angleToPointer, player_acceleration, player.body.acceleration);
      }
    
      if (!this.spacebar.isDown) {
        player_acceleration = 0
        moveToPointer = true;
        this.physics.velocityFromRotation(angleToPointer, player_acceleration, player.body.acceleration);
    
      // Cap the velocity to a maximum speed (gradual stop when released)
      const currentSpeed = Phaser.Math.Distance.Between(0, 0, player.body.velocity.x, player.body.velocity.y);
      if (currentSpeed > player_speed) {
        player.body.velocity.scale(player_speed / currentSpeed); // Scale velocity to player_speed
      }
      } else {
        moveToPointer = false;
      }
    
      if (shooting == true && player.rotation) {
          shootBullet(player.rotation)  
      }
      const velocity = (Math.abs(player.body.velocity.x)+Math.abs(player.body.velocity.y))
      if(frames >= 300){
        spawndashLine(player.rotation/2 + - Math.PI / 2)
      }
      if (frames % spawnRate == 0 && frames >= 3000) {getEnemy()}
      
    }
    
    }
    
   
  }

class dashLine extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y) {
    super(scene, x, y, 'dashLine');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.spawnTimer = 3500;
    this.spawnInterval = 4000;
  }

  spawn(rotation) {
    this.setAlpha(0)
    this.setActive(true);
    this.setVisible(false);

  // Generate random x and y coordinates within the screen size
  const randomX = Phaser.Math.Between(Phaser.Math.Between(player.x-1500, player.x-1250), Phaser.Math.Between(player.x+1250, player.x+1500));
      const randomY = Phaser.Math.Between(Phaser.Math.Between(player.y-1500, player.y-1250), Phaser.Math.Between(player.y+1250, player.y+1500));
      this.setPosition(randomX, randomY);

    const angle = player.rotation/2 + - Math.PI / 2;

    this.setRotation(angle);  
  }
    // Set bullet position
    //this.setPosition(posX, posY);
    
  update(time, delta) {

    const deltaTime = delta / 1000;

    // Update the spawn timer
    this.spawnTimer += delta;

    // Spawn only if the timer exceeds the interval
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0; // Reset timer
      this.spawn(); // Spawn a new item
    }
    const cameraVelocityX = this.scene.cameras.main.scrollX - this.prevCameraX;
    const cameraVelocityY = this.scene.cameras.main.scrollY - this.prevCameraY;

    // Calculate the camera velocity
    const cameraVelocity = Math.sqrt(cameraVelocityX * cameraVelocityX + cameraVelocityY * cameraVelocityY);

    // Store the camera's current position for the next frame
    this.prevCameraX = this.scene.cameras.main.scrollX;
    this.prevCameraY = this.scene.cameras.main.scrollY;

    const velocityX = player.body.velocity.x;
    const velocityY = player.body.velocity.y;
    const pos = Math.abs(Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y));
    if (pos > 1500) {         
      const randomX = Phaser.Math.Between(Phaser.Math.Between(player.x-1500, player.x-1250), Phaser.Math.Between(player.x+1250, player.x+1500));
      const randomY = Phaser.Math.Between(Phaser.Math.Between(player.y-1500, player.y-1250), Phaser.Math.Between(player.y+1250, player.y+1500));
      this.setPosition(randomX, randomY);
    }

    const velocity = (Math.abs(player.body.velocity.x)+Math.abs(player.body.velocity.y))
  
    const scaleX = Phaser.Math.Clamp(cameraVelocity / 10, 0.08, 2000);
    // Calculate the angle of movement in radians
    const angle = Math.atan2(cameraVelocityY, cameraVelocityX);
    //this.setAlpha((pos)/1500)
    this.setAlpha((1-(pos/1500)) * (1-((cameraVelocity)/35)))
    if (this.visible == false) {
      this.setVisible(true)
    }
    
    this.setActive(true)
    
    //this.setAlpha(1)
    this.setRotation(angle)
    this.setScale(scaleX/2,(1/2))
   

  }
}

class Upgrade extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y) {
    super(scene, x, y, 'upgrade');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.speed = 0
    this.power = 1
    this.lifespan =0
    this.id = Phaser.Math.Between(0,8);
  }


  tintColor() {
    let offensive = 0xff0000;
    let utility = 0x4a00ff;
    let defensive = 0x0cff00;
    let speed = 0x002eff;
    let range = 0xff7800
    switch(this.id) {
      case 0: // spread
        this.setTint(utility)
        break
      case 1: // firerate
        this.setTint(offensive)
        break;
      case 2: // speed
        this.setTint(speed)
        break
      case 3: // acceleration
        this.setTint(speed)
        break
      case 4: // damage
        this.setTint(offensive)
        break
      case 5: // health
        this.setTint(defensive)
        break
      case 6: // range
        this.setTint(range)
        break
      case 7: // vision
        this.setTint(range)
        break
      case 8: // bulletspeed
        this.setTint(utility)
        break
      default:
        this.setTint(0xed00ff)
        break
    }
    return
  }

  spawn(x,y,p){
    this.setScale(0.5 +(0.2 *(p)))
    this.body.setCircle(this.body.width/2);
    let scaleFactor = Phaser.Math.Clamp(this.scale*100, 0, 1);  // Clamp between 0 and 1

    this.tintColor();
    this.lifespan = 500
    this.power=p
    //this.angle = Phaser.Math.Between(0, 360);
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x,y)
    this.body.maxVelocity.set(2000)
  }
  update(time, delta){
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    
    this.setAlpha((this.lifespan)/500)
    this.lifespan--
    if (this.alpha <= 0) {
      this.setActive(false)
      this.setVisible(false);
    }

    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;

    // Optionally, you can add a check to stop movement when the enemy reaches the player
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance > 2000) {
        // Stop the enemy's movement when it's close enough to the player
        this.speed = 0;
    }
    else {this.speed+=0.1}
    
  }
}

class BasicEnemy extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y) {
    super(scene, x, y, 'basicEnemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.health=0
    this.speed=0
    this.power=1
    this.rotationSpeed = 0
    this.radius = 0
    this.birth = true
    this.death = false
    this.setBounce(2)
    this.setDamping(true);
    this.setDrag(0.2 );
    this.maxRotationSpeed = 100;
    this.angularAcceleration = 10;
    
  }

  async hit(that) {
    let object = that.constructor.name
    switch(object) {
      case "Bullet":
        if(that.visible == false) {
          return
         }
         that.setVisible(false)
        setTimeout(async () => {
          that.setActive(false)
          that.setVisible(false)
          that.body.checkCollision.none = true;
          this.health = this.health - that.damage
          if (this.health <= 0) {
            this.setTintFill(0xff0051);
             if (this.death == false) {
              await spawnUpgrade(this.x, this.y, this.power)
             }
             this.death = true
             
          }
          else {
            this.setTintFill(0xffffff);
          }
          bulletBasicEnemyOverlap.active=false
        },5);
        setTimeout(async () => { 
          if (this.health <= 0){
           //await this.spawn(player.x,player.y,8000)
           this.setActive(false)
           this.setVisible(false)
           this.body.checkCollision.none = true;
          }
          this.clearTint()
          bulletBasicEnemyOverlap.active=true
        }, 50);
        break;
      case "Arc":
        //console.log(object)
        if(that.visible == false) {
          return
         }
         that.setVisible(false)
        setTimeout(async () => {
          that.setActive(false)
          that.setVisible(false)
          that.body.checkCollision.none = true;
          this.health = this.health - that.damage
          if (this.health <= 0) {
            this.setTintFill(0xff0051);
             if (this.death == false) {
              await spawnUpgrade(this.x, this.y, this.power)
             }
             this.death = true
             
          }
          else {
            this.setTintFill(0xffffff);
          }
          arcBasicEnemyOverlap.active=false
        },5);
        setTimeout(async () => { 
          if (this.health <= 0){
           //await this.spawn(player.x,player.y,8000)
           this.setActive(false)
           this.setVisible(false)
           this.body.checkCollision.none = true;
          }
          this.clearTint()
          arcBasicEnemyOverlap.active=true
        }, 50);
        break;     
      case "BasicEnemy":
        basicEnemyCollision.active=false
      if(this.scale <= 7) {
        this.setScale(this.scale +(that.scale/20))
        this.health = this.health + that.health
        this.speed = 250*(1/this.scale);
      }
      that.health=0
      this.clearTint()
      that.clearTint()
      this.setTintFill(0xfff5a2);
      that.setTintFill(0xfff5a2);
      let posX = (this.x + that.x)/2
      let posY = (this.y + that.y)/2
      setTimeout(async () => { 
      if (that.health <= 0){
        this.power = Phaser.Math.Clamp(this.power + that.power,1,10)
        //await that.spawn(player.x,player.y,8000)
        that.setActive(false)
        that.setVisible(false)
        that.body.checkCollision.none = true;
        await this.clearTint()
        await that.clearTint()
      }
      
    }, 50);
    setTimeout(async () => {
      await this.clearTint()
      await that.clearTint()
      basicEnemyCollision.active=true
    }, 100)
        break
      default:
        this.health--
        player.setTint(0xff0051)
        if (this.health <= 0) {
          this.setTintFill(0xff0051);
        }
        else {
          this.setTintFill(0xffffff);
        }
          setTimeout(async () => {
            if (this.health <= 0) {
              //await this.spawn(player.x,player.y,8000)
              this.setActive(false)
              this.setVisible(false)
              this.body.checkCollision.none = true;
            }
            this.clearTint()
            player.clearTint()
          }, 50);
        break;
    }
    return
      
  }

  scaling(min, max) {
    let randomFloat = Phaser.Math.FloatBetween(0, 1);
        // Apply logarithmic scaling: using Math.pow() to transform the random float
        let logRandom = Math.pow(10, randomFloat);
        // Scale it to the desired range (min, max)
        let scaledRandom = min + (logRandom - 1) / 9 * (max - min);
        return scaledRandom
  }

  spawn(x,y,r){
    this.death = false
    this.body.checkCollision.none = false
    this.setActive(true)
    this.setVisible(true)
    this.clearTint()
    this.setScale(this.scaling(1.1,1.6));
    this.acceleration = 0.1
    this.speed = 250*(1/this.scale);
    this.rotationSpeed = Phaser.Math.FloatBetween(0.000001, 0.01);
    this.setMaxVelocity(this.speed)
    this.power= Math.floor(this.scale)
    if (this.birth == true) {
      this.radius = this.body.width/2
      this.body.setCircle(this.radius);
      this.birth = false
    }
    this.health=this.scale*1.2
    //this.setScale(1)
    const radius = r;
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    //this.rotation = angle
    
    //this.body.setOffset(-this.radius, -this.radius);
    
    const offsetX = radius * Math.cos(angle);
    const offsetY = radius * Math.sin(angle);
    const posX = x + offsetX;
    const posY = y + offsetY;
    this.setPosition(posX, posY);

  }

  update(time,delta){
    this.setActive(true);
    this.setVisible(true);
    let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y );
    this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, angle, 0.01)
  

    // Calculate the movement direction based on the object's current angle
    let radians = Phaser.Math.DegToRad(this.angle);

    // Apply velocity in the direction the object is facing (based on its rotation)
    this.body.velocity.x = Math.cos(radians) * this.speed;
    this.body.velocity.y = Math.sin(radians) * this.speed;
  }
}

class EnemyFighter extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y) {
    super(scene, x, y, 'enemyFighter');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.lastShotTime = Math.floor(Math.random() * (200 - 0 + 1)) + 0;
    this.shotInterval = 300; // Delay in milliseconds (e.g., 500ms)
    this.health = 0
    this.speed = 0
    this.power = 1
    this.rotationSpeed = 0
    this.radius = 0
    this.birth = true
    this.death = false
    this.setBounce(2)
    this.setDamping(true);
    this.setDrag(0.001 );
    this.maxRotationSpeed = 300;
    this.angularAcceleration = 10;
  }

  async hit(that) {
    let object = that.constructor.name
    switch(object) {
      case "Bullet":
        if(that.visible == false) {
          return
         }
         that.setVisible(false)
        setTimeout(async () => {
          that.setActive(false)
          that.setVisible(false)
          that.body.checkCollision.none = true;
          this.health = this.health - that.damage
          if (this.health <= 0) {
            this.setTintFill(0xff0051);
             if (this.death == false) {
              await spawnUpgrade(this.x, this.y, this.power)
             }
             this.death = true
             
          }
          else {
            this.setTintFill(0xffffff);
          }
          bulletBasicEnemyOverlap.active=false
        },5);
        setTimeout(async () => { 
          if (this.health <= 0){
           //await this.spawn(player.x,player.y,8000)
           this.setActive(false)
           this.setVisible(false)
           this.body.checkCollision.none = true;
          }
          this.clearTint()
          bulletBasicEnemyOverlap.active=true
        }, 50);
        break;
      case "Arc":
        //console.log(object)
        if(that.visible == false) {
          return
         }
         that.setVisible(false)
        setTimeout(async () => {
          that.setActive(false)
          that.setVisible(false)
          that.body.checkCollision.none = true;
          this.health = this.health - that.damage
          if (this.health <= 0) {
            this.setTintFill(0xff0051);
             if (this.death == false) {
              await spawnUpgrade(this.x, this.y, this.power)
             }
             this.death = true
             
          }
          else {
            this.setTintFill(0xffffff);
          }
          arcBasicEnemyOverlap.active=false
        },5);
        setTimeout(async () => { 
          if (this.health <= 0){
           //await this.spawn(player.x,player.y,8000)
           this.setActive(false)
           this.setVisible(false)
           this.body.checkCollision.none = true;
          }
          this.clearTint()
          arcBasicEnemyOverlap.active=true
        }, 50);
        break;
        
    //   case "BasicEnemy":
    //     basicEnemyCollision.active=false
    //   if(this.scale <= 7) {
    //     this.setScale(this.scale +(that.scale/20))
    //     this.health = this.health + that.health
    //     this.speed = 250*(1/this.scale);
    //   }
    //   that.health=0
    //   this.clearTint()
    //   that.clearTint()
    //   this.setTintFill(0xfff5a2);
    //   that.setTintFill(0xfff5a2);
    //   let posX = (this.x + that.x)/2
    //   let posY = (this.y + that.y)/2
    //   setTimeout(async () => { 
    //   if (that.health <= 0){
    //     this.power = Phaser.Math.Clamp(this.power + that.power,1,10)
    //     //await that.spawn(player.x,player.y,8000)
    //     that.setActive(false)
    //     that.setVisible(false)
    //     that.body.checkCollision.none = true;
    //     await this.clearTint()
    //     await that.clearTint()
    //   }
    // }, 50);
    // setTimeout(async () => {
    //   await this.clearTint()
    //   await that.clearTint()
    //   basicEnemyCollision.active=true
    // }, 100)
        break
      default:
        this.health--
        player.setTint(0xff0051)
        if (this.health <= 0) {
          this.setTintFill(0xff0051);
        }
        else {
          this.setTintFill(0xffffff);
        }
          setTimeout(async () => {
            if (this.health <= 0) {
              //await this.spawn(player.x,player.y,8000)
              this.setActive(false)
              this.setVisible(false)
              this.body.checkCollision.none = true;
            }
            this.clearTint()
            player.clearTint()
          }, 50);
        break;
    }
    return
      
  }

  sight() {

    let fovAngle = Math.PI / 4
    const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const enemyFacing = this.rotation;
    const angleDifference = Phaser.Math.Angle.Wrap(angleToPlayer - enemyFacing);

    //console.log(Math.abs(angleDifference) <= fovAngle)
    return Math.abs(angleDifference) <= fovAngle;
}

  shoot() {
    const currentTime = frames - (Math.floor(Math.random() * (200 - 0 + 1)) + 0);
    if (currentTime - this.lastShotTime >= this.shotInterval) {
      const bullet = enemyBullets.get(this.x, this.y);
      bullet.fire(this.rotation + Math.PI / 2, 0.5, this.x, this.y, 0);
      this.lastShotTime = currentTime;
    }
  }

  spawn(x,y,r){
    this.death = false
    this.body.checkCollision.none = false
    this.setActive(true)
    this.setVisible(true)
    this.clearTint()
    this.setScale(1);
    this.acceleration = 0.1
    this.speed = Phaser.Math.Between(400, 550);
    this.rotationSpeed = Phaser.Math.FloatBetween(0.000001, 0.01);
    this.setMaxVelocity(this.speed)
    this.power= Math.floor(this.scale)
    if (this.birth == true) {
      this.radius = this.body.width/2
      this.body.setCircle(this.radius);
      this.birth = false
    }
    this.health = 1
    //this.setScale(1)
    const radius = r;
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    //this.rotation = angle
    
    //this.body.setOffset(-this.radius, -this.radius);
    
    const offsetX = radius * Math.cos(angle);
    const offsetY = radius * Math.sin(angle);
    const posX = x + offsetX;
    const posY = y + offsetY;
    this.setPosition(posX, posY);

  }

  update(time,delta){
    this.setActive(true);
    this.setVisible(true);
    let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y );
    this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, angle, 0.01)
  
    // Calculate the movement direction based on the object's current angle
    let radians = Phaser.Math.DegToRad(this.angle);

    // Apply velocity in the direction the object is facing (based on its rotation)
    this.body.velocity.x = Math.cos(radians) * this.speed;
    this.body.velocity.y = Math.sin(radians) * this.speed;

    let scan = this.sight()
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (scan == true && distance <= 1000) {this.shoot()}
  }
}
class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.body.setSize(15,15)
    this.cooldown = 10
    this.frames
    this.damage 
    this.firerate = Phaser.Math.Clamp(40 - upgrade.firerate, 10, 40)
    this.spread
    this.velocity
    this.weapon
    this.lifespan
  }

  async triggerSpawn() {

    if (this.weapon != weapon.length-1) {
      let projectile
      let weaponClass
      let loop = 1
      let spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
      let deviation = Math.random() * (spread - (0-spread)) + (0-spread);
      let angle = (this.rotation + deviation) + Math.PI / 2;
      switch(weapon[this.weapon+1].type) {
        case "bullet":
            weaponClass = bullets
          break
          case "arc":
            weaponClass = arcs
          break
          default: 
          break
      }
      switch (weapon[this.weapon+1].modifier) {
        case "double":
          loop = 2
          break
          case "triple":
            loop = 3
          break
          case "quadruple":
          loop = 4
          break
        default:
          loop = 1
          break
      }
      for (let i = 0; i <= loop-1; i++) {
          projectile = weaponClass.get(player.x, player.y);
          projectile.fire(angle, this.scale, this.x, this.y, this.weapon + 1);
          spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
          deviation = Math.random() * (spread - (0-spread)) + (0-spread);
          angle = (this.rotation + deviation) + Math.PI / 2;
      }
      
      this.setActive(false)
      this.setVisible(false)
    }
  }

  async fire(rotation, scale, x, y, i) {
    this.weapon = i
    this.lifespan = frames + weapon[i].duration
    
    this.velocity = 2000 + upgrade.bulletspeed
    this.damage = 1* upgrade.damage
    this.spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
    this.body.checkCollision.none = false;
    this.setScale(scale)
    
      this.setTint(0xffffff)
      this.setActive(true);
      this.setVisible(true);

      const velocity = this.velocity
      const spread = this.spread
      const deviation = Math.random() * (spread - (0-spread)) + (0-spread);
      const angle = (rotation + deviation) + - Math.PI / 2;
      this.setRotation(angle);
      this.setBounce(1)
  
      const bulletSpawnOffset = {
        x: 10,
        y: 0,
      };
  
      // Calculate direction to fire the bullet
      this.body.velocity.x = Math.cos(angle) * velocity;
      this.body.velocity.y = Math.sin(angle) * velocity;
  
      const bulletX = x + bulletSpawnOffset.x * Math.cos(angle) - bulletSpawnOffset.y * Math.sin(angle);
      const bulletY = y + bulletSpawnOffset.x * Math.sin(angle) + bulletSpawnOffset.y * Math.cos(angle);
  
      // Set bullet position
      this.setPosition(bulletX, bulletY);
      
  
      // Calculate bullet velocity based on player's rotation and speed
      const bulletVelocityX = Math.cos(angle) * velocity;
      const bulletVelocityY = Math.sin(angle) * velocity;

      if (this.x == player.x && this.y == player.y || this.body.velocity.x == 0 && this.body.velocity.y == 0) {
        this.setActive(false)
        this.setVisible(false)
      }
  
      // Add the player's velocity to the bullet's velocity
      this.body.velocity.x = bulletVelocityX + (player.body.velocity.x/2);
      this.body.velocity.y = bulletVelocityY + (player.body.velocity.y/2);
  }

  update(time, delta) {
      
      if (this.scale < 1) {
        this.clearTint()
        this.body.velocity.x = this.body.velocity.x/1.01;
        this.body.velocity.y = this.body.velocity.y/1.01;
      } else {
        this.body.velocity.x = this.body.velocity.x*1.1;
        this.body.velocity.y = this.body.velocity.y*1.1;
      }
      this.setScale(this.scaleX - upgrade.range * (Phaser.Math.Clamp(upgrade.bulletspeed/2500, 1, 10000)))
    if (this.scale < 0.4 || this.body.velocity < 12 ){
      this.setActive(false)
      this.setVisible(false)
    }  
    if (this.lifespan - frames <= 0) {
      this.triggerSpawn()
    }
  }
}

class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemyBullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.body.setSize(15,15)
    this.cooldown = 10
    this.frames
    this.damage 
    this.spread
    this.velocity
    this.weapon
    this.lifespan
  }

  hit() {
    player.setTint(0xff0051)      
    setTimeout(async () => {
      {
        this.setActive(false)
        this.setVisible(false)
        this.body.checkCollision.none = true;
      }     
      player.clearTint()
    }, 50);
  }

  async triggerSpawn() {

    if (this.weapon != weapon.length-1) {
      let projectile
      let weaponClass
      let loop = 1
      let spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
      let deviation = Math.random() * (spread - (0-spread)) + (0-spread);
      let angle = (this.rotation + deviation) + Math.PI / 2;
      switch(weapon[this.weapon+1].type) {
        case "bullet":
            weaponClass = bullets
          break
          case "arc":
            weaponClass = arcs
          break
          default: 
          break
      }
      switch (weapon[this.weapon+1].modifier) {
        case "double":
          loop = 2
          break
          case "triple":
            loop = 3
          break
          case "quadruple":
          loop = 4
          break
        default:
          loop = 1
          break
      }
      for (let i = 0; i <= loop-1; i++) {
          projectile = weaponClass.get(player.x, player.y);
          projectile.fire(angle, this.scale, this.x, this.y, this.weapon + 1);
          spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
          deviation = Math.random() * (spread - (0-spread)) + (0-spread);
          angle = (this.rotation + deviation) + Math.PI / 2;
      }
      
      this.setActive(false)
      this.setVisible(false)
    }
  }

  async fire(rotation, scale, x, y, i) {
    this.weapon = i
    this.lifespan = frames + 50
    this.velocity = 1500
    this.damage = 1
    this.spread = Phaser.Math.Clamp(0.3, 0.07, 0.3)
    this.body.checkCollision.none = false;
    this.setScale(scale)
    this.setTint(0xffffff)
    this.setActive(true);
    this.setVisible(true);
    const velocity = this.velocity
    const spread = this.spread
    const deviation = Math.random() * (spread - (0-spread)) + (0-spread);
    const angle = (rotation + deviation) + - Math.PI / 2;
    this.setRotation(angle);
    this.setBounce(1)
  
      const bulletSpawnOffset = {
        x: 10,
        y: 0,
      };
  
      // Calculate direction to fire the bullet
      this.body.velocity.x = Math.cos(angle) * velocity;
      this.body.velocity.y = Math.sin(angle) * velocity;
  
      const bulletX = x + bulletSpawnOffset.x * Math.cos(angle) - bulletSpawnOffset.y * Math.sin(angle);
      const bulletY = y + bulletSpawnOffset.x * Math.sin(angle) + bulletSpawnOffset.y * Math.cos(angle);
  
      // Set bullet position
      this.setPosition(bulletX, bulletY);
      
  
      // Calculate bullet velocity based on player's rotation and speed
      const bulletVelocityX = Math.cos(angle) * velocity;
      const bulletVelocityY = Math.sin(angle) * velocity;

      if (this.x == player.x && this.y == player.y || this.body.velocity.x == 0 && this.body.velocity.y == 0) {
        this.setActive(false)
        this.setVisible(false)
      }
  
      // Add the player's velocity to the bullet's velocity
      this.body.velocity.x = bulletVelocityX + (player.body.velocity.x/2);
      this.body.velocity.y = bulletVelocityY + (player.body.velocity.y/2);
  }

  update(time, delta) {
      
      if (this.scale < 0.5) {
        this.clearTint()
        this.body.velocity.x = this.body.velocity.x/1.01;
        this.body.velocity.y = this.body.velocity.y/1.01;
      } else {
        this.body.velocity.x = this.body.velocity.x*1.1;
        this.body.velocity.y = this.body.velocity.y*1.1;
      }
      this.setScale(this.scaleX - 0.001)
    if (this.scale < 0.4 || this.body.velocity < 12 ){
      this.setActive(false)
      this.setVisible(false)
    }  
    if (this.lifespan - frames <= 0) {
      this.triggerSpawn()
    }
  }
}

class Arc extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'arc');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.body.setSize(15,15)
    this.cooldown = 10
    this.frames
    this.damage 
    this.firerate = Phaser.Math.Clamp(40 - upgrade.firerate, 10, 40)
    this.spread
    this.velocity
    this.weapon
    this.lifespan
  }

  async triggerSpawn() {

    if (this.weapon != weapon.length-1) {
      let projectile
      let weaponClass
      let loop = 1
      let spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
      let deviation = Math.random() * (spread - (0-spread)) + (0-spread);
      let angle = (this.rotation + deviation) + Math.PI / 2;
      switch(weapon[this.weapon+1].type) {
        case "bullet":
            weaponClass = bullets
          break
          case "arc":
            weaponClass = arcs
          break
          default: 
          break
      }
      switch (weapon[this.weapon+1].modifier) {
        case "double":
          loop = 2
          break
          case "triple":
            loop = 3
          break
          case "quadruple":
          loop = 4
          break
        default:
          loop = 1
          break
      }
      for (let i = 0; i <= loop-1; i++) {
          projectile = weaponClass.get(player.x, player.y);
          projectile.fire(angle, this.scale, this.x, this.y, this.weapon + 1);
          spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
          deviation = Math.random() * (spread - (0-spread)) + (0-spread);
          angle = (this.rotation + deviation) + Math.PI / 2;
      }
      
      this.setActive(false)
      this.setVisible(false)
    }
  }

  async fire(rotation, scale, x, y, i) {
    this.weapon = i
    this.lifespan = frames + weapon[i].duration
    
    this.velocity = 2000 + upgrade.bulletspeed
    this.damage = 2* upgrade.damage
    this.spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
    this.body.checkCollision.none = false;
    this.setScale(scale)
    
      this.setTint(0xffffff)
      this.setActive(true);
      this.setVisible(true);

      const velocity = this.velocity
      const spread = this.spread
      const deviation = Math.random() * (spread - (0-spread)) + (0-spread);
      const angle = (rotation + deviation) + - Math.PI / 2;
      this.setRotation(angle);
      this.setBounce(1)
  
      const bulletSpawnOffset = {
        x: 10,
        y: 0,
      };
  
      // Calculate direction to fire the bullet
      this.body.velocity.x = Math.cos(angle) * velocity;
      this.body.velocity.y = Math.sin(angle) * velocity;
  
      const bulletX = x + bulletSpawnOffset.x * Math.cos(angle) - bulletSpawnOffset.y * Math.sin(angle);
      const bulletY = y + bulletSpawnOffset.x * Math.sin(angle) + bulletSpawnOffset.y * Math.cos(angle);
  
      // Set bullet position
      this.setPosition(bulletX, bulletY);
      
  
      // Calculate bullet velocity based on player's rotation and speed
      const bulletVelocityX = Math.cos(angle) * velocity;
      const bulletVelocityY = Math.sin(angle) * velocity;

      if (this.x == player.x && this.y == player.y || this.body.velocity.x == 0 && this.body.velocity.y == 0) {
        this.setActive(false)
        this.setVisible(false)
      }
  
      // Add the player's velocity to the bullet's velocity
      this.body.velocity.x = bulletVelocityX + (player.body.velocity.x/2);
      this.body.velocity.y = bulletVelocityY + (player.body.velocity.y/2);
  }

  update(time, delta) {

      if (frames % 5 == 0) {
      let spread = Phaser.Math.Clamp(1.4 - (upgrade.spread*0.1), 0.9, 1.4)
      let deviation = Math.random() * (spread - (0-spread)) + (0-spread);
      let angle = (this.rotation + deviation);
      this.setRotation(angle)
      
      this.body.velocity.x = Math.cos(angle) * this.velocity;
      this.body.velocity.y = Math.sin(angle) * this.velocity;
      let randomInt = Phaser.Math.Between(1, 10)
      this.damage/2
      if (randomInt >= 1){
        let projectile = arcs.get(player.x, player.y);
        spread = Phaser.Math.Clamp(1.4 - (upgrade.spread*0.1), 0.9, 1.4)
        deviation = Math.random() * (spread - (0-spread)) + (0-spread);
        angle = (this.rotation + deviation) + Math.PI / 2;
        projectile.fire(angle, this.scale, this.x, this.y, this.weapon);
        projectile.damage = projectile.damage/5
        projectile.setScale(projectile.scale/1.2)
      }
    }
      
      if (this.scale < 1) {
        this.clearTint()
        //this.body.velocity.x = this.body.velocity.x/1.01;
        //this.body.velocity.y = this.body.velocity.y/1.01;
      } else {
        //this.body.velocity.x = this.body.velocity.x*1.1;
        //this.body.velocity.y = this.body.velocity.y*1.1;
      }
      this.setScale(this.scaleX - (4*upgrade.range) * (Phaser.Math.Clamp(upgrade.bulletspeed/2500, 1, 8000)))
    if (this.scale < 0.4 || this.body.velocity < 12 ){
      this.setActive(false)
      this.setVisible(false)
    }  

    if (this.lifespan - frames <= 0) {
      this.triggerSpawn()
    } 
  }
}
class Cursor extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'cursor');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(true);
    this.setVisible(true);  
    
    this.spawn()
    
    
  }
  spawn(){
    this.setTintFill(0xff0000);
    this.setDepth(1)  
  }
}

// Game configuration
const config = {
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
      debug: false       // Enable this to visualize physics objects (optional)
    }
  },
  fps: {
    smoothstep: true,
    target: 144,
    forceSetTimeOut: true,
    debug: true
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

let player;
let weapon = [{
  type: "bullet",
  modifier: "none",
  duration: 0
},
// {
//   type: "bullet",
//   modifier: "none",
//   duration: 10
// },
// {
//   type: "arc",
//   modifier: "none",
//   duration: 5
// },
// {
//   type: "arc",
//   modifier: "none",
//   duration: 10
// },
]
let upgrade= {
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
let cursor;
let angleToPointer
let cursorDistance
let pad;
let xAxis
let yAxis
var maxRadius = 200
let lastPosition = { x: 0, y: 0 }
let nextPosition = {x: 0, y: 0 }
let cursorMoving
let bullets;
let arcs
let upgrades
let dashLines;
let basicEnemies
let enemyFighters
let worldBounds = { width: 10000, height: 10000 };  // Large world size
let moveToPointer = false;
let shooting = false
let player_acceleration = 0
let player_speed = 1800
let frames = 0
let maxVelocity = 1200 + upgrade.speed
let basicEnemyCollision
let basicEnemyFighterCollision
let enemyFighterCollision
let playerBasicEnemyCollision
let playerEnemyFighterCollision
let bulletBasicEnemyOverlap
let bulletEnemyFighterOverlap
let playerEnemyBulletOverlap
let enemyBullets
let arcBasicEnemyOverlap
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
  switch(random){
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
      spawnBasicEnemy()
      break
  }

  
}

function spawnBasicEnemy(){
  let radius = 200;
  let enemyX
  let enemyY
  let angle
  let offsetX
  let offsetY
  let posX
  let posY
  let reroll = Phaser.Math.Between(0,5)
  
  let enemy = basicEnemies.getFirstDead(player.x, player.y)
  if (enemy){
    enemy.spawn(player.x,player.y,2000)
    enemyX = enemy.x
    enemyY = enemy.y
  }
    while (reroll >= 2) {
      angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
      offsetX = radius * Math.cos(angle);
      offsetY = radius * Math.sin(angle);
      posX = enemyX + offsetX;
      posY = enemyY + offsetY;
      enemy = basicEnemies.get(player.x, player.y)
      if (enemy){
        enemy.spawn(posX,posY,radius)
      }
      reroll = Phaser.Math.Between(0,5)
    }
  
}

function spawnEnemyFighter(){
  let radius = 200;
  let enemyX
  let enemyY
  let angle
  let offsetX
  let offsetY
  let posX
  let posY
  let reroll = Phaser.Math.Between(0,5)
  
  let enemy = enemyFighters.getFirstDead(player.x, player.y)
  if (enemy){
    enemy.spawn(player.x,player.y,2000)
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
      if (enemy){
        enemy.spawn(posX,posY,radius)
      }
      reroll = Phaser.Math.Between(0,5)
    }
  
}

function spawndashLine() {
  const dashLine = dashLines.get(player.x, player.y)
  if (dashLine){
    dashLine.spawn(player.rotation/2 + - Math.PI / 2)
  }
}

function shootBullet(rotation) {
  switch(weapon[0].type){
    case "bullet":
      const bullet = bullets.get(player.x, player.y);
      if (frames % upgrade.firerate == 0 && rotation != null && bullet != null ) {
        bullet.fire(rotation, 1, player.x, player.y, 0);
      }
      break
    case "arc":
      const arc = arcs.get(player.x, player.y);
      if (frames % upgrade.firerate == 0 && rotation != null && arc != null ) {
        arc.fire(rotation, 1, player.x, player.y, 0);
      }
      break
    default:
      break
    } 
  }

  function spawnUpgrade(x,y,p) {
    const upgrade = upgrades.get(player.x,player.y);
    if (upgrade) {
      upgrade.spawn(x,y,p)
    }
  }


