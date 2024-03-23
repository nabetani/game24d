import * as Phaser from 'phaser';
import { BaseScene, range } from './baseScene';
import { World, PlayerType } from './world';
import { XY, sincos } from './calc'

const getTickSec = (): number => {
  return (new Date().getTime()) * 1e-3
}

const depth = {
  bg: 0,
  stars: 10,
  goal: 20,
  enemy: 100,
  broken: 105,
  player: 110,
  bullet: 120,
  arrow: 180,
  text: 200,
}

const divmod = (n: number, d: number): { q: number, r: number } => {
  const q = Math.floor(n / d)
  const r = n - q * d
  return { q: q, r: r }
}

const stringizeDist = (d: number): string => {
  if (d <= 0) {
    return "0"
  }
  const p = Math.max(0, Math.log10(d))
  if (5.999 < p) { return "測定不能" }
  const n = Math.ceil(p);
  let r = "";
  for (const i of range(0, 10)) {
    const x = n - i
    const s = Math.floor(d / 10 ** x);
    if (x === -1) {
      r += (r === "" ? "0." : ".")
    }
    if (s != 0 || r !== "") {
      r += `${s}`
    }
    d -= s * 10 ** x
    if (5 < r.length && x <= 0) {
      break
    }
  }
  return r;
}

