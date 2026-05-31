import * as Phaser from 'phaser';
import { state } from '../state.js';

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemyBullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.body.setSize(15, 15);
    this.cooldown = 10;
    this.damage = 1;
    this.spread = 0;
    this.velocity = 0;
    this.weapon = 0;
    this.lifespan = 0;
  }

  hit() {
    const { player } = state;
    player.setTint(0xff0051);
    setTimeout(() => {
      this.setActive(false);
      this.setVisible(false);
      this.body.checkCollision.none = true;
      player.clearTint();
    }, 50);
  }

  triggerSpawn() {
    const { upgrade, bullets, player, frames } = state;
    this.setActive(false);
    this.setVisible(false);
  }

  fire(rotation, scale, x, y, i) {
    const { player, frames } = state;
    this.weapon = i;
    this.lifespan = frames + 50;
    this.velocity = 1500;
    this.damage = 1;
    this.spread = 0.3;
    this.body.checkCollision.none = false;
    this.setScale(scale);
    this.setTint(0xffffff);
    this.setActive(true);
    this.setVisible(true);

    const deviation = Math.random() * this.spread * 2 - this.spread;
    const angle = rotation + deviation + -Math.PI / 2;
    this.setRotation(angle);
    this.setBounce(1);

    const offsetX = 10 * Math.cos(angle);
    const offsetY = 10 * Math.sin(angle);
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

  update(time, delta) {
    const { frames } = state;

    if (this.scale < 0.5) {
      this.clearTint();
      this.body.velocity.x /= 1.01;
      this.body.velocity.y /= 1.01;
    } else {
      this.body.velocity.x *= 1.1;
      this.body.velocity.y *= 1.1;
    }

    this.setScale(this.scaleX - 0.001);

    if (this.scale < 0.4) {
      this.setActive(false);
      this.setVisible(false);
    }

    if (this.lifespan - frames <= 0) {
      this.triggerSpawn();
    }
  }
}
