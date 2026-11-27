import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync(path.resolve('code_artifact.html'), 'utf-8');
const match = html.match(/const COLORS_DB = (\[[\s\S]*?\n    \]);/);
if (!match) throw new Error('Could not find COLORS_DB in code_artifact.html');
const prototypeColors = new Function(`return ${match[1]};`)();

const raw526 = JSON.parse(fs.readFileSync(path.resolve('data/raw-colors.json'), 'utf-8'));

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

function getSimulatedHex(hex, sliderType, step, id) {
  const [r, g, b] = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  if (sliderType === 'dye') {
    const delta = step - 2;
    const l = Math.max(10, Math.min(92, hsl.l - delta * 10));
    const s = Math.max(8, Math.min(92, hsl.s + (delta > 0 ? delta * 2.5 : delta * 5.5)));
    return hslToHex(hsl.h, s, l);
  } else if (sliderType === 'mineral') {
    const delta = step - 1;
    const l = Math.max(12, Math.min(94, hsl.l + delta * 10.5));
    const s = Math.max(5, Math.min(92, hsl.s - delta * 6.5));
    const h = id === 'zhusha' && step === 3 ? hsl.h + 16 : hsl.h;
    return hslToHex(h, s, l);
  } else {
    const delta = step - 1;
    const l = Math.max(16, Math.min(90, hsl.l - delta * 8));
    const s = Math.max(8, Math.min(88, hsl.s + delta * 5.5));
    return hslToHex(hsl.h, s, l);
  }
}

function classifyFamily(name, hex) {
  const [r, g, b] = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  // Strong neutral checks (achromatic or named white/grey/black/ink)
  if (s <= 11 || l >= 93 || l <= 10) return 'neutral';
  if (/(白|灰|黑|墨|炭|银|雪|霜|烟|铅|铁灰|瓦)$/.test(name) && s < 24) return 'neutral';

  // Explicit Chinese suffix overrides for borderline hues
  if (/(紫|藕|丁香|雪青|雪紫|绛)$/.test(name) && (h >= 245 || h <= 15)) return 'purple';
  if (/(蓝|靛|蔚|海蓝|天蓝|湖蓝|宝蓝)$/.test(name) && h >= 175 && h <= 255) return 'blue';
  if (/(绿|翠|碧|青|竹|松|柳|苔|草)$/.test(name) && h >= 72 && h <= 198) return 'green';
  if (/(黄|金|缃|姜|杏|鹅|米|茶|驼|麦|秋香)$/.test(name) && h >= 28 && h <= 78) return 'yellow';
  if (/(红|赤|朱|绯|丹|粉|桃|绯|霞|胭|茜|赭|绛|枣|栗|棕|褐)$/.test(name) && (h <= 38 || h >= 315)) {
    return 'red';
  }

  // Pure HSL classification fallback
  if (h < 28 || h >= 332) return 'red';
  if (h < 72) return 'yellow';
  if (h < 174) return 'green';
  if (h < 252) return 'blue';
  return 'purple';
}

