<script setup>
// Joker 卡（DESIGN §3 Joker 槽）—— 140×200，纸黄底，四角内描边按稀有度色
import { computed } from 'vue'
import { RARITY } from '../game/jokers.js'

const props = defineProps({
  joker: { type: Object, default: null }, // null → 空槽
  triggered: { type: Boolean, default: false }, // §5.3 触发金光
  showPrice: { type: Boolean, default: false }, // 商店态右上角价格
  sold: { type: Boolean, default: false },
  suggested: { type: Boolean, default: false }, // AI 建议高亮
})

const rarityColor = computed(() => (props.joker ? RARITY[props.joker.rarity]?.color : '#888'))
</script>

<template>
  <!-- 空槽 -->
  <div v-if="!joker" class="joker-slot empty">
    <div class="plus">+</div>
    <div class="empty-label">空槽</div>
  </div>

  <!-- 实卡 -->
  <div
    v-else
    class="joker-slot card"
    :class="{ triggered, sold, suggested }"
    :style="{ '--rarity': rarityColor }"
  >
    <div v-if="showPrice" class="price">${{ joker.price }}</div>
    <div v-if="suggested" class="suggest-tag">AI 推荐</div>
    <div class="name">{{ joker.name }}</div>
    <div class="art">{{ joker.art }}</div>
    <div class="desc">{{ joker.desc }}</div>
    <div v-if="sold" class="sold-mask">已售出</div>
  </div>
</template>

<style scoped>
.joker-slot {
  width: 140px;
  height: 200px;
  flex: 0 0 auto;
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

/* 空槽：跟实卡同尺寸，虚线紫蓝边 + 半透紫底 + 中心 + 号 */
.joker-slot.empty {
  justify-content: center;
  gap: 6px;
  border: 3px dashed rgba(79, 70, 229, 0.4);
  background: rgba(79, 70, 229, 0.08);
}
.joker-slot.empty .plus {
  font-family: var(--font-ui);
  font-size: 24px;
  color: rgba(232, 234, 240, 0.5);
}
.joker-slot.empty .empty-label {
  font-family: var(--font-ui);
  font-size: 12px;
  color: rgba(232, 234, 240, 0.5);
}

/* 实卡 */
.joker-slot.card {
  background: var(--joker-paper);
  /* 四角内描边按稀有度色 */
  box-shadow:
    inset 0 0 0 3px var(--rarity),
    0 5px 14px rgba(0, 0, 0, 0.45);
  padding: 12px 10px 10px;
  justify-content: flex-start;
  transition:
    transform 0.3s ease-out,
    box-shadow 0.3s ease-out;
}
.joker-slot.card.triggered {
  transform: translateY(-18px) scale(1.15);
  box-shadow:
    inset 0 0 0 3px var(--rarity),
    0 0 16px 6px var(--gold),
    0 8px 20px rgba(255, 200, 87, 0.6);
  z-index: 5;
}
.joker-slot.card.sold {
  opacity: 0.45;
}
.joker-slot.card.suggested {
  box-shadow:
    inset 0 0 0 3px var(--rarity),
    0 0 0 4px #c084fc,
    0 0 22px 6px rgba(192, 132, 252, 0.8);
}
.name {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  color: #2a2418;
  text-align: center;
  line-height: 1.2;
  min-height: 32px;
  display: flex;
  align-items: center;
}
.art {
  font-size: 48px;
  margin: 10px 0;
  line-height: 1;
}
.desc {
  font-family: var(--font-ui);
  font-size: 11px;
  color: #5a4f3a;
  text-align: center;
  line-height: 1.35;
}
.price {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #1a1a2e;
  color: var(--gold);
  font-family: var(--font-lcd);
  font-size: 20px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 8px;
  border: 2px solid var(--gold);
}
.suggest-tag {
  position: absolute;
  top: -10px;
  left: -6px;
  background: #7e22ce;
  color: #fff;
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}
.sold-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 18px;
  font-weight: 900;
  color: #b91c1c;
  background: rgba(245, 230, 200, 0.5);
  border-radius: 10px;
}
</style>
