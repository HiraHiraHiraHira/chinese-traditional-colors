import colorsData from '../../data/colors.json';
import craftsData from '../../data/crafts.json';
import type { TraditionalColor, CraftProfile } from '../../data/schema';
import { hexToRgb, hslToHex, rgbToHsl, findNearestColors } from '../utils/color';

export const COLORS: TraditionalColor[] = colorsData as TraditionalColor[];
export const CRAFTS: CraftProfile[] = craftsData as CraftProfile[];

const colorMap = new Map<string, TraditionalColor>(COLORS.map((c) => [c.id, c]));
const craftMap = new Map<string, CraftProfile>(CRAFTS.map((c) => [c.id, c]));

export function getColorById(id: string | undefined): TraditionalColor | undefined {
  if (!id) return undefined;
  return colorMap.get(id);
}

export function getCraftById(id: string | null | undefined): CraftProfile | undefined {
  if (!id) return undefined;
  return craftMap.get(id);
}

export type FamilyFilter = 'all' | TraditionalColor['family'];

export const FAMILY_OPTIONS: Array<{ id: FamilyFilter; label: string; shortLabel: string }> = [
  { id: 'all', label: '全部', shortLabel: '全部' },
  { id: 'red', label: '红赤系', shortLabel: '红赤' },
  { id: 'yellow', label: '黄缃系', shortLabel: '黄缃' },
  { id: 'green', label: '青绿系', shortLabel: '青绿' },
  { id: 'blue', label: '蓝靛系', shortLabel: '蓝靛' },
  { id: 'purple', label: '紫绀系', shortLabel: '紫绀' },
  { id: 'neutral', label: '玄白系', shortLabel: '玄白' },
];

export const FAMILY_LABELS: Record<TraditionalColor['family'], string> = {
  red: '红赤',
  yellow: '黄缃',
  green: '青绿',
  blue: '蓝靛',
  purple: '紫绀',
  neutral: '玄白',
};

export type CraftFilter = 'all' | CraftProfile['category'];
export type ProvenanceFilter = 'all' | TraditionalColor['provenance'];
export type MatrixSortMode = 'index' | 'hue' | 'lightness';

export const PROVENANCE_FILTER_OPTIONS: Array<{ id: ProvenanceFilter; label: string }> = [
  { id: 'all', label: '全部可信度' },
  { id: 'verified', label: '典籍确证' },
  { id: 'inferred', label: '工艺推演' },
  { id: 'literary', label: '文献意象' },
];

export const PROVENANCE_COUNTS = {
  total: COLORS.length,
  verified: COLORS.filter((c) => c.provenance === 'verified').length,
  inferred: COLORS.filter((c) => c.provenance === 'inferred').length,
  literary: COLORS.filter((c) => c.provenance === 'literary').length,
};

export const CRAFT_CATEGORY_LABELS: Record<CraftProfile['category'], string> = {
  plant_dye: '植物草木染',
  mineral_pigment: '矿物颜料',
  ceramic_glaze: '传统瓷釉',
  compound_dye: '复合套染',
  organic_animal: '动物与贝壳染',
  none: '文献意象色',
};

export const CRAFT_FILTER_OPTIONS: Array<{ id: CraftFilter; label: string }> = [
  { id: 'all', label: '全部制色工艺' },
  { id: 'plant_dye', label: '植物草木染' },
  { id: 'mineral_pigment', label: '矿物颜料' },
  { id: 'ceramic_glaze', label: '传统瓷釉' },
  { id: 'compound_dye', label: '复合套染' },
  { id: 'organic_animal', label: '动物与贝壳染' },
];

export const PROVENANCE_META: Record<
  TraditionalColor['provenance'],
  { label: string; en: string; desc: string }
> = {
  verified: {
    label: '典籍确证',
    en: 'VERIFIED',
    desc: '有古籍明确配方与原文出处',
  },
  inferred: {
    label: '工艺推演',
    en: 'INFERRED',
    desc: '按同系古法矿物/植物/瓷釉工艺推演',
  },
  literary: {
    label: '文献意象',
    en: 'LITERARY',
    desc: '源于诗词器物意象，开放社区考据认领',
  },
};

export function getColorCraftLabel(color: TraditionalColor): string {
  const craft = getCraftById(color.craftId);
  if (!craft) return '文献意象';
  return CRAFT_CATEGORY_LABELS[craft.category];
}

