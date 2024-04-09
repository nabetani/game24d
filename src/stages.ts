import { XY, range } from './calc'

type goal_t = XY
export type pva = { p?: XY, v?: XY, a?: XY }
type enemy_t = { p: XY, v: XY, r: number, vr?: number, im: number, pva?: (p: XY, ep: XY, ev: XY, tick: number) => pva }
type stage_t = { msg?: string, goal: goal_t, enemies: enemy_t[] }

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

const e3 = (pos: XY, velo: XY, fric: number): enemy_t => {
  const forget = 1 - 1 / 50
  return {
    p: pos, v: velo, r: 0, vr: 1, im: 3, pva: (p: XY, ep: XY, ev: XY, dt: number): pva => {
      const dir = p.subP(ep).atan2()
      return { v: XY.rt(fric, dir).addP(ev.mul(forget)) }
    }
  };
}

const e4 = (pos: XY): enemy_t => {
  const th = 200
  const velo = 200
  return {
    p: pos, v: XY.zero(), r: 0, vr: 1, im: 4, pva: (p: XY, ep: XY, ev: XY, dt: number): pva => {
      const vec = p.subP(ep)
      if (th < vec.norm) {
        return { v: XY.zero() }
      }
      const dir = vec.atan2()
      return { v: XY.rt(velo, dir).mulAdd(ev, -1 / 4) }
    }
  };
}

const e5 = (pos: XY, range: number, a: number, f: number): enemy_t => {
  let tick = 0
  const move = (p: XY, ep: XY, ev: XY, dt: number): pva => {
    tick += dt
    const t = tick * f + (a * Math.PI / 180);
    const rt = t / 7.1
    const x0 = Math.cos(t) * range
    const y0 = Math.sin(t) * range / 5
    const s = Math.sin(rt)
    const c = Math.cos(rt)
    const x = x0 * c - y0 * s + pos.x
    const y = x0 * s + y0 * c + pos.y
    return { p: XY.xy(x, y) }
  }
  const z = move(XY.zero(), XY.zero(), XY.zero(), 0)
  return { p: z.p!, v: XY.zero(), r: 0, vr: 1, im: 1, pva: move }
}

const e6 = (pos: XY, rad: number, a: number, f: number): enemy_t => {
  let tick = 0
  const velo = 50
  const th = 200
  const forget = 0.8
  const move = (p: XY, ep: XY, ev: XY, dt: number): pva => {
    tick += dt
    const t = tick * f + (a * Math.PI / 180);
    const x = Math.cos(t) * rad + pos.x
    const y = Math.sin(t) * rad + pos.y
    return { p: XY.xy(x, y) }
  }
  const chase = (p: XY, ep: XY, ev: XY, dt: number): pva => {
    const vec = p.subP(ep)
    if (th < vec.norm) {
      return {
        v: XY.zero()
      }
    }
    const dir = vec.atan2()
    return { v: XY.rt(velo, dir).addP(ev.mul(forget)) }
  }
  const z = move(XY.zero(), XY.zero(), XY.zero(), 0)
  let proc = move
  return {
    p: z.p!, v: XY.zero(), r: 0, vr: 1, im: 6, pva: (p: XY, ep: XY, ev: XY, dt: number): pva => {
      const vec = p.subP(ep)
      if (vec.norm < th) {
        proc = chase
      }
      return proc(p, ep, ev, dt)
    }
  };
}


export const stages: (() => stage_t)[] = [
  /* 0 */ () => { throw "" },

  /* 1 */ () => ({
    msg: "チャージしてから発射すれば\nすぐに母星にたどり着けます。\nタップまたはカーソルキーで\nゲームスタートです。",
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
  /* 4 */ () => {
    return {
      goal: XY.rt(600, 0), enemies: [...range(0, 4)].map((i) => {
        const a = 90 * i + 45;
        return e3(XY.ra(200, 0 + a), XY.ra(400, 90 + a), (i + 1) * 1)
      })
    }
  },
  /* 5 */ () => {
    return {
      goal: XY.rt(-600, 0), enemies: [...range(0, 11)].map((i) => {
        return e4(XY.xy(-200 - (i % 2) * 100, (i - 5.5) * 100 + (i < 6 ? -100 : 100)))
      })
    }
  },
  /* 6 */ () => {
    return {
      goal: XY.rt(600, 0), enemies: [...range(0, 11)].map((i) => {
        return e5(XY.xy(150 + (i % 2) * 100, (i - 5.5) * 100), 30, 10, 10 + i * 7 % 11)
      })
    }
  },
  /* 7 */ () => {
    return {
      goal: XY.rt(600, 0), enemies: [...range(0, 11)].map((i) => {
        return e6(XY.xy(0, 0), 300, 90 * i, 2)
      })
    }
  },
];
