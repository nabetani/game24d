import { XY, range } from './calc'

type goal_t = XY
export type pva = { p?: XY, v?: XY, a?: XY }
type enemy_t = { p: XY, v: XY, r: number, vr?: number, im: number, pva?: (p: XY, ep: XY, ev: XY, tick: number) => pva }
type stage_t = { goal: goal_t, enemies: enemy_t[] }

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

const e2 = (pos: XY, velo: XY, fric: number): enemy_t => {
  return {
    p: pos, v: velo, r: 0, vr: 1, im: 2, pva: (p: XY, ep: XY, ev: XY, dt: number): pva => {
      const a = p.subP(ep).subP(ev.mul(fric));
      const r = a.norm + 1e-3;
      return { a: a.mul(30 / r) }
    }
  };
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
      goal: XY.rt(600, 0), enemies: [...range(0, 4)].map((i) =>
        e1(XY.xy(0, 0), 200, 90 * i, 2),
      )
    }
  },
  /* 3 */ () => {
    return {
      goal: XY.rt(600, 0), enemies: [...range(0, 4)].map((i) =>
        e2(XY.ra(200, 0 + 90 * i), XY.ra(100, 90 + 90 * i), 3 ** i * 0.3),
      )
    }
  },
];
