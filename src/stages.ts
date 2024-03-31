import { XY, range } from './calc'

type goal_t = XY
type enemies_t = { p: XY, v: XY, r: number, vr?: number, a?: (p: XY, ep: XY, ev: XY) => XY }
type stage_t = { goal: goal_t, enemies: enemies_t[] }

const chase = (p: XY, ep: XY, ev: XY): XY => {
  const a = p.subP(ep).subP(ev.mul(1));
  const r = a.norm + 1e-3;
  return a.mul(30 / r)
};

export const stages: (() => stage_t)[] = [
  /* 0 */ () => { throw "" },

  /* 1 */ () => ({
    goal: XY.rt(-400, 0), enemies: [
      { p: XY.rt(400, 0), v: XY.zero(), r: 0 }
    ]
  }),
  /* 2 */ () => {
    return {
      goal: XY.rt(400, 0), enemies: [
        { p: XY.rt(200, Math.PI * 0.5), v: new XY(100, 0), r: 0, a: chase },
        // { p: XY.rt(400, Math.PI * 1.0), v: XY.zero(), r: 0 },
        { p: XY.rt(200, Math.PI * 1.5), v: new XY(-100, 0), r: 0, a: chase },
      ]
    }
  },
  /* 3 */ () => {
    const n = 30
    return {
      goal: XY.rt(400, 0), enemies: [...range(0, n)].map((i) => {
        return {
          p: XY.rt(300, Math.PI * 2 * i / n),
          v: XY.rt(100, Math.PI * (2 * i / n + 0.5)),
          r: Math.PI * (32 ** 0.5) * i / n,
          a: chase,
          vr: Math.PI
        }
      })
    }
  },
];
