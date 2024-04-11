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
  return { p: z.p!, v: XY.zero(), r: 0, vr: 1, im: 5, pva: move }
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
      msg: "チャージせずに発射して\n向きを変えます。\n回っている間にチャージして\n母星が真下になったら\nフルチャージの弾を発射しましょう。",
      goal: XY.rt(600, 0), enemies: [...range(0, 3)].map((i) => {
        return e0(XY.xy(250, (i - 1) * 200))
      })
    }
  },
  /* 3 */ () => {
    return {
      msg: "そのまま母星に向かうと\n敵にぶつかってしまいます。\n敵を倒してから\n母星に向かいましょう。",
      goal: XY.rt(-650, 0), enemies: [...range(0, 18)].map((i) => {
        const x = i % 2
        const y = (i - x) / 2
        return e0(XY.xy(-300 + x * 80, (y - 4) * 80))
      })
    }
  },
  /* 4 */ () => {
    const n = 20
    return {
      msg: "チャージせずに何度も\n左右の弾を同時に撃つことで\n自分の向きを変えずに\n敵を殲滅できます。",
      goal: XY.rt(-650, 0), enemies: [...range(0, n)].map((i) => {
        return e1(XY.xy(0, 0), 200, 360 * i / n, i % 2 ? -1 : 1)
      })
    }
  },
  /* 5 */ () => {
    const n = 20
    return {
      msg: "フルチャージで発射すると\n一発で敵を殲滅できます",
      goal: XY.rt(-1000, 0), enemies: [...range(0, n)].map((i) => {
        const av = Math.ceil(i / 2) / n
        const v = av * (i % 2 ? -1 : 1)
        return e1(XY.xy(0, 0), 200 + av * 150, -360 * v, v * 6)
      })
    }
  },
  /* 6 */ () => {
    const n = 10
    const e = (i: number, a: number, f: number) => {
      const av = Math.ceil(i / 2) / n
      const v = av * (i % 2 ? -1 : 1)
      return e1(XY.xy(0, 0), 200 + av * 150, a - 360 * v, v * f)
    }
    return {
      msg: "左右同時にチャージを始め\n右→左の順に撃つと\n敵を殲滅のうえ\n母星に帰還できます。",
      goal: XY.ra(-1000, 10), enemies: [...range(0, n * 2)].map((i) =>
        i < n ? e(i, 0, 6) : e(i - n, 30, 4)
      )
    }
  },
  /* 7 */ () => {
    const n = 10
    return {
      msg: "右の砲を細かく撃ち\n右の敵を殲滅してから\n母星を目指すのが\nよさそうです。",
      goal: XY.ra(600, 90), enemies: [...range(0, 2 * n)].map((i) => {
        if (i < n) {
          const k = i
          return e2(XY.xy((k % 2) * 60, 250 + k * 60), XY.xy(0, -100), 0.5)
        } else {
          const k = i - n
          return e0(XY.xy(k * 60, -(200 + k * 10)))
        }
      })
    }
  },
  /* 8 */ () => {
    const n = 7
    return {
      msg: "いろいろな種類の敵がいます。\nGood luck!。",
      goal: XY.rt(600, 0), enemies: [...range(0, n)].map((i) => {
        const a = 360 * i / n - 40
        const r = 300
        const p = XY.ra(r, a)
        switch (i % 7) {
          default:
            return e0(p)
          case 2:
          case 3:
            return e1(XY.zero(), r, a, 2)
          case 1: return e2(p, p.mul(-0.1), 1)
          case 0: return e5(p, 50, 0, 10)
        }
      })
    }
  },
  /* 9 */ () => {
    const n = 10
    return {
      goal: XY.ra(600, 90), enemies: [...range(0, n)].map((i) => {
        const a = 360 * (i - n / 2 + 0.5) / (n * 1.5)
        const r = 300
        const p = XY.ra(r, a)
        return e2(p, p.mul(-0.3).addP(XY.xy(-50, 0)), 1)
      })
    }
  },
  /* 10 */ () => {
    const n = 20
    return {
      goal: XY.rt(-650, 0), enemies: [...range(0, n)].map((i) => {
        const a = 360 / n * i
        return e3(XY.ra(330, a), XY.ra(-100, a + 90), 0.9)
      })
    }
  },
  /* 11 */ () => {
    const n = 20
    return {
      goal: XY.rt(-650, 0), enemies: [...range(0, n)].map((i) => {
        const a = 360 / n * i * 2
        return e4(XY.ra(250 + a / 5, a))
      })
    }
  },
  /* 12 */ () => {
    const n = 16
    return {
      goal: XY.rt(650, 0), enemies: [...range(-3, n)].map((i) => {
        if (i < 0) {
          return e0(XY.xy(-150, (i + 2) * 120))
        } else {
          const x = i % 4
          const y = Math.floor(i / 4)
          const p = XY.xy(x + 2, y - 1.5).mul(120)
          const ph = p.mul(0.5)
          const sig = p.y < 0 ? 1 : -1
          const c = ph.add(sig * p.y, sig * -p.x)
          const v = p.subP(c)
          const a = v.atan2() * 180 / Math.PI
          return e1(c, v.norm, a, sig / (4 + x))
        }
      })
    }
  },
  /* 13 */ () => {
    const n = 16
    return {
      goal: XY.rt(650, 0), enemies: [...range(0, n)].map((i) => {
        const t = 360 * i / n
        return e5(XY.ra(200, t), 100, t ** 2, 4)
      })
    }
  },
  /* 14 */ () => {
    const n = 15
    return {
      goal: XY.rt(650, 0), enemies: [...range(0, n)].map((i) => {
        const k = i % 8
        if (i == k) {
          const t = 180 * (k / (8 - 1) - 0.5)
          return e2(XY.ra(230, t), XY.ra(-200, t), 0.1)
        }
        const t = 180 * ((k + 0.5) / (8 - 1) - 0.5)
        return e3(XY.ra(280, t), XY.ra(-200, t), 0.1)
      })
    }
  },
  /* 15 */ () => {
    const n = 15
    return {
      goal: XY.rt(650, 0), enemies: [...range(-1, n)].map((i) => {
        if (i < 0) {
          return e0(XY.xy(-250, 0))
        }
        const k = i % 8
        if (i == k) {
          const t = 180 * (k / (8 - 1) - 0.5)
          return e2(XY.ra(280, t), XY.ra(-200, t), 0.1)
        }
        const t = 180 * ((k + 0.5) / (8 - 1) - 0.5)
        return e3(XY.ra(220, t), XY.ra(-200, t), 0.1)
      })
    }
  },
  /* 27 */ () => {
    const n = 20
    return {
      goal: XY.rt(600, 0), enemies: [...range(0, n)].map((i) => {
        const a = 360 / n * i
        const r = 200
        return e1(XY.ra(r, a), r, a, 0.12 * (i / n + 4))
      })
    }
  },
];
