import * as Phaser from 'phaser';
import { Title } from "./title";
import { Main } from "./main";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 512,
  height: 900,
  parent: 'game-app',
  scene: [Title, Main],
  input: {
    activePointers: 3
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  }
};

new Phaser.Game(config);
