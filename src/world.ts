import { Segment, XY, range } from './calc'
import { stages, pva } from './stages';

export class Mobj {
  pOld: XY = new XY(0, 0)
  p: XY = new XY(0, 0)
  v: XY = new XY(0, 0) // pix / s
  a: XY = new XY(0, 0) // pix / s**2
  ar: number = 0
  r: number = 0 // rad
  vr: number = 0 // rad / s
  id: string = Mobj.newID()
  static zero(): Mobj {
    return new Mobj()
  }
  static nextID: integer = 0
  static newID(): string {
    return `${++Mobj.nextID}`
  }
  get x(): number { return this.p.x }
  get y(): number { return this.p.y }
  static forget: number = 0.9
  dev(dt: number) {
    this.a = this.a.mul(Mobj.forget);
    this.v = this.v.mulAdd(this.a, dt)
    this.pOld = this.p
    this.p = this.p.mulAdd(this.v, dt)

    this.ar *= Mobj.forget
    this.vr += this.ar * dt
    this.r += this.vr * dt
  }
}

const vrot = (seed: (number | XY | null)[]): number => {
  let s = 0
  seed.forEach((v, ix) => {
    const e = ("number" === typeof (v)) ? v
      : (null === v) ? 1
        : v.x + v.y * (1 << 16)
    s = (e * (ix + 1.1) + s * 1.2) % 8
  })
  s -= 4
  return s < 0 ? -1 + s / 4 : 1 + s / 4
}

export class Bullet extends Mobj {
  _power: number
  constructor(power: number) {
    super()
    this._power = power
  }
  get power(): number {
    return Math.max(0, Math.min(this._power, 1))
  }
  get dead(): boolean {
    return this.power <= 0
  }
  get rad(): number {
    return this.power * 60 + 10
  }
  decPower() {
    const e = 1.4
    const f = (p: number): number => Math.max(0, p ** e - 0.02) ** (1 / e)
    this._power = f(f(this._power))
  }
}

export class Enemy extends Mobj {
  im: number = 0
  pvaProc: null | ((p: XY, ep: XY, ev: XY, dt: number) => pva) = null
  get rad() { return 50 }
  secSinceDeath: number = -1
  get isLiving(): boolean {
    return this.secSinceDeath < 0
  }
  get isKilled(): boolean {
    return 0 <= this.secSinceDeath
  }

  setKilled() {
    if (this.isLiving) {
      this.secSinceDeath = 0
    }
  }

  dev(dt: number) {
    if (!this.isLiving) {
      this.secSinceDeath += dt
    }
    super.dev(dt)
  }
}
export class Broken extends Mobj {
  presence: number = 1
  dev(dt: number) {
    this.presence = Math.max(0, this.presence - dt);
    super.dev(dt)
  }
  get isVisible(): boolean {
    return 0 < this.presence
  }
}

export class PlayerType extends Mobj {
  killed: boolean = false
  static bones(): [number, number][] {
    return [[15, -9], [-15, -5], [-15, 5], [15, 9]]
  }
  hitTest(p: XY) {
    const r = this.r
    const pts = PlayerType.bones().map((p) => {
      return this.p.addByDir(r, p[0]).addByDir(r + Math.PI / 2, p[1])
    })
    for (const ix of range(1, pts.length)) {
      const seg = new Segment(pts[ix - 1], pts[ix])
      if (seg.dist(p) < 25) {
        this.killed = true
      }
    }
  }
}

export class World {
  _goal = { rad: 120, xy: new XY(400, 0) }
  get goal() { return this._goal }
  firedCount: number = 0
  killCount: number = 0
  restTick: number = 100
  player: PlayerType = new PlayerType()
  enemies: Set<Enemy> = new Set<Enemy>();
  brokens: Set<Broken> = new Set<Broken>()
  gunCharge: (number | null)[] = []
  bullets: Bullet[] = []
  updateBullets(dt: number) {
    const bullets: Bullet[] = []
    for (const b of this.bullets) {
      if (b.dead) { continue }
      b.dev(dt)
      if (this.player.p.dist(b.p) < 900) {
        bullets.push(b)
      }
    }
    this.bullets = bullets
  }
  init(stage: number) {
    const s = stages[stage]()
    s.enemies.forEach(
      (ei, ix) => {
        const e = new Enemy();
        e.im = ei.im
        e.p = ei.p
        e.r = ei.r
        e.v = ei.v
        e.vr = ei.vr ?? vrot([e.p, e.r, e.v, ix])
        e.pvaProc = ei.pva || null
        this.enemies.add(e)
      }
    );
    this._goal.xy = s.goal
  }