/** 7 canonical reusable craft templates for `inferred` (同系工艺推演) colors */
const CANONICAL_CRAFT_TEMPLATES = [
  {
    id: 'craft-tpl-mineral-red',
    name: '矿物红赭水飞古法（同系推演）',
    category: 'mineral_pigment',
    rawMaterials: ['赤铁矿 / 辰砂系天然矿石', '精制动物皮胶'],
    mordantOrBinder: '水飞矿粉（约 88%）、淡皮胶液（约 12%）',
    origin: '湖南辰州 / 山西代县 / 敦煌矿区',
    steps: [
      { order: 1, title: '选矿剔杂', description: '精选结晶致密或土质细腻的天然铁红、丹砂矿石，去除伴生杂石。' },
      { order: 2, title: '湿法细研', description: '置瓷乳钵中加水长时细研，防止干磨发热导致色相发暗。' },
      { order: 3, title: '水飞分级', description: '兑清水搅匀静置，依颗粒沉降速率分出深浅各阶色粉。' },
      { order: 4, title: '入胶设色', description: '阴干收粉后以温淡牛皮胶调匀，即可罩染纸绢或器物。' },
    ],
    chemistryNote: '以天然硫化汞（HgS）或氧化铁（Fe₂O₃）为呈色核心，耐光耐风化。',
    sliderType: 'mineral',
    materials: [
      { name: '天然赤铁矿 / 辰砂矿粉', origin: '华北、西南传统矿区', description: '同系矿物颜料核心发色体，色泽沉稳庄重。' },
      { name: '精制动物皮胶', origin: '传统胶结介质', description: '温和固着矿物颗粒于纸绢或地仗之上。' },
    ],
    mordants: [
      { name: '水飞矿物细粉', ratio: 88, note: '提供高遮盖力与历久弥新的暖红色相' },
      { name: '温淡动物胶液', ratio: 12, note: '平衡附着力与色面清润感' },
    ],
  },
  {
    id: 'craft-tpl-mineral-blue-green',
    name: '矿物青绿水飞古法（同系推演）',
    category: 'mineral_pigment',
    rawMaterials: ['孔雀石 / 蓝铜矿 / 青金石矿粉', '精制动物皮胶'],
    mordantOrBinder: '水飞矿粉（约 86%）、淡骨胶（约 14%）',
    origin: '广东阳春 / 安徽铜陵 / 西域丝路',
    steps: [
      { order: 1, title: '拣选纯矿', description: '剔除褐铁伴生杂脉，择取翠绿孔雀石或湛蓝蓝铜矿纯晶。' },
      { order: 2, title: '研碎漂洗', description: '石臼捣细后于乳钵湿研，清水淘洗浮沫与轻杂质。' },
      { order: 3, title: '水飞四色', description: '按悬浮沉降时间依次析出头青/头绿至四青/四绿，颗粒愈细愈淡雅。' },
      { order: 4, title: '调胶罩染', description: '临用加淡骨胶指腹研匀，逐层平涂呈宝石般颗粒质感。' },
    ],
    chemistryNote: '碱式碳酸铜或含硫铝硅酸钠矿物结晶呈色，颗粒粗细直接决定明度与色深。',
    sliderType: 'mineral',
    materials: [
      { name: '孔雀石 / 蓝铜矿 / 青金石', origin: '传统铜矿伴生带 / 西域', description: '青绿山水与壁画经典矿色，显色华丽持久。' },
      { name: '透明淡骨胶', origin: '传统胶结介质', description: '锁住矿物晶体折光感而不显晦暗。' },
    ],
    mordants: [
      { name: '水飞青绿矿粉', ratio: 86, note: '决定色相浓度与晶体颗粒质感' },
      { name: '纯净骨胶液', ratio: 14, note: '防止粗颗粒矿粉脱落' },
    ],
  },
  {
    id: 'craft-tpl-plant-red',
    name: '植物草木染 · 红赤系（同系推演）',
    category: 'plant_dye',
    rawMaterials: ['茜草根 / 苏木心材 / 红蓝花', '白明矾或乌梅酸汁'],
    mordantOrBinder: '天然植物色素（约 75%）、铝盐/有机酸媒染（约 25%）',
    origin: '华北、川渝及岭南传统染坊',
    steps: [
      { order: 1, title: '浸渍煎汁', description: '将干燥染材冷水浸泡后文火慢煎，过滤取清亮红汁（忌大火沸煮防发褐）。' },
      { order: 2, title: '预媒固底', description: '织物先经白明矾水或草木灰碱液处理，增强纤维与色素亲和力。' },
      { order: 3, title: '温缸复染', description: '丝麻织物入缸轻柔翻染多遍，依目标深浅控制浸染次数。' },
      { order: 4, title: '调酸定色', description: '以稀乌梅汁或清水漂洗定色，避强光阴干发色。' },
    ],
    chemistryNote: '蒽醌类（茜素）、巴西苏木素或红花素借铝离子螯合或酸碱调控呈现不同深浅红调。',
    sliderType: 'dye',
    materials: [
      { name: '茜草 / 苏木 / 红蓝花', origin: '华夏传统红染植物', description: '天然植物红素来源，色韵温润且富有层次。' },
      { name: '白明矾 / 乌梅清汁', origin: '天然媒染与显色剂', description: '稳固色素分子并微调暖红与玫瑰红倾向。' },
    ],
    mordants: [
      { name: '植物红染汁', ratio: 75, note: '提供主体暖红或娇红发色基调' },
      { name: '白明矾 / 乌梅汁', ratio: 25, note: '媒染固色并调节色相明度' },
    ],
  },
  {
    id: 'craft-tpl-plant-yellow',
    name: '植物草木染 · 黄缃系（同系推演）',
    category: 'plant_dye',
    rawMaterials: ['山栀子 / 国槐米 / 黄檗树皮 / 姜黄', '白明矾媒染剂'],
    mordantOrBinder: '植物黄染汁（约 82%）、白明矾（约 18%）',
    origin: '江南丘陵与中原广植',
    steps: [
      { order: 1, title: '选材浸泡', description: '取干山栀子、槐米或黄檗皮洗净冷水浸泡，令黄酮或小檗碱充分溶出。' },
      { order: 2, title: '文火熬液', description: '文火熬煮半小时后以细纱滤净残渣，得澄澈金黄染液。' },
      { order: 3, title: '入缸匀染', description: '织物入温缸反复浸渍翻动，依深浅需求调整染次。' },
      { order: 4, title: '明矾固色', description: '白明矾媒染提升水洗牢度与明净光泽，阴干成色。' },
    ],
    chemistryNote: '藏红花素、芦丁黄酮或姜黄素在弱酸与铝盐环境下呈现纯正温雅的传统黄调。',
    sliderType: 'dye',
    materials: [
      { name: '山栀子 / 国槐米 / 黄檗', origin: '华夏传统黄染植物', description: '药染同源的经典天然黄色素来源。' },
      { name: '白明矾 / 淡米醋', origin: '固色媒染剂', description: '稳定发色并减少日晒褪色。' },
    ],
    mordants: [
      { name: '植物黄染浓液', ratio: 82, note: '释放温和通透的天然黄色素' },
      { name: '白明矾媒染', ratio: 18, note: '与黄酮形成稳定螯合物，固色提亮' },
    ],
  },
  {
    id: 'craft-tpl-plant-indigo-green',
    name: '植物草木染 · 蓝靛套染系（同系推演）',
    category: 'compound_dye',
    rawMaterials: ['发酵蓝靛泥（蓼蓝/菘蓝/马蓝）', '槐米 / 荩草 / 栀子黄套染'],
    mordantOrBinder: '蓝靛还原缸（约 60%）、草木黄套染与明矾（约 40%）',
    origin: '江南及西南传统蓝染作坊',
    steps: [
      { order: 1, title: '建缸还原', description: '以蓝靛泥配石灰、米酒与麦麸发酵建缸，使靛蓝还原为黄绿色隐色体。' },
      { order: 2, title: '浸染氧化', description: '织物入缸慢浸后提起迎风氧化，依蓝调深浅重复浸染多遍。' },
      { order: 3, title: '草木套染', description: '若呈青绿色相，再以槐米、荩草或栀子黄液套染成间色。' },
      { order: 4, title: '媒染漂洗', description: '淡明矾或清水漂净浮色，通风晾干定色。' },
    ],
    chemistryNote: '靛蓝素氧化附着于纤维表层，叠加植物黄酮后通过减色混合呈现丰富青蓝与草木绿。',
    sliderType: 'dye',
    materials: [
      { name: '天然发酵蓝靛泥', origin: '江南 / 贵州传统产区', description: '提供清冷沉静的蓝基，耐洗耐磨。' },
      { name: '槐米 / 荩草（套染用）', origin: '传统草木黄材', description: '与蓝靛相合，化生松花、竹青、碧绿等间色。' },
    ],
    mordants: [
      { name: '蓝靛还原液', ratio: 60, note: '构建沉静青蓝或蓝绿基底' },
      { name: '植物黄套染与灰碱', ratio: 40, note: '调节青绿偏暖程度与色相深浅' },
    ],
  },
  {
    id: 'craft-tpl-plant-brown-ink',
    name: '植物单宁与铁媒 / 松烟墨法（同系推演）',
    category: 'plant_dye',
    rawMaterials: ['五倍子 / 核桃青皮 / 薯莨 / 橡碗或松烟炭黑', '绿矾（硫酸亚铁）媒染'],
    mordantOrBinder: '单宁染材或烟炱（约 80%）、铁盐媒染或皮胶（约 20%）',
    origin: '徽州制墨 / 岭南及中原传统染坊',
    steps: [
      { order: 1, title: '煎煮单宁', description: '将橡碗、核桃皮、薯莨或五倍子捣碎煎煮，萃出富含鞣质的深褐汁液。' },
      { order: 2, title: '反复浸染', description: '织物多次浸染并晾晒氧化，逐步加深棕褐与沉茶底色。' },
      { order: 3, title: '铁浆发乌', description: '入稀绿矾水或铁浆媒染，亚铁离子与单宁络合迅速转沉灰、褐黑或乌玄。' },
      { order: 4, title: '清水洗净', description: '彻底漂洗残余铁盐防止纤维发脆，阴干定色。' },
    ],
    chemistryNote: '植物多酚单宁与 Fe²⁺/Fe³⁺ 发生经典铁鞣络合显色，是古代灰、褐、玄黑染的核心机理。',
    sliderType: 'dye',
    materials: [
      { name: '五倍子 / 橡碗 / 薯莨 / 核桃皮', origin: '全国传统单宁染材', description: '高单宁植物原料，耐晒且沉稳古朴。' },
      { name: '绿矾（皂矾）', origin: '传统铁盐媒染剂', description: '令褐调沉降转为雅灰、铁褐或乌黑。' },
    ],
    mordants: [
      { name: '高单宁植物浓汁', ratio: 80, note: '提供温厚褐茶与深沉底色' },
      { name: '稀绿矾铁媒液', ratio: 20, note: '精确控制灰黑与暗褐发色深度' },
    ],
  },
  {
    id: 'craft-tpl-ceramic-glaze',
    name: '传统瓷器窑变釉色古法（同系推演）',
    category: 'ceramic_glaze',
    rawMaterials: ['长石瓷釉矿料与草木灰', '微量氧化铁 / 氧化铜 / 钴料呈色剂'],
    mordantOrBinder: '长石石英基础釉（约 85%）、天然草木灰与金属呈色剂（约 15%）',
    origin: '景德镇 / 龙泉 / 禹州 / 宝丰历代名窑',
    steps: [
      { order: 1, title: '淘洗配釉', description: '釉果与草木灰水淘细研，按目标釉色精准配入微量铁、铜或钴矿呈色剂。' },
      { order: 2, title: '施釉阴干', description: '采用浸釉、荡釉或多次吹釉法施于素坯，控制釉层厚薄均匀。' },
      { order: 3, title: '入窑高温', description: '约 1260°C–1320°C 高温烧成，依器类严格控制还原焰或氧化焰气氛。' },
      { order: 4, title: '缓冷开窑', description: '自然冷却促成玻璃相与微晶乳浊分相，呈现温润如玉的窑变釉色。' },
    ],
    chemistryNote: '高温下铁、铜、钴离子在不同氧化还原气氛与乳浊结构中呈现青、白、红、蓝等万千釉韵。',
    sliderType: 'glaze',
    materials: [
      { name: '天然长石釉矿与草木灰', origin: '传统名窑产区', description: '高温熔融成温润玻璃相釉层。' },
      { name: '微量天然铁 / 铜 / 钴呈色矿', origin: '天然矿脉呈色剂', description: '随窑火气氛化出青翠、霁蓝、窑红或玉白。' },
    ],
    mordants: [
      { name: '长石釉石基础料', ratio: 85, note: '形成温润玉质釉面与通透感' },
      { name: '草木灰与微量金属呈色剂', ratio: 15, note: '助熔并在高温气氛下发色' },
    ],
  },
];

