<script setup>
// ============================================================
// 小丑牌 · 核心循环主编排（PRD §4 布局 / §5 动效 / M4 状态机）
// ============================================================
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import SideBar from './components/SideBar.vue'
import PlayingCard from './components/PlayingCard.vue'
import JokerCard from './components/JokerCard.vue'
import Shop from './components/Shop.vue'
import EndScreen from './components/EndScreen.vue'
import SettingsModal from './components/SettingsModal.vue'
import { buildDeck, shuffle, detectHand, scoreHand, HAND_TYPES } from './game/cards.js'
import { JOKER_LIBRARY } from './game/jokers.js'
import { BLINDS, blindReward } from './game/blinds.js'
import { bestPlay, shopSuggestion } from './game/ai.js'

const HAND_SIZE = 8
const SLOT_MAX = 5
const SETTINGS_KEY = 'balatro.settings'

// ---------------- 持久化设置（PRD §5.4） ----------------
const settings = reactive({ bgm: 50, sfx: 70, animSpeed: '普通', showFormula: true })
const showSettings = ref(false)

const animScale = computed(() => {
  if (settings.animSpeed === '慢') return 1.5
  if (settings.animSpeed === '快') return 0.6
  return 1
})

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) Object.assign(settings, JSON.parse(raw))
  } catch (e) {
    /* 忽略损坏的本地存储 */
  }
  applyAnimScale()
}
function saveSettings(next) {
  Object.assign(settings, next)
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings }))
  applyAnimScale()
}
function applyAnimScale() {
  document.documentElement.style.setProperty('--anim-scale', String(animScale.value))
}

// ---------------- 游戏状态（M4 状态机） ----------------
const gameState = ref('playing') // playing | shop | won | lost
const deck = ref([])
const hand = ref([])
const played = ref([]) // 出牌区当前展示的牌
const ownedJokers = ref([])
const selectedIds = ref([])

const currentBlindIndex = ref(0)
const round = ref(1)
const money = ref(0)
const blindScore = ref(0) // 真实累计分
const displayScore = ref(0) // 动画插值显示分
const handsLeft = ref(4)
const discardsLeft = ref(3)

// 战斗中临时显示（sidebar HAND 块）
const battleHandType = ref('')
const battleChips = ref(0)
const battleMult = ref(0)
const isBusy = ref(false) // 动画锁
const highlightCardId = ref('') // 逐张计分高亮
const triggeredJokerIds = ref(new Set()) // Joker 触发金光
const dealingIds = ref(new Set()) // 飞行中隐藏占位的牌
const scoreBurst = ref(null) // { chips, mult, score }

// 商店
const shopJokers = ref([])
const suggestedId = ref('')

// AI
const aiThinking = ref(false)

const currentBlind = computed(() => BLINDS[currentBlindIndex.value])

// 选中的牌（按手牌顺序）
const selectedCards = computed(() =>
  hand.value.filter((c) => selectedIds.value.includes(c.id)),
)

// sidebar 牌型名：忙时用战斗值；选牌时预览；否则空
const sidebarHandType = computed(() => {
  if (isBusy.value) return battleHandType.value
  if (selectedCards.value.length) return HAND_TYPES[detectHand(selectedCards.value)].name
  return ''
})
const sidebarChips = computed(() => (isBusy.value ? battleChips.value : 0))
const sidebarMult = computed(() => (isBusy.value ? battleMult.value : 0))

// 出牌区公式预览（设置开启 + 选了牌 + 未忙）
const formulaPreview = computed(() => {
  if (!settings.showFormula || isBusy.value || played.value.length || !selectedCards.value.length)
    return null
  return scoreHand(selectedCards.value, ownedJokers.value)
})

// ---------------- 工具 ----------------
const wait = (ms) => new Promise((r) => setTimeout(r, ms * animScale.value))
const getEl = (sel) => document.querySelector(sel)
const cardWrapEl = (id) => document.querySelector(`[data-card="${id}"]`)
const playedWrapEl = (id) => document.querySelector(`[data-played="${id}"]`)
const jokerWrapEl = (id) => document.querySelector(`[data-joker="${id}"]`)

