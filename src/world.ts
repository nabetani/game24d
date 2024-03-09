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
}

export class Mobj {
  p: XY = new XY(0, 0)
  v: XY = new XY(0, 0) // pix / s
  r: number = 0 // rad
  vr: number = 0 // rad / s
  static zero(): Mobj {
    return new Mobj()
  }
  get x(): number { return this.p.x }
  get y(): number { return this.p.y }
  dev(dt: number) {
    this.p = this.p.mulAdd(this.v, dt)
    this.r += this.vr * dt
  }
}

export class World {
  player: Mobj = Mobj.zero()
  update(dt: number) {
    this.player.dev(dt)
  }
  init() {
  }
};
