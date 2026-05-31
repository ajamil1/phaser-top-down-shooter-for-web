import * as Phaser from 'phaser';

export class Spark extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'spark');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setAlpha(1);
    this.setDepth(3);
    this.setBounce(2);
    this.setDamping(true);
    this.speed = 0;
  }

  spawn(x, y, r) {
    this.setFrame(5);
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);
    this.scaleX = Phaser.Math.Between(10, 20);
    this.scaleY = 0.5;
    this.speed = Phaser.Math.Between(500, 2000);
    this.setMaxVelocity(this.speed);
    this.setPosition(x + Phaser.Math.Between(-50, 50), y + Phaser.Math.Between(-20, 20));
    this.setRotation(r + Phaser.Math.DegToRad(Phaser.Math.Between(-30, 30)));
    this.body.velocity.x = Math.cos(r) * -this.speed;
    this.body.velocity.y = Math.sin(r) * -this.speed;
  }

  update(time, delta) {
    if (Math.abs(this.body.velocity.x) <= 1 && Math.abs(this.body.velocity.y) <= 1) {
      this.setAlpha(this.alpha - 0.01);
      if (this.alpha <= 0.05) {
        this.setActive(false);
        this.setVisible(false);
      }
    } else {
      this.scaleX -= 0.5;
      this.body.velocity.x /= 1.01;
      this.body.velocity.y /= 1.01;
      if (this.scaleX <= 1) {
        this.setActive(false);
        this.setVisible(false);
      }
    }
  }
}
