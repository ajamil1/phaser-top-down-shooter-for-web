import * as Phaser from 'phaser';
import { state } from '../state.js';

const ICON_S = 14; // half-size of the square icon

export class Weapon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'weapon');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.speed = 0;
    this.setScale(2);
    this.selected = false;
    this.lifespan = 0;
    this.id = Phaser.Math.Between(0, 3);
    this.body.setCircle(this.body.width / 2);
    this.overlay = scene.add.image(x, y, 'weapon').setScale(2).setVisible(false).setDepth(3);
    this.gfx = scene.add.graphics().setDepth(3).setVisible(false);
    this.label = scene.add.text(x, y, '', {
      fontSize: '8px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3).setVisible(false);
  }

  setActive(value) {
    super.setActive(value);
    if (!value) {
      if (this.overlay) this.overlay.setVisible(false);
      if (this.gfx) this.gfx.setVisible(false);
      if (this.label) this.label.setVisible(false);
    }
    return this;
  }

  sprite() {
    const frames = [0, 1, 2, 3];
    // reset custom icon by default
    this.gfx.setVisible(false);
    this.label.setVisible(false);
    if (this.id === 4) {
      this.setVisible(true);
      this.setFrame(0);
      this.overlay.setFrame(0).setVisible(true);
    } else if (this.id === 5) {
      this.setVisible(false);
      this.overlay.setVisible(false);
      this._setupCustomIcon('SHD', 0x112244, 0x4488ff);
    } else if (this.id === 6) {
      this.setVisible(false);
      this.overlay.setVisible(false);
      this._setupCustomIcon('ARC', 0x001a22, 0x44eeff);
    } else if (this.id === 7) {
      // Bolt rifle — new dedicated icon (frame 4 of weapons.png).
      this.setVisible(true);
      this.setFrame(4);
      this.overlay.setVisible(false);
    } else if (this.id >= 0 && this.id <= 3) {
      this.setVisible(true);
      this.setFrame(frames[this.id]);
      this.overlay.setVisible(false);
    } else {
      this.setVisible(true);
      this.setTint(0xed00ff);
      this.overlay.setVisible(false);
    }
  }

  _setupCustomIcon(text, fillColor, strokeColor) {
    this._iconFill = fillColor;
    this._iconStroke = strokeColor;
    this.label.setText(text);
    this.gfx.setVisible(true);
    this.label.setVisible(true);
    this._redrawIcon(false);
  }

  _redrawIcon(hovered) {
    const g = this.gfx;
    g.clear();
    const stroke = hovered ? 0xff0051 : this._iconStroke;
    g.fillStyle(this._iconFill, 0.9);
    g.fillRect(-ICON_S, -ICON_S, ICON_S * 2, ICON_S * 2);
    g.lineStyle(2, stroke, 1);
    g.strokeRect(-ICON_S, -ICON_S, ICON_S * 2, ICON_S * 2);
  }

  spawn(x, y, id) {
    if (id !== undefined) this.id = id;
    this.speed = 0;
    this.selected = false;
    this.sprite();
    this.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.lifespan = 1000;
    this.setActive(true);
    this.setPosition(x, y);
    this.body.maxVelocity.set(2000);
  }

  update() {
    const { player, cursor, spaceDown } = state;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

    this.setAlpha(this.lifespan / 1000);
    this.lifespan--;
    if (this.alpha <= 0) {
      this.setActive(false);
      this.setVisible(false);
      return;
    }

    const distanceToCursor = Phaser.Math.Distance.Between(this.x, this.y, cursor.x, cursor.y);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const hovered = distanceToCursor <= 200 && distance <= 3000;

    if (hovered) {
      this.setTint(0xff0051);
      if (this.id === 4) this.overlay.setTint(0xff0051);
      if (spaceDown) this.selected = true;
    } else {
      this.clearTint();
      if (this.id === 4) this.overlay.clearTint();
    }

    this.rotation += this.speed / 100;
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;

    if (this.id === 4) {
      this.overlay.setPosition(this.x + 5, this.y + 5);
      this.overlay.setRotation(this.rotation);
      this.overlay.setAlpha(this.alpha);
    }

    if (this.id === 5 || this.id === 6) {
      this.gfx.setPosition(this.x, this.y);
      this.gfx.setRotation(this.rotation);
      this.gfx.setAlpha(this.alpha);
      this.label.setPosition(this.x, this.y);
      this.label.setRotation(this.rotation);
      this.label.setAlpha(this.alpha);
      this._redrawIcon(hovered);
    }

    if (!this.selected) {
      this.speed = 0;
    } else {
      this.speed += 0.1;
    }
  }
}
