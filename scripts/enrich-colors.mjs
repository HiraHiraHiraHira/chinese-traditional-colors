// 用途：调用 Gemini API 为 data/colors.json 中 provenance !== "verified" 的传统色增量补全文化简述、英文名与古籍考据
// 安装依赖: npm install -D @google/genai
// 运行方式: GEMINI_API_KEY="你的Key" node scripts/enrich-colors.mjs

import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ 请先设置环境变量 GEMINI_API_KEY');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const COLORS_FILE = path.resolve('data/colors.json');
const CRAFTS_FILE = path.resolve('data/crafts.json');

const colors = JSON.parse(fs.readFileSync(COLORS_FILE, 'utf-8'));
const crafts = JSON.parse(fs.readFileSync(CRAFTS_FILE, 'utf-8'));
const validCraftIds = new Set(crafts.map((c) => c.id));

const pending = colors.filter((c) => c.provenance !== 'verified' && !c.englishName);
const BATCH_SIZE = 20;

console.log(`共 ${colors.length} 色，待 AI 增量考据 ${pending.length} 色（已保留所有 verified 典籍确证数据）。`);

for (let i = 0; i < pending.length; i += BATCH_SIZE) {
  const batch = pending.slice(i, i + BATCH_SIZE);
  console.log(`正在处理第 ${i + 1} - ${i + batch.length} / ${pending.length} 个颜色...`);

  const prompt = `你是中国传统色彩与古法染织/颜料考据专家。
请为以下中国传统色补全结构化考据信息，严格遵守三级可信度原则（宁缺毋滥，绝不编造虚假古籍）：
- "verified": 仅当存在明确古籍配方记载（如《天工开物》《齐民要术》《本草纲目》《考工记》《芥子园画传》）时使用，且 references 必须给出真实原文与出处。
- "inferred": 归属明确矿物/植物/瓷釉体系，按同系古法推演，craftId 须从可用工艺模板 ID 中选择：${JSON.stringify([...validCraftIds].filter((id) => id.startsWith('craft-tpl-')))}。
- "literary": 源于诗词、自然物象或现代色谱，无明确古法配方，craftId 设为 null，references 设为 []。

输入颜色列表：
${JSON.stringify(batch.map((c) => ({ id: c.id, name: c.name, pinyin: c.pinyin, hex: c.hex, family: c.family })))}

请严格输出 JSON 数组，每个对象包含：
- id (保持与输入完全一致)
- englishName (雅致英文译名)
- provenance ("verified" | "inferred" | "literary")
- craftId (合法 craftId 或 null)
- description (60字内文化与色相简述)
- references (数组，每项含 source, dynasty, quote；无确证古籍时为空数组 [])`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const updates = JSON.parse(response.text);
  const updateMap = new Map(updates.map((u) => [u.id, u]));

  for (const item of colors) {
    const patch = updateMap.get(item.id);
    if (!patch || item.provenance === 'verified') continue;
    if (patch.englishName) item.englishName = patch.englishName;
    if (patch.description) item.description = patch.description;
    if (['verified', 'inferred', 'literary'].includes(patch.provenance)) {
      item.provenance = patch.provenance;
    }
    if (patch.craftId === null || validCraftIds.has(patch.craftId)) {
      item.craftId = patch.craftId;
    }
    if (Array.isArray(patch.references)) {
      item.references = patch.references;
    }
  }

  fs.writeFileSync(COLORS_FILE, JSON.stringify(colors, null, 2) + '\n', 'utf-8');
}

console.log('✅ 增量考据补全完成！请运行 npm run validate 校验数据完整性。');