/* =========================================================================
   合色实验室数据与算法（完整保留原型配方与化学原理）
   ========================================================================= */
export interface LabMaterial {
  id: string;
  name: string;
  hex: string;
  note: string;
}

export interface LabMordant {
  id: string;
  name: string;
  tag: string;
  desc: string;
}

export interface LabMixResult {
  name: string;
  hex: string;
  theory: string;
  isHistoricalRecipe: boolean;
}

export const LAB_BASES: LabMaterial[] = [
  { id: 'indigo', name: '蓝草 (靛蓝)', hex: '#1E5482', note: '冷调蓝基' },
  { id: 'gardenia', name: '山栀子', hex: '#E0B227', note: '明快正黄' },
  { id: 'madder', name: '老茜草', hex: '#B13B3C', note: '温润暖红' },
  { id: 'safflower', name: '红蓝花', hex: '#D44254', note: '娇艳桃红' },
  { id: 'sappanwood', name: '苏枋木', hex: '#A42E38', note: '多变艳红' },
  { id: 'pagoda', name: '国槐米', hex: '#D2B034', note: '耐晒正黄' },
  { id: 'gromwell', name: '新疆紫草', hex: '#6A3361', note: '古雅正紫' },
];

export const LAB_OVERS: LabMaterial[] = [
  { id: 'none', name: '不叠加 (单染)', hex: '#E5E2D9', note: '保留单材本色' },
  ...LAB_BASES,
];

export const LAB_MORDANTS: LabMordant[] = [
  { id: 'none', name: '无媒染（清水）', tag: '中性 pH 7', desc: '呈现草木色素最质朴的原始色相。' },
  { id: 'alum', name: '白明矾（铝盐）', tag: '提亮固色', desc: '铝离子与黄酮、蒽醌螯合，令色泽清亮牢固。' },
  { id: 'plum', name: '乌梅酸汁（酸性）', tag: 'pH 3–4', desc: '中和残碱，激发红花纯正真红与暖亮橘调。' },
  { id: 'ash', name: '草木灰碱水（碱性）', tag: 'pH 9–10', desc: '促使紫草、苏木向古雅紫绀偏移，助蓝靛还原。' },
  { id: 'iron', name: '铁浆 / 绿矾（铁盐）', tag: '沉色发乌', desc: '亚铁离子与植物单宁络合，大幅沉降明度成古意深色。' },
];

export const LAB_PRESETS = [
  { label: '松花 / 竹青', base: 'indigo', over: 'gardenia', mordant: 'alum' },
  { label: '唐代石榴红', base: 'safflower', over: 'gardenia', mordant: 'plum' },
  { label: '唐宋绛紫', base: 'sappanwood', over: 'none', mordant: 'iron' },
  { label: '古籍绀青', base: 'indigo', over: 'madder', mordant: 'ash' },
];

