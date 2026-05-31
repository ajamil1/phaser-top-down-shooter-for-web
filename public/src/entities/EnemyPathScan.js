import * as Phaser from 'phaser';

export class EnemyPathScan extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(1, 1);
    this.setDepth(5);
    this.setActive(true);
    this.partner = null;
  }

  spawn(partner) {
    this.partner = partner;
  }

  detection() {
    if (this.partner) {
      this.x += Math.cos(this.partner.rotation + Phaser.Math.DegToRad(this.partner.sightAngle)) * -30;
      this.y += Math.sin(this.partner.rotation + Phaser.Math.DegToRad(this.partner.sightAngle)) * -30;
    }
  }

  update() {}
}
