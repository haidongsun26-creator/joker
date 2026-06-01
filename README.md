# 🃏 小丑牌（Balatro 核心循环 · 第 1 轮）

Balatro 风格的「扑克 + 小丑牌组合」游戏核心循环版本。基于 Vue 3 + Vite。

## 🚀 换电脑接着用（先看这里）

新电脑装好 [Node.js](https://nodejs.org)（≥ 18）后，三步即可恢复开发：

```bash
git clone https://github.com/haidongsun26-creator/joker.git
cd joker
npm install && npm run dev   # → http://localhost:5173
```

> `node_modules` 不必随项目携带，`npm install` 会按 `package-lock.json` 精确还原依赖。

## 玩法

从 $0 / 0 张小丑牌开始，4 手内打到盲注目标分通关，进商店买卡变强，依次推进 3 关递增盲注（小盲注 300 → 中盲注 500 → 大盲注 800）。任意一关 4 手内未达标即失败。

- **出牌计分**：`得分 = (牌型基础筹码 + 出牌点数之和) × 牌型基础倍率`，再依次叠加持有 Joker 的效果。
- **6 张 Joker 候选库**：小丑 / 学者 / 红心收藏家 / 梅花爱好者 / 皇家头牌 / 同花顺大师。
- **完整动效**：飞牌、逐张计分飞字、Joker 触发金光、发牌飞入、计分爆字。
- **设置面板**：BGM / SFX 音量、动画速度、出牌公式预览（写 localStorage）。
- **AI 出牌**：本地启发式枚举最优出牌组合，零 API、不联网。

## 开发

> 需要本机已安装 Node.js（建议 ≥ 18）。

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（http://localhost:5173）
npm run build    # 生产构建
npm run preview  # 预览构建产物
```

## 部署到 GitHub Pages

```bash
npm run build:pages   # 用 /joker/ 作为 base 构建（见 vite.config.js）
```

仓库名若不是 `joker`，请同步修改 [vite.config.js](vite.config.js) 中的 base 路径。

## 目录结构

```
src/
├── main.js              入口
├── App.vue              主编排：状态机 + 动画时间线 + 布局
├── style.css            全局样式 + 设计令牌 + 按钮规范
├── game/                纯逻辑（无 UI）
│   ├── cards.js         牌组 / 牌型识别 / 计分
│   ├── jokers.js        6 张 Joker 候选库 + 稀有度
│   ├── blinds.js        3 关盲注 + 通关奖励
│   └── ai.js            AI 启发式出牌 + 商店建议
└── components/
    ├── SideBar.vue      左侧 HUD
    ├── PlayingCard.vue  扑克牌
    ├── JokerCard.vue    Joker 卡 / 空槽
    ├── Shop.vue         商店覆盖层
    ├── EndScreen.vue    通关 / 失败界面
    └── SettingsModal.vue 设置面板
```
