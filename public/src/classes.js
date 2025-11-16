import {
  player, cursor, mainCamera, config, spaceDown,
  spawnWeapon, spawnCorpse, spawnSpark, enemyShoot,
  upgrade, weapon,
  bullets,
  MainGameScene, MainMenuScene
} from './main'

import Phaser from 'phaser'

export class dashLine extends Phaser.Physics.Arcade.Sprite {
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
    const randomX = Phaser.Math.Between(Phaser.Math.Between(player.x - 1500, player.x - 1250), Phaser.Math.Between(player.x + 1250, player.x + 1500));
    const randomY = Phaser.Math.Between(Phaser.Math.Between(player.y - 1500, player.y - 1250), Phaser.Math.Between(player.y + 1250, player.y + 1500));
    this.setPosition(randomX, randomY);

    const angle = player.rotation / 2 + - Math.PI / 2;

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
      const randomX = Phaser.Math.Between(Phaser.Math.Between(player.x - 1500, player.x - 1250), Phaser.Math.Between(player.x + 1250, player.x + 1500));
      const randomY = Phaser.Math.Between(Phaser.Math.Between(player.y - 1500, player.y - 1250), Phaser.Math.Between(player.y + 1250, player.y + 1500));
      this.setPosition(randomX, randomY);
    }

    const velocity = (Math.abs(player.body.velocity.x) + Math.abs(player.body.velocity.y))

    const scaleX = Phaser.Math.Clamp(cameraVelocity / 10, 0.08, 2000);
    // Calculate the angle of movement in radians
    const angle = Math.atan2(cameraVelocityY, cameraVelocityX);
    //this.setAlpha((pos)/1500)
    this.setAlpha((1 - (pos / 1500)) * (1 - ((cameraVelocity) / 35)))
    if (this.visible == false) {
      this.setVisible(true)
    }

    this.setActive(true)

    //this.setAlpha(1)
    this.setRotation(angle)
    this.setScale(scaleX / 2, (1 / 2))


  }
}

export class Wall extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, width, height) {
    super(scene, x, y, 'wall');
    this.spawnX = x
    this.spawnY = y
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false)
    this.setVisible(false)
    this.scene = scene
    this.setDepth(4)
    this.lifespan = 0
    //this.pipelineInstance = this.scene.plugins.get('rexoutlinepipelineplugin').add(this, config);
  }

  spawn(x, y, w, h) {
    this.spawnX = x
    this.spawnY = y
    this.setPushable(false)
    this.setScale(w / 100, h / 100)
    this.setActive(true)
    this.setVisible(true)

  }

  update() {

    this.lifespan++
    if (this.lifespan >= 50) {
      this.setPosition(this.spawnX, this.spawnY)
    }

  }

}

export class Weapon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.speed = 0
    this.setScale(2)
    this.selected = false
    this.lifespan = 0
    this.id = Phaser.Math.Between(0, 2);
  }


  sprite() {
    let shotgun = 0xff0000;
    let pistol = 0x002eff;
    let assaultRifle = 0xed00ff
    switch (this.id) {
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

  selectWeapon() {
    const distanceToCursor = Phaser.Math.Distance.Between(this.x, this.y, cursor.x, cursor.y)
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    this.selected = true

    if (distanceToCursor <= 200 && distance <= 500) {
      this.selected = true
    }
  }

  spawn(x, y) {
    this.speed = 0
    this.selected = 0
    this.body.setCircle(this.body.width / 2);
    this.sprite();
    this.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.lifespan = 1000
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y)
    this.body.maxVelocity.set(2000)
  }
  update(time, delta) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setAlpha((this.lifespan) / 1000)
    this.lifespan--
    if (this.alpha <= 0) {
      this.setActive(false)
      this.setVisible(false);
    }

    const distanceToCursor = Phaser.Math.Distance.Between(this.x, this.y, cursor.x, cursor.y)
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distanceToCursor <= 200 && distance <= 3000) {
      this.setTint(0xff0051);
      if (spaceDown == true) {
        this.selected = true
      }
    } else {
      this.clearTint()
    }

    this.rotation += (this.speed / 100)

    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;

    // Optionally, you can add a check to stop movement when the enemy reaches the player

    if (this.selected == false) {
      // Stop the enemy's movement when it's close enough to the player
      this.speed = 0;
    }
    else { this.speed += 0.1 }

  }
}

