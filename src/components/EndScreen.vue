<script setup>
// 结束界面（PRD §4.8）—— won / lost
import JokerCard from './JokerCard.vue'

defineProps({
  won: { type: Boolean, required: true },
  money: { type: Number, required: true },
  jokers: { type: Array, required: true },
})
defineEmits(['restart'])
</script>

<template>
  <div class="overlay">
    <div class="panel">
      <h1 class="title" :class="won ? 'win' : 'lose'">
        {{ won ? '🎉 通关全部' : '💀 失败' }}
      </h1>

      <div class="money">
        最终金币 <span class="gold">${{ money }}</span>
      </div>

      <div class="jokers-label">持有的 Joker</div>
      <div class="jokers-row">
        <template v-if="jokers.length">
          <JokerCard v-for="j in jokers" :key="j.id" :joker="j" />
        </template>
        <div v-else class="none">（无）</div>
      </div>

      <button class="px-btn btn-restart" @click="$emit('restart')">重新开始</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(5, 8, 24, 0.88);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.panel {
  width: min(720px, 92vw);
  max-height: 90vh;
  overflow-y: auto;
  background: linear-gradient(160deg, #15234d, #0a1330);
  border: 1px solid rgba(129, 140, 248, 0.45);
  border-radius: 16px;
  padding: 36px 40px 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}
.title {
  font-family: var(--font-ui);
  font-size: 32px;
  font-weight: 900;
  margin: 0 0 16px;
}
.title.win {
  color: var(--gold);
  text-shadow: 0 0 20px rgba(255, 200, 87, 0.6);
}
.title.lose {
  color: #ef4444;
}
.money {
  font-size: 18px;
  margin-bottom: 24px;
}
.money .gold {
  font-family: var(--font-lcd);
  font-size: 32px;
  color: var(--gold);
}
.jokers-label {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 12px;
}
.jokers-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  margin-bottom: 30px;
  min-height: 40px;
}
.none {
  color: var(--muted);
}
</style>
