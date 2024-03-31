export const sincos = (a: number, b: number | null = null): { sin: number, cos: number } => {
  const t = b === null ? a : (Math.PI * 2 * a / b)
  return { sin: Math.sin(t), cos: Math.cos(t) }
}

export function* range(start: integer, end: integer) {
  for (let i = start; i < end; i++) {
    yield i;
  }
}

export const clamp = (v: number, low: number, high: number): number => {
  const lo = Math.min(low, high)
  const hi = Math.max(low, high)
  if (v < lo) {
    return lo
  }
  if (hi < v) { return hi }
  return v
}

// x と y
export class XY {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  static zero(): XY {
    return new XY(0, 0);
  }
  static rt(r: number, t: number): XY {
    return new XY(r * Math.cos(t), r * Math.sin(t));
  }
  ip(p: XY): number {
    return this.x * p.x + this.y * p.y
  }
  subP(p: XY): XY {
    return new XY(this.x - p.x, this.y - p.y)
  }
  addP(p: XY): XY {
    return new XY(this.x + p.x, this.y + p.y)
  }
  atan2(): number {
    return Math.atan2(this.y, this.x)
  }
  add(x: number, y: number, mul: number = 1): XY {
    return new XY(this.x + x * mul, this.y + y * mul)
  }
  mul(s: number): XY {
    return new XY(this.x * s, this.y * s);
  }
  mulAdd(o: XY, s: number): XY {
    return new XY(this.x + o.x * s, this.y + o.y * s)
  }
  incByDir(dir: number, s: number) {
    this.x += Math.cos(dir) * s
    this.y += Math.sin(dir) * s
  }
  addByDir(dir: number, s: number): XY {
    const r = this.dup()
    r.incByDir(dir, s)
    return r
  }
  dist(o: XY): number {
    const dx = this.x - o.x;
    const dy = this.y - o.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  get norm2(): number {
    return this.x ** 2 + this.y ** 2;
  }
  get norm(): number {
    return Math.sqrt(this.norm2)
  }
  dup(): XY {
    return new XY(this.x, this.y)
  }
}

export class Segment {
  p: [XY, XY]
  d: XY
  d2: number
  a: number
  b: number
  c: number
  den: number
  constructor(p0: XY, p1: XY) {
    this.p = [p0, p1]
    this.d = p1.subP(p0);
    this.d2 = this.d.ip(this.d)
    this.a = this.d.y
    this.b = - this.d.x
    this.c = -(this.a * p0.x + this.b * p0.y)
    this.den = (this.a ** 2 + this.b ** 2) ** 0.5
  }
  static fromEnds(p0: XY, p1: XY): Segment {
    return new Segment(p0, p1);
  }
  dist(p: XY | null = null): number {
    p ??= new XY(0, 0)
    const d = p.subP(this.p[0])
    const ip = d.ip(this.d)
    const a = p.dist(this.p[0])
    const b = p.dist(this.p[1])
    if (ip <= 0 || this.d2 <= ip) {
      return Math.min(a, b)
    }
    const num = Math.abs(this.a * p.x + this.b * p.y + this.c)
    const c = num / this.den
    return Math.min(a, b, c);
  }
}