export class Main extends BaseScene {
  prevTick: number = getTickSec()
  updateCount: integer = 0
  world: World = new World()
  bgs: Phaser.GameObjects.Image[] = []
  cursorInput: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  objIDs: Set<string> = new Set<string>();

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
    this.load.image("enemy", "assets/enemy.webp");
    this.load.image("arrow", "assets/arrow.webp");
    this.load.image("bullet", "assets/bullet.webp");
    this.load.image("goal", "assets/goal.webp");
  }
  addTexts() {
    const style = {
      fontSize: 50,
    };
    const u = this.add.text(250, 30, "宇宙デニール", {
      fontFamily: "sans-serif",
      ...style
    }).setName("unit.text").setDepth(depth.text)
    u.setScale(200 / u.width)
    const ub = u.getBounds()
    const d = this.add.text(ub.left - 20, ub.bottom, "0.400000", {
      align: "right",
      fontFamily: "monospace",
      ...style
    }).setOrigin(1, 1).setDepth(depth.text).setName("dist.text")
    d.setScale(200 / d.width)
    d.setText("")
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
    this.addTexts()
    this.add.sprite(width / 2, height / 2, "player").setDepth(depth.player).setScale(0.5).setName("player");
    this.add.graphics().setName("pbone").setDepth(depth.player + 1)
    this.add.graphics().setName("charge").setDepth(depth.player)
    this.add.sprite(width / 2, height / 2, "goal").setDepth(depth.goal).setScale(0.5).setName("goal");
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
    const { sin, cos } = sincos(t);
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
      const gx = cos * wx - sin * wy
      const gy = sin * wx + cos * wy
      bg.setPosition(gx + width / 2, gy + height / 2)
      bg.setRotation(t)
      bg.setDepth(depth.stars - z)
    })
    const goalPos = this.gpos(cos, sin, this.world.goal.xy)
    const angle = t * 180 / Math.PI
    this.goal.setPosition(goalPos.x, goalPos.y).setAngle(angle);
    {
      const dir = Math.atan2(goalPos.y - height / 2, goalPos.x - width / 2)
      const id = "arrow";
      const o = this.sys.displayList.getByName(id) || this.add.sprite(0, 0, "arrow").setScale(0.5).setName(id).setDepth(depth.arrow);
      const sp = o as Phaser.GameObjects.Sprite
      const ar = 230
      const a = XY.rt(ar, dir).add(width, height, 0.5)
      sp.setPosition(a.x, a.y).setAngle(90 + dir * (180 / Math.PI))
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
  addEnemy(id: string): Phaser.GameObjects.Sprite {
    const o = this.add.sprite(0, 0, "enemy").setName(id).setDepth(depth.enemy)
    const m = o.postFX.addColorMatrix()
    m.hue(360 * Math.random())
    return o
  }
  addBroken(id: string): Phaser.GameObjects.Sprite {
    const o = this.add.sprite(0, 0, "enemy").setName(id).setDepth(depth.broken)
    const m = o.postFX.addColorMatrix()
    m.hue(360 * Math.random())
    return o
  }
  addBullet(id: string, power: number): Phaser.GameObjects.Sprite {
    return this.add.sprite(0, 0, "bullet").setName(id).setDepth(depth.bullet).setScale((power * 3 + 1) / 8)
  }
  upudateObjcts() {
    const p = this.world.player.p
    const { width, height } = this.canvas()
    const t = -(this.world.player.r + Math.PI / 2)
    const { sin, cos } = sincos(t)
    const objIDs = new Set<string>();
    if (false) {
      const graphics = this.sys.displayList.getByName("pbone") as Phaser.GameObjects.Graphics
      graphics.clear()
      graphics.fillStyle(0xff0000)
      const r = this.world.player.r
      for (const [pf, px] of PlayerType.bones()) {
        const w = p.addByDir(r, pf).addByDir(r + Math.PI / 2, px)
        const g = this.gpos(cos, sin, w)
        graphics.fillCircle(g.x, g.y, 10)
      }
    }
    for (const b of this.world.bullets) {
      const g = this.gpos(cos, sin, b.p)
      const id = b.id
      const o = this.sys.displayList.getByName(id) || this.addBullet(id, b.power)
      const sp = o as Phaser.GameObjects.Sprite
      objIDs.add(id);
      this.objIDs.delete(id);
      sp.setPosition(g.x, g.y);
      sp.setScale(b.rad / 80)
      sp.setAngle((b.r - this.world.player.r) * 180 / Math.PI);
    }
    for (const b of this.world.brokens) {
      const g = this.gpos(cos, sin, b.p)
      const id = b.id
      const o = this.sys.displayList.getByName(id) || this.addBroken(id)
      const sp = o as Phaser.GameObjects.Sprite
      sp.setScale(b.presence)
      objIDs.add(id);
      this.objIDs.delete(id);
      sp.setPosition(g.x, g.y);
      const r = b.r - this.world.player.r
      sp.setAngle(r * (180 / Math.PI))
    }
    for (const e of this.world.enemies) {
      const g = this.gpos(cos, sin, e.p)
      const id = e.id
      const o = this.sys.displayList.getByName(id) || this.addEnemy(id)
      const sp = o as Phaser.GameObjects.Sprite
      {
        const scale = sp.scale
        const z = 1 / 50
        const u = 1.1 < scale ? 0 : z
        const d = scale < 0.9 ? 0 : -z
        sp.setScale(scale + Math.random() * (u - d) + d)
      }
      objIDs.add(id);
      this.objIDs.delete(id);
      sp.setPosition(g.x, g.y);
      const r = e.r - this.world.player.r
      sp.setAngle(r * (180 / Math.PI))
    }
    this.objIDs.forEach(id => {
      this.spriteByName(id).destroy()
    })
    this.objIDs = objIDs;
    console.log("this.sys.displayList.length:", this.sys.displayList.length)
  }

  dispDist(): number {
    const g = this.world.goal.xy
    const p = this.world.player.p
    return (p.dist(g) - 280) * 3e-2
  }

  upudateText() {
    const t = this.textByName("dist.text");
    t.setText(stringizeDist(this.dispDist()));
  }
  upudatePlayer() {
    const { width, height } = this.canvas();
    const graphics = this.graphicsByName("charge");
    graphics.clear()
    const h0 = 90
    for (const gunId of [0, 1]) {
      const ch = this.world.charged(gunId)
      if (1 <= ch) {
        graphics.fillStyle((0 == (this.updateCount & 4)) ? 0xff8888 : 0xffffff)
      } else {
        graphics.fillStyle(0xff0000)
      }
      const x = width / 2 + (gunId === 0 ? 1 : -1) * 50
      const h = h0 * ch
      const y = height / 2 + h0 / 2 - h
      const w = (gunId === 0 ? 1 : -1) * -15
      graphics.fillRect(x, y, w, h);
    }
  }

  update() {
    ++this.updateCount
    const dt = getTickSec() - this.prevTick
    this.world.update(dt)
    this.updateBG()
    this.upudateObjcts()
    this.upudatePlayer()
    this.upudateText()
    this.prevTick += dt
  }
}
