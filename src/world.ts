import { range } from './baseScene';

// x と y
export class XY {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  mulAdd(o: XY, s: number): XY {
    return new XY(this.x + o.x * s, this.y + o.y * s)
  }
  incByDir(dir: number, s: number) {
    this.x += Math.cos(dir) * s
    this.y += Math.sin(dir) * s
  }
  dup(): XY {
    return new XY(this.x, this.y)
  }
}

export class Mobj {
  p: XY = new XY(0, 0)
  v: XY = new XY(0, 0) // pix / s
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
  dev(dt: number) {
    this.p = this.p.mulAdd(this.v, dt)
    this.r += this.vr * dt
  }
}

type Bullet = Mobj
const Bullet = Mobj

export class World {
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
    this.player.vr = 0.1
    this.player.v.x = 10
    this.player.v.y = 20
  }
  charge(gunId: integer) {
    this.gunCharge[gunId] = (this.gunCharge[gunId] || 0) + 1;
  }
  fire(gunId: integer) {
    const ch = this.gunCharge[gunId] || 0
    this.gunCharge[gunId] = 0
    const b = new Bullet()
    b.p = this.player.p.dup()
    b.v = this.player.v.dup()
    b.v.incByDir(this.player.r, 50)
    this.bullets.push(b)
  }
  inputDown(gunId: integer) {
    this.charge(gunId)
  }
  inputUp(gunId: integer) {
    this.fire(gunId)
  }
};

