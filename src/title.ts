import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import { range } from './calc';

export class Title extends BaseScene {
  constructor() {
    super("Title")
  }
  preload() {
    this.load.image("title", `assets/title.webp`);
  }
  addTextButton(x: number, y: number, w: number, depth: number,
    fontSize: number, padding: number,
    text: string): Phaser.GameObjects.Graphics {
    const t = this.add.text(x, y, text, {
      fontSize: fontSize,
      padding: { x: padding, y: padding }
    });
    t.setOrigin(0.5, 0.5)
    t.setDepth(depth + 1)
    const g = this.add.graphics()
    g.fillStyle(0, 0.5)
    g.lineStyle(3, 0, 1)
    const rc = new Phaser.Geom.Rectangle(x - w / 2, y - t.height / 2, w, t.height)
    const args = [rc.left, rc.top, rc.width, rc.height, t.height / 10] as const
    g.fillRoundedRect(...args);
    g.strokeRoundedRect(...args);
    g.setDepth(depth)
    g.setInteractive(rc, (rc: Phaser.Geom.Rectangle, x: number, y: number): boolean => {
      return rc.contains(x, y);
    });
    return g
  }
  addStarts() {
    const { width, height } = this.canvas();
    const col = 4;
    for (const stage of range(1, 33)) {
      const i = stage - 1
      const x = ((i % col) / col + 0.5 / col) * width
      const y = Math.floor(i / col) * 55 + height / 2
      const depth = 1
      const t = this.addTextButton(x, y, width / 4.5, depth, 20, 10, `Stage ${stage}`);
      t.on("pointerdown", () => {
        this.scene.start('Main', { stage: stage });
      });
    }
  }
  create() {
    const { width, height } = this.canvas();
    this.add.image(width / 2, height / 2, "title");
    this.addStarts();
  }
}
