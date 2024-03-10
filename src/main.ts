import * as Phaser from 'phaser';
import { BaseScene, range } from './baseScene';
import { XY, World } from './world';

const getTickSec = (): number => {
  return (new Date().getTime()) * 1e-3
}

const depth = {
  bg: 0,
  stars: 10,
  goal: 20,
  player: 100,
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
  get player(): Phaser.GameObjects.Sprite {
    return this.spriteByName("player");
  }
  get goal(): Phaser.GameObjects.Sprite {
    return this.spriteByName("goal");
  }
  constructor() {
    super("Main")
  }
  preload() {
    for (const d of range(0, 6)) {
      this.load.image(`bg${d}`, `assets/bg${d}.webp`);
    }
    this.load.image("player", "assets/player.webp");
    this.load.image("goal", "assets/goal.webp");
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
    this.add.sprite(width / 2, height / 2, "player").setDepth(depth.player).setScale(0.5).setName("player");
    this.add.sprite(width / 2, height / 2, "goal").setDepth(depth.player).setScale(0.5).setName("goal");
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
    const t = -(this.world.player.r + Math.PI / 2)
    const c = Math.cos(t)
    const s = Math.sin(t)
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
      const gx = c * wx - s * wy
      const gy = s * wx + c * wy
      bg.setPosition(gx + width / 2, gy + height / 2)
      bg.setRotation(t)
      bg.setDepth(depth.stars - z)
    })
    const goalPos = this.gpos(c, s, this.world.goal.xy)
    const angle = t * 180 / Math.PI
    this.goal.setPosition(goalPos.x, goalPos.y).setAngle(angle);
    {
      const dir = Math.atan2(goalPos.y - height / 2, goalPos.x - width / 2)
      const id = "arrow";
      const o = this.sys.displayList.getByName(id) || this.add.sprite(0, 0, "player").setScale(0.3).setName(id)
      const sp = o as Phaser.GameObjects.Sprite
      const ar = 200
      const ax = Math.cos(dir) * ar + width / 2
      const ay = Math.sin(dir) * ar + height / 2
      sp.setPosition(ax, ay).setAngle(90 + dir * (180 / Math.PI))
    }
  }
  gpos(c: number, s: number, b: XY): XY {
    const p = this.world.player.p
    const { width, height } = this.canvas()
    const t = -(this.world.player.r + Math.PI / 2)
    const wx = b.x - p.x
    const wy = b.y - p.y
    const gx = c * wx - s * wy
    const gy = s * wx + c * wy
    return new XY(gx + width / 2, gy + height / 2);
  }
  upudateObjcts() {
    const p = this.world.player.p
    const { width, height } = this.canvas()
    const t = -(this.world.player.r + Math.PI / 2)
    const c = Math.cos(t)
    const s = Math.sin(t)
    for (const b of this.world.bullets) {
      const g = this.gpos(c, s, b.p)
      const id = b.id
      const o = this.sys.displayList.getByName(id) || this.add.sprite(0, 0, "player").setScale(0.1).setName(id)
      const sp = o as Phaser.GameObjects.Sprite
      sp.setPosition(g.x, g.y);
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
