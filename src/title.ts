import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import { range } from './calc';
import * as WS from './wstorage'

const depth = {
  bg: 0,
  button: 100,
  textUI: 200,
}
type Rectangle = Phaser.Geom.Rectangle
const Rectangle = Phaser.Geom.Rectangle

export class Title extends BaseScene {
  constructor() {
    super("Title")
  }
  preload() {
    this.load.image("title", `assets/title.webp`);
  }
  addTextButton(rc: Rectangle, depth: number, texts: string[]): Phaser.GameObjects.Graphics {
    const fit = (t: Phaser.GameObjects.Text, w: number, h: number) => {
      const s = Math.min(w / t.width, h / t.height)
      t.setScale(s)
    }

    const t0 = this.add.text(rc.centerX, rc.top, texts[0], {
      fontSize: rc.height / 2,
      fontFamily: "sasn-serif",
      padding: { x: 4, y: 4 }
    });
    t0.setOrigin(0.5, 0)
    fit(t0, rc.width, rc.height * 0.6)
    t0.setDepth(depth + 1)
    if (texts[1] != "") {
      const t1 = this.add.text(rc.centerX, rc.bottom, texts[1], {
        fontSize: rc.height / 2,
        padding: { x: 4, y: 4 }
      });
      t1.setOrigin(0.5, 1)
      fit(t1, rc.width, rc.height * 0.4)
      t1.setDepth(depth + 1)
    }
    const g = this.add.graphics()
    g.fillStyle(0, 0.5)
    g.lineStyle(3, 0, 1)
    const args = [rc.left, rc.top, rc.width, rc.height] as const
    g.fillRect(...args)
    g.strokeRect(...args)
    g.setDepth(depth)
    g.setInteractive(rc, (rc: Rectangle, x: number, y: number): boolean => {
      return rc.contains(x, y);
    });
    return g
  }
  addStarts() {
    const sr = WS.stageResults.value
    const { width, height } = this.canvas();
    const col = 4;
    const h = 500 / 8 - 8
    const debug = false
    const w = width / col - 10
    for (const stage of range(1, 33)) {
      if (debug || (stage <= 4 || (stage - 1 < sr.length && sr[stage - 1].score != undefined))) {
        const i = stage - 1
        const ix = i % col
        const iy = (i - ix) / col
        const x = width / col * (ix + 0.5) - w / 2
        const y = height - (8 - iy) * (500 / 8)
        const name = `Stage ${stage}`
        const score = ((s: number | undefined): string => {
          if (s == undefined) { return "" }
          return `score: ${s}`
        })(sr[stage]?.score)
        const rc = new Rectangle(x, y, w, h)
        const t = this.addTextButton(rc, depth.button, [name, score]);
        t.on("pointerdown", () => {
          this.scene.start('Main', { stage: stage });
        });
      }
    }
  }
  setSoundOn(on: boolean) {
    for (const i of range(0, 2)) {
      const name = ["soundOFF.text", "soundON.text"][i]
      const h = (on == (i != 0)) ? 35 : 25
      const o = this.textByName(name)
      o.setScale(h / o.height)
      WS.soundOn.write(on)
    }
  }
  create() {
    this.addSoundOnOff()
    this.setSoundOn(WS.soundOn.value)
    this.addStarts();
  }
  addSoundOnOff() {
    let x = 510
    for (const i of range(0, 2)) {
      const o = this.add.text(
        0, 25,
        ['Sound OFF', 'Sound ON'][i],
        {
          fontSize: 28,
          padding: { x: 5, y: 5 },
        }
      )
      o.on("pointerdown", () => this.setSoundOn(i != 0))
      o.setName(["soundOFF.text", "soundON.text"][i])
      o.setOrigin(0.5, 0.5).setDepth(depth.textUI).setInteractive()
      o.setBackgroundColor("#0008")
      o.x = x - o.width / 2
      x = o.x - o.width / 2
      const { width, height } = this.canvas();
      this.add.image(width / 2, height / 2, "title");
    }
  }
}
