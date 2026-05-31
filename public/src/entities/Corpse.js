import * as Phaser from 'phaser';

export class Corpse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setDepth(0);
    this.setBounce(2);
    this.setDamping(true);
    this.setDrag(0.001);
  }

  spawn(x, y, r, vx, vy) {
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);
    this.setScale(3);
    this.speed = Phaser.Math.Between(400, 550);
    this.setMaxVelocity(this.speed);
    this.play('knockdown', true);
    this.setPosition(x, y);
    this.rotation = r + Phaser.Math.DegToRad(270);
    this.body.velocity.x = vx * -6;
    this.body.velocity.y = vy * -6;
  }

  update(time, delta) {
    if (Math.abs(this.body.velocity.x) <= 1 && Math.abs(this.body.velocity.y) <= 1) {
      this.body.velocity.x = 0;
      this.body.velocity.y = 0;
      this.setAlpha(this.alpha - 0.001);
      if (this.alpha <= 0.05) {
        this.setActive(false);
        this.setVisible(false);
      }
    } else {
      this.body.velocity.x /= 1.07;
      this.body.velocity.y /= 1.07;
    }
  }
}
