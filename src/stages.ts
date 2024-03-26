import { XY } from './calc'

type goal_t = XY
type enemies_t = { p: XY, v: XY, r: number, a?: (p: XY, ep: XY, ev: XY) => XY }
type stage_t = { goal: goal_t, enemies: enemies_t[] }

export const stages: (() => stage_t)[] = [
  //0
  (): stage_t => { throw "" },

  //1
  () => ({
    goal: XY.rt(-400, 0), enemies: [
      { p: XY.rt(400, 0), v: XY.zero(), r: 0 }
    ]
  }),
  //2
  () => {
    const chase = (p: XY, ep: XY, ev: XY): XY => {
      const a = p.subP(ep).subP(ev.mul(1));
      const r = a.norm + 1e-3;
      return a.mul(30 / r)
    };
    return {
      goal: XY.rt(400, 0), enemies: [
        { p: XY.rt(200, Math.PI * 0.5), v: new XY(100, 0), r: 0, a: chase },
        // { p: XY.rt(400, Math.PI * 1.0), v: XY.zero(), r: 0 },
        { p: XY.rt(200, Math.PI * 1.5), v: new XY(-100, 0), r: 0, a: chase },
      ]
    }
  },
];
