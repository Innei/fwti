import { FAMILY_THEME_NAMES } from '../copy/family';

export type Family =
  | 'gz'
  | 'gr'
  | 'dz'
  | 'dr'
  | 'all'
  | 'rat'
  | 'pure'
  | 'mad'
  | 'edog'
  | 'chaos'
  | 'cpu'
  | 'bench'
  | 'void'
  | 'limbo'
  | 'c'
  | 'r'
  | 'a'
  | 's';

export interface FamilyTheme {
  key: Family;
  name: string;
  color: string;
  tint: string;
}

/*
 * v2 redesign · 甜皮黑心 neo-brutalist pastel palette。
 * color 字段直接作为贴纸底色；tint 保留语义，在 v2 下变成同色更淡层（仅极少数场景用）。
 * 见 DESIGN.md §2.3 / §2.4。
 */
export const FAMILY_THEMES: Record<Family, FamilyTheme> = {
  // v2 legacy 4 家族（pastel）
  gz: { key: 'gz', name: FAMILY_THEME_NAMES.gz, color: '#FFB4B8', tint: 'rgba(255, 180, 184, 0.5)' }, // 珊瑚
  gr: { key: 'gr', name: FAMILY_THEME_NAMES.gr, color: '#FFE08A', tint: 'rgba(255, 224, 138, 0.5)' }, // 柠檬
  dz: { key: 'dz', name: FAMILY_THEME_NAMES.dz, color: '#D4B8E8', tint: 'rgba(212, 184, 232, 0.5)' }, // 薰紫
  dr: { key: 'dr', name: FAMILY_THEME_NAMES.dr, color: '#A8E6C9', tint: 'rgba(168, 230, 201, 0.5)' }, // 薄荷
  // v3 · 四族（主导维度）—— 映回 v2 pastel 家族色以保持调色板纯净
  c: { key: 'c', name: FAMILY_THEME_NAMES.c, color: '#FFB4B8', tint: 'rgba(255, 180, 184, 0.5)' },   // = gz
  r: { key: 'r', name: FAMILY_THEME_NAMES.r, color: '#FFE08A', tint: 'rgba(255, 224, 138, 0.5)' },   // = gr
  a: { key: 'a', name: FAMILY_THEME_NAMES.a, color: '#D4B8E8', tint: 'rgba(212, 184, 232, 0.5)' },   // = dz
  s: { key: 's', name: FAMILY_THEME_NAMES.s, color: '#A8E6C9', tint: 'rgba(168, 230, 201, 0.5)' },   // = dr
  // 隐藏人格：单色皆在 pastel 语调内微调；badge 形状走珊瑚浓单一版（DESIGN.md §2.4）
  all: { key: 'all', name: FAMILY_THEME_NAMES.all, color: '#D6D3CF', tint: 'rgba(214, 211, 207, 0.5)' },
  rat: { key: 'rat', name: FAMILY_THEME_NAMES.rat, color: '#B8B2A8', tint: 'rgba(184, 178, 168, 0.5)' },
  pure: { key: 'pure', name: FAMILY_THEME_NAMES.pure, color: '#F4DAB5', tint: 'rgba(244, 218, 181, 0.5)' },
  mad: { key: 'mad', name: FAMILY_THEME_NAMES.mad, color: '#FF9AA2', tint: 'rgba(255, 154, 162, 0.5)' },
  edog: { key: 'edog', name: FAMILY_THEME_NAMES.edog, color: '#FFD6E8', tint: 'rgba(255, 214, 232, 0.5)' },
  chaos: { key: 'chaos', name: FAMILY_THEME_NAMES.chaos, color: '#C8B8E4', tint: 'rgba(200, 184, 228, 0.5)' },
  cpu: { key: 'cpu', name: FAMILY_THEME_NAMES.cpu, color: '#FFC99A', tint: 'rgba(255, 201, 154, 0.5)' },
  bench: { key: 'bench', name: FAMILY_THEME_NAMES.bench, color: '#E4D4B5', tint: 'rgba(228, 212, 181, 0.5)' },
  void: { key: 'void', name: FAMILY_THEME_NAMES.void, color: '#B5C4D4', tint: 'rgba(181, 196, 212, 0.5)' },
  limbo: { key: 'limbo', name: FAMILY_THEME_NAMES.limbo, color: '#C9B4D1', tint: 'rgba(201, 180, 209, 0.5)' },
};

/** v3 · 首页预览图例：四族（12 型卡片角标色） */
export const PREVIEW_LEGEND_QUADRANT_ORDER = ['c', 'r', 'a', 's'] as const satisfies readonly Family[];

/** 四族图例点击预览时，解析用锚点型（取各族中档，代表家族中位）。 */
export const PREVIEW_QUADRANT_ANCHOR_CODE = {
  c: 'CMD',
  r: 'RBS',
  a: 'ANR',
  s: 'SNT',
} as const satisfies Record<(typeof PREVIEW_LEGEND_QUADRANT_ORDER)[number], string>;

/** v3 · 首页预览图例：4 枚 hidden，顺序同 predicates 优先级链（VOID > MAD > RAT > ALL） */
export const PREVIEW_LEGEND_HIDDEN_ORDER = [
  'void',
  'mad',
  'rat',
  'all',
] as const satisfies readonly Family[];

/** 隐藏行 family key → 人格代号（取 `personalities[code].emoji`） */
export const PREVIEW_HIDDEN_PERSONALITY_CODE = {
  void: 'VOID',
  mad: 'MAD',
  rat: 'RAT',
  all: 'ALL',
} as const satisfies Record<(typeof PREVIEW_LEGEND_HIDDEN_ORDER)[number], string>;

/** v3 · 首页 preview 网格只渲染这 12 主型 code（家族 × 档位）。 */
export const PREVIEW_MAIN_CODES = [
  'CHS', 'CMD', 'CNV',
  'RSO', 'RBS', 'RSU',
  'ACL', 'ANR', 'ADS',
  'SCA', 'SNT', 'SFL',
] as const;

/** 隐藏人格代号 → family key 映射 */
const HIDDEN_FAMILY_MAP: Record<string, Family> = {
  ALL: 'all',
  RAT: 'rat',
  PURE: 'pure',
  MAD: 'mad',
  'E-DOG': 'edog',
  CHAOS: 'chaos',
  CPU: 'cpu',
  BENCH: 'bench',
  VOID: 'void',
  LIMBO: 'limbo',
};

export function getFamily(code: string): Family {
  const hidden = HIDDEN_FAMILY_MAP[code];
  if (hidden) return hidden;
  // v3 · 3 字母 code 按首字母取家族
  if (code.length === 3) {
    const first = code[0].toLowerCase();
    if (first === 'c' || first === 'r' || first === 'a' || first === 's') {
      return first as Family;
    }
  }
  // v2 legacy · 4 字母 code
  const g = code[0] === 'G' ? 'g' : 'd';
  const z = code[1] === 'Z' ? 'z' : 'r';
  return (g + z) as Family;
}

export function getFamilyTheme(code: string): FamilyTheme {
  return FAMILY_THEMES[getFamily(code)];
}
