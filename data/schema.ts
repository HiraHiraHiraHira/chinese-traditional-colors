import { z } from 'zod';

/** 数据可信度分级 */
export const ProvenanceLevelSchema = z.enum([
  'verified', // 一级：典籍确证（有古籍明确配方与原文出处）
  'inferred', // 二级：工艺推演（归属明确矿物/植物/瓷釉大类，按同系古法推演）
  'literary', // 三级：文献/意象色（源于诗词或现代色谱，暂留空工艺，开放社区认领）
]);

/** 六大传统色系 */
export const ColorFamilySchema = z.enum([
  'red',    // 红赤
  'yellow', // 黄缃
  'green',  // 青绿
  'blue',   // 蓝靛
  'purple', // 紫绀
  'neutral' // 玄白
]);

/** 工艺大类 */
export const CraftCategorySchema = z.enum([
  'plant_dye',      // 植物草木染
  'mineral_pigment',// 矿物颜料（水飞/研磨）
  'ceramic_glaze',  // 瓷器窑变釉色
  'compound_dye',   // 复合套染
  'organic_animal', // 动物/昆虫染（如胭脂虫、紫胶）
  'none',           // 无明确制色工艺（意象色）
]);

export const CraftStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const ReferenceSchema = z.object({
  source: z.string(),
  dynasty: z.string().optional(),
  quote: z.string(),
  note: z.string().optional(),
});

export const CraftMaterialSchema = z.object({
  name: z.string().min(1),
  origin: z.string().optional(),
  description: z.string().optional(),
});

export const CraftMordantSchema = z.object({
  name: z.string().min(1),
  ratio: z.number().min(0).max(100),
  note: z.string().optional(),
});

export const CraftProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: CraftCategorySchema,
  rawMaterials: z.array(z.string()).min(1),
  mordantOrBinder: z.string().optional(),
  origin: z.string().optional(),
  steps: z.array(CraftStepSchema).min(1),
  chemistryNote: z.string().optional(),
  sliderType: z.enum(['dye', 'mineral', 'glaze']).optional(),
  materials: z.array(CraftMaterialSchema).optional(),
  mordants: z.array(CraftMordantSchema).optional(),
});

export const ShadeSimulationSchema = z.object({
  label: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  note: z.string().optional(),
});

export const TraditionalColorSchema = z.object({
  id: z.string(),
  index: z.number().int().min(1),
  name: z.string().min(1),
  pinyin: z.string().min(1),
  englishName: z.string().optional(),
  family: ColorFamilySchema,
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  rgb: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
  cmyk: z.tuple([z.number().int(), z.number().int(), z.number().int(), z.number().int()]),
  provenance: ProvenanceLevelSchema,
  craftId: z.string().nullable(),
  customCraftNote: z.string().optional(),
  shades: z.array(ShadeSimulationSchema).optional(),
  references: z.array(ReferenceSchema).default([]),
  description: z.string().optional(),
});

export type TraditionalColor = z.infer<typeof TraditionalColorSchema>;
export type CraftProfile = z.infer<typeof CraftProfileSchema>;
