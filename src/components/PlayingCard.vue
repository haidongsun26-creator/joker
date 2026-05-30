<script setup>
// 扑克牌（DESIGN §3 手牌）—— 100×145，选中态上移 + 金边金光
defineProps({
  card: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  highlight: { type: Boolean, default: false }, // 逐张计分高亮（§5.1 第 3 步）
  disabled: { type: Boolean, default: false }, // 已选 5 张时未选中的牌不响应
})
defineEmits(['click'])
</script>

<template>
  <div
    class="playing-card"
    :class="[`suit-${card.color}`, { selected, highlight, disabled }]"
    @click="!disabled && $emit('click', card)"
  >
    <div class="corner top">
      <div class="rank">{{ card.rank }}</div>
      <div class="suit">{{ card.symbol }}</div>
    </div>
    <div class="center-suit">{{ card.symbol }}</div>
    <div class="corner bottom">
      <div class="rank">{{ card.rank }}</div>
      <div class="suit">{{ card.symbol }}</div>
    </div>
  </div>
</template>

<style scoped>
.playing-card {
  position: relative;
  width: 100px;
  height: 145px;
  flex: 0 0 auto;
  background: #ffffff;
  border: 2px solid #1a1a2e;
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
  user-select: none;
}
.playing-card:hover:not(.disabled):not(.selected) {
  transform: translateY(-8px) scale(1.03);
}
.playing-card.selected {
  transform: translateY(-26px);
  border-color: var(--gold);
  box-shadow:
    0 0 0 3px var(--gold),
    0 8px 20px rgba(255, 200, 87, 0.5);
}
.playing-card.highlight {
  transform: translateY(-18px) scale(1.05);
  box-shadow:
    0 0 18px 4px #4dd6ff,
    0 8px 18px rgba(77, 214, 255, 0.6);
}
.playing-card.disabled {
  cursor: default;
  opacity: 0.92;
}
.suit-red {
  color: #e4322b;
}
.suit-black {
  color: #1a1a2e;
}
.corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}
.corner.top {
  top: 7px;
  left: 8px;
}
.corner.bottom {
  bottom: 7px;
  right: 8px;
  transform: rotate(180deg);
}
.corner .rank {
  font-family: var(--font-ui);
  font-weight: 800;
  font-size: 20px;
}
.corner .suit {
  font-size: 16px;
}
.center-suit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 44px;
}
</style>
