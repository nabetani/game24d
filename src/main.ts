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

const divmod = (n: number, d: number): { q: number, r: number } => {
  const q = Math.floor(n / d)
  const r = n - q * d
  return { q: q, r: r }
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
    this.world.init()
    this.prevTick = getTickSec()
    this.cursorInput = this.input?.keyboard?.createCursorKeys() ?? null
    for (const xy of range(0, 9 * 6)) {
      const o = this.add.image(0, 0, "bg")
      this.bgs.push(o)
    }
  }
  updateBG() {
    const w = 900
    const { width, height } = this.canvas();
    this.bgs.forEach((bg, index) => {
      const qr0 = divmod(index, 9)
      const z = qr0.q
      const px = this.world.player.x * (1.4 ** -z)
      const py = this.world.player.y * (1.4 ** -z)
      const icx = Math.floor(px / w + 0.5)
      const icy = Math.floor(py / w + 0.5)
      const qr = divmod(qr0.r, 3)
      const x = qr.r + icx - 1
      const y = qr.q + icy - 1
      const wx = x * w - px
      const wy = y * w - py
      const t = -(this.world.player.d + Math.PI / 2)
      const c = Math.cos(t)
      const s = Math.sin(t)
      const gx = c * wx - s * wy
      const gy = s * wx + c * wy
      bg.setPosition(gx + width / 2, gy + height / 2)
      bg.setRotation(t)
      bg.setDepth(depth.stars - z)
    })
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
