import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';

export class Main extends BaseScene {
  constructor() {
    super("Main")
  }
  preload() {
    this.load.image("bg", `assets/bg.webp`);
  }
  create() {
    const { width, height } = this.canvas();
    this.add.image(width / 2, height / 2, "bg");
  }
}
