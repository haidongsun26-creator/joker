<script setup>
// 左 sidebar（PRD §4.2）—— 从上到下 8 块
import { computed } from 'vue'
import { blindReward } from '../game/blinds.js'

const props = defineProps({
  blind: { type: Object, required: true }, // { name, target, icon }
  blindIndex: { type: Number, required: true }, // 0-based
  blindCount: { type: Number, required: true },
  displayScore: { type: Number, required: true }, // 动画插值后的当前分
  handType: { type: String, default: '' }, // 牌型名（空 = 未选）
  chips: { type: Number, default: 0 },
  mult: { type: Number, default: 0 },
  handsLeft: { type: Number, required: true },
  discardsLeft: { type: Number, required: true },
  money: { type: Number, required: true },
  round: { type: Number, required: true },
})
defineEmits(['restart', 'settings'])

const reward = computed(() => blindReward(props.handsLeft))
const progress = computed(() =>
  Math.min(100, Math.round((props.displayScore / props.blind.target) * 100)),
)
</script>

<template>
  <aside class="sidebar">
    <!-- 1. Logo -->
    <div class="logo">🃏 小丑牌</div>

    <!-- 2. 盲注大面板 -->
    <div class="blind-panel">
      <div class="blind-tag">盲注 {{ blindIndex + 1 }}/{{ blindCount }}</div>
      <div class="blind-main">
        <span class="blind-icon">{{ blind.icon }}</span>
        <span class="blind-name">{{ blind.name }}</span>
      </div>
      <div class="blind-target-label">目标分</div>
      <div class="blind-target">{{ blind.target }}</div>
      <div class="blind-reward">奖励 ${{ reward }}</div>
    </div>

    <!-- 3. Round Score -->
    <div class="block">
      <div class="label">当前分</div>
      <div class="round-score">{{ displayScore }}</div>
      <div class="progress">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- 4. HAND 计分块 -->
    <div class="block hand-block">
      <div class="hand-type-name" :class="{ empty: !handType }">
        {{ handType || '— 选牌出牌 —' }}
      </div>
      <div class="score-row">
        <div class="chips-box">
          <div class="big">{{ chips }}</div>
          <div class="tag">CHIPS</div>
        </div>
        <div class="x-sign">×</div>
        <div class="mult-box">
          <div class="big">{{ mult }}</div>
          <div class="tag">MULT</div>
        </div>
      </div>
    </div>

    <!-- 5. Hands / Discards -->
    <div class="hd-row">
      <div class="hd-panel">
        <div class="label">剩余手数</div>
        <div class="hd-num green">{{ handsLeft }}</div>
      </div>
      <div class="hd-panel">
        <div class="label">剩余弃牌</div>
        <div class="hd-num red">{{ discardsLeft }}</div>
      </div>
    </div>

    <!-- 6. 金币 -->
    <div class="money-box">
      <span class="dollar">$</span>
      <span class="money-num">{{ money }}</span>
    </div>

    <!-- 7. Ante / Round -->
    <div class="ante-row">
      <span class="ante">Ante {{ blindIndex + 1 }}/{{ blindCount }}</span>
      <span class="round">Round {{ round }}</span>
    </div>

    <!-- 8. 重新开始 -->
    <div class="bottom-btns">
      <button class="px-btn btn-restart restart" @click="$emit('restart')">重新开始</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: min(28vw, 480px);
  min-width: 280px;
  height: 100vh;
  flex: 0 0 auto;
  background: linear-gradient(180deg, #1a2a5a, #111e44);
  border-right: 2px solid rgba(74, 107, 255, 0.4);
  padding: 18px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  position: relative;
  z-index: 2;
}

.logo {
  font-family: var(--font-pixel);
  font-size: 18px;
  color: var(--gold);
  text-shadow: 2px 2px 0 #000;
  text-align: center;
  padding: 4px 0 8px;
}

/* 盲注大面板 */
.blind-panel {
  background: linear-gradient(180deg, #1e3068, #152050);
  border: 2px solid rgba(74, 107, 255, 0.5);
  border-radius: 12px;
  padding: 14px 16px;
  text-align: center;
}
.blind-tag {
  font-size: 13px;
  color: var(--muted);
  font-weight: 600;
}
.blind-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 6px 0 8px;
}
.blind-icon {
  font-size: 22px;
}
.blind-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-light);
}
.blind-target-label {
  font-size: 12px;
  color: var(--muted);
}
.blind-target {
  font-family: var(--font-lcd);
  font-size: 28px;
  color: var(--gold);
  line-height: 1;
}
.blind-reward {
  font-size: 13px;
  font-weight: 700;
  color: var(--gold);
  margin-top: 4px;
}

/* 通用块 */
.block {
  background: rgba(74, 107, 255, 0.08);
  border: 1px solid rgba(74, 107, 255, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
}
.label {
  font-size: 13px;
  color: var(--muted);
  font-weight: 600;
}
.round-score {
  font-family: var(--font-lcd);
  font-size: 44px;
  color: var(--gold);
  line-height: 1.05;
}
.progress {
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
  border: 1px solid rgba(74, 107, 255, 0.3);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4dd6ff, #2196f3);
  border-radius: 4px;
  transition: width 0.25s ease;
}

/* HAND 计分块 */
.hand-block {
  text-align: center;
}
.hand-type-name {
  font-size: 14px;
  font-weight: 700;
  color: #4dd6ff;
  margin-bottom: 8px;
}
.hand-type-name.empty {
  color: var(--muted);
}
.score-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.chips-box,
.mult-box {
  flex: 1;
  border-radius: 8px;
  padding: 10px 4px 6px;
  color: #000;
}
.chips-box {
  background: var(--chips-blue);
  border: 2px solid #1a7bd4;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 3px 0 #0d4a80;
}
.mult-box {
  background: var(--mult-red);
  border: 2px solid #cc2233;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    0 3px 0 #8b1a1a;
}
.chips-box .big,
.mult-box .big {
  font-family: var(--font-pixel);
  font-size: 28px;
  line-height: 1.1;
  color: rgba(0, 5, 20, 0.9);
}
.chips-box .tag,
.mult-box .tag {
  font-family: var(--font-pixel);
  font-size: 9px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 5px;
}
.x-sign {
  font-family: var(--font-pixel);
  font-size: 10px;
  color: var(--text-dim);
}

/* Hands / Discards */
.hd-row {
  display: flex;
  gap: 10px;
}
.hd-panel {
  flex: 1;
  background: rgba(74, 107, 255, 0.08);
  border: 1px solid rgba(74, 107, 255, 0.2);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: center;
}
.hd-num {
  font-family: var(--font-lcd);
  font-size: 34px;
  line-height: 1;
}
.hd-num.green {
  color: #62d18b;
}
.hd-num.red {
  color: #ff5544;
}

/* 金币 */
.money-box {
  background: var(--inset);
  border: 2px solid rgba(74, 107, 255, 0.5);
  border-radius: 10px;
  padding: 8px 16px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
}
.money-box .dollar {
  font-family: var(--font-pixel);
  font-size: 14px;
  color: var(--gold);
}
.money-box .money-num {
  font-family: var(--font-lcd);
  font-size: 44px;
  color: var(--money);
  line-height: 1;
}

/* Ante / Round */
.ante-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 0 4px;
}
.ante-row .ante {
  color: var(--gold);
  font-weight: 700;
}
.ante-row .round {
  color: #4dd6ff;
  font-weight: 700;
}

.bottom-btns {
  margin-top: auto;
}
.restart {
  width: 100%;
}
</style>