const deckRef = ref(null)

// 飞行克隆牌：从 fromRect 飞到 toRect，dur 毫秒（已含 animScale）
function flyClone(fromRect, toRect, html, durMs) {
  return new Promise((res) => {
    const el = document.createElement('div')
    el.className = 'fly-card'
    el.style.left = fromRect.left + 'px'
    el.style.top = fromRect.top + 'px'
    el.style.width = fromRect.width + 'px'
    el.style.height = fromRect.height + 'px'
    el.style.setProperty('--fly-dur', durMs + 'ms')
    el.innerHTML = html
    document.body.appendChild(el)
    el.getBoundingClientRect() // 强制 reflow
    el.style.transform = `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px)`
    setTimeout(() => {
      el.remove()
      res()
    }, durMs)
  })
}

// 飞字：从 fromEl 飞向 toEl
function flyText(fromEl, toEl, text, kind, durMs) {
  if (!fromEl || !toEl) return
  const f = fromEl.getBoundingClientRect()
  const t = toEl.getBoundingClientRect()
  const el = document.createElement('div')
  el.className = `fly-text ${kind}`
  el.textContent = text
  el.style.left = f.left + f.width / 2 + 'px'
  el.style.top = f.top + 'px'
  el.style.setProperty('--fly-dur', durMs + 'ms')
  document.body.appendChild(el)
  el.getBoundingClientRect()
  el.style.transform = `translate(${t.left + t.width / 2 - (f.left + f.width / 2)}px, ${t.top - f.top}px)`
  el.style.opacity = '0'
  setTimeout(() => el.remove(), durMs)
}

// RAF 数字插值（PRD §5.1 第 6 步）
function animateScore(from, to, durMs) {
  const start = performance.now()
  function tick(now) {
    const t = Math.min(1, (now - start) / durMs)
    displayScore.value = Math.round(from + (to - from) * t)
    if (t < 1) requestAnimationFrame(tick)
    else displayScore.value = to
  }
  requestAnimationFrame(tick)
}

// ---------------- 发牌动画（PRD §5.2） ----------------
// 把 hand 补到 HAND_SIZE，新牌从牌堆位置飞入，每张错峰 60ms
async function dealUpTo(target) {
  const need = Math.min(target - hand.value.length, deck.value.length)
  if (need <= 0) return
  const newCards = []
  for (let i = 0; i < need; i++) newCards.push(deck.value.pop())
  hand.value.push(...newCards)
  await nextTick()
  const deckRect = deckRef.value?.getBoundingClientRect()
  if (!deckRect) return
  for (const card of newCards) {
    const el = cardWrapEl(card.id)
    if (!el) continue
    const toRect = el.getBoundingClientRect()
    const html = el.innerHTML
    dealingIds.value = new Set([...dealingIds.value, card.id]) // 隐藏真牌占位
    flyClone(deckRect, toRect, html, 400 * animScale.value).then(() => {
      const s = new Set(dealingIds.value)
      s.delete(card.id)
      dealingIds.value = s
    })
    await wait(60)
  }
  await wait(400)
}

// ---------------- 选牌 / 排序 ----------------
function toggleSelect(card) {
  if (isBusy.value) return
  const i = selectedIds.value.indexOf(card.id)
  if (i >= 0) {
    selectedIds.value.splice(i, 1)
  } else {
    if (selectedIds.value.length >= 5) return // 已选 5 张不响应（PRD §1 选牌）
    selectedIds.value.push(card.id)
  }
}
function isSelected(card) {
  return selectedIds.value.includes(card.id)
}
function sortByRank() {
  hand.value.sort((a, b) => a.order - b.order || a.suit.localeCompare(b.suit))
}
function sortBySuit() {
  hand.value.sort((a, b) => a.suit.localeCompare(b.suit) || a.order - b.order)
}

