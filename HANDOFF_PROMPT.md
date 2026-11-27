# 给反重力（Antigravity）的交接提示词

请直接复制以下内容发送给本地 IDE Agent：

---

你现在接手「中国传统色谱 · 制色工艺志 (526 Colors)」开源项目的工程化落地。
请先完整阅读项目根目录下的以下文件：
1. `IMPLEMENTATION_PLAN.md`（技术栈、视觉规范、目录结构与分步任务）
2. `data/schema.ts`（526 色与工艺库的 Zod 数据结构定义）
3. `chinese_traditional_colors.html`（美术馆策展级视觉原型，请务必将其放到根目录供你参考）

请严格按以下顺序执行，每完成一个阶段后向我汇报并确认可运行：
- **Phase 1**: 初始化 Vite + React 19 + TypeScript + Tailwind CSS v4 项目，安装 `zod`、`react-router-dom`、`lucide-react`、`html-to-image`，配置 `package.json` 的 `validate` 脚本。
- **Phase 2**: 将原型 `chinese_traditional_colors.html` 中的 49 种传统色及工艺提取为初始 `data/colors.json` 和 `data/crafts.json`，并跑通 `npm run validate`（`scripts/validate-data.ts`）。
- **Phase 3**: 严格复刻原型的双展馆视觉（浅暖灰白 `#F6F5F0` / 深炭石 `#131312`、瑞士网格大留白、3%-6% 氛围光晕），拆分并实现 4 个核心页面：`GalleryPage`（色志鉴赏）、`MatrixPage`（526 色矩阵）、`ColorDetailPage`（`/color/:slug` 单色独立页 + WCAG 对比度 + 海报导出）、`DyeLabPage`（合色实验室 + Delta-E 匹配）。
- **Phase 4**: 实现收藏夹（LocalStorage）与多格式设计资产导出（CSS Variables / Tailwind Config / Figma Tokens JSON）。

注意：视觉上严禁回退到高饱和满屏刺眼背景，一切以 `chinese_traditional_colors.html` 的克制美术馆风格为准。
