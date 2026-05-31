import './style.css';
import * as Phaser from 'phaser';
import { gameConfig } from './config.js';

const game = new Phaser.Game(gameConfig);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
