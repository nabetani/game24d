import * as Phaser from 'phaser';
import { BaseScene, range } from './baseScene';
import { World } from './world';

const getTickSec = (): number => {
  return (new Date().getTime()) * 1e-3
}

const depth = {
  bg: 0,
  stars: 10,
  player: 20,
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
  player: Phaser.GameObjects.Sprite | null = null
  constructor() {
    super("Main")
  }
  preload() {
    for (const d of range(0, 6)) {
      this.load.image(`bg${d}`, `assets/bg${d}.webp`);
    }
    this.load.image("player", "assets/player.webp");
  }
  create() {
    const { width, height } = this.canvas();
    this.world.init()
    this.prevTick = getTickSec()
    this.cursorInput = this.input?.keyboard?.createCursorKeys() ?? null
    for (const ix of range(0, 9 * 6)) {
      const o = this.add.image(0, 0, `bg${0 | (ix / 9)}`)
      this.bgs.push(o)
    }
    this.player = this.add.sprite(width / 2, height / 2, "player").setDepth(depth.player).setScale(0.5);
    {
      const kb = this.input!.keyboard!
      kb.on('keydown-RIGHT', () => this.world.inputDown(0));
      kb.on('keydown-LEFT', () => this.world.inputDown(1));
      kb.on('keyup-RIGHT', () => this.world.inputUp(0));
      kb.on('keyup-LEFT', () => this.world.inputUp(1));
    }
  }
  updateBG() {
    const w = 900
    const { width, height } = this.canvas();
    this.bgs.forEach((bg, index) => {
      const qr0 = divmod(index, 9)
      const z = qr0.q
      const px = this.world.player.x * (1.2 ** -z)
      const py = this.world.player.y * (1.2 ** -z)
      const icx = Math.floor(px / w + 0.5)
      const icy = Math.floor(py / w + 0.5)
      const qr = divmod(qr0.r, 3)
      const x = qr.r + icx - 1
      const y = qr.q + icy - 1
      const wx = x * w - px
      const wy = y * w - py
      const t = -(this.world.player.r + Math.PI / 2)
      const c = Math.cos(t)
      const s = Math.sin(t)
      const gx = c * wx - s * wy
      const gy = s * wx + c * wy
      bg.setPosition(gx + width / 2, gy + height / 2)
      bg.setRotation(t)
      bg.setDepth(depth.stars - z)
    })
  }
  upudateObjcts() {
    const p = this.world.player.p
    const { width, height } = this.canvas()
    const t = -(this.world.player.r + Math.PI / 2)
    const c = Math.cos(t)
    const s = Math.sin(t)
    for (const b of this.world.bullets) {
      const wx = b.x - p.x
      const wy = b.y - p.y
      const id = b.id
      const o = this.sys.displayList.getByName(id) || this.add.sprite(0, 0, "player").setScale(0.1).setName(id)
      const gx = c * wx - s * wy
      const gy = s * wx + c * wy
      const sp = o as Phaser.GameObjects.Sprite
      sp.setPosition(gx + width / 2, gy + height / 2)
    }
  }

  update() {
    const dt = getTickSec() - this.prevTick
    this.world.update(dt)
    this.updateBG()
    this.upudateObjcts()
    this.prevTick += dt
  }
}
