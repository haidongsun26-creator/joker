import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 自适应（PRD §10.4）：GitHub Pages 部署用 /<repo>/，本地与其他场景用相对路径 ./
// 部署到 Pages 时设置环境变量 DEPLOY_TARGET=pages（见 package.json build:pages）
export default defineConfig({
  plugins: [vue()],
  base: process.env.DEPLOY_TARGET === 'pages' ? '/joker/' : './',
})