function inferCraftTemplate(name, family) {
  // Ceramic / glaze keywords
  if (/(釉|瓷|窑|汝|钧|哥|官|定|影青|祭红|郎窑|霁|青花|琉璃)/.test(name)) {
    return {
      craftId: 'craft-tpl-ceramic-glaze',
      note: '依色名所涉传统瓷釉体系，按同系高温窑变釉色古法推演。',
    };
  }
  // Mineral pigment keywords
  if (/(朱|丹|赭|赤铁|红土|珊瑚|玛瑙|铅丹|雄黄|雌黄)/.test(name)) {
    return {
      craftId: 'craft-tpl-mineral-red',
      note: '依色名所涉传统红赭矿物体系，按同系水飞研粉古法推演。',
    };
  }
  if (/(石绿|石青|孔雀|青金|翡翠|碧玉|铜绿|松石|绿松|群青|宝蓝|宝石|矿)/.test(name)) {
    return {
      craftId: 'craft-tpl-mineral-blue-green',
      note: '依色名所涉传统青绿/青蓝矿物体系，按同系水飞分级古法推演。',
    };
  }
  // Plant dye red/purple keywords
  if (/(茜|苏木|红花|胭脂|紫草|绯|绛|纁|紫苏|紫棠|海棠|石榴|朱红|大红|银红|品红)/.test(name)) {
    return {
      craftId: 'craft-tpl-plant-red',
      note: '依色名所涉传统红赤/紫草植物染体系，按同系草木煎染与媒染古法推演。',
    };
  }
  // Plant dye yellow keywords
  if (/(栀子|槐|黄檗|黄柏|姜黄|藤黄|明黄|杏黄|鹅黄|缃|秋香|郁金|枯黄|藁)/.test(name)) {
    return {
      craftId: 'craft-tpl-plant-yellow',
      note: '依色名所涉传统植物黄染体系，按同系栀子/槐米/黄檗媒染古法推演。',
    };
  }
  // Plant dye indigo/green keywords
  if (/(靛|蓝草|黛|绀|青莲|缥|竹青|松花|官绿|油绿|葱绿|艾绿|苔绿|荷青|青碧)/.test(name)) {
    return {
      craftId: 'craft-tpl-plant-indigo-green',
      note: '依色名所涉传统蓝靛单染或黄蓝套染体系，按同系古法还原缸套染推演。',
    };
  }
  // Tannin / iron / ink keywords
  if (/(墨|松烟|炭|乌|玄|皂|缁|茶|栗|橡|核桃|薯莨|檀|棕|褐|铁|煤)/.test(name)) {
    return {
      craftId: 'craft-tpl-plant-brown-ink',
      note: '依色名所涉传统单宁铁媒或松烟制墨体系，按同系古法推演。',
    };
  }
  // Remaining poetic/imagery colors remain honestly `literary` with `craftId: null`
  void family;
  return null;
}

