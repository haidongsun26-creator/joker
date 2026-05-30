<script setup>
// 设置面板（PRD §5.4）—— 4 项，写 localStorage(key=balatro.settings)
const props = defineProps({
  settings: { type: Object, required: true }, // { bgm, sfx, animSpeed, showFormula }
})
const emit = defineEmits(['close', 'update'])

function update(key, value) {
  emit('update', { ...props.settings, [key]: value })
}
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <h2 class="title">设置</h2>

      <!-- BGM 音量 -->
      <div class="row">
        <label>BGM 音量</label>
        <div class="control">
          <input
            type="range"
            min="0"
            max="100"
            :value="settings.bgm"
            @input="update('bgm', Number($event.target.value))"
          />
          <span class="val">{{ settings.bgm }}</span>
        </div>
      </div>

      <!-- SFX 音量 -->
      <div class="row">
        <label>SFX 音量</label>
        <div class="control">
          <input
            type="range"
            min="0"
            max="100"
            :value="settings.sfx"
            @input="update('sfx', Number($event.target.value))"
          />
          <span class="val">{{ settings.sfx }}</span>
        </div>
      </div>

      <!-- 动画速度 -->
      <div class="row">
        <label>动画速度</label>
        <div class="control radios">
          <button
            v-for="opt in ['慢', '普通', '快']"
            :key="opt"
            class="radio"
            :class="{ active: settings.animSpeed === opt }"
            @click="update('animSpeed', opt)"
          >
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- 显示出牌公式预览 -->
      <div class="row">
        <label>显示出牌公式预览</label>
        <div class="control">
          <button
            class="toggle"
            :class="{ on: settings.showFormula }"
            @click="update('showFormula', !settings.showFormula)"
          >
            <span class="knob"></span>
          </button>
        </div>
      </div>

      <button class="px-btn btn-skip close-btn" @click="$emit('close')">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(5, 8, 24, 0.7);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  width: 600px;
  max-width: 92vw;
  min-height: 400px;
  background: linear-gradient(160deg, #15234d, #0a1330);
  border: 1px solid rgba(129, 140, 248, 0.5);
  border-radius: 14px;
  padding: 28px 34px 30px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}
.title {
  font-family: var(--font-ui);
  font-size: 24px;
  font-weight: 700;
  color: var(--gold);
  text-align: center;
  margin: 0 0 16px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(129, 140, 248, 0.15);
}
.row label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-light);
}
.control {
  display: flex;
  align-items: center;
  gap: 12px;
}
.control input[type='range'] {
  width: 200px;
  accent-color: #4dd6ff;
}
.val {
  font-family: var(--font-lcd);
  font-size: 22px;
  color: var(--gold);
  width: 36px;
  text-align: right;
}
.radios {
  gap: 8px;
}
.radio {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 700;
  color: #c7d2fe;
  background: rgba(99, 102, 241, 0.2);
  border: 2px solid rgba(129, 140, 248, 0.4);
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.radio.active {
  background: linear-gradient(180deg, #818cf8, #4338ca);
  color: #fff;
  border-color: #818cf8;
}
.toggle {
  width: 56px;
  height: 30px;
  border-radius: 16px;
  border: 2px solid rgba(129, 140, 248, 0.4);
  background: rgba(0, 0, 0, 0.4);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
}
.toggle.on {
  background: linear-gradient(90deg, #4dd6ff, #2196f3);
}
.toggle .knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}
.toggle.on .knob {
  transform: translateX(26px);
}
.close-btn {
  margin-top: auto;
  align-self: center;
  min-width: 140px;
}
</style>
