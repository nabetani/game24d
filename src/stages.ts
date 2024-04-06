import { XY, range } from './calc'

type goal_t = XY
export type pva = { p?: XY, v?: XY, a?: XY }
type enemy_t = { p: XY, v: XY, r: number, vr?: number, im: number, pva?: (p: XY, ep: XY, ev: XY, tick: number) => pva }
type stage_t = { goal: goal_t, enemies: enemy_t[] }

const chase1 = (p: XY, ep: XY, ev: XY): pva => {
  const a = p.subP(ep).subP(ev.mul(1));
  const r = a.norm + 1e-3;
  return { a: a.mul(30 / r) }
};

const e0 = (pos: XY): enemy_t => {
  return { p: pos, v: XY.xy(0, 0), r: 0, vr: 1, im: 0 }
}

const e1 = (pos: XY, rad: number, a: number, f: number): enemy_t => {
  let tick = 0
  const move = (p: XY, ep: XY, ev: XY, dt: number): pva => {
    tick += dt
    const t = tick * f + (a * Math.PI / 180);
    const x = Math.cos(t) * rad + pos.x
    const y = Math.sin(t) * rad + pos.y
    return { p: XY.xy(x, y) }
  }
  const z = move(XY.zero(), XY.zero(), XY.zero(), 0)
  return { p: z.p!, v: XY.zero(), r: 0, vr: 1, im: 1, pva: move }
}

export const stages: (() => stage_t)[] = [
  /* 0 */ () => { throw "" },

  /* 1 */ () => ({
    goal: XY.rt(-400, 0), enemies: [
      e0(XY.xy(400, 0)),
    ]
  }),
  /* 2 */ () => {
    const f = 2
    return {
      goal: XY.rt(600, 0), enemies: [
        e1(XY.xy(0, 0), 200, 0, f),
        e1(XY.xy(0, 0), 200, 90, f),
        e1(XY.xy(0, 0), 200, 180, f),
        e1(XY.xy(0, 0), 200, 270, f),
      ]
    }
  },
];