const colors = [];
const crafts = [];
const usedIds = new Set();
const usedNames = new Set();

// 1. Add all 49 verified curated prototype colors & bespoke crafts first
prototypeColors.forEach((item, idx) => {
  const hex = item.hex.toUpperCase();
  const rgb = hexToRgb(hex);
  const cmyk = rgbToCmyk(rgb[0], rgb[1], rgb[2]);
  const craftId = `craft-${item.id}`;

  const shades = (item.sliderLabels || []).map((label, stepIdx) => ({
    label,
    hex: getSimulatedHex(hex, item.sliderType, stepIdx, item.id),
    note: label.includes('（') ? label.slice(label.indexOf('（') + 1, label.lastIndexOf('）')) : undefined,
  }));

  crafts.push({
    id: craftId,
    name: `${item.name} · ${item.craft}`,
    category: mapCraftCategory(item),
    rawMaterials: item.materials.map((m) => m.name),
    mordantOrBinder: item.mordants.map((m) => `${m.name}（约 ${m.ratio}%）`).join('、'),
    origin: item.materials.map((m) => m.origin).filter(Boolean).join(' / '),
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

  usedIds.add(item.id);
  usedNames.add(item.name);

  colors.push({
    id: item.id,
    index: idx + 1,
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
    references: item.quote ? [{ source: item.source, quote: item.quote }] : [],
    description: item.era,
  });
});

// Add canonical craft templates
crafts.push(...CANONICAL_CRAFT_TEMPLATES);

// 2. Merge remaining colors from canonical 526 raw dataset
let nextIndex = colors.length + 1;
for (const entry of raw526) {
  if (usedNames.has(entry.name)) continue;

  const baseSlug = String(entry.pinyin || 'color')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '') || `color-${nextIndex}`;
  let slug = baseSlug;
  let suffix = 2;
  while (usedIds.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
  usedIds.add(slug);
  usedNames.add(entry.name);

  const hex = String(entry.hex).toUpperCase();
  const rgb = hexToRgb(hex);
  const cmyk = rgbToCmyk(rgb[0], rgb[1], rgb[2]);
  const family = classifyFamily(entry.name, hex);
  const inferred = inferCraftTemplate(entry.name, family);

  const template = inferred ? CANONICAL_CRAFT_TEMPLATES.find((t) => t.id === inferred.craftId) : null;
  const shades = template
    ? (template.sliderType === 'dye'
        ? ['一染（浅调）', '二染（轻染）', '三染（正色）', '四染（浓染）', '五染（深调）', '六染（沉色）']
        : template.sliderType === 'mineral'
          ? ['头色（粗晶深调）', '二色（正色）', '三色（细晶明调）', '四色（浮层浅色）']
          : ['薄釉（清浅）', '中釉（正釉色）', '厚釉（浓润）', '窑变（深凝）']
      ).map((label, stepIdx) => ({
        label,
        hex: getSimulatedHex(hex, template.sliderType, stepIdx, slug),
        note: label.slice(label.indexOf('（') + 1, label.lastIndexOf('）')),
      }))
    : undefined;

  colors.push({
    id: slug,
    index: nextIndex++,
    name: entry.name,
    pinyin: entry.pinyin,
    family,
    hex,
    rgb,
    cmyk,
    provenance: inferred ? 'inferred' : 'literary',
    craftId: inferred ? inferred.craftId : null,
    customCraftNote: inferred?.note,
    shades,
    references: [],
    description: inferred
      ? `收录自中国传统 526 色谱。${inferred.note}`
      : '收录自中国传统 526 色谱。源自诗词意象、自然物候或器物雅称，暂归类为文献意象色，欢迎社区提交古法考据 PR。',
  });
}

fs.writeFileSync(path.resolve('data/colors.json'), JSON.stringify(colors, null, 2) + '\n', 'utf-8');
fs.writeFileSync(path.resolve('data/crafts.json'), JSON.stringify(crafts, null, 2) + '\n', 'utf-8');

const counts = {
  total: colors.length,
  verified: colors.filter((c) => c.provenance === 'verified').length,
  inferred: colors.filter((c) => c.provenance === 'inferred').length,
  literary: colors.filter((c) => c.provenance === 'literary').length,
  families: colors.reduce((acc, c) => {
    acc[c.family] = (acc[c.family] || 0) + 1;
    return acc;
  }, {}),
};
console.log('Catalog built:', JSON.stringify(counts, null, 2));
