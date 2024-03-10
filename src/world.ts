import { range } from './baseScene';

// x と y
export class XY {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  static rt(r: number, t: number): XY {
    return new XY(r * Math.cos(t), r * Math.sin(t));
  }
  mulAdd(o: XY, s: number): XY {
    return new XY(this.x + o.x * s, this.y + o.y * s)
  }
  incByDir(dir: number, s: number) {
    this.x += Math.cos(dir) * s
    this.y += Math.sin(dir) * s
  }
  dist(o: XY): number {
    const dx = this.x - o.x;
    const dy = this.y - o.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  dup(): XY {
    return new XY(this.x, this.y)
  }
}

export class Mobj {
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
    this.p = this.p.mulAdd(this.v, dt)

    this.ar *= Mobj.forget
    this.vr += this.ar * dt
    this.r += this.vr * dt
  }
}

type Bullet = Mobj
const Bullet = Mobj

export class World {
  get goal() { return { rad: 120, xy: new XY(400, 0) } }
  player: Mobj = Mobj.zero()
  gunCharge: number[] = []
  bullets: Bullet[] = []
  update(dt: number) {
    this.player.dev(dt)
    for (const b of this.bullets) {
      b.dev(dt)
    }
  }
  init() {
  }
  charge(gunId: integer) {
    this.gunCharge[gunId] = (this.gunCharge[gunId] || 0) + 1;
  }
  fire(gunId: integer) {
    const ch = this.gunCharge[gunId] || 0
    this.gunCharge[gunId] = 0
    const b = new Bullet()
    b.p = this.player.p.dup()
    b.p.incByDir(this.player.r + 0.4 * [1, -1][gunId], 65)
    b.v = this.player.v.dup()
    b.v.incByDir(this.player.r, 200)

    this.player.ar += [1, -1][gunId] * 1
    this.player.a.incByDir(this.player.r, -200)
    this.bullets.push(b)
  }
  inputDown(gunId: integer) {
    this.charge(gunId)
  }
  inputUp(gunId: integer) {
    this.fire(gunId)
  }
};

