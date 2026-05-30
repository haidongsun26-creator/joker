// ============================================================
// 牌组 / 牌型识别 / 计分 —— 数值全部按 PRD §1.1 / §1.2 锁定
// ============================================================

export const SUITS = [
  { key: 'spade', symbol: '♠', color: 'black' },
  { key: 'heart', symbol: '♥', color: 'red' },
  { key: 'diamond', symbol: '♦', color: 'red' },
  { key: 'club', symbol: '♣', color: 'black' },
]

// 点数：2-10 + J Q K A（无大小王）
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

// 计分点数：A = 11、J/Q/K = 10、其他 = 数字本身（PRD §1.2）
export function cardValue(rank) {
  if (rank === 'A') return 11
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10
  return Number(rank)
}

// 顺子排序用的序号：A 默认高位（14），A-2-3-4-5 时单独特判
function orderValue(rank) {
  if (rank === 'A') return 14
  if (rank === 'K') return 13
  if (rank === 'Q') return 12
  if (rank === 'J') return 11
  return Number(rank)
}

let cardSeq = 0
function makeCard(suitObj, rank) {
  return {
    id: `c${cardSeq++}`,
    suit: suitObj.key,
    symbol: suitObj.symbol,
    color: suitObj.color,
    rank,
    value: cardValue(rank),
    order: orderValue(rank),
  }
}

// 标准 52 张
export function buildDeck() {
  const deck = []
  for (const s of SUITS) for (const r of RANKS) deck.push(makeCard(s, r))
  return deck
}

// Fisher–Yates 洗牌（原地，返回同一数组）
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ============================================================
// 牌型表（PRD §1.1，按基础筹码降序）
// ============================================================
export const HAND_TYPES = {
  straightFlush: { name: '同花顺', chips: 100, mult: 8 },
  fourKind: { name: '四条', chips: 60, mult: 7 },
  fullHouse: { name: '葫芦', chips: 40, mult: 4 },
  flush: { name: '同花', chips: 35, mult: 4 },
  straight: { name: '顺子', chips: 30, mult: 4 },
  threeKind: { name: '三条', chips: 30, mult: 3 },
  twoPair: { name: '两对', chips: 20, mult: 2 },
  pair: { name: '对子', chips: 10, mult: 2 },
  highCard: { name: '高牌', chips: 5, mult: 1 },
}

// 统计每个点数出现次数，降序
function rankCounts(cards) {
  const m = {}
  for (const c of cards) m[c.rank] = (m[c.rank] || 0) + 1
  return Object.values(m).sort((a, b) => b - a)
}

function isFlush(cards) {
  return cards.length === 5 && cards.every((c) => c.suit === cards[0].suit)
}

function isStraight(cards) {
  if (cards.length !== 5) return false
  const orders = [...new Set(cards.map((c) => c.order))].sort((a, b) => a - b)
  if (orders.length !== 5) return false
  // 普通连续
  if (orders[4] - orders[0] === 4) return true
  // A-2-3-4-5（A 当 1 用）：序号集合为 2,3,4,5,14
  if (orders[0] === 2 && orders[1] === 3 && orders[2] === 4 && orders[3] === 5 && orders[4] === 14) return true
  return false
}

// 识别牌型，返回 HAND_TYPES 的 key（依赖 5 张的牌型在少于 5 张时自然不命中）
export function detectHand(cards) {
  if (!cards.length) return 'highCard'
  const counts = rankCounts(cards)
  const flush = isFlush(cards)
  const straight = isStraight(cards)

  if (straight && flush) return 'straightFlush'
  if (counts[0] === 4) return 'fourKind'
  if (counts[0] === 3 && counts[1] === 2) return 'fullHouse'
  if (flush) return 'flush'
  if (straight) return 'straight'
  if (counts[0] === 3) return 'threeKind'
  if (counts[0] === 2 && counts[1] === 2) return 'twoPair'
  if (counts[0] === 2) return 'pair'
  return 'highCard'
}

// ============================================================
// 计分（PRD §1.2）
// 返回结构同时供「最终得分」与「§5.1 动画时间线」逐步播放使用
// ============================================================
export function scoreHand(cards, jokers = []) {
  const handType = detectHand(cards)
  const info = HAND_TYPES[handType]

  const baseChips = info.chips // 牌型基础筹码（动画第 2 步锁定）
  const baseMult = info.mult

  // 逐张牌的点数贡献（动画第 3 步：逐张高亮 + 蓝色 +N 飞字）
  const cardSteps = cards.map((c) => ({ card: c, add: c.value }))
  const chipsAfterCards = baseChips + cardSteps.reduce((s, c) => s + c.add, 0)

  // Joker 依次修改 (chips, mult)
  const s = { chips: chipsAfterCards, mult: baseMult, cards, handType }
  const jokerSteps = []
  for (const j of jokers) {
    const r = j.apply(s) || { triggered: false }
    jokerSteps.push({
      joker: j,
      triggered: !!r.triggered,
      text: r.text || '',
      kind: r.kind || 'mult',
      chips: s.chips,
      mult: s.mult,
    })
  }

  const finalChips = s.chips
  const finalMult = s.mult
  const score = Math.round(finalChips * finalMult)

  return {
    handType,
    info,
    baseChips,
    baseMult,
    cardSteps,
    chipsAfterCards,
    jokerSteps,
    finalChips,
    finalMult,
    score,
  }
}
