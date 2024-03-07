import * as Phaser from 'phaser';
import { BaseScene, range } from './baseScene';
import { World } from './world';

const getTickSec = (): number => {
  return (new Date().getTime()) * 1e-3
}

const depth = {
  bg: 0,
  stars: 10,
}

export class Main extends BaseScene {
  prevTick: number = getTickSec()
  world: World = new World()
  bgs: Phaser.GameObjects.Image[] = []
  cursorInput: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  constructor() {
    super("Main")
  }
  preload() {
    this.load.image("bg", `assets/bg.webp`);
  }
  create() {
    const { width, height } = this.canvas();
    this.world.init()
    this.prevTick = getTickSec()
    this.cursorInput = this.input?.keyboard?.createCursorKeys() ?? null
    for (const xy of range(0, 9)) {
      const ix = xy % 3 - 1
      const iy = (xy - (ix + 1)) / 3 - 1
      const o = this.add.image(ix * 512, iy * 900, "bg")
      o.setData("pos", { x: ix, y: iy })
      this.bgs.push(o)
    }
  }
  updateBG() {
    for (const bg of this.bgs) {
      const { x, y } = bg.getData("pos")
      const wx = x * 512 - this.world.player.x
      const wy = y * 900 - this.world.player.y
      const t = -(this.world.player.d + Math.PI / 2)
      const c = Math.cos(t)
      const s = Math.sin(t)
      const gx = c * wx - s * wy
      const gy = s * wx + c * wy
      bg.setPosition(gx + 512 / 2, gy + 900 / 2)
      bg.setRotation(t)
    }
  }

  update() {
    const dt = getTickSec() - this.prevTick
    if (this.cursorInput?.right.isDown) {
      this.world.player.d += 0.01
    } else if (this.cursorInput?.left.isDown) {
      this.world.player.d -= 0.01
    }
    this.world.update(dt)
    this.updateBG()
    this.prevTick += dt
  }
}
