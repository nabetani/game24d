import { XY, range } from './calc'

type goal_t = XY
type enemies_t = { p: XY, v: XY, r: number, vr?: number, im: number, a?: (p: XY, ep: XY, ev: XY) => XY }
type stage_t = { goal: goal_t, enemies: enemies_t[] }

const chase = (p: XY, ep: XY, ev: XY): XY => {
  const a = p.subP(ep).subP(ev.mul(1));
  const r = a.norm + 1e-3;
  return a.mul(30 / r)
};

const e0 = (pos: XY): enemies_t => {
  return { p: pos, v: XY.xy(0, 0), r: 0, vr: 1, im: 0 }
}

const e1 = (pos: XY, velo: XY): enemies_t => {
  return { p: pos, v: velo, r: 0, vr: 1, im: 1, a: chase }
}

export const stages: (() => stage_t)[] = [
  /* 0 */ () => { throw "" },

  /* 1 */ () => ({
    goal: XY.rt(-400, 0), enemies: [
      e0(XY.xy(400, 0)),
    ]
  }),
  /* 2 */ () => {
    return {
      goal: XY.rt(400, 0), enemies: [
        e1(XY.ra(200, 90), XY.ra(100, 0)),
        e1(XY.ra(200, 270), XY.ra(100, 180)),
      ]
    }
  },
];
