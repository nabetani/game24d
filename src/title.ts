import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';

export class Title extends BaseScene {
  constructor() {
    super("Title")
  }
  preload() {
    this.load.image("title", `assets/title.webp`);
  }
  create() {
    const { width, height } = this.canvas();
    this.add.image(width / 2, height / 2, "title");
  }
}