const LAB_RECIPES: Record<string, { name: string; hex: string; theory: string }> = {
  'indigo|gardenia|none': {
    name: '碧绿',
    hex: '#348358',
    theory: '蓝靛中的靛蓝素与栀子藏红花素通过减色吸收直接交融，无需金属媒染即可呈现清澈生机的碧绿色。',
  },
  'indigo|gardenia|alum': {
    name: '松花 / 竹青',
    hex: '#4B885A',
    theory: '白明矾（硫酸铝钾）固着栀子黄酮并提升明净度，叠加于蓝靛底色之上，化作持久清雅的竹青与翠微绿。',
  },
  'indigo|gardenia|iron': {
    name: '黛绿 / 苍松',
    hex: '#26463B',
    theory: '绿矾中的亚铁离子与栀子单宁发生络合反应使黄调沉暗，叠加深蓝底色后转为沉静古朴的黛绿。',
  },
  'indigo|pagoda|alum': {
    name: '官绿 / 竹青',
    hex: '#4F7E56',
    theory: '槐米富含芦丁黄酮，经明矾媒染后极其耐晒；套染于蓝靛底布，正是宋明文人与官服推崇的正统竹青、官绿色。',
  },
  'indigo|pagoda|iron': {
    name: '苍松暗绿',
    hex: '#2F4638',
    theory: '槐米芦丁遇亚铁离子迅速转为暗橄榄褐，与蓝靛交融后呈现苍劲深沉的松林暗绿。',
  },
  'indigo|madder|none': {
    name: '青莲紫',
    hex: '#4F3F6B',
    theory: '靛蓝冷青与茜草暖红套染相合，呈现如青莲花瓣般沉静清冷的古紫。',
  },
  'indigo|madder|ash': {
    name: '古籍绀青',
    hex: '#222B3F',
    theory: '重靛打底再套茜草，草木灰碱水令茜素微偏紫调，成就《说文》“帛深青扬赤色”的庄严绀青。',
  },
  'indigo|madder|iron': {
    name: '至高玄青',
    hex: '#212128',
    theory: '蓝、红双底叠加铁浆与茜草单宁络合，吸收绝大部分可见光，正合古法“黑而有赤”的帝王玄青。',
  },
  'indigo|sappanwood|alum': {
    name: '紫绀',
    hex: '#40315C',
    theory: '明矾促使苏木发艳红，覆盖在蓝靛底色上合成浓烈典雅的紫绀色。',
  },
  'indigo|sappanwood|iron': {
    name: '乌紫 / 漆玄',
    hex: '#221E2D',
    theory: '苏木多酚遇铁极易变乌紫黑，叠加蓝靛底色后化为深邃沉静的乌黑玄紫。',
  },
  'safflower|none|plum': {
    name: '真红 / 胭脂红',
    hex: '#C92D3E',
    theory: '红花素为酸碱敏感色素，乌梅有机酸彻底中和前期萃取残碱，激发红花最纯净清透的“真红”。',
  },
  'safflower|gardenia|plum': {
    name: '唐代石榴红',
    hex: '#D92B24',
    theory: '盛唐“石榴裙”正宗古法：先以栀子染亮黄打底，再重套红花并以乌梅酸定色，红黄交辉如烈焰石榴。',
  },
  'safflower|none|ash': {
    name: '暗藕紫',
    hex: '#8F5A6C',
    theory: '红花素在碱性草木灰环境中分子结构重排，鲜红顿消，转为低饱和的温柔暗藕紫色。',
  },
  'sappanwood|none|alum': {
    name: '彤红 / 苏芳',
    hex: '#B42E30',
    theory: '巴西苏木素与明矾铝离子螯合，呈现端庄明润、极富光泽的传统彤红色。',
  },
  'sappanwood|none|plum': {
    name: '杏橘红',
    hex: '#CF5B3A',
    theory: '酸性环境使巴西苏木素吸收光谱向短波偏移，由正红转为温暖明快的杏橘红色。',
  },
  'sappanwood|none|ash': {
    name: '紫苏 / 绛紫',
    hex: '#6B2C49',
    theory: '草木灰碱性令巴西苏木素脱质子化，色相立刻由红转向古雅深沉的紫红色。',
  },
  'sappanwood|none|iron': {
    name: '唐宋绛紫',
    hex: '#4B2130',
    theory: '苏木富含多酚类苏木素，遇亚铁离子迅速生成深紫褐色铁络合物，乃唐宋染绛紫之秘法。',
  },
  'madder|none|alum': {
    name: '正茜草红',
    hex: '#B13B3C',
    theory: '茜草中的茜素（Alizarin）与明矾铝离子形成著名的“茜素铝红”坚牢络合物，温润古朴。',
  },
  'madder|none|iron': {
    name: '紫檀 / 深栗',
    hex: '#52262B',
    theory: '茜素遇铁离子由暖红转为深沉凝重的紫檀褐红色，耐晒度极高。',
  },
  'madder|gardenia|alum': {
    name: '绯红 / 纁色',
    hex: '#CA482D',
    theory: '茜草红与栀子黄协同，经明矾固色，焕发如朝霞般温暖端庄的纁红与绯红色。',
  },
  'pagoda|none|alum': {
    name: '皇室明黄',
    hex: '#E8BC34',
    theory: '国槐花蕾含丰富芦丁（芸香苷），经白明矾媒染后呈灿烂端正、耐光不褪的宫廷明黄。',
  },
  'pagoda|none|iron': {
    name: '文人秋香',
    hex: '#80773B',
    theory: '槐米黄酮与亚铁离子络合，明黄瞬间沉降为清雅含蓄的文人秋香橄榄色。',
  },
  'gromwell|none|ash': {
    name: '御用紫棠',
    hex: '#541E50',
    theory: '新疆紫草根的紫草素遇椿木灰（天然碱与铝源）方能绽放最纯正高贵的帝王紫棠。',
  },
  'gromwell|none|iron': {
    name: '沉暗紫绀',
    hex: '#392039',
    theory: '铁盐令紫草素深沉泛灰黑，化作庄严静穆的深紫绀。',
  },
};

