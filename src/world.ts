import { range } from './baseScene';
import { XY } from './calc'

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

export class Enemy extends Mobj {
}

export class World {
  get goal() { return { rad: 120, xy: new XY(400, 0) } }
  player: Mobj = Mobj.zero()
  enemies: Set<Enemy> = new Set<Enemy>();
  gunCharge: number[] = []
  bullets: Bullet[] = []
  updateBullets(dt: number) {
    const bullets: Bullet[] = []
    for (const b of this.bullets) {
      b.dev(dt)
      if (this.player.p.dist(b.p) < 900) {
        bullets.push(b)
      }
    }
    this.bullets = bullets
  }
  updateEnemies(dt: number) {
  }
  update(dt: number) {
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

