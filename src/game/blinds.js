// ============================================================
// 3 关盲注（PRD §3.1）+ 通关奖励（PRD §3.2）
// ============================================================

export const BLINDS = [
  { name: '小盲注', target: 300, icon: '🔵' },
  { name: '中盲注', target: 500, icon: '🟡' },
  { name: '大盲注', target: 800, icon: '🔴' },
]

// 奖金 = $5 + 剩余手数 × $1（剩 4 手 = $9，剩 0 手 = $5）
export function blindReward(handsLeft) {
  return 5 + handsLeft * 1
}