export function computeLabMix(baseId: string, overId: string, mordantId: string): LabMixResult {
  const k1 = `${baseId}|${overId}|${mordantId}`;
  const k2 = overId !== 'none' ? `${overId}|${baseId}|${mordantId}` : '';
  if (LAB_RECIPES[k1]) return { ...LAB_RECIPES[k1], isHistoricalRecipe: true };
  if (k2 && LAB_RECIPES[k2]) return { ...LAB_RECIPES[k2], isHistoricalRecipe: true };

  const baseObj = LAB_BASES.find((d) => d.id === baseId) ?? LAB_BASES[0];
  const overObj = LAB_OVERS.find((d) => d.id === overId) ?? LAB_OVERS[0];

  const rgb1 = hexToRgb(baseObj.hex);
  let r = rgb1.r;
  let g = rgb1.g;
  let b = rgb1.b;

  if (overId !== 'none' && overId !== baseId) {
    const rgb2 = hexToRgb(overObj.hex);
    const mr = Math.sqrt((rgb1.r * rgb2.r) / 255) * 14.5;
    const mg = Math.sqrt((rgb1.g * rgb2.g) / 255) * 14.5;
    const mb = Math.sqrt((rgb1.b * rgb2.b) / 255) * 14.5;
    r = mr * 0.65 + ((rgb1.r + rgb2.r) / 2) * 0.35;
    g = mg * 0.65 + ((rgb1.g + rgb2.g) / 2) * 0.35;
    b = mb * 0.65 + ((rgb1.b + rgb2.b) / 2) * 0.35;
  } else if (overId === baseId) {
    r *= 0.8;
    g *= 0.8;
    b *= 0.8;
  }

  const hsl = rgbToHsl(r, g, b);
  const notes: string[] = [];

  if (overId === 'none') {
    notes.push(`以「${baseObj.name}」单染打底，展现单一天然草木色素的基础色相。`);
  } else if (overId === baseId) {
    notes.push(`以「${baseObj.name}」同材重覆套染，纤维表面色素沉积加倍，明度降低而色韵更显浓醇。`);
  } else {
    notes.push(
      `以「${baseObj.name}」为底，再以「${overObj.name}」套染，两种植物色素通过减色吸收交融生成复合间色。`,
    );
  }

  if (mordantId === 'alum') {
    hsl.s = Math.min(90, hsl.s + 9);
    hsl.l = Math.min(76, hsl.l + 4);
    notes.push('白明矾（铝盐）与黄酮及多酚色素形成稳定铝螯合物，显著提亮色泽并稳固水洗牢度。');
  } else if (mordantId === 'plum') {
    hsl.h = (hsl.h - 10 + 360) % 360;
    hsl.s = Math.min(92, hsl.s + 7);
    hsl.l = Math.min(74, hsl.l + 3);
    notes.push('乌梅酸汁营造弱酸性环境，抑制单宁氧化发暗，令暖红与黄调更显清亮透彻。');
  } else if (mordantId === 'ash') {
    hsl.h = (hsl.h + 18) % 360;
    hsl.l = Math.max(18, hsl.l - 5);
    notes.push('草木灰碱水提高染液 pH 值，促使酚羟基解离，推动色相向古雅紫青或沉静暖调偏移。');
  } else if (mordantId === 'iron') {
    hsl.s = Math.max(10, hsl.s - 24);
    hsl.l = Math.max(15, hsl.l - 21);
    notes.push('铁浆/绿矾中的亚铁离子与植物单宁发生显色络合，大幅压低明度与艳度，生出沉郁雅致的古意深色。');
  } else {
    notes.push('未加金属媒染剂，完整保留草木温和质朴的天然色韵。');
  }

  const hex = hslToHex(hsl.h, hsl.s, hsl.l);
  const nearest = findNearestColors(hex, COLORS, 1)[0];
  return {
    name: nearest ? nearest.color.name : '古法间色',
    hex,
    theory: notes.join(''),
    isHistoricalRecipe: false,
  };
}
