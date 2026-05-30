// ============================================================
// Joker 候选库（共 6 张）—— 字段 + 数值按 PRD §2.1 锁定
// apply(s) 直接修改累加器 s = { chips, mult, cards, handType }
// 返回 { triggered, text, kind } 供 §5.1 飞字动画使用
//   kind: 'mult' → 红色飞字向 mult 块；'chips' → 蓝色飞字向 chips 块
// ============================================================

// 稀有度色板（PRD §2.2 / DESIGN §2.2）
export const RARITY = {
  common: { name: '普通', color: '#6cb4d3' }, // 普通蓝
  uncommon: { name: '罕见', color: '#5bc97a' }, // 罕见绿
  rare: { name: '稀有', color: '#e34b6f' }, // 稀有红
  legendary: { name: '传说', color: '#b577ff' }, // 传说紫
}

export const JOKER_LIBRARY = [
  {
    id: 'joker',
    name: '小丑',
    rarity: 'common',
    price: 3,
    art: '🃏',
    desc: '每手 +4 倍率',
    apply(s) {
      s.mult += 4
      return { triggered: true, text: '+4', kind: 'mult' }
    },
  },
  {
    id: 'scholar',
    name: '学者',
    rarity: 'common',
    price: 3,
    art: '📖',
    desc: '打出的牌每张 A：+4 倍率',
    apply(s) {
      const aces = s.cards.filter((c) => c.rank === 'A').length
      if (!aces) return { triggered: false }
      s.mult += 4 * aces
      return { triggered: true, text: `+${4 * aces}`, kind: 'mult' }
    },
  },
  {
    id: 'heart_collector',
    name: '红心收藏家',
    rarity: 'rare',
    price: 5,
    art: '❤️',
    desc: '打出的牌里含 ♥ 时，倍率 ×4',
    apply(s) {
      if (!s.cards.some((c) => c.suit === 'heart')) return { triggered: false }
      s.mult *= 4
      return { triggered: true, text: '×4', kind: 'mult' }
    },
  },
  {
    id: 'club_lover',
    name: '梅花爱好者',
    rarity: 'rare',
    price: 5,
    art: '♣',
    desc: '打出的牌里含 ♣ 时，倍率 ×4',
    apply(s) {
      if (!s.cards.some((c) => c.suit === 'club')) return { triggered: false }
      s.mult *= 4
      return { triggered: true, text: '×4', kind: 'mult' }
    },
  },
  {
    id: 'royal_face',
    name: '皇家头牌',
    rarity: 'rare',
    price: 5,
    art: '👑',
    desc: '打出的牌里含 J / Q / K 时，倍率 ×10',
    apply(s) {
      const hasFace = s.cards.some((c) => ['J', 'Q', 'K'].includes(c.rank))
      if (!hasFace) return { triggered: false }
      s.mult *= 10
      return { triggered: true, text: '×10', kind: 'mult' }
    },
  },
  {
    id: 'flush_master',
    name: '同花顺大师',
    rarity: 'legendary',
    price: 8,
    art: '🔥',
    desc: '打出同花顺时 +50 倍率',
    apply(s) {
      if (s.handType !== 'straightFlush') return { triggered: false }
      s.mult += 50
      return { triggered: true, text: '+50', kind: 'mult' }
    },
  },
]

export function getJokerById(id) {
  return JOKER_LIBRARY.find((j) => j.id === id)
}
