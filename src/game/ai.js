// ============================================================
// AI 出牌助手（PRD §5.5）—— 本地启发式枚举，不接 LLM、不联网
// 枚举 C(8,1..5) 子集，模拟计分，取最高分
// ============================================================
import { scoreHand } from './cards.js'

// 生成 arr 中大小为 k 的所有组合（按索引）
function* combinations(arr, k) {
  const n = arr.length
  if (k > n) return
  const idx = Array.from({ length: k }, (_, i) => i)
  while (true) {
    yield idx.map((i) => arr[i])
    let i = k - 1
    while (i >= 0 && idx[i] === i + n - k) i--
    if (i < 0) break
    idx[i]++
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1
  }
}

// 返回得分最高的牌子集（card 对象数组）
export function bestPlay(hand, jokers) {
  // 降级：手牌 ≤ 5 张直接全选打出（PRD §5.5 降级策略）
  if (hand.length <= 5) return [...hand]

  let best = null
  let bestScore = -1
  const maxK = Math.min(5, hand.length)
  for (let k = 1; k <= maxK; k++) {
    for (const combo of combinations(hand, k)) {
      const { score } = scoreHand(combo, jokers)
      if (score > bestScore) {
        bestScore = score
        best = combo
      }
    }
  }
  return best || [hand[0]]
}

// 商店 AI 建议性价比模型：price / 期望增益，越低越值
function expectedGain(joker) {
  switch (joker.id) {
    case 'joker':
      return 4
    case 'scholar':
      return 6
    case 'heart_collector':
      return 12
    case 'club_lover':
      return 12
    case 'royal_face':
      return 20
    case 'flush_master':
      return 50
    default:
      return 1
  }
}

// 商店 AI 建议：返回性价比最高（未售出）Joker 的 id
export function shopSuggestion(shopJokers) {
  if (!shopJokers || !shopJokers.length) return null
  let best = null
  let bestRatio = Infinity
  for (const j of shopJokers) {
    if (j.sold) continue
    const ratio = j.price / expectedGain(j)
    if (ratio < bestRatio) {
      bestRatio = ratio
      best = j
    }
  }
  return best ? best.id : null
}
