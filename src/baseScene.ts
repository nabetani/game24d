import * as Phaser from 'phaser';

export class BaseScene extends Phaser.Scene {
  fps(): number { return this.game.config.fps.target!; }
  canvas(): HTMLCanvasElement {
    return this.sys.game.canvas
  }
  spriteByName(name: string): Phaser.GameObjects.Sprite {
    return this.sys.displayList.getByName(name) as Phaser.GameObjects.Sprite
  }
  textByName(name: string): Phaser.GameObjects.Text {
    return this.sys.displayList.getByName(name) as Phaser.GameObjects.Text
  }
}

export const sincos = (a: number, b: number | null = null): { sin: number, cos: number } => {
  const t = b === null ? a : (Math.PI * 2 * a / b)
  return { sin: Math.sin(t), cos: Math.cos(t) }
}

export function* range(start: integer, end: integer) {
  for (let i = start; i < end; i++) {
    yield i;
  }
}