// ---------------- 出牌（PRD §5.1 完整时间线） ----------------
async function handlePlay() {
  if (isBusy.value || selectedCards.value.length === 0) return
  isBusy.value = true
  suggestedId.value = ''

  const cards = [...selectedCards.value]
  const result = scoreHand(cards, ownedJokers.value)

  // 1. 选中牌飞向出牌区（≈350ms）
  const fromRects = cards.map((c) => cardWrapEl(c.id)?.getBoundingClientRect())
  const htmls = cards.map((c) => cardWrapEl(c.id)?.innerHTML || '')
  // 从手牌移除，放进出牌区（先隐藏出牌区真牌占位）
  hand.value = hand.value.filter((c) => !cards.includes(c))
  selectedIds.value = []
  played.value = cards
  dealingIds.value = new Set(cards.map((c) => c.id))
  await nextTick()
  const flyP = []
  cards.forEach((c, i) => {
    const toRect = playedWrapEl(c.id)?.getBoundingClientRect()
    if (fromRects[i] && toRect) flyP.push(flyClone(fromRects[i], toRect, htmls[i], 350 * animScale.value))
  })
  await Promise.all(flyP)
  dealingIds.value = new Set() // 显示出牌区真牌

  // 2. 显示牌型名 + 锁定初始 chips / mult
  battleHandType.value = result.info.name
  battleChips.value = result.baseChips
  battleMult.value = result.baseMult
  await wait(200)

  // 3. 逐张高亮 + 蓝色 chips 飞字（每张 150ms）
  const chipsBox = getEl('.chips-box')
  for (const step of result.cardSteps) {
    highlightCardId.value = step.card.id
    battleChips.value += step.add
    flyText(playedWrapEl(step.card.id), chipsBox, `+${step.add}`, 'chips', 400 * animScale.value)
    await wait(150)
  }
  highlightCardId.value = ''

  // 4. Joker 触发金光 + 飞字（每个 300ms）
  const multBox = getEl('.mult-box')
  for (const js of result.jokerSteps) {
    if (!js.triggered) continue
    triggeredJokerIds.value = new Set([...triggeredJokerIds.value, js.joker.id])
    battleChips.value = js.chips
    battleMult.value = js.mult
    const target = js.kind === 'chips' ? chipsBox : multBox
    flyText(jokerWrapEl(js.joker.id), target, js.text, js.kind, 400 * animScale.value)
    await wait(300)
  }

  // 5. 公式爆出（停留 800ms）
  scoreBurst.value = { chips: result.finalChips, mult: result.finalMult, score: result.score }
  await wait(800)
  scoreBurst.value = null
  triggeredJokerIds.value = new Set()

  // 6. blindScore 累加（RAF 插值 ≈600ms）
  const from = blindScore.value
  blindScore.value += result.score
  animateScore(from, blindScore.value, 600 * animScale.value)
  handsLeft.value -= 1
  await wait(600)

  // 7. 淡出出牌区 + 补牌发牌
  played.value = []
  battleHandType.value = ''
  battleChips.value = 0
  battleMult.value = 0
  await dealUpTo(HAND_SIZE)

  isBusy.value = false

  // 8. 判定通关 / 失败
  if (blindScore.value >= currentBlind.value.target) {
    passBlind()
  } else if (handsLeft.value <= 0) {
    gameState.value = 'lost'
  }
}

// ---------------- 弃牌（PRD §1 / 验收·弃牌） ----------------
async function handleDiscard() {
  if (isBusy.value) return
  if (selectedCards.value.length < 1 || discardsLeft.value <= 0) return
  isBusy.value = true
  const cards = [...selectedCards.value]
  hand.value = hand.value.filter((c) => !cards.includes(c))
  selectedIds.value = []
  discardsLeft.value -= 1
  await dealUpTo(HAND_SIZE)
  isBusy.value = false
}

// ---------------- 通关 / 商店 / 关卡推进 ----------------
function passBlind() {
  // 大盲注通关 → won，不进商店（PRD §10.2 翻车点 5）
  money.value += blindReward(handsLeft.value)
  if (currentBlindIndex.value >= BLINDS.length - 1) {
    gameState.value = 'won'
    return
  }
  enterShop()
}

