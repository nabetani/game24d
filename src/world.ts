import { range } from './baseScene';
import { Segment, XY } from './calc'

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
    this.a.x *= Mobj.forget
    this.a.y *= Mobj.forget
    this.v = this.v.mulAdd(this.a, dt)
    this.pOld = this.p
    this.p = this.p.mulAdd(this.v, dt)

    this.ar *= Mobj.forget
    this.vr += this.ar * dt
    this.r += this.vr * dt
  }
}

export class Bullet extends Mobj {
  hit: boolean = false
}

export class Enemy extends Mobj {
  get rad() { return 50 }
  secSinceDeath: number = -1
  get isLiving(): boolean {
    return this.secSinceDeath < 0
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

export class PlayerType extends Mobj {
  killed: boolean = false
  static bones(): [number, number][] {
    return [[30, 18], [30, -18], [-30, -10], [-30, 10]]
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
  get goal() { return { rad: 120, xy: new XY(400, 0) } }
  player: PlayerType = new PlayerType()
  enemies: Set<Enemy> = new Set<Enemy>();
  gunCharge: number[] = []
  bullets: Bullet[] = []
  updateBullets(dt: number) {
    const bullets: Bullet[] = []
    for (const b of this.bullets) {
      if (b.hit) { continue }
      b.dev(dt)
      if (this.player.p.dist(b.p) < 900) {
        bullets.push(b)
      }
    }
    this.bullets = bullets
  }
  updateEnemies(dt: number) {
    const enemies: Set<Enemy> = new Set<Enemy>()
    this.enemies.forEach(e => {
      if (!e.isLiving) {
        return;
      }
      e.dev(dt)
      this.player.hitTest(e.p)
      this.bullets.forEach(b => {
        const p0 = b.p.subP(e.p)
        const p1 = b.pOld.subP(e.pOld)
        const seg = new Segment(p0, p1)
        if (seg.dist() < e.rad) {
          e.vr += 10
          b.hit = true
          e.setKilled()
        }
      })
      enemies.add(e)
    })
    this.enemies = enemies
  }
  update(dt: number) {
    if (this.player.killed) {
      return
    }
    this.player.dev(dt)
    this.updateBullets(dt);
    this.updateEnemies(dt);
  }
  init() {
    const ec = 20
    for (const i of range(0, ec)) {
      this.enemies.add(((): Enemy => {
        const e = new Enemy();
        const t = Math.PI * 2 * i / ec
        e.p = this.goal.xy.addByDir(t, 300)
        e.r = t
        return e;
      })());
      this.enemies.add(((): Enemy => {
        const e = new Enemy();
        const t = Math.PI * 2 * i / ec
        e.p = XY.rt(300, t)
        e.r = t
        return e;
      })());
    }
  }
  charge(gunId: integer) {
    this.gunCharge[gunId] = (this.gunCharge[gunId] || 0) + 1;
  }
  fire(gunId: integer) {
    const ch = this.gunCharge[gunId] || 0
    this.gunCharge[gunId] = 0
    const b = new Bullet()
    b.p = this.player.p.dup()
    b.vr = 6
    b.p.incByDir(this.player.r + 0.4 * [1, -1][gunId], 65)
    b.v = this.player.v.dup()
    b.v.incByDir(this.player.r, 200)

    this.player.ar += [1, -1][gunId] * 1
    this.player.a.incByDir(this.player.r, -30)
    this.bullets.push(b)
  }
  inputDown(gunId: integer) {
    this.charge(gunId)
  }
  inputUp(gunId: integer) {
    this.fire(gunId)
  }
};