export class EnemySight extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sight');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(2)
    this.partner
    this.scan = 0
  }

  spawn(partner) {

    this.setAlpha(0)
    this.partner = partner
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(partner.x, partner.y);
    // this.body.setCircle(12);
    // this.body.setOffset(this.width / 2 - 12, this.height / 2 - 12)
    this.rotation = this.partner.rotation
  }

  detection(wall) {
    this.partner.divert(wall)
  }

  update() {
    this.scan += 20
    if (this.scan >= 100) {
      this.scan = 0
      this.partner.clear()
    }
    this.body.velocity.x = this.partner.body.x
    this.body.velocity.y = this.partner.body.y

    this.x = this.partner.x + (Math.cos(this.partner.rotation + Phaser.Math.DegToRad(270)) * this.scan);
    this.y = this.partner.y + (Math.sin(this.partner.rotation + Phaser.Math.DegToRad(270)) * this.scan);
    this.setRotation(this.partner.rotation)

  }
}

export class EnemyFighter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    this.pistol_sfx = this.scene.sound.add('pistol_sfx', {
      loop: false,
      volume: 0.4,
      allowMultiple: true
    })
    this.shotgun_sfx = this.scene.sound.add('shotgun_sfx', {
      loop: false,
      volume: 0.4,
      allowMultiple: true
    })
    this.rifle_sfx = this.scene.sound.add('rifle_sfx', {
      loop: false,
      volume: 0.4,
      allowMultiple: true
    })
    scene.physics.add.existing(this);
    this.legs = scene.add.sprite(this.x, this.y, "legs");
    this.legs.setOrigin(0.5);
    this.legs.setScale(3);
    this.setActive(false);
    this.setVisible(false);
    //this.effect = this.postFX.addGlow(0xffffff, 2, 1, false, 0.001, 1);
    //this.effect.setActive(false)
    this.lastShotTime = Math.floor(Math.random() * (200 - 0 + 1)) + 0;
    this.shotInterval = 300; // Delay in milliseconds (e.g., 500ms)
    this.health = 2
    this.turnScale = 1
    this.weapon
    this.wallCount = 0
    this.body.setMass(50)
    this.distance = 9999
    this.speed = 0
    this.power = 1
    this.rotationSpeed = 0
    this.radius = 0
    this.birth = true
    this.death = false
    this.legs.setDepth(0)
    this.setDepth(1)
    this.setBounce(1)
    this.body.setMass(0)
    this.setDamping(true);
    this.setDrag(0.001);
    this.maxRotationSpeed = 300;
    this.angularAcceleration = 10;
    this.loop = false;
    this.wall = null
    this.scene.time.addEvent({
      delay: 300,
      callback: () => {
        if (this.loop == true && this.weapon == 1 && this.death == false) {
          enemyShoot(this, this.weapon, this.rotation, this.pistol_sfx)

        }
      },
      callbackScope: this,
      loop: true
    });
    this.scene.time.addEvent({
      delay: 800,
      callback: () => {
        if (this.loop == true && this.weapon == 2 && this.death == false) {
          enemyShoot(this, this.weapon, this.rotation, this.shotgun_sfx)
        }
      },
      callbackScope: this,
      loop: true
    })
    this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.loop == true && this.weapon == 3 && this.death == false) {
          enemyShoot(this, this.weapon, this.rotation, this.rifle_sfx)
        }
      },
      callbackScope: this,
      loop: true
    })
  }


  async hit(that) {
    let object = that.constructor.name
    switch (object) {
      case "Bullet":

        if (that.visible == false) {
          return
        }
        that.setVisible(false)
        setTimeout(async () => {
          that.setActive(false)
          that.setVisible(false)
          that.body.checkCollision.none = true;
          this.health = this.health - that.damage
          await spawnSpark(that.x, that.y, that.rotation + Phaser.Math.DegToRad(180))
          if (this.health <= 0) {
            this.legs.setActive(false)
            this.legs.setVisible(false)
            this.setTintFill(0xff0051);
            if (this.death == false) {
              this.loop = false
              await spawnCorpse(this.x, this.y, that.rotation, this.body.velocity.x, this.body.velocity.y)
              await spawnWeapon(this.x, this.y, this.power)

            }
            this.death = true

          }
          else {
            this.setTintFill(0xffffff);
          }
        }, 5);
        setTimeout(async () => {
          if (this.health <= 0) {
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
            if (this.death == false && that != player) {
              this.loop = false
              await spawnCorpse(this.x, this.y, this.rotation + Phaser.Math.DegToRad(90), this.body.velocity.x, this.body.velocity.y)
              await spawnWeapon(this.x, this.y, this.power)
            }
            this.death = true
            that.body.checkCollision.none = false;
          }
          else {
            this.setTintFill(0xffffff);
          }
        }, 5);
        setTimeout(async () => {
          if (this.health <= 0) {
            this.legs.setActive(false)
            this.legs.setVisible(false)
            this.setActive(false)
            this.setVisible(false)
            this.loop = false
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
            this.loop = false
            this.body.checkCollision.none = true;
          }
          this.clearTint()
          player.clearTint()
        }, 50);
        break;

    }
    return

  }

  setWeapon(weapon) {
    switch (weapon) {
      case 1:
        this.setFrame(5)
        break
      case 2:
        this.setFrame(7)
        break
      case 3:
        this.setFrame(6)
        break
      default:
        this.setFrame(0)
        break
    }
  }


  spawn(x, y, r) {
    this.turnScale = 1
    this.loop = false
    this.wallCount = 0
    this.weapon = Phaser.Math.Between(0, 20)
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
    this.power = Math.floor(this.scale)
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
    this.setWeapon(this.weapon)

  }

  divert(wall) {
    this.wallCount += 1
    this.wall = wall

  }

  clear() {
    this.wall = null
    this.wallCount = 0
  }

  update(time, delta) {
    if (this.wall != null) {
      this.turnScale = Phaser.Math.Distance.Between(this.x, this.y, this.wall.x, this.wall.y)
      if (this.turnScale <= 30) {
        //console.log(this.turnScale)
      }
    }
    else { this.turnScale = 1 }

    this.setActive(true);
    this.setVisible(true);
    this.legs.setPosition(this.x, this.y)
    this.legs.setActive(true)
    this.legs.setVisible(true)
    this.legs.rotation = this.rotation
    let angle
    if (this.wall == null) {
      angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this.setRotation(Phaser.Math.Angle.RotateTo(this.rotation, angle + (Phaser.Math.DegToRad(90)), 0.09))
    } else {
      angle = Phaser.Math.Angle.Between(this.wall.x, this.wall.y, this.x, this.y,);
      if (this.wallCount >= 10) {
        this.setRotation((Phaser.Math.Angle.RotateTo(this.rotation, (angle * -1) + (Phaser.Math.DegToRad(90)), (0.09 * 1))))
      }

    }
    let radians = Phaser.Math.DegToRad(this.angle);
    this.body.velocity.x = Math.cos(radians - (Phaser.Math.DegToRad(90))) * this.speed;
    this.body.velocity.y = Math.sin(radians - (Phaser.Math.DegToRad(90))) * this.speed;

    this.distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (this.distance <= 900) {
      this.loop = true
    } else { this.loop = false }
  }
}