function enterShop() {
  // 从 6 张候选库随机抽 3 张不重复
  const pool = shuffle([...JOKER_LIBRARY]).slice(0, 3)
  shopJokers.value = pool.map((j) => ({ ...j, sold: false }))
  suggestedId.value = ''
  gameState.value = 'shop'
}

function buyJoker(j) {
  if (j.sold || money.value < j.price || ownedJokers.value.length >= SLOT_MAX) return
  money.value -= j.price
  ownedJokers.value.push({ ...j })
  const item = shopJokers.value.find((x) => x.id === j.id)
  if (item) item.sold = true
}

function skipShop() {
  currentBlindIndex.value += 1
  round.value += 1
  startBlind()
  gameState.value = 'playing'
}

// 开始一关（重置牌堆 / 手牌 / 分数 / 手数 / 弃牌）
async function startBlind() {
  deck.value = shuffle(buildDeck())
  hand.value = []
  played.value = []
  selectedIds.value = []
  blindScore.value = 0
  displayScore.value = 0
  handsLeft.value = 4
  discardsLeft.value = 3
  battleHandType.value = ''
  battleChips.value = 0
  battleMult.value = 0
  await nextTick()
  await dealUpTo(HAND_SIZE)
}

// 全新一局（重新开始）
function newGame() {
  money.value = 0
  ownedJokers.value = []
  currentBlindIndex.value = 0
  round.value = 1
  gameState.value = 'playing'
  startBlind()
}

// ---------------- AI（PRD §5.5） ----------------
async function handleAI() {
  if (isBusy.value || aiThinking.value) return
  aiThinking.value = true
  await wait(800) // 思考态脉冲动画
  const best = bestPlay(hand.value, ownedJokers.value)
  selectedIds.value = best.map((c) => c.id)
  aiThinking.value = false
  await wait(200)
  await handlePlay()
}

function handleAISuggest() {
  suggestedId.value = shopSuggestion(shopJokers.value) || ''
}

// ---------------- 按钮文案 / 状态 ----------------
const playLabel = computed(() => `出牌 (${selectedCards.value.length})`)
const discardLabel = computed(() => `弃牌 (${discardsLeft.value})`)
const playDisabled = computed(() => isBusy.value || selectedCards.value.length === 0)
const discardDisabled = computed(
  () => isBusy.value || selectedCards.value.length === 0 || discardsLeft.value <= 0,
)
const handCountLabel = computed(() => `已选 ${selectedCards.value.length} / 5 张`)

onMounted(() => {
  loadSettings()
  newGame()
})
</script>

