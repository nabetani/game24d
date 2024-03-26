import { XY } from './calc'

type goal_t = XY
type enemies_t = { p: XY, v: XY, r: number }
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
  () => ({
    goal: XY.rt(400, 0), enemies: [
      { p: XY.rt(400, Math.PI * 0.5), v: XY.zero(), r: 0 },
      { p: XY.rt(400, Math.PI * 1.0), v: XY.zero(), r: 0 },
      { p: XY.rt(400, Math.PI * 1.5), v: XY.zero(), r: 0 },
    ]
  }),
];
