# CLAUDE.md

小丑牌教学项目（Balatro 核心循环）。本文件给后续维护/开发的 AI 同事看。

## 技术栈

- Vue 3（`<script setup>` 组合式 API）+ Vite 5，纯前端、无后端、无 API key。
- 字体：Press Start 2P（英文装饰）/ VT323（数字大屏）/ Inter（中文），由 [index.html](index.html) 通过 Google Fonts 引入。

## 架构约定

- **逻辑与 UI 分离**：`src/game/*.js` 是纯函数模块（牌型、计分、Joker 效果、AI），不依赖 Vue；`src/components/*.vue` 只负责渲染；[src/App.vue](src/App.vue) 负责状态机编排与动画时间线。
- **状态机**（`gameState`）：`playing → shop → playing → … → won / lost`。大盲注通关直接进 `won`，不进商店（见 `passBlind()`）。
- **计分**：`scoreHand()` 返回的 `cardSteps` / `jokerSteps` 同时驱动「最终得分」与「逐步播放动画」，App.vue 的 `handlePlay()` 按 PRD §5.1 时间线消费它们。
- **动画**：用 DOM 克隆 + CSS transition 实现飞牌/飞字（`flyClone` / `flyText`），`getBoundingClientRect()` 实时取位置；`animateScore()` 用 RAF 做数字插值。所有时长乘以 `animScale`（设置面板「动画速度」）。
- **设置持久化**：localStorage key = `balatro.settings`，动画速度通过 CSS 变量 `--anim-scale` 影响关键帧动画。

## 关键锁定值（改动前先看 PRD）

- 牌型 chips/mult 表、6 张 Joker 数值、3 关目标分（300/500/800）、通关奖励 `$5 + 剩余手数` —— 全部在 `game/` 模块里，与 PRD §1/§2/§3 一一对应。
- 布局硬锁定：sidebar `width: min(28vw, 480px); min-width: 280px`；主区 grid `230px 1fr 280px`；牌堆 `absolute` 内嵌出牌区右下（不可改 fixed）。

## 范围边界（本轮不做）

真实音频（Howler）、粒子升级、Tauri 打包、DeepSeek 真 LLM、商店刷新/出售/Tarot/Planet —— 均留给后续轮次。AI 仅本地启发式枚举。

## 常用命令

- `npm install` — 安装依赖
- `npm run dev` — 本地开发服务器（http://localhost:5173）
- `npm run build` — 生产构建（base 为相对路径 `./`）
- `npm run build:pages` — GitHub Pages 构建（base 为 `/joker/`）
- `npm run preview` — 预览构建产物
- `npm run verify` — 纯逻辑自检（牌型/计分/Joker/AI，无需浏览器，见 `scripts/verify-logic.mjs`）
