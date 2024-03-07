import { range } from './baseScene';

export class Pos {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

export class DPos {
  x: number
  y: number
  d: number // rad
  constructor(x: number, y: number, d: number) {
    this.x = x
    this.y = y
    this.d = d
  }
  add(dx: number, dy: number) {
    this.x += dx
    this.y += dy
  }
  move(r: number) {
    const dx = r * Math.cos(this.d)
    const dy = r * Math.sin(this.d)
    this.add(dx, dy)
  }
}

export class Mobj {
  dpos: DPos
  v: number
  constructor(dpos: DPos, v: number) {
    this.dpos = dpos
    this.v = v
  }
  dev(dt: number) {
    this.dpos.move(this.v * dt)
  }
}

export class World {
  player: DPos = new DPos(0, 0, Math.PI / 2)
  update(dt: number) {
    this.player.move(dt * 200)
  }
  init() {
  }
};
