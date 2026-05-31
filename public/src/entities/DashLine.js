import * as Phaser from 'phaser';
import { state } from '../state.js';

export class DashLine extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'dashLine');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.spawnTimer = 3500;
    this.spawnInterval = 4000;
    this.prevCameraX = 0;
    this.prevCameraY = 0;
  }

  spawn(_rotation) {
    const { player } = state;
    this.prevCameraX = this.scene.cameras.main.scrollX;
    this.prevCameraY = this.scene.cameras.main.scrollY;
    this.setAlpha(0);
    this.setActive(true);
    this.setVisible(false);
    const randomX = Phaser.Math.Between(
      Phaser.Math.Between(player.x - 1500, player.x - 1250),
      Phaser.Math.Between(player.x + 1250, player.x + 1500)
    );
    const randomY = Phaser.Math.Between(
      Phaser.Math.Between(player.y - 1500, player.y - 1250),
      Phaser.Math.Between(player.y + 1250, player.y + 1500)
    );
    this.setPosition(randomX, randomY);
    this.setRotation(player.rotation / 2 + -Math.PI / 2);
  }

  update(_time, delta) {
    const { player } = state;

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawn();
    }

    const cameraVelocityX = this.scene.cameras.main.scrollX - this.prevCameraX;
    const cameraVelocityY = this.scene.cameras.main.scrollY - this.prevCameraY;
    const cameraVelocity = Math.sqrt(cameraVelocityX ** 2 + cameraVelocityY ** 2);
    this.prevCameraX = this.scene.cameras.main.scrollX;
    this.prevCameraY = this.scene.cameras.main.scrollY;

    const pos = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
    if (pos > 1500) {
      const randomX = Phaser.Math.Between(
        Phaser.Math.Between(player.x - 1500, player.x - 1250),
        Phaser.Math.Between(player.x + 1250, player.x + 1500)
      );
      const randomY = Phaser.Math.Between(
        Phaser.Math.Between(player.y - 1500, player.y - 1250),
        Phaser.Math.Between(player.y + 1250, player.y + 1500)
      );
      this.setPosition(randomX, randomY);
    }

    this.setAlpha((1 - pos / 1500) * (1 - cameraVelocity / 35));
    if (!this.visible) this.setVisible(true);
    this.setActive(true);
    this.setRotation(Math.atan2(cameraVelocityY, cameraVelocityX));
    const scaleX = Phaser.Math.Clamp(cameraVelocity / 10, 0.08, 2000);
    this.setScale(scaleX / 2, 0.5);
  }
}
