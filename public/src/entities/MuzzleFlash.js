import * as Phaser from 'phaser';

// A brief muzzle flash at a gun's barrel. It tracks the shooter (player or enemy)
// so it stays at the muzzle for its short life, and picks a random frame each shot.
const FRAME_COUNT = 4; // muzzle-flash.png is 40x10 = 4 frames of 10x10
const LIFE_MS = 40; // brief — flashes pop and vanish, no fade

export class MuzzleFlash extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'muzzleFlash');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
    this.setDepth(5); // above the player/enemies, below the HUD
    if (this.body) this.body.checkCollision.none = true;
    this.lifespan = 0;
    this._shooter = null;
    this._trackX = 0;
    this._trackY = 0;
  }

  spawn(x, y, angle, shooter) {
    this.setActive(true).setVisible(true);
    this.setPosition(x, y);
    this.setRotation(angle);
    this.setFrame(Phaser.Math.Between(0, FRAME_COUNT - 1)); // random flash frame
    this.setScale(3.5);
    this.setAlpha(1);
    this.lifespan = LIFE_MS;
    this._shooter = shooter ?? null;
    this._trackX = shooter ? shooter.x : x;
    this._trackY = shooter ? shooter.y : y;
  }

  update(_time, delta) {
    if (!this.active) return;
    // Follow the shooter so the flash stays fixed to their gun as they move.
    if (this._shooter && this._shooter.active) {
      this.x += this._shooter.x - this._trackX;
      this.y += this._shooter.y - this._trackY;
      this._trackX = this._shooter.x;
      this._trackY = this._shooter.y;
    }
    this.lifespan -= delta;
    if (this.lifespan <= 0) this.setActive(false).setVisible(false);
  }
}
