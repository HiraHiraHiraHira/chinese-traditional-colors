# 中国传统色谱 · 制色工艺志 (Chinese Traditional Colors)

> 以现代美术馆策展视角，收录 **562 种中国传统色彩**（完整覆盖 526 经典传统色谱 + 36 补录典籍正色），深度考据其背后的古法制色工艺、天然原料、媒染配比与典籍出处。

[参与工艺考据 (Contributing)](./CONTRIBUTING.md) · [开源协议 (License)](./LICENSE)

## ✨ 核心特性

- **双展馆美术馆视觉**：摒弃刺眼的高饱和满屏背景，提供温润宣纸浅色（`#F6F5F0`）与深炭石暗黑（`#131312`）双展馆模式，仅在顶部保留 3%–6% 透明度的动态氛围光晕。
- **古法制色工艺志**：拆解植物草木染、矿物水飞、瓷器窑变与复合套染的核心原料、媒染剂配比、四步古法流程与古籍引文。
- **交互式工艺模拟与合色实验室**：支持拖动模拟植物染次（1~6 染）、矿物水飞（头色~四色）与瓷釉窑变，内置「古法套染实验室」与 **CIELAB ΔE₀₀** 感知色差匹配。
- **面向设计师与开发者**：
  - 单色独立档案 `/color/:slug`：提供 HEX / RGB / CMYK / HSL / CIELAB / CSS 变量复制、**WCAG 2.1 四向对比度检测**、以及**竖版 / 横版高清色卡 PNG 一键导出**；
  - 本地收藏夹（LocalStorage）与多格式设计资产导出：**CSS Variables**、**Tailwind v4 `@theme`**、**Tailwind v3 Config** 与 **W3C / Figma Design Tokens JSON**。

## 📜 数据规模与三级可信度分级 (Data Provenance)

本项目对所有收录色彩严格实行**三级可信度标注**（由 Zod Schema 与 CI 自动校验）：

| 等级标识 | 当前收录 | 考据标准 |
| :--- | :---: | :--- |
| **`Verified` 典籍确证** | **49 色** | 附《天工开物》《齐民要术》《本草纲目》《考工记》《芥子园画传》等典籍原文引证与专属配方 |
| **`Inferred` 工艺推演** | **72 色** | 归属明确的矿物/植物/瓷釉体系，依据同系传统古法工艺模板推演并透明标注 |
| **`Literary` 文献意象** | **441 色** | 源自诗词、物候或器物雅称，提供精准色值与文化释义，不编造虚假工艺，欢迎社区提交考据 PR |

## 🚀 本地运行与数据校验

```bash
npm install
npm run validate    # 校验 562 色数据、HEX/RGB 一致性与 craftId 引用完整性
npm run dev         # 启动本地开发服务器
npm run build       # TypeScript 严格检查 + Vite 生产构建
```

### 数据维护脚本

- `npm run build:data`：从原始 526 色清单与 49 色典籍原型重新生成并校验 `data/colors.json` 和 `data/crafts.json`。
- `GEMINI_API_KEY="你的Key" node scripts/enrich-colors.mjs`：调用 Gemini API 增量补全 `inferred` / `literary` 色彩的英文名与文化简述（自动保护所有 `verified` 人工精校条目）。

## ☁️ 一键部署

仓库已内置 SPA 路由回退配置，可直接部署至主流静态托管平台：
- **Vercel**：已配置 `vercel.json`（构建前自动执行 `npm run validate && npm run build`）。
- **Netlify / Cloudflare Pages**：已配置 `public/_redirects`。

## 🙏 致谢 (Acknowledgements)

- 本项目的 526 色基础色名与色值体系致敬并参考自 Figma Community 开源作品 [526 个中国传统颜色色谱](https://www.figma.com/design/5gJsBEyypBoGo48GFRcd4F/526-%E4%B8%AA%E4%B8%AD%E5%9B%BD%E4%BC%A0%E7%BB%9F%E9%A2%9C%E8%89%B2-%E8%89%B2%E8%B0%B1--Community-) 与中国传统色开源社区数据。

## 📄 开源协议 (Dual Licensing)

- **源代码**（`src/`, `scripts/`）：采用 [MIT License](./LICENSE) 开源。
- **色彩与工艺考据数据**（`data/`）：采用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 协议。
