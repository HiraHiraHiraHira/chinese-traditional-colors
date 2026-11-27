# Implementation Plan: 中国传统色谱 · 制色工艺志 (526 Colors)

## 1. 项目目标
将单文件原型 `chinese_traditional_colors.html` 重构为生产级开源 Web 应用，完整支持 526 种中国传统色展示、古法制色工艺考据、单色独立详情页及设计资产导出。

## 2. 技术栈
- **框架**: Vite + React 19 + TypeScript
- **样式**: Tailwind CSS v4（严格复刻原型中的美术馆策展级视觉）
- **路由**: React Router v7（支持 `/`, `/matrix`, `/lab`, `/color/:slug`）
- **数据校验**: Zod（读取 `data/schema.ts`）
- **图标**: Lucide React
- **海报导出**: html-to-image

## 3. 视觉设计基准（必须严格对齐原型）
参考 `chinese_traditional_colors.html`：
- **双展馆主题**:
  - 浅色画廊：底色 `#F6F5F0`，纯白展卡 `#FFFFFF`，温润边框 `#E8E6DF`
  - 暗黑画廊：底色 `#131312`，深炭展卡 `#1C1C1A`，克制边框 `#2A2A27`
- **克制的色彩呈现**: 禁止满屏高饱和刺眼背景；顶部仅保留 3%-6% 透明度的氛围光晕。
- **排版**: 瑞士网格大留白，中文衬线体（Noto Serif SC）用于色名与典籍引文，无衬线与等宽字体（Inter / JetBrains Mono）用于色值与参数。

## 4. 目录结构
- `data/`: 存放 `colors.json`、`crafts.json`、`schema.ts`、`raw-colors.json`
- `scripts/`:
  - `validate-data.ts`: 校验 JSON 合法性、HEX/RGB 一致性、craftId 引用完整性
  - `enrich-colors.mjs`: 调用 Gemini API 批量补全 526 色数据
  - `figma-extract.js`: Figma Scripter 插件提取 526 色脚本
- `src/pages/`:
  - `GalleryPage.tsx`: 默认「色志 · 鉴赏」主视图（左侧索引筛选 + 右侧展台）
  - `MatrixPage.tsx`: 526 色「色谱 · 矩阵」（需支持分组懒加载或虚拟滚动保证流畅度）
  - `ColorDetailPage.tsx`: 单色独立详情页 `/color/:slug`（含 WCAG 黑白对比度检测 + 一键导出竖版高清色卡 PNG）
  - `DyeLabPage.tsx`: 「合色 · 实验室」（保留原型中的套染模拟与 CIELAB Delta-E 最接近传统色匹配）
- `src/utils/color.ts`: HEX/RGB/CMYK/LAB 转换、Delta-E 色差计算、WCAG 对比度计算