<template>
  <div class="game">
    <!-- 右上角设置齿轮（PRD §5.4 / 文案 ⚙️） -->
    <button class="gear-btn" @click="showSettings = true">⚙️</button>

    <SideBar
      :blind="currentBlind"
      :blind-index="currentBlindIndex"
      :blind-count="BLINDS.length"
      :display-score="displayScore"
      :hand-type="sidebarHandType"
      :chips="sidebarChips"
      :mult="sidebarMult"
      :hands-left="handsLeft"
      :discards-left="discardsLeft"
      :money="money"
      :round="round"
      @restart="newGame"
    />

    <!-- 右主区：3 段 grid（PRD §10.1.3 锁定 230px 1fr 280px） -->
    <main class="main-area">
      <!-- 第 1 段 Joker 区 -->
      <section class="joker-section">
        <div class="joker-title">JOKERS · {{ ownedJokers.length }}/{{ SLOT_MAX }}</div>
        <div class="joker-row">
          <div
            v-for="i in SLOT_MAX"
            :key="i"
            class="joker-wrap"
            :data-joker="ownedJokers[i - 1]?.id"
          >
            <JokerCard
              :joker="ownedJokers[i - 1] || null"
              :triggered="ownedJokers[i - 1] && triggeredJokerIds.has(ownedJokers[i - 1].id)"
            />
          </div>
        </div>
      </section>

      <!-- 第 2 段 出牌区（relative，牌堆锚定右下） -->
      <section class="play-area">
        <div class="play-title">出牌区</div>

        <!-- 出牌中：展示出牌 + 牌型浮字 -->
        <div v-if="played.length" class="played-row">
          <div
            v-for="c in played"
            :key="c.id"
            class="card-wrap"
            :data-played="c.id"
            :style="{ visibility: dealingIds.has(c.id) ? 'hidden' : 'visible' }"
          >
            <PlayingCard :card="c" :highlight="highlightCardId === c.id" />
          </div>
        </div>

        <!-- 公式预览（设置开启 + 选了牌） -->
        <div v-else-if="formulaPreview" class="formula-preview">
          <span class="f-chips">{{ formulaPreview.finalChips }}</span>
          <span class="f-op">×</span>
          <span class="f-mult">{{ formulaPreview.finalMult }}</span>
          <span class="f-op">=</span>
          <span class="f-score">{{ formulaPreview.score }}</span>
        </div>

        <!-- 空态 -->
        <div v-else class="play-empty">选择手牌组成牌型（1-5 张）</div>

        <!-- 牌堆（absolute 内嵌出牌区右下，PRD §4.4） -->
        <div v-show="gameState === 'playing'" ref="deckRef" class="deck">
          <div class="deck-pile">
            <span class="deck-layer l3"></span>
            <span class="deck-layer l2"></span>
            <span class="deck-layer l1"></span>
          </div>
          <div class="deck-count">{{ deck.length }}/52</div>
        </div>
      </section>

      <!-- 第 3 段 手牌 + 操作 -->
      <section class="hand-section">
        <div class="hand-head">
          <span class="hand-label">手牌</span>
          <span class="hand-count">{{ handCountLabel }}</span>
        </div>

        <div class="hand-row">
          <div
            v-for="c in hand"
            :key="c.id"
            class="card-wrap"
            :data-card="c.id"
            :style="{ visibility: dealingIds.has(c.id) ? 'hidden' : 'visible' }"
          >
            <PlayingCard
              :card="c"
              :selected="isSelected(c)"
              :disabled="!isSelected(c) && selectedIds.length >= 5"
              @click="toggleSelect"
            />
          </div>
        </div>

        <div class="action-row">
          <button class="px-btn" :disabled="playDisabled" @click="handlePlay">{{ playLabel }}</button>
          <button class="px-btn btn-discard" :disabled="discardDisabled" @click="handleDiscard">
            {{ discardLabel }}
          </button>
          <button class="px-btn btn-sort" :disabled="isBusy" @click="sortByRank">按点排序</button>
          <button class="px-btn btn-sort" :disabled="isBusy" @click="sortBySuit">按花排序</button>
          <button
            class="px-btn btn-ai ai-btn"
            :class="{ thinking: aiThinking }"
            :disabled="isBusy || aiThinking"
            @click="handleAI"
          >
            {{ aiThinking ? '🤔 AI 思考中…' : '🤖 AI 出牌' }}
          </button>
        </div>
      </section>
    </main>

    <!-- 计分爆字（§5.1 第 5 步） -->
    <div v-if="scoreBurst" class="score-burst">
      {{ scoreBurst.chips }} × {{ scoreBurst.mult }} = {{ scoreBurst.score }}
    </div>

    <!-- 商店 -->
    <Shop
      v-if="gameState === 'shop'"
      :shop-jokers="shopJokers"
      :money="money"
      :joker-count="ownedJokers.length"
      :slot-max="SLOT_MAX"
      :suggested-id="suggestedId"
      @buy="buyJoker"
      @skip="skipShop"
    >
    </Shop>
    <!-- 商店阶段 AI 建议按钮（浮在商店上） -->
    <button
      v-if="gameState === 'shop'"
      class="px-btn btn-ai shop-ai-btn"
      @click="handleAISuggest"
    >
      🤖 AI 建议
    </button>

    <!-- 结束界面 -->
    <EndScreen
      v-if="gameState === 'won' || gameState === 'lost'"
      :won="gameState === 'won'"
      :money="money"
      :jokers="ownedJokers"
      @restart="newGame"
    />

    <!-- 设置面板 -->
    <SettingsModal
      v-if="showSettings"
      :settings="settings"
      @close="showSettings = false"
      @update="saveSettings"
    />
  </div>
