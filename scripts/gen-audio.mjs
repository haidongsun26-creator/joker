// ============================================================
// 程序化生成 8-bit 占位音效（WAV）—— node scripts/gen-audio.mjs
// 零版权、零依赖。输出到 src/assets/audio/
// 之后想换成正式 mp3，只要同名替换文件即可，代码无需改。
// ============================================================
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/assets/audio')
mkdirSync(OUT, { recursive: true })

const SR = 22050 // 采样率（够用且体积小）
const TAU = Math.PI * 2

// ---------- 振荡器 ----------
const square = (t, f, duty = 0.5) => (((t * f) % 1) < duty ? 1 : -1)
const sine = (t, f) => Math.sin(TAU * f * t)
const saw = (t, f) => 2 * ((t * f) % 1) - 1
const noise = () => Math.random() * 2 - 1

// 线性衰减包络
const decay = (i, n, power = 1) => Math.pow(1 - i / n, power)
// 快起快落包络（attack 很短）
const pluck = (i, n) => {
  const a = Math.min(1, i / (n * 0.02))
  const d = Math.pow(1 - i / n, 1.6)
  return a * d
}

// 把 [-1,1] 的 Float 数组写成 16-bit PCM 单声道 WAV
function writeWav(name, samples, gain = 0.35) {
  const n = samples.length
  const buf = Buffer.alloc(44 + n * 2)
  // RIFF header
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16) // PCM chunk size
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28) // byte rate
  buf.writeUInt16LE(2, 32) // block align
  buf.writeUInt16LE(16, 34) // bits
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    let s = Math.max(-1, Math.min(1, samples[i] * gain))
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2)
  }
  writeFileSync(resolve(OUT, name), buf)
  console.log(`  ✓ ${name} (${(buf.length / 1024).toFixed(1)} KB, ${(n / SR).toFixed(2)}s)`)
}

const dur = (sec) => Math.floor(SR * sec)
const buildSfx = (sec, fn) => {
  const n = dur(sec)
  const a = new Float32Array(n)
  for (let i = 0; i < n; i++) a[i] = fn(i / SR, i, n)
  return a
}

// 音名 → 频率
const NOTE = {}
;(() => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  for (let oct = 2; oct <= 6; oct++)
    for (let i = 0; i < 12; i++) NOTE[names[i] + oct] = 440 * Math.pow(2, (oct - 4) + (i - 9) / 12)
})()

console.log('生成音效到', OUT)

// ---------- 各 SFX ----------

// 选牌：清脆短 blip
writeWav('card-select.wav', buildSfx(0.06, (t, i, n) => square(t, 1040) * pluck(i, n)), 0.3)

// 按钮：更钝的 click
writeWav('button.wav', buildSfx(0.05, (t, i, n) => square(t, 520, 0.3) * pluck(i, n)), 0.28)

// 出牌：下滑 swoosh（频率从高到低）
writeWav('card-play.wav', buildSfx(0.18, (t, i, n) => {
  const f = 700 - 400 * (i / n)
  return (square(t, f, 0.5) * 0.6 + noise() * 0.2) * decay(i, n, 1.2)
}), 0.32)

// 计分筹码：两段上行 coin
writeWav('chip.wav', buildSfx(0.13, (t, i, n) => {
  const f = i / n < 0.4 ? NOTE['B4'] : NOTE['E5']
  return square(t, f, 0.5) * decay(i, n, 1.3)
}), 0.3)

// Joker 触发：上行琶音 sparkle
writeWav('joker-trigger.wav', buildSfx(0.26, (t, i, n) => {
  const p = i / n
  const f = p < 0.33 ? NOTE['E5'] : p < 0.66 ? NOTE['G#5'] : NOTE['B5']
  return (square(t, f, 0.5) * 0.7 + sine(t, f * 2) * 0.2) * decay(i, n, 1.1)
}), 0.3)

// 计分爆字：和弦 fanfare
writeWav('score-burst.wav', buildSfx(0.42, (t, i, n) => {
  const e = decay(i, n, 1.0)
  return (square(t, NOTE['C5']) + square(t, NOTE['E5']) + square(t, NOTE['G5'])) / 3 * e
}), 0.34)

// 弃牌：噪声 brrt
writeWav('discard.wav', buildSfx(0.16, (t, i, n) => {
  return (noise() * 0.7 + square(t, 180 - 80 * (i / n), 0.4) * 0.3) * decay(i, n, 1.4)
}), 0.3)

// 购买：收银 ding（两音）
writeWav('buy.wav', buildSfx(0.22, (t, i, n) => {
  const f = i / n < 0.35 ? NOTE['G5'] : NOTE['C6']
  return (sine(t, f) * 0.6 + square(t, f, 0.5) * 0.4) * decay(i, n, 1.0)
}), 0.32)

// 通关：上行 fanfare 4 音
writeWav('win.wav', buildSfx(0.85, (t, i, n) => {
  const p = i / n
  const seq = [NOTE['C5'], NOTE['E5'], NOTE['G5'], NOTE['C6']]
  const f = seq[Math.min(3, Math.floor(p * 4))]
  return (square(t, f) * 0.7 + sine(t, f * 2) * 0.2) * (0.6 + 0.4 * decay(i, n, 0.5))
}), 0.32)

// 失败：下行 sad 3 音
writeWav('lose.wav', buildSfx(0.7, (t, i, n) => {
  const p = i / n
  const seq = [NOTE['E4'], NOTE['D#4'], NOTE['C4']]
  const f = seq[Math.min(2, Math.floor(p * 3))]
  return saw(t, f) * decay(i, n, 0.8)
}), 0.3)

// ---------- BGM：可循环 chiptune（约 8 秒）----------
// 4 小节，每小节 1 个和弦的琶音 + 方波贝斯。首尾对齐以无缝循环。
{
  const bpm = 110
  const beat = 60 / bpm
  const bars = 4
  const totalBeats = bars * 4 // 4/4
  const sec = totalBeats * beat
  const n = dur(sec)
  const a = new Float32Array(n)

  // 和弦进行（Am - F - C - G，轻松循环感）
  const chords = [
    ['A3', 'C4', 'E4'],
    ['F3', 'A3', 'C4'],
    ['C3', 'E3', 'G3'],
    ['G3', 'B3', 'D4'],
  ]
  const bassNotes = ['A2', 'F2', 'C2', 'G2']

  for (let i = 0; i < n; i++) {
    const t = i / SR
    const beatPos = t / beat
    const bar = Math.floor(beatPos / 4) % bars
    const chord = chords[bar]
    const bassF = NOTE[bassNotes[bar]]

    // 贝斯：每拍一个方波音，短促
    const beatFrac = beatPos % 1
    const bassEnv = Math.pow(1 - beatFrac, 1.5)
    const bass = square(t, bassF, 0.4) * bassEnv * 0.5

    // 琶音：每 1/4 拍换一个和弦音
    const step = Math.floor(beatPos * 2) // 八分音符
    const arpF = NOTE[chord[step % chord.length]] * 2 // 高八度
    const arpFrac = (beatPos * 2) % 1
    const arpEnv = Math.pow(1 - arpFrac, 1.2)
    const arp = square(t, arpF, 0.5) * arpEnv * 0.32

    // 轻微 hi-hat（噪声）在反拍
    const hat = beatFrac > 0.5 && beatFrac < 0.56 ? noise() * 0.06 : 0

    a[i] = bass + arp + hat
  }
  writeWav('bgm-main.wav', a, 0.5)
}

console.log('完成。')