export class Corpse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setDepth(0)
    this.setBounce(2)
    this.setDamping(true);
    this.setDrag(0.001);
  }

  spawn(x, y, r, vx, vy) {
    this.setAlpha(1)
    this.setActive(true)
    this.setVisible(true)
    this.setScale(3)
    this.acceleration = 0.1
    this.speed = Phaser.Math.Between(400, 550);
    this.setMaxVelocity(this.speed)
    this.power = Math.floor(this.scale)
    this.play("knockdown", true)
    this.setPosition(x, y);
    this.rotation = r + Phaser.Math.DegToRad(270)
    this.body.velocity.x = vx * -3
    this.body.velocity.y = vy * -3
  }

  update(time, delta) {

    if (Math.abs(this.body.velocity.x) <= 1 && Math.abs(this.body.velocity.y) <= 1) {
      this.body.velocity.x = 0
      this.body.velocity.y = 0
      this.setAlpha(this.alpha - 0.001)
      if (this.alpha <= 0.05) {
        this.setActive(false);
        this.setVisible(false);
      }
    } else {
      this.body.velocity.x = this.body.velocity.x / 1.07
      this.body.velocity.y = this.body.velocity.y / 1.07
    }
  }
}

export class Spark extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'spark');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setAlpha(1)
    this.setDepth(3)
    this.setBounce(2)
    this.setDamping(true);
    this.spawnX = x
    this.spawnY = y
    this.roll
  }

  spawn(x, y, r) {
    this.setFrame(5)
    this.setAlpha(1)
    this.setActive(true)
    this.setVisible(true)
    this.setScale(3)
    this.scaleX = Phaser.Math.Between(10, 20)
    this.scaleY = 0.5
    this.acceleration = 0.1
    this.speed = Phaser.Math.Between(500, 2000);
    this.setMaxVelocity(this.speed)
    this.power = Math.floor(this.scale)
    this.setPosition(x + Phaser.Math.Between(-50, 50), y + Phaser.Math.Between(-20, 20));
    this.setRotation(r + Phaser.Math.DegToRad(Phaser.Math.Between(-30, 30)))

    this.body.velocity.x = Math.cos(r) * -this.speed;
    this.body.velocity.y = Math.sin(r) * -this.speed;
  }

  update(time, delta) {

    if (Math.abs(this.body.velocity.x) <= 1 && Math.abs(this.body.velocity.y) <= 1) {
      this.setAlpha(this.alpha - 0.01)
      if (this.alpha <= 0.05) {
        this.setActive(false);
        this.setVisible(false);
      }
    } else {
      this.scaleX -= 0.5
      this.body.velocity.x = this.body.velocity.x / 1.01
      this.body.velocity.y = this.body.velocity.y / 1.01
      if (this.scaleX <= 1) {
        this.setActive(false);
        this.setVisible(false);
      }
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
    this.body.setSize(15, 15)
    this.enemyBullet
    this.cooldown = 10
    this.frames
    this.damage
    this.spread
    this.velocity
    this.weapon

    this.setScale(4, 1)
  }

  async fire(rotation, x, y, range_min, range_max, spread_min, spread_max, spawn_offset, enemyBullet) {
    this.body.setCircle(2);
    this.enemyBullet = enemyBullet
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
    const deviation = Math.random() * (spread - (0 - spread)) + (0 - spread);
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
    this.body.velocity.x = bulletVelocityX + (player.body.velocity.x / 2);
    this.body.velocity.y = bulletVelocityY + (player.body.velocity.y / 2);
  }

  update(time, delta) {

    this.body.velocity.x = this.body.velocity.x / 1.01;
    this.body.velocity.y = this.body.velocity.y / 1.01;
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
    this.body.setSize(15, 15)
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

    if (this.weapon != weapon.length - 1) {
      let projectile
      let weaponClass
      let loop = 1
      let spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
      let deviation = Math.random() * (spread - (0 - spread)) + (0 - spread);
      let angle = (this.rotation + deviation) + Math.PI / 2;
      switch (weapon[this.weapon + 1].type) {
        case "bullet":
          weaponClass = bullets
          break
        case "arc":
          weaponClass = arcs
          break
        default:
          break
      }
      switch (weapon[this.weapon + 1].modifier) {
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
      for (let i = 0; i <= loop - 1; i++) {
        projectile = weaponClass.get(player.x, player.y);
        projectile.fire(angle, this.scale, this.x, this.y, this.weapon + 1);
        spread = Phaser.Math.Clamp(0.3 - upgrade.spread, 0.07, 0.3)
        deviation = Math.random() * (spread - (0 - spread)) + (0 - spread);
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
    const deviation = Math.random() * (spread - (0 - spread)) + (0 - spread);
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
    this.body.velocity.x = bulletVelocityX + (player.body.velocity.x / 2);
    this.body.velocity.y = bulletVelocityY + (player.body.velocity.y / 2);
  }

  update(time, delta) {

    if (this.scale < 0.5) {
      this.clearTint()
      this.body.velocity.x = this.body.velocity.x / 1.01;
      this.body.velocity.y = this.body.velocity.y / 1.01;
    } else {
      this.body.velocity.x = this.body.velocity.x * 1.1;
      this.body.velocity.y = this.body.velocity.y * 1.1;
    }
    this.setScale(this.scaleX - 0.001)
    if (this.scale < 0.4 || this.body.velocity < 12) {
      this.setActive(false)
      this.setVisible(false)
    }
    if (this.lifespan - frames <= 0) {
      this.triggerSpawn()
    }
  }
}
