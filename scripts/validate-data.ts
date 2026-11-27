import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { TraditionalColorSchema, CraftProfileSchema } from '../data/schema.js';

const colorsPath = path.resolve('data/colors.json');
const craftsPath = path.resolve('data/crafts.json');

if (!fs.existsSync(colorsPath) || !fs.existsSync(craftsPath)) {
  console.error('❌ 缺少 data/colors.json 或 data/crafts.json');
  process.exit(1);
}

const rawColors = JSON.parse(fs.readFileSync(colorsPath, 'utf-8'));
const rawCrafts = JSON.parse(fs.readFileSync(craftsPath, 'utf-8'));

const crafts = z.array(CraftProfileSchema).parse(rawCrafts);
const colors = z.array(TraditionalColorSchema).parse(rawColors);

const craftIds = new Set(crafts.map((c) => c.id));
const colorIds = new Set<string>();
let errors = 0;

for (const color of colors) {
  if (colorIds.has(color.id)) {
    console.error(`❌ 重复的色卡 ID: ${color.id} (${color.name})`);
    errors++;
  }
  colorIds.add(color.id);

  if (color.craftId && !craftIds.has(color.craftId)) {
    console.error(`❌ 找不到关联的 craftId: ${color.craftId} (色名: ${color.name})`);
    errors++;
  }

  // 校验 HEX 与 RGB 一致性
  const r = parseInt(color.hex.slice(1, 3), 16);
  const g = parseInt(color.hex.slice(3, 5), 16);
  const b = parseInt(color.hex.slice(5, 7), 16);
  if (color.rgb[0] !== r || color.rgb[1] !== g || color.rgb[2] !== b) {
    console.error(`❌ HEX(${color.hex}) 与 RGB(${color.rgb.join(',')}) 不一致: ${color.name}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n共发现 ${errors} 处数据错误，请修复后重试。`);
  process.exit(1);
}

console.log(`✅ 校验通过！共验证 ${colors.length} 种传统色，${crafts.length} 份工艺档案。`);
