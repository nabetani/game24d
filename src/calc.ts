export const sincos = (a: number, b: number | null = null): { sin: number, cos: number } => {
  const t = b === null ? a : (Math.PI * 2 * a / b)
  return { sin: Math.sin(t), cos: Math.cos(t) }
}

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
  add(x: number, y: number, mul: number = 1): XY {
    return new XY(this.x + x * mul, this.y + y * mul)
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
  dup(): XY {
    return new XY(this.x, this.y)
  }
}
