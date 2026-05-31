import * as Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { MainGameScene } from './scenes/MainGameScene.js';

export const MAX_VELOCITY = 700;
export const MAX_RADIUS = 1000;
export const SPAWN_RATE = 100;

export const gameConfig = {
  type: Phaser.WEBGL,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      fixedStep: false,
      fps: 144,
      timeStep: 1 / 144,
      debug: false,
    },
  },
  fps: {
    smoothstep: true,
    target: 144,
    forceSetTimeOut: true,
  },
  render: {
    antialias: true,
    antialiasGL: true,
  },
  pixelArt: true,
  scene: [MainMenuScene, MainGameScene],
};
