import {
    player, 
    spawnWeapon, spawnCorpse,
    upgrade, weapon,
    MainGameScene, MainMenuScene
} from './main'

import Phaser from 'phaser'

export class dashLine extends Phaser.Physics.Arcade.Sprite{
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

export class Weapon extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.speed = 0
    this.setScale(2)
    this.lifespan = 0
    this.id = Phaser.Math.Between(0,2);
  }


  sprite() {
    let shotgun = 0xff0000;
    let pistol = 0x002eff;
    let assaultRifle = 0xed00ff
    switch(this.id) {
      case 0: // spread
        this.setFrame(0)
        break
      case 1: // firerate
       this.setFrame(1)
        break;
      case 2: // firerate
        this.setFrame(2)
        break;
      default:
        this.setTint(0xed00ff)
        break
    }
    return
  }

  spawn(x,y){
    
    this.body.setCircle(this.body.width/2);
    this.sprite();
    this.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.lifespan = 500
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
    this.rotation += (this.speed/100)

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

export class EnemyFighter extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.legs = scene.add.sprite(this.x, this.y, "legs");
    this.legs.setOrigin(0.5);
    this.legs.setScale(3);
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
    this.legs.setDepth(0)
    this.setDepth(1)
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
        console.log("p")
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
            this.legs.setActive(false)
            this.legs.setVisible(false)
            this.setTintFill(0xff0051);
             if (this.death == false) {
              await spawnCorpse(this.x, this.y, that.rotation, this.body.velocity.x, this.body.velocity.y)
              await spawnWeapon(this.x, this.y, this.power)
             }
             this.death = true
             
          }
          else {
            this.setTintFill(0xffffff);
          }
        },5);
        setTimeout(async () => { 
          if (this.health <= 0){
           this.legs.setActive(false)
           this.legs.setVisible(false)
           this.setActive(false)
           this.setVisible(false)
           this.body.checkCollision.none = true;
          }
          this.clearTint()
        }, 50);
        break;
      case "ArcadeSprite2":
        setTimeout(async () => {
          that.body.checkCollision.none = true;
          this.health = this.health - 1
          if (this.health <= 0) {
            this.legs.setActive(false)
            this.legs.setVisible(false)
            this.setTintFill(0xff0051);
             if (this.death == false) {
              await spawnCorpse(this.x, this.y, that.rotation + Phaser.Math.DegToRad(90), this.body.velocity.x, this.body.velocity.y)
              await spawnWeapon(this.x, this.y, this.power)
             }
             this.death = true
              that.body.checkCollision.none = false;
          }
          else {
            this.setTintFill(0xffffff);
          }
        },5);
        setTimeout(async () => { 
          if (this.health <= 0){
           this.legs.setActive(false)
           this.legs.setVisible(false)
           this.setActive(false)
           this.setVisible(false)
           this.body.checkCollision.none = true;
          }
          this.clearTint()
        }, 50);
        break;
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
              this.legs.setActive(false)
              this.legs.setVisible(false)
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
    this.setScale(3) 
    this.acceleration = 0.1
    this.speed = Phaser.Math.Between(400, 550);
    this.rotationSpeed = Phaser.Math.FloatBetween(0.000001, 0.01);
    this.setMaxVelocity(this.speed)
    this.power= Math.floor(this.scale)
    this.legs.play("walk", true)
    
    if (this.birth == true) {
      this.body.setCircle(12);
      this.body.setOffset(this.width / 2 - 12, this.height / 2 - 12)
      this.birth = false
    }
    this.health = 1
    const radius = r;
    const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
    const offsetX = radius * Math.cos(angle);
    const offsetY = radius * Math.sin(angle);
    const posX = x + offsetX;
    const posY = y + offsetY;
    this.setPosition(posX, posY);
    
  }

  update(time,delta){
    this.setActive(true);
    this.setVisible(true);
    this.legs.setPosition(this.x, this.y)
    this.legs.setActive(true)
    this.legs.setVisible(true)
    this.legs.rotation = this.rotation
    let angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y );
    this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, angle + (Phaser.Math.DegToRad(90)), 0.01)
    let radians = Phaser.Math.DegToRad(this.angle);
    this.body.velocity.x = Math.cos(radians - (Phaser.Math.DegToRad(90))) * this.speed;
    this.body.velocity.y = Math.sin(radians - (Phaser.Math.DegToRad(90))) * this.speed;

    let scan = this.sight()
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (scan == true && distance <= 1000) {this.shoot()}
  }
}

export class Corpse extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setDepth(0)
    this.setBounce(2)
    this.setDamping(true);
    this.setDrag(0.001 );
  }

  spawn(x,y,r,vx, vy){
    this.setAlpha(1)
    this.setActive(true)
    this.setVisible(true)
    this.setScale(3) 
    this.acceleration = 0.1
    this.speed = Phaser.Math.Between(400, 550);
    this.setMaxVelocity(this.speed)
    this.power= Math.floor(this.scale)
    this.play("knockdown", true)
    this.setPosition(x, y);
    this.rotation = r + Phaser.Math.DegToRad(270)
    this.body.velocity.x = vx * -3
    this.body.velocity.y = vy * -3
  }

  update(time,delta){

    if (Math.abs(this.body.velocity.x) <= 1 && Math.abs(this.body.velocity.y) <= 1) {
      this.body.velocity.x = 0
      this.body.velocity.y = 0
      this.setAlpha(this.alpha-0.001)
      if (this.alpha <= 0.05) {
        this.setActive(false);
        this.setVisible(false);
      }
    } else {
      this.body.velocity.x = this.body.velocity.x/1.07
      this.body.velocity.y -= this.body.velocity.y/1.07
    }
  }
}

export class Bullet extends Phaser.Physics.Arcade.Sprite {
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
    this.spread
    this.velocity
    this.weapon
    
    this.setScale(4,1)
  }

  async fire(rotation, x, y, range_min, range_max, spread_min, spread_max, spawn_offset) {
    this.body.setCircle(2);
    this.body.setOffset(this.width / 2 - 2, this.height / 2 - 2)
    this.scaleX = 3.5
    this.scaleY = 0.5
    this.lifespan = frames + 10
    this.velocity = Phaser.Math.Between(range_min, range_max)
    this.damage = 1
    this.spread = Phaser.Math.Clamp(spread_max, spread_min, spread_max)
    this.body.checkCollision.none = false;
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
        x: spawn_offset,
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

    this.body.velocity.x = this.body.velocity.x/1.01;
    this.body.velocity.y = this.body.velocity.y/1.01;
    this.scaleX -= 0.04
      
    if (this.scaleX <= 0.1) {
      this.setActive(false)
      this.setVisible(false)
    }
  }
}

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
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
