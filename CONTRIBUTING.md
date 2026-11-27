# 参与工艺考据与开源贡献 (Contributing Guide)

欢迎为 **「中国传统色谱 · 制色工艺志」** 提交色彩考据、古籍引证或工程改进 PR！

## 1. 数据严谨性原则（三级可信度分级）

为确保传统色考据的严肃性，本项目拒绝为诗词意象色编造虚假配方，所有色彩均按以下三级标准分级：

| 等级 (`provenance`) | 含义 | 提交要求 |
| :--- | :--- | :--- |
| **`verified` 典籍确证** | 有明确古代配方记载 | 必须附真实典籍出处与引文（如《天工开物》《齐民要术》《本草纲目》《考工记》《芥子园画传》《多能鄙事》等），并关联具体工艺档案 `craftId` |
| **`inferred` 工艺推演** | 同系矿物/植物/瓷釉推演 | 关联 `data/crafts.json` 中同系工艺模板（`craft-tpl-*`），并在 `customCraftNote` 中说明推演依据 |
| **`literary` 文献意象** | 诗词/自然物象/现代色谱 | `craftId` 设为 `null`，`references` 可附诗词原文，但切勿编造制色工艺 |

## 2. 如何认领并完善一种传统色

1. 在 `data/colors.json` 中找到目标颜色（可优先认领 `provenance: "literary"` 或 `"inferred"` 的条目）。
2. 如需新增专属工艺档案，在 `data/crafts.json` 中按 `data/schema.ts` 的 `CraftProfileSchema` 格式新增条目（建议使用 `craft-<slug>` 作为 ID）。
3. 更新 `data/colors.json` 中对应颜色的 `provenance`、`craftId`、`description` 与 `references`。
4. 在本地运行数据校验与构建检查：

```bash
npm install
npm run validate
npm run build
```

确保终端输出 `✅ 校验通过！` 且无 TypeScript / Vite 报错。

## 3. 代码与视觉贡献规范

- **保持克制的美术馆视觉**：浅色画廊底色 `#F6F5F0`、暗黑画廊底色 `#131312`，严禁引入高饱和刺眼全屏背景。
- **遵循类型安全**：所有新增数据结构需同步更新 `data/schema.ts` 并通过 `tsc -b` 严格检查。
- **PR 说明**：在 Pull Request 描述中注明考据典籍版本、修改的颜色 ID 列表及本地 `npm run validate` 运行结果。
