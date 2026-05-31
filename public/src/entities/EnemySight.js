import * as Phaser from 'phaser';
import { state } from '../state.js';

export class EnemySight extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sight');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(0.1, 0.1);
    this.partner = null;
    this.sightAngle = 270;
    this.scan = 0;
    this.polarity = 1;
    this.wall = null;
    this.scanner = state.enemyPathScanners?.getFirstDead(this.x, this.y) ?? null;
    if (this.scanner) {
      this.scanner.spawn(this);
    }
  }

  spawn(partner, angle, polarity) {
    this.polarity = polarity;
    this.sightAngle = angle;
    this.partner = partner;
    this.wall = null;
    this.setAlpha(0);
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(partner.x, partner.y);
    this.body.setCircle(12);
    this.body.setOffset(this.width / 2 - 12, this.height / 2 - 12);
    this.rotation = this.partner.legs.rotation;
  }

  detection(wall) {
    if (this.wall === null) this.wall = wall;
    this.partner.divert(wall, this.polarity, this.sightAngle);
  }

  update() {
    this.scan += 10;
    this.scaleX += 0.07;
    this.scaleY += 0.07;

    if (this.scan >= 300) {
      this.scan = 0;
      this.partner.clear();
      this.setScale(0.1, 0.1);
      this.wall = null;
    }

    this.body.velocity.x = this.partner.body.x;
    this.body.velocity.y = this.partner.body.y;

    if (this.partner.wall === null) {
      this.x = this.partner.x + Math.cos(this.partner.legs.rotation + Phaser.Math.DegToRad(this.sightAngle)) * this.scan;
      this.y = this.partner.y + Math.sin(this.partner.legs.rotation + Phaser.Math.DegToRad(this.sightAngle)) * this.scan;
    } else {
      this.setScale(0.1, 0.1);
      this.setPosition(this.partner.x, this.partner.y);
    }

    this.setRotation(this.partner.legs.rotation);
  }
}
