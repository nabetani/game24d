import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import { World, PlayerType } from './world';
import { XY, sincos, clamp, range } from './calc'
import { stages } from './stages';

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
  arrowG: 180,
  arrowD: 190,
  textbase: 200,
  text: 201,
}

const divmod = (n: number, d: number): { q: number, r: number } => {
  const q = Math.floor(n / d)
  const r = n - q * d
  return { q: q, r: r }
}

const stringizeNumber = (d: number): string => {
  if (d < 0) {
    return "0.0"
  }
  const n = Math.round(d * 10)
  const f = n % 10
  const i = (n - f) / 10
  return `${i}.${f}`
}

const enemyImageCount = 7

export class Main extends BaseScene {
  started: boolean = false
  starLayerCount: number = 6
  prevTick: number = getTickSec()
  updateCount: integer = 0
  dtHist: number[] = [];
  world: World = new World()
  bgs: Phaser.GameObjects.Image[] = []
  cursorInput: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  objIDs: Set<string> = new Set<string>();
  cleared: boolean = false

  init() {
    this.started = false
    this.starLayerCount = 6
    this.prevTick = getTickSec()
    this.updateCount = 0
    this.dtHist = [];
    this.world = new World()
    this.bgs = []
    this.cursorInput = null
    this.objIDs = new Set<string>();
    this.cleared = false
  }
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
    this.load.image("arrowD", "assets/arrowD.webp");
    this.load.image("arrowG", "assets/arrowG.webp");
    this.load.image("bullet", "assets/bullet.webp");
    for (const e of range(0, enemyImageCount)) {
      this.load.image(`enemy${e}`, `assets/enemy${e}.webp`);
    }
  }
  addTexts(stageMsg: string | undefined) {
    const style = {
      fontSize: 20,
      stroke: "black",
      strokeThickness: 5,
    };
    const w = 90
    const du = this.add.text(510, 50, "宇宙デニール", {
      fontFamily: "sans-serif",
      ...style
    }).setName("dunit.text").setDepth(depth.text)
    du.setScale(w / du.width).setOrigin(1, 1)
    const duB = du.getBounds()
    const d = this.add.text(duB.left, duB.bottom, "12345.0", {
      align: "right",
      fontFamily: "monospace",
      ...style
    }).setOrigin(1, 1).setDepth(depth.text).setName("dist.text")
    d.setScale(w / d.width)
    const dB = d.getBounds()
    d.setText("")
    //
    const fixed = (text: string, bounds: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle => {
      const t = this.add.text(bounds.left - 20, bounds.bottom, text, {
        fontFamily: "sans-serif",
        ...style,
      }).setOrigin(1, 1).setDepth(depth.text).setScale(du.scale)
      return t.getBounds()
    }
    const numT = (text: string, name: string, bounds: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle => {
      const r = this.add.text(bounds.left, bounds.bottom, text, {
        align: "right",
        fontFamily: "monospace",
        ...style
      }).setOrigin(1, 1).setDepth(depth.text).setName(name).setScale(d.scale)
      const rB = r.getBounds()
      r.setText("")
      return rB
    }
    const ruB = fixed("秒", dB)
    const rB = numT("100.0", "tick.text", ruB)
    const fuB = fixed("発", rB)
    const fB = numT("1000", "fire.text", fuB)
    const kuB = fixed("殺", fB)
    const kB = numT("100", "kill.text", kuB)
    const { width, height } = this.canvas()
    if (stageMsg) {
      const o = this.add.text(width / 2, height / 4,
        stageMsg,
        {
          fontSize: 30,
          lineSpacing: 20,
          backgroundColor: "#0008",
          align: "center",
          padding: { x: 5, y: 5 },
        }).setOrigin(0.5, 0.5).setDepth(depth.text).setName("stage.text")
      if (width < o.getBounds().width) {
        o.setScale(width / o.getBounds().width)
      }
    }
  }

  create(data: { stage: number }) {
    console.log(data);
    const { width, height } = this.canvas();
    this.init()
    this.world.init(data.stage)
    this.cursorInput = this.input?.keyboard?.createCursorKeys() ?? null
    const starLayerCount = 6
    for (const ix of range(0, 9 * starLayerCount)) {
      const o = this.add.image(0, 0, `bg${0 | (ix / 9)}`)
      this.bgs.push(o)
    }
    this.addTexts(stages[data.stage]().msg)
    this.add.sprite(width / 2, height / 2, "player").setDepth(depth.player).setScale(0.25).setName("player");
    this.add.graphics().setName("pbone").setDepth(depth.player + 1)
    this.add.graphics().setName("charge").setDepth(depth.player)
    this.add.sprite(width / 2, height / 2, "goal").setDepth(depth.goal).setScale(0.5).setName("goal");
    const inputDown = (ix: 1 | 0) => {
      if (!this.started) {
        this.started = true
        const o = this.sys.displayList.getByName("stage.text")
        if (o) {
          const t = o as Phaser.GameObjects.Text
          o.destroy()
        }
      }

      this.world.inputDown(ix)
    }
    const inputUp = (ix: 1 | 0) => {
      this.world.inputUp(ix)
    }
    {
      const kb = this.input!.keyboard!
      kb.on('keydown-RIGHT', () => inputDown(0));
      kb.on('keydown-LEFT', () => inputDown(1));
      kb.on('keyup-RIGHT', () => inputUp(0));
      kb.on('keyup-LEFT', () => inputUp(1));
    }
    const zones = [
      this.add.zone(width, height / 2, width, height),
      this.add.zone(0, height / 2, width, height)]
    zones.forEach((z, ix0) => {
      const ix = ix0 == 0 ? 0 : 1
      z.setInteractive()
      z.on("pointerdown", () => { inputDown(ix) });
      z.on("pointerup", () => { inputUp(ix) });
    })
    this.updateGameObjects()
  }
  updateGameObjects() {
    this.updateBG()
    this.upudateObjcts()
    this.upudatePlayer()
    this.upudateText()
  }
  updateBG() {
    const w = 900
    const { width, height } = this.canvas();
    const t = -(this.world.player.r + Math.PI / 2)
    const { sin, cos } = sincos(t);
    this.bgs.forEach((bg, index) => {
      const qr0 = divmod(index, 9)
      const z = qr0.q
      if (z <= this.starLayerCount) {
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
      } else {
        bg.setVisible(false)
      }
    })
    const goalPos = this.gpos(cos, sin, this.world.goal.xy)
    const angle = t * 180 / Math.PI
    this.goal.setPosition(goalPos.x, goalPos.y).setAngle(angle);
    {
      const dir = Math.atan2(goalPos.y - height / 2, goalPos.x - width / 2)
      const id = "arrowG";
      const o = this.sys.displayList.getByName(id) || this.add.sprite(0, 0, "arrowG").setScale(0.5).setName(id).setDepth(depth.arrowG);
      const sp = o as Phaser.GameObjects.Sprite
      const ar = 200
      const a = XY.rt(ar, dir).add(width, height, 0.5)
      sp.setPosition(a.x, a.y).setAngle(90 + dir * (180 / Math.PI))
    }
    {
      const sv = Math.log2(this.world.player.v.norm2) - 10
      const id = "arrowD";
      const o = this.sys.displayList.getByName(id) || this.add.sprite(0, 0, "arrowD").setName(id).setDepth(depth.arrowD);
      const sp = o as Phaser.GameObjects.Sprite
      if (sv < 2) {
        sp.setVisible(false)
      } else {
        // console.log({ sv: sv })
        sp.setVisible(true)
        sp.setScale(0.5 + sv / 10)
        const dir = this.world.player.v.atan2() - this.world.player.r - Math.PI / 2;
        const ar = 100 + sv * 4
        const a = XY.rt(ar, dir).add(width, height, 0.5)
        sp.setPosition(a.x, a.y).setAngle(90 + dir * (180 / Math.PI))
      }
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
  addEnemy(id: string, im: number): Phaser.GameObjects.Sprite {
    const o = this.add.sprite(0, 0, `enemy${im}`).setName(id).setDepth(depth.enemy)
    // const m = o.postFX.addColorMatrix()
    // m.hue(360 * Math.random())
    return o
  }
  addBroken(id: string): Phaser.GameObjects.Graphics {
    const o = this.add.graphics()
    o.fillStyle(0xffffff)
    o.fillCircle(0, 0, 30)
    o.setName(id).setDepth(depth.broken)
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
      PlayerType.bones().forEach(([pf, px], i) => {
        const w = p.addByDir(r, pf).addByDir(r + Math.PI / 2, px)
        const g = this.gpos(cos, sin, w)
        graphics.fillCircle(g.x, g.y, 5)
        if (i != 0) {
          const [pf0, px0] = PlayerType.bones()[i - 1]
          for (const ix of range(1, 5)) {
            const m = ix / 5
            const ipx = px * m + px0 * (1 - m)
            const ipf = pf * m + pf0 * (1 - m)
            const w = p.addByDir(r, ipf).addByDir(r + Math.PI / 2, ipx)
            const g = this.gpos(cos, sin, w)
            graphics.fillCircle(g.x, g.y, 2)
          }
        }
      })
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
      const gr = o as Phaser.GameObjects.Graphics
      objIDs.add(id);
      this.objIDs.delete(id);
      gr.setScale((1 - b.presence ** 4))
      gr.setAlpha(Math.min(1, b.presence * 1.5))
      gr.setPosition(g.x, g.y);
      const r = b.r - this.world.player.r
    }
    for (const e of this.world.enemies) {
      const g = this.gpos(cos, sin, e.p)
      const id = e.id
      const o = this.sys.displayList.getByName(id) || this.addEnemy(id, e.im)
      const sp = o as Phaser.GameObjects.Sprite
      if (false) {
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
    // console.log("this.sys.displayList.length:", this.sys.displayList.length)
  }

  dispDist(): number {
    const g = this.world.goal.xy
    const p = this.world.player.p
    return (p.dist(g) - 280) * 3e-2
  }

  upudateText() {
    this.textByName("dist.text").setText(stringizeNumber(this.dispDist()));
    this.textByName("tick.text").setText(stringizeNumber(this.world.restTick));
    this.textByName("fire.text").setText(`${this.world.firedCount}`)
    this.textByName("kill.text").setText(`${this.world.killCount}`)
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

  showGoToTitle() {
    const { width, height } = this.canvas()
    const gtt = this.add.text(0, height, "Go to TITLE", {
      fontFamily: "sans-serif",
      fontStyle: "Bold",
      fontSize: 30,
    }).setDepth(depth.text).setOrigin(0, 1).setShadow(3, 3, "black")
    const b = gtt.getBounds()
    const c = 5
    const w = b.width + c
    const h = b.height + c
    const points = [0, 0,
      w - c * 2, 0,
      w, c * 2,
      w, h,
      0, h,
      0, 0,
    ]
    const g = this.add.polygon(0, height, points, 0xffffff, 0.5).setOrigin(0, 1).setDepth(depth.textbase)
    g.setInteractive()
    g.on("pointerdown", () => { this.scene.start('Title') })
  }

  showGameOver() {
    this.showGoToTitle()
  }

  showWelcomeBack() {
    const { width, height } = this.canvas()
    const wb = this.add.text(width * 0.5, height * 0.6, "Welcome Back!", {
      fontFamily: "serif",
      fontStyle: "Bold",
      fontSize: 60,
    }).setDepth(depth.text).setOrigin(0.5, 0.5).setShadow(3, 3, "black")
    const wbB = wb.getBounds()
    this.add.text(width * 0.5, wbB.top - 100, `Score: ${this.world.score}pts.`, {
      fontFamily: "serif",
      fontStyle: "Bold",
      fontSize: 40,
    }).setDepth(depth.text).setOrigin(0.5, 1).setShadow(3, 3, "black")
    this.showGoToTitle()
  }
  update() {
    if (this.cleared || this.world.isGameOver) {
    } else if (this.started) {
      ++this.updateCount
      const dtReal = getTickSec() - this.prevTick
      this.dtHist = [dtReal, ...this.dtHist.slice(0, 4)]
      const dtMax = Math.min(...this.dtHist)
      const dt = Math.min(1 / 20, dtReal)
      if (4 < this.dtHist.length) {
        this.starLayerCount = clamp(6 / 30 / dtMax, 1, this.starLayerCount)
      }
      console.log({ dtMaxInv: 1 / dtMax, dtHist: this.dtHist, dtinv: 1 / dt, starLayerCount: this.starLayerCount })
      this.world.update(dt, this.starLayerCount)
      this.updateGameObjects()
      this.prevTick += dtReal
      this.cleared = this.dispDist() <= 0
      if (this.cleared) {
        this.showWelcomeBack()
      }
      if (this.world.isGameOver) {
        this.showGameOver()
      }
    }
  }
}
