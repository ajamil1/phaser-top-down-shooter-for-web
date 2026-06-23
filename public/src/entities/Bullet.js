import * as Phaser from 'phaser';
import { state } from '../state.js';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.body.setSize(15, 15);
    this.enemyBullet = false;
    this.cooldown = 10;
    this.damage = 1;
    this.spread = 0;
    this.velocity = 0;
    this.reflect = false;
    this.bounces = 0;
    this.bounceCooldown = 0;
    this.setScale(4, 1);
  }

  fire(rotation, x, y, range_min, range_max, spread_min, spread_max, spawn_offset, enemyBullet, damage = 1) {
    const { player } = state;

    if (!enemyBullet) {
      this.scene.input.setDefaultCursor('url(/src/assets/cursor-shoot.png) 20 20, pointer');
      setTimeout(() => {
        this.scene.input.setDefaultCursor('url(/src/assets/cursor.png) 20 20, pointer');
      }, 70);
    }

    this.reflect = false;
    this.bounces = enemyBullet ? 0 : state.upgrade.ricochet;
    this.pierceLeft = enemyBullet ? 0 : state.upgrade.pierce;
    this.bounceCooldown = 0;
    this.body.setCircle(2);
    this.enemyBullet = enemyBullet;
    this.body.setOffset(this.width / 2 - 2, this.height / 2 - 2);
    this.scaleX = 3.5;
    this.scaleY = 0.5;
    this.lifespan = state.frames + 10;
    this.velocity = Phaser.Math.Between(range_min, range_max);
    this.damage = damage;
    this.spread = Phaser.Math.Clamp(spread_max, spread_min, spread_max);
    this.body.checkCollision.none = false;
    this.setTint(0xffffff);
    this.setActive(true);
    this.setVisible(true);

    const deviation = Math.random() * this.spread * 2 - this.spread;
    const angle = rotation + deviation + -Math.PI / 2;
    this.setRotation(angle);
    this.setBounce(1);

    const offsetX = spawn_offset * Math.cos(angle);
    const offsetY = spawn_offset * Math.sin(angle);
    this.setPosition(x + offsetX, y + offsetY);

    const vx = Math.cos(angle) * this.velocity;
    const vy = Math.sin(angle) * this.velocity;

    if ((this.x === player.x && this.y === player.y) || (vx === 0 && vy === 0)) {
      this.setActive(false);
      this.setVisible(false);
      return;
    }

    this.body.velocity.x = vx + player.body.velocity.x / 2;
    this.body.velocity.y = vy + player.body.velocity.y / 2;
  }

  bulletReflected() {
    if (this.reflect) return;
    this.reflect = true;
    this.scaleX = -this.scaleX;
    this.setTint(0xffff69);

    const deflectAngle = Phaser.Math.DegToRad(Phaser.Math.Between(-90, 90));
    this.rotation += deflectAngle;

    this.body.velocity.x = -0.8 * Math.cos(this.rotation) * this.velocity;
    this.body.velocity.y = -0.8 * Math.sin(this.rotation) * this.velocity;

    const { player } = state;
    this.body.velocity.x += player.body.velocity.x / 2;
    this.body.velocity.y += player.body.velocity.y / 2;

    this.setRotation(Phaser.Math.Angle.Between(0, 0, -this.body.velocity.x, -this.body.velocity.y));
  }

  // eslint-disable-next-line no-unused-vars
  update(_time, _delta) {
    if (this.bounceCooldown > 0) this.bounceCooldown--;
    this.body.velocity.x /= 1.01;
    this.body.velocity.y /= 1.01;

    if (this.scaleX >= 0) {
      this.scaleX -= 0.04;
    } else {
      this.scaleX += 0.04;
    }

    if (Math.abs(this.scaleX) <= 0.1) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
