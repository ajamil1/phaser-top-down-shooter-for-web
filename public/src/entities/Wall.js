import * as Phaser from 'phaser';

export class Wall extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'wall');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setDepth(4);
    this.spawnX = x;
    this.spawnY = y;
    this.lifespan = 0;
  }

  spawn(x, y, w, h) {
    this.spawnX = x;
    this.spawnY = y;
    this.setPushable(false);
    this.setScale(w / 100, h / 100);
    if (this.body) this.body.checkCollision.none = false;
    this.setActive(true);
    this.setVisible(true);
  }

  update() {
    this.lifespan++;
    if (this.lifespan >= 50) {
      this.setPosition(this.spawnX, this.spawnY);
    }
  }
}