</template>

<style scoped>
.game {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

/* 右上角齿轮 */
.gear-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.35);
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
  box-shadow:
    0 4px 0 #92400e,
    0 6px 12px rgba(245, 158, 11, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}
.gear-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}
.gear-btn:active {
  transform: translateY(2px);
}

/* 右主区 grid：3 段（PRD §10.1.3） */
.main-area {
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: grid;
  grid-template-rows: 230px 1fr 280px;
  position: relative;
  z-index: 1;
}

/* 第 1 段 Joker */
.joker-section {
  padding: 14px 18px 4px;
  background: rgba(15, 23, 42, 0.6);
  overflow: hidden;
}
.joker-title {
  font-family: var(--font-pixel);
  font-size: 14px;
  color: var(--gold);
  text-shadow: 2px 2px 0 #000;
  margin-bottom: 12px;
}
.joker-row {
  display: flex;
  gap: 12px;
  align-items: flex-start; /* 贴段顶（PRD §4.3） */
}

/* 第 2 段 出牌区 */
.play-area {
  position: relative; /* 牌堆锚定 + 飞牌起点 */
  background: rgba(5, 8, 24, 0.5);
  padding: 10px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}
.play-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  align-self: flex-start;
  margin-bottom: 8px;
}
.played-row {
  display: flex;
  gap: 10px;
  align-items: flex-start; /* 贴段顶（PRD §4.3） */
  justify-content: center;
  width: 100%;
}
.play-empty {
  margin: auto;
  font-size: 14px;
  color: var(--text-light);
  opacity: 0.55;
}
.formula-preview {
  margin: auto;
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--font-pixel);
}
.formula-preview .f-chips {
  color: #4dd6ff;
  font-size: 22px;
}
.formula-preview .f-mult {
  color: #ff8844;
  font-size: 22px;
}
.formula-preview .f-op {
  color: var(--text-dim);
  font-size: 14px;
}
.formula-preview .f-score {
  color: var(--gold);
  font-size: 26px;
}

/* 牌堆 */
.deck {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 2;
  pointer-events: none;
  width: 90px;
  text-align: center;
}
.deck-pile {
  position: relative;
  width: 90px;
  height: 130px;
  margin: 0 auto;
}
.deck-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6b3ec9, #2d0d6e);
  border: 2px solid #1a0f24;
  border-radius: 8px;
}
.deck-layer.l3 {
  transform: translate(-6px, 6px);
  opacity: 0.55;
}
.deck-layer.l2 {
  transform: translate(-3px, 3px);
  opacity: 0.8;
}
.deck-count {
  font-family: var(--font-lcd);
  font-size: 14px;
  color: var(--gold);
  margin-top: 4px;
}

/* 第 3 段 手牌 + 操作 */
.hand-section {
  padding: 36px 18px 16px; /* padding-top ≥ 36px 给选中态上移留余量 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.hand-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.hand-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--gold);
}
.hand-count {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
.hand-row {
  display: flex;
  gap: 8px; /* 真并排不叠层（PRD §4.3 警告） */
  justify-content: center;
  align-items: flex-end;
  flex: 1;
  min-height: 0;
}
.card-wrap {
  flex: 0 0 auto;
}
.action-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-right: 130px; /* 给牌堆腾位置（PRD §4.3） */
  margin-top: 10px;
}
.ai-btn {
  margin-left: auto;
}

/* 商店 AI 建议按钮 */
.shop-ai-btn {
  position: fixed;
  z-index: 150;
  left: 50%;
  bottom: 36px;
  transform: translateX(-50%);
}
</style>
