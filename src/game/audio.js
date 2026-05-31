// ============================================================
// 音频管理（PRD 第 3 轮 · 接 Howler）
// 设置面板的 BGM / SFX 音量（0-100）实时联动；首次用户手势解锁。
// 占位音效由 scripts/gen-audio.mjs 生成，换成正式 mp3 只需同名替换。
// ============================================================
import { Howl } from 'howler'

import bgmUrl from '../assets/audio/bgm-main.wav'
import cardSelect from '../assets/audio/card-select.wav'
import button from '../assets/audio/button.wav'
import cardPlay from '../assets/audio/card-play.wav'
import chip from '../assets/audio/chip.wav'
import jokerTrigger from '../assets/audio/joker-trigger.wav'
import scoreBurst from '../assets/audio/score-burst.wav'
import discard from '../assets/audio/discard.wav'
import buy from '../assets/audio/buy.wav'
import win from '../assets/audio/win.wav'
import lose from '../assets/audio/lose.wav'

const SFX_SRC = {
  'card-select': cardSelect,
  button,
  'card-play': cardPlay,
  chip,
  'joker-trigger': jokerTrigger,
  'score-burst': scoreBurst,
  discard,
  buy,
  win,
  lose,
}

let sounds = {} // name -> Howl
let bgm = null
let sfxVol = 0.7 // 0-1
let bgmVol = 0.5
let unlocked = false
let inited = false

export const audio = {
  // 启动时载入（settings.bgm / settings.sfx 为 0-100）
  init(settings) {
    if (inited) return
    inited = true
    bgmVol = (settings?.bgm ?? 50) / 100
    sfxVol = (settings?.sfx ?? 70) / 100
    for (const [name, src] of Object.entries(SFX_SRC)) {
      sounds[name] = new Howl({ src: [src], volume: sfxVol, preload: true })
    }
    bgm = new Howl({ src: [bgmUrl], loop: true, volume: bgmVol, preload: true })
  },

  // 首次用户手势时调用：解锁音频上下文并起 BGM（浏览器自动播放限制要求）
  unlock() {
    if (unlocked) return
    unlocked = true
    this.startBgm()
  },

  play(name) {
    const s = sounds[name]
    if (!s) return
    s.volume(sfxVol)
    s.play()
  },

  startBgm() {
    if (bgm && !bgm.playing()) bgm.play()
  },
  stopBgm() {
    if (bgm) bgm.stop()
  },

  setSfxVolume(v0to100) {
    sfxVol = Math.max(0, Math.min(1, v0to100 / 100))
    for (const s of Object.values(sounds)) s.volume(sfxVol)
  },
  setBgmVolume(v0to100) {
    bgmVol = Math.max(0, Math.min(1, v0to100 / 100))
    if (bgm) bgm.volume(bgmVol)
  },
}
