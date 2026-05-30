<script setup>
// 商店覆盖层（PRD §4.7 / §3.3）
import JokerCard from './JokerCard.vue'

const props = defineProps({
  shopJokers: { type: Array, required: true }, // [{...joker, sold}]
  money: { type: Number, required: true },
  jokerCount: { type: Number, required: true }, // 已持有 Joker 数
  slotMax: { type: Number, default: 5 },
  suggestedId: { type: String, default: '' }, // AI 建议高亮的 joker id
})
defineEmits(['buy', 'skip'])

// 购买按钮状态（PRD §3.3）
function buyState(j) {
  if (j.sold) return { label: '已售出', disabled: true }
  if (props.jokerCount >= props.slotMax) return { label: '槽满了', disabled: true }
  if (props.money < j.price) return { label: '钱不够', disabled: true }
  return { label: `购买 $${j.price}`, disabled: false }
}
</script>

<template>
  <div class="overlay">
    <div class="shop">
      <h1 class="title">商店</h1>
      <p class="subtitle">
        通关奖励到账！金币 ${{ money }} · Joker 槽 {{ jokerCount }}/{{ slotMax }}
      </p>

      <div class="shop-row">
        <div v-for="j in shopJokers" :key="j.id" class="shop-item">
          <JokerCard
            :joker="j"
            :show-price="true"
            :sold="j.sold"
            :suggested="j.id === suggestedId"
          />
          <button
            class="px-btn buy-btn"
            :class="{ available: !buyState(j).disabled }"
            :disabled="buyState(j).disabled"
            @click="$emit('buy', j)"
          >
            {{ buyState(j).label }}
          </button>
        </div>
      </div>

      <div class="skip-row">
        <button class="px-btn btn-skip skip-btn" @click="$emit('skip')">跳过 →</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(5, 8, 24, 0.82);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.shop {
  position: relative;
  width: min(780px, 92vw);
  background: linear-gradient(160deg, #15234d, #0a1330);
  border: 1px solid rgba(129, 140, 248, 0.45);
  border-radius: 16px;
  padding: 32px 36px 36px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}
.title {
  font-family: var(--font-ui);
  font-size: 30px;
  font-weight: 800;
  color: var(--gold);
  margin: 0 0 6px;
}
.subtitle {
  font-size: 14px;
  color: var(--text-light);
  margin: 0 0 28px;
}
.shop-row {
  display: flex;
  justify-content: center;
  gap: 26px;
  margin-bottom: 26px;
}
.shop-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.buy-btn {
  width: 140px;
  min-height: 44px;
  padding: 10px 8px;
  font-size: 14px;
  /* 默认（禁用态）灰蓝；available 时变绿 */
  background: linear-gradient(180deg, #64748b, #475569);
  box-shadow:
    0 4px 0 #334155,
    inset 0 2px 0 rgba(255, 255, 255, 0.2);
}
.buy-btn.available {
  background: linear-gradient(180deg, #34d399 0%, #10b981 50%, #059669 100%);
  box-shadow:
    0 5px 0 #047857,
    0 8px 18px rgba(16, 185, 129, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.35);
}
.skip-row {
  display: flex;
  justify-content: flex-end;
}
.skip-btn {
  min-width: 160px;
}
</style>
