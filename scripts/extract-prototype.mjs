import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('code_artifact.html'), 'utf-8');
const match = html.match(/const COLORS_DB = (\[[\s\S]*?\n    \]);/);
if (!match) {
  throw new Error('Could not find COLORS_DB in code_artifact.html');
}

// Evaluate the array literal from the trusted local prototype file
const rawList = new Function(`return ${match[1]};`)();

const FAMILY_MAP = {
  红赤: 'red',
  黄缃: 'yellow',
  青绿: 'green',
  蓝靛: 'blue',
  紫绀: 'purple',
  玄白: 'neutral',
};

const ANIMAL_IDS = new Set(['yanzhi', 'gefen']);

function mapCraftCategory(item) {
  if (item.craft === '植物草木染') return 'plant_dye';
  if (item.craft === '矿物颜料') return 'mineral_pigment';
  if (item.craft === '传统瓷釉') return 'ceramic_glaze';
  if (item.craft === '动物与合色') {
    return ANIMAL_IDS.has(item.id) ? 'organic_animal' : 'compound_dye';
  }
  return 'none';
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function rgbToCmyk(r, g, b) {
  if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 100];
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const k = 1 - Math.max(rp, gp, bp);
  return [
    Math.round(((1 - rp - k) / (1 - k)) * 100),
    Math.round(((1 - gp - k) / (1 - k)) * 100),
    Math.round(((1 - bp - k) / (1 - k)) * 100),
    Math.round(k * 100),
  ];
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function getSimulatedHex(item, step) {
  const [r, g, b] = hexToRgb(item.hex);
  const hsl = rgbToHsl(r, g, b);
  if (item.sliderType === 'dye') {
    const delta = step - 2;
    const l = Math.max(10, Math.min(92, hsl.l - delta * 10));
    const s = Math.max(8, Math.min(92, hsl.s + (delta > 0 ? delta * 2.5 : delta * 5.5)));
    return hslToHex(hsl.h, s, l);
  } else if (item.sliderType === 'mineral') {
    const delta = step - 1;
    const l = Math.max(12, Math.min(94, hsl.l + delta * 10.5));
    const s = Math.max(5, Math.min(92, hsl.s - delta * 6.5));
    const h = item.id === 'zhusha' && step === 3 ? hsl.h + 16 : hsl.h;
    return hslToHex(h, s, l);
  } else {
    const delta = step - 1;
    const l = Math.max(16, Math.min(90, hsl.l - delta * 8));
    const s = Math.max(8, Math.min(88, hsl.s + delta * 5.5));
    return hslToHex(hsl.h, s, l);
  }
}

const colors = [];
const crafts = [];

rawList.forEach((item, idx) => {
  const hex = item.hex.toUpperCase();
  const rgb = hexToRgb(hex);
  const cmyk = rgbToCmyk(rgb[0], rgb[1], rgb[2]);
  const craftId = `craft-${item.id}`;

  const shades = (item.sliderLabels || []).map((label, stepIdx) => ({
    label,
    hex: getSimulatedHex(item, stepIdx),
    note: label.includes('（') ? label.slice(label.indexOf('（') + 1, label.lastIndexOf('）')) : undefined,
  }));

  crafts.push({
    id: craftId,
    name: `${item.name} · ${item.craft}`,
    category: mapCraftCategory(item),
    rawMaterials: item.materials.map((m) => m.name),
    mordantOrBinder: item.mordants.map((m) => `${m.name}（约 ${m.ratio}%）`).join('、'),
    origin: item.materials
      .map((m) => m.origin)
      .filter(Boolean)
      .join(' / '),
    steps: item.steps.map((s, sIdx) => ({
      order: sIdx + 1,
      title: s.title,
      description: s.desc,
    })),
    chemistryNote: item.mordants.map((m) => `${m.name}：${m.note}`).join('；'),
    sliderType: item.sliderType,
    materials: item.materials.map((m) => ({
      name: m.name,
      origin: m.origin,
      description: m.desc,
    })),
    mordants: item.mordants.map((m) => ({
      name: m.name,
      ratio: m.ratio,
      note: m.note,
    })),
  });

  colors.push({
    id: item.id,
    index: parseInt(item.code, 10) || idx + 1,
    name: item.name,
    pinyin: item.pinyin,
    englishName: item.en,
    family: FAMILY_MAP[item.family],
    hex,
    rgb,
    cmyk,
    provenance: 'verified',
    craftId,
    shades,
    references: item.quote
      ? [
          {
            source: item.source,
            quote: item.quote,
          },
        ]
      : [],
    description: item.era,
  });
});

fs.writeFileSync(path.resolve('data/colors.json'), JSON.stringify(colors, null, 2) + '\n', 'utf-8');
fs.writeFileSync(path.resolve('data/crafts.json'), JSON.stringify(crafts, null, 2) + '\n', 'utf-8');
console.log(`Extracted ${colors.length} colors and ${crafts.length} craft profiles.`);
