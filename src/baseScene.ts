import * as Phaser from 'phaser';

export class BaseScene extends Phaser.Scene {
  fps(): number { return this.game.config.fps.target!; }
  canvas(): HTMLCanvasElement {
    return this.sys.game.canvas
  }
}
