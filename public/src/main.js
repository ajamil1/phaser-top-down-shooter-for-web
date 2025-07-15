import './style.css';
import Phaser from 'phaser';
import {
  dashLine, Upgrade, 
  BasicEnemy, 
  EnemyFighter, EnemyBullet,
  Bullet, Arc,
} from './classes'

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
    this.load.image('arc', '/src/assets/bullet.png'); 
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
    
      

    
    this.time.delayedCall(50, () => {
      console.log("1")
      basicEnemyCollision = this.physics.add.collider(basicEnemies, basicEnemies, function response (e1, e2) {
      if(e1.scale> e2.scale) {e1.hit(e2)} 
      else {e2.hit(e1)}
    });
    })

    
    
    
    this.time.delayedCall(50, () => {
      console.log("2")
      enemyFighterCollision = this.physics.add.collider(enemyFighters, enemyFighters, function response (e1, e2) {
    });
    })

    
    this.time.delayedCall(50, () => {
      console.log("3")
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
    })
    
    
    this.time.delayedCall(50, () => {
      console.log("4")
      bulletBasicEnemyOverlap = this.physics.add.overlap(basicEnemies, bullets, function hitBasicEnemy(enemy, bullet) {
      console.log("COLLISION: enemy + bullet")
      enemy.hit(bullet)
    })
    })

    
    this.time.delayedCall(50, () => {
      console.log("5")
      bulletEnemyFighterOverlap = this.physics.add.overlap(enemyFighters, bullets, function hitEnemyFighter(enemy, bullet) {
      console.log("COLLISION: enemy + bullet")
      enemy.hit(bullet)
    })
    })

    
    this.time.delayedCall(50, () => {
      console.log("6")
      arcBasicEnemyOverlap = this.physics.add.overlap(basicEnemies, arcs, function hitBasicEnemy(enemy, arc) {
      console.log("COLLISION: enemy + arc")
      enemy.hit(arc)
    })
    })

    this.time.delayedCall(50, () => {
      console.log("6")
      arcEnemyFighterOverlap = this.physics.add.overlap(enemyFighters, arcs, function hitEnemyFighter(enemy, arc) {
      console.log("COLLISION: enemy + arc")
      enemy.hit(arc)
    })
    })
    
    
    this.time.delayedCall(50, () => {
      console.log("7")
      playerBasicEnemyCollision = this.physics.add.collider(basicEnemies, player, function hitBasicEnemy(player, enemy) {
      console.log("COLLISION: player + enemy")
      enemy.hit(player)
    })
    })
    
    
    this.time.delayedCall(50, () => {
      console.log("8")
      basicEnemyFighterCollision = this.physics.add.collider(basicEnemies, enemyFighters)
    })
    
    
    this.time.delayedCall(50, () => {
      console.log("9")
      playerEnemyBulletOverlap = this.physics.add.overlap(enemyBullets, player, function hitPlayer(player, bullet) {
      console.log("COLLISION: player. + bullet")
      bullet.hit()
    })
    })

    

    
    this.time.delayedCall(50, () => {
      console.log("10")
     playerEnemyFighterCollision = this.physics.add.collider(enemyFighters, player, function hitEnemyFighter(player, enemy) {
      console.log("COLLISION: player + enemy")
      enemy.hit(player)
    })
    })
    
      this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
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

      let direction = new Phaser.Math.Vector2(0, 0);

      if (this.w.isDown) direction.y -= 1;
      if (this.s.isDown) direction.y += 1;
      if (this.a.isDown) direction.x -= 1;
      if (this.d.isDown) direction.x += 1;

  if (direction.lengthSq() > 0) {
    direction.normalize();
  }

    // Convert direction to angle
    const directionalAngle = direction.angle();
    
      if (this.spacebar.isDown || this.w.isDown || this.a.isDown || this.s.isDown || this.d.isDown) {
        player_acceleration = 900 + upgrade.acceleration
        moveToPointer = true
        if (!this.spacebar.isDown) {
          this.physics.velocityFromRotation(directionalAngle, player_acceleration, player.body.acceleration);
        } else {
          this.physics.velocityFromRotation(angleToPointer, player_acceleration, player.body.acceleration);
        }
        
      }
      
      if (!this.spacebar.isDown && !this.w.isDown && !this.a.isDown && !this.s.isDown && !this.d.isDown) {
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
      if (frames % spawnRate == 0 && frames >= 500) {getEnemy()}
      
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
    debug: false
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
export let weapon = [{
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
export let upgrade= {
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
export let basicEnemyCollision
export let basicEnemyFighterCollision
export let enemyFighterCollision
export let playerBasicEnemyCollision
export let playerEnemyFighterCollision
export let bulletBasicEnemyOverlap
export let bulletEnemyFighterOverlap
export let arcBasicEnemyOverlap
export let arcEnemyFighterOverlap
export let playerEnemyBulletOverlap
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

  export function spawnUpgrade(x,y,p) {
    const upgrade = upgrades.get(player.x,player.y);
    if (upgrade) {
      upgrade.spawn(x,y,p)
    }
  }


