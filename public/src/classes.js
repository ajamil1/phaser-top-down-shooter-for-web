import {
    player, 
    basicEnemyCollision, bulletBasicEnemyOverlap, arcBasicEnemyOverlap, arcEnemyFighterOverlap, 
    spawnUpgrade,
    upgrade, weapon
} from './main'

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

export class Upgrade extends Phaser.Physics.Arcade.Sprite{
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

export class BasicEnemy extends Phaser.Physics.Arcade.Sprite{
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

export class EnemyFighter extends Phaser.Physics.Arcade.Sprite{
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

export class Arc extends Phaser.Physics.Arcade.Sprite {
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
