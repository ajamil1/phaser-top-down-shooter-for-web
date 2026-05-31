import * as Phaser from 'phaser';

export class ThrownWeapon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.damage = 3;
    this.lifespan = 0;
    this.body.setCircle(16);
    this.body.setOffset(this.width / 2 - 16, this.height / 2 - 16);
  }

  spawn(x, y, weaponFrame, angle) {
    this.setActive(true);
    this.setVisible(true);
    this.setPosition(x, y);
    this.setFrame(weaponFrame);
    this.setScale(3);
    this.lifespan = 90;
    this.body.checkCollision.none = false;
    this.clearTint();
    this.body.velocity.x = Math.cos(angle) * 1800;
    this.body.velocity.y = Math.sin(angle) * 1800;
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.checkCollision.none = true;
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
  }

  update() {
    this.rotation += 0.2;
    this.lifespan--;
    if (this.lifespan <= 0) {
      this.deactivate();
    }
  }
}
