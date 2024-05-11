import * as Phaser from 'phaser';
import { BaseScene } from './baseScene';
import { range } from './calc';
import * as WS from './wstorage'
import { stages } from './stages';

const depth = {
  bg: 0,
  button: 100,
  textUI: 200,
  longText: 1000,
}
type Rectangle = Phaser.Geom.Rectangle
const Rectangle = Phaser.Geom.Rectangle

type longTextItem = string | { s: number, t: string[] }

export class Title extends BaseScene {
  model: integer = 0
  constructor() {
    super("Title")
  }
  preload() {
    this.load.image("title", `assets/title.webp`);
  }
  addStartButton(rc: Rectangle, depth: number, texts: string[]): Phaser.GameObjects.Graphics {
    const fit = (t: Phaser.GameObjects.Text, w: number, h: number) => {
      const s = Math.min(w / t.width, h / t.height)
      t.setScale(s)
    }

    const t0 = this.add.text(rc.centerX, rc.top, texts[0], {
      fontSize: rc.height / 2,
      fontFamily: "sans-serif",
      padding: { x: 4, y: 4 }
    });
    t0.setOrigin(0.5, 0)
    fit(t0, rc.width, rc.height * 0.6)
    t0.setDepth(depth + 1)
    if (texts[1] != "") {
      const t1 = this.add.text(rc.centerX, rc.bottom, texts[1], {
        fontFamily: "sans-serif",
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
        const title = stages[stage]()?.title ?? `Stage ${stage}`
        const i = stage - 1
        const ix = i % col
        const iy = (i - ix) / col
        const x = width / col * (ix + 0.5) - w / 2
        const y = height - (8 - iy) * (500 / 8) - 100
        const score = ((s: number | undefined): string => {
          if (s == undefined) { return "" }
          return `score: ${s}`
        })(sr[stage]?.score)
        const rc = new Rectangle(x, y, w, h)
        const t = this.addStartButton(rc, depth.button, [title, score]);
        t.on("pointerdown", () => {
          if (this.model != 0) { return }
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
  longTexts() {
    const { width } = this.canvas()
    const y = 220
    const h = 40
    const w = 130
    const ty = y - 40
    this.addTextButton(new Rectangle(20, y, w, h), depth.textUI, "物語", () => this.showLongText(
      ty, [
      {
        s: 2, t: [
          "「メインエンジン大破、切り離します!」",
          "「姿勢制御エンジンも操作不能!」",
          "「生命維持装置にも支障、持ってあと100秒です。」",
          "「艦長……", "　母星まであと僅かだというのに……」",
          "",]
      },
      { s: 1, t: ["「主砲は撃てるか?」"] },
      { s: 2, t: ["", "「……え?」"] },
      { s: 1, t: ["", "「主砲は撃てるかときいている」"] },
      { s: 2, t: ["", "「……はい。主砲は健在です。", "　エネルギーも十分にあります……」"] },
      {
        s: 1, t: [
          "",
          "「ならば主砲の反動で母星を目指す。",
          "　我々は諦めない。　生きて母星に帰るぞ！」"]
      },
    ]
    ))
    this.addTextButton(new Rectangle(256 - w / 2, y, w, h), depth.textUI, "遊び方", () => this.showLongText(
      ty, [
      "画面右半分を触るか、矢印キー右を押下で",
      "右タイツ砲チャージ開始。",
      "触るのをやめる、あるいは矢印キー押下やめると",
      "右タイツ砲発射です。",
      "チャージが不十分だと弾が出ません。",
      "左も同様です。",
      "左右同時チャージ、一方だけ発射なども可能です。",
      "発射すると反動で加速します。回転速度も変わります。",
      "チャージする・発射する 以外の操作はありません。",
      "制限時間内に母星に到着してください。",
      "敵に触れるか、時間切れでゲームオーバーです。",
      "",
      "緑の太い矢印が母星の方向を示します。",
      "赤い細い矢印は、巡洋艦が進んでいる方向を示します。",
      "",
      "⚠️ 2Dのゲームですが、なぜか 3D酔いをする場合が",
      "　あります。苦手な方はご注意ください。",
      "",
      "ℹ️ 計算負荷に応じて星の数が減ります（仕様）。",
      "ℹ️ Sound OFF にすると処理が軽くなるかも。"
    ]))
    this.addTextButton(new Rectangle(width - w - 20, y, w, h), depth.textUI, "得点計算", () => this.showLongText(
      ty, [
      "スコアは、クリア点 + 破壊点 + 残り時間点 です。",
      "",
      "クリア点は、発射した弾数で決まります。",
      " • 〜3発: 2000点",
      " • 4〜9発:  1500点",
      " • 10〜29発:  1250点",
      " • 30〜99発:  1000点",
      " • 100発〜:  750点",
      "",
      "破壊点は、破壊した敵の数✕100点です。",
      "全滅すると、さらに 2000点入ります。",
      "",
      "残り時間点 は、残り時間 0.1秒で 1点です。",
    ]))
  }
  create() {
    this.addSoundOnOff()
    this.setSoundOn(WS.soundOn.value)
    this.addStarts();
    this.addLinks();
    this.longTexts()
  }
  addLinks() {
    const tag = "宇宙巡洋艦タイツ";
    let y = this.sys.game.canvas.height - 10;
    const rightEnd = 500
    let x = rightEnd;
    [
      ["タイッツー #" + tag, "https://taittsuu.com/search/taiitsus/hashtags?query=" + tag],
      ["Suzuri - Nabetani-T - 宇宙巡洋艦", "https://suzuri.jp/Nabetani-T/designs/15802611"],
      ["Source code and license", "https://github.com/nabetani/game24d/"],
      ["鍋谷武典 @ タイッツー", "https://taittsuu.com/users/nabetani"],
      ["制作ノート", "https://nabetani.hatenadiary.com/entry/game24d"],
    ].forEach((e, ix) => {
      const text = this.add.text(x, y, e[0], {
        fontSize: 14,
        fontFamily: "sans-serif",
        backgroundColor: "#0008",

        padding: { x: 5, top: 6, bottom: 2 },
      })
      text.on("pointerdown", () => {
        if (this.model != 0) { return }
        if (!window.open(e[1])) {
          location.href = e[1];
        }
      }).setInteractive();
      text.setOrigin(1, 1);
      if (text.getBounds().x < 10) {
        x = rightEnd
        y = text.getBounds().top - 5;
        text.setPosition(x, y)
      }
      x = text.getBounds().x - 10
    });
  }
  addSoundOnOff() {
    let x = 510
    for (const i of range(0, 2)) {
      const o = this.add.text(
        0, 25,
        ['Sound OFF', 'Sound ON'][i],
        {
          fontFamily: "sans-serif",
          fontSize: 28,
          padding: { x: 5, y: 5 },
        }
      )
      o.on("pointerdown", () => {
        if (this.model != 0) { return }
        this.setSoundOn(i != 0)
      })
      o.setName(["soundOFF.text", "soundON.text"][i])
      o.setOrigin(0.5, 0.5).setDepth(depth.textUI).setInteractive()
      o.setBackgroundColor("#0008")
      o.x = x - o.width / 2
      x = o.x - o.width / 2
      const { width, height } = this.canvas();
      this.add.image(width / 2, height / 2, "title");
    }
  }
  showLongText(y0: number, items: longTextItem[]) {
    if (this.model != 0) { return }
    ++this.model
    const { width, height } = this.canvas();
    let y = y0
    let ruleObjs: Phaser.GameObjects.GameObject[] = [];
    let bounds: Rectangle | null = null
    const addLine = (msg: string, style: number) => {
      const rule = this.add.text(width / 2, y, msg,
        {
          wordWrap: { width: width * 0.9, useAdvancedWrap: true },
          fontSize: "18px",
          fontFamily: "sans-serif",
          fixedWidth: width * 0.95,
          backgroundColor: "#222",
          color: ["#fff", "#ccf", "#ffa"][style],
          padding: { x: 5, y: 6 },
        }
      )
      rule.setDepth(depth.longText)
      rule.setOrigin(0.5, 0)
      ruleObjs.push(rule);
      const b = rule.getBounds()
      y = b.bottom
      bounds = Rectangle.Union(rule.getBounds(), bounds ?? b)
    }
    for (const item of items) {
      if ("string" === typeof (item)) {
        addLine(item, 0)
      } else {
        for (const e of item.t) {
          addLine(e, item.s)
        }
      }
    }
    ruleObjs.push(...this.addCloseBox(bounds!, depth.longText + 1));
    ruleObjs.push(this.add.zone(bounds!.x, bounds!.y, bounds!.width, bounds!.height).on(
      "pointerdown", () => {
        for (const r of ruleObjs) {
          r.destroy();
        }
        --this.model;
      }).setInteractive().setDepth(depth.longText + 2).setOrigin(0, 0))
  }
  addCloseBox(rc: Phaser.Geom.Rectangle, d: number): Phaser.GameObjects.GameObject[] {
    let objs = [];
    const { width, height } = this.sys.game.canvas
    const w = width / 15;
    const h = w;
    const x = rc.right - w / 2;
    const y = rc.top + h / 2;
    objs.push(this.add.rectangle(x, y, w, h, 0, 1).setDepth(d));
    for (const i of [45, -45]) {
      const r = this.add.rectangle(x, y, w / 7, h * 0.9, 0xff0000, 1);
      r.setDepth(d)
      r.setAngle(i);
      objs.push(r);
    }
    return objs;
  }
  addTextButton(rc: Rectangle, depth: number, text: string, proc: Function): Phaser.GameObjects.Graphics {
    const fit = (t: Phaser.GameObjects.Text, w: number, h: number) => {
      const s = Math.min(w / t.width, h / t.height)
      t.setScale(s)
    }
    const t0 = this.add.text(rc.centerX, rc.centerY, text, {
      fontSize: rc.height * 2,
      fontFamily: "sans-serif",
      fontStyle: "bold",
      padding: { x: 4, y: 4 },
      color: "black"
    });
    t0.setOrigin(0.5, 0.5)
    fit(t0, rc.width, rc.height)
    t0.setDepth(depth + 1)
    const g = this.add.graphics()
    g.fillStyle(0xffffff, 0.5)
    g.lineStyle(3, 0, 1)
    const args = [rc.left, rc.top, rc.width, rc.height] as const
    g.fillRect(...args)
    g.strokeRect(...args)
    g.setDepth(depth)
    g.setInteractive(rc, (rc: Rectangle, x: number, y: number): boolean => {
      return rc.contains(x, y);
    });
    g.on("pointerdown", proc)
    return g
  }

}
