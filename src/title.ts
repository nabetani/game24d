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
    const t = this.add.text(width / 2, height / 2, "Start", {
      fontSize: "50px",
      backgroundColor: "#000a",
      padding: { x: 10, y: 10 },
    });
    t.setOrigin(0.5, 0.5);
    t.setInteractive();
    t.on("pointerdown", () => {
      this.scene.start('Main');
    });
  }
}