  updateBrokens(dt: number) {
    const brokens: Set<Broken> = new Set<Broken>()
    this.brokens.forEach(b => {
      if (!b.isVisible) {
        return;
      }
      b.dev(dt)
      brokens.add(b)
    })
    this.brokens = brokens
  }

  addBrokens(e: Enemy) {
    const bro = new Broken()
    this.brokens.add(bro)
    bro.p = e.p
    bro.v = e.v.dup()
  }

  updateEnemies(dt: number, slc: number): number[] {
    const enemies: Set<Enemy> = new Set<Enemy>()
    let k: number[] = []
    this.enemies.forEach(e => {
      if (!e.isLiving) {
        return []
      }
      if (e.pvaProc) {
        const act = e.pvaProc(this.player.p, e.p, e.v, dt)
        e.p = act.p ?? e.p
        e.v = act.v ?? e.v
        e.a = act.a ?? e.a
      }
      e.dev(dt)
      this.player.hitTest(e.p)
      this.bullets.forEach(b => {
        const p0 = b.p.subP(e.p)
        const p1 = b.pOld.subP(e.pOld)
        const seg = new Segment(p0, p1)
        if (seg.dist() < e.rad + b.rad && e.isLiving) {
          this.addBrokens(e)
          b.decPower()
          e.setKilled()
          this.killCount++;
          k.push(e.im)
        }
      })
      enemies.add(e)
    })
    this.enemies = enemies
    return k
  }
  get isGameOver(): boolean {
    return this.player.killed || this.restTick <= 0
  }
  get score(): integer {
    const lt = (th: number): number => (this.firedCount < th ? 1 : 0)
    const fireScore = [750, 1000, 1250, 1500, 2000][lt(4) + lt(10) + lt(30) + lt(100)]
    const killAllScore = this.enemies.size == 0 ? 2000 : 0
    return Math.round(this.restTick * 10) + (this.killCount * 100) + killAllScore + fireScore
  }
  update(dt: number, slc: number): number[] {
    if (this.isGameOver) {
      return []
    }
    this.restTick -= dt
    // console.log({ player_a: this.player.a.norm, player_v: this.player.v.norm })
    this.player.dev(dt)
    this.addCharge(0, dt)
    this.addCharge(1, dt)
    this.updateBullets(dt);
    const k = this.updateEnemies(dt, slc);
    this.updateBrokens(dt);
    return k
  }
  startCharging(gunId: integer) {
    this.gunCharge[gunId] = 0
  }
  addCharge(gunId: integer, dt: number) {
    const o = this.gunCharge[gunId]
    this.gunCharge[gunId] = (o === null ? null : o + dt)
  }
  charged(gunId: integer): number {
    return Math.min(1, (this.gunCharge[gunId] ?? 0))
  }
  get fireLimit(): integer { return 1 / 16 }
  fire(gunId: integer): number | null {
    const ch = this.charged(gunId)
    this.gunCharge[gunId] = null
    if (ch < this.fireLimit) {
      return null
    }
    this.firedCount++
    const b = new Bullet(ch)
    b.p = this.player.p.dup()
    b.vr = 6
    b.p.incByDir(this.player.r + 0.4 * [1, -1][gunId], 32)
    b.v = this.player.v.dup()
    b.v.incByDir(this.player.r, 200 * (1 + b.power * 3))
    b.p.incByDir(b.v.atan2(), b.rad)

    this.player.ar += 3 * [1, -1][gunId] * (0.1 + b.power * 2)
    this.player.a.incByDir(this.player.r, -100 * (0.1 + 10 * b.power ** 2))
    this.bullets.push(b)
    return ch
  }
  inputDown(gunId: integer): boolean {
    if (this.player.killed) {
      return false
    }
    this.startCharging(gunId)
    return true
  }
  inputUp(gunId: integer): number | null {
    if (this.player.killed) {
      return null
    }
    return this.fire(gunId)
  }
};

