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

export const FAMILY_THEMES: Record<Family, FamilyTheme> = {
  gz: { key: 'gz', name: FAMILY_THEME_NAMES.gz, color: '#F25E62', tint: 'rgba(242, 94, 98, 0.08)' },
  gr: { key: 'gr', name: FAMILY_THEME_NAMES.gr, color: '#E4AE3A', tint: 'rgba(228, 174, 58, 0.10)' },
  dz: { key: 'dz', name: FAMILY_THEME_NAMES.dz, color: '#88619A', tint: 'rgba(136, 97, 154, 0.08)' },
  dr: { key: 'dr', name: FAMILY_THEME_NAMES.dr, color: '#33A474', tint: 'rgba(51, 164, 116, 0.08)' },
  // v0.3 隐藏人格：每型自有配色（对应 PROMPT.md §5 各条目的 family color cue）。
  all: { key: 'all', name: FAMILY_THEME_NAMES.all, color: '#6B7280', tint: 'rgba(107, 114, 128, 0.10)' },
  rat: { key: 'rat', name: FAMILY_THEME_NAMES.rat, color: '#4A4A4A', tint: 'rgba(74, 74, 74, 0.10)' },
  pure: { key: 'pure', name: FAMILY_THEME_NAMES.pure, color: '#D4A574', tint: 'rgba(212, 165, 116, 0.10)' },
  mad: { key: 'mad', name: FAMILY_THEME_NAMES.mad, color: '#C73E3E', tint: 'rgba(199, 62, 62, 0.10)' },
  edog: { key: 'edog', name: FAMILY_THEME_NAMES.edog, color: '#E8A5C8', tint: 'rgba(232, 165, 200, 0.10)' },
  chaos: { key: 'chaos', name: FAMILY_THEME_NAMES.chaos, color: '#B7A4D1', tint: 'rgba(183, 164, 209, 0.10)' },
  cpu: { key: 'cpu', name: FAMILY_THEME_NAMES.cpu, color: '#E07A2B', tint: 'rgba(224, 122, 43, 0.10)' },
  bench: { key: 'bench', name: FAMILY_THEME_NAMES.bench, color: '#CBB89A', tint: 'rgba(203, 184, 154, 0.10)' },
  void: { key: 'void', name: FAMILY_THEME_NAMES.void, color: '#3B4252', tint: 'rgba(59, 66, 82, 0.10)' },
  limbo: { key: 'limbo', name: FAMILY_THEME_NAMES.limbo, color: '#5A3A5E', tint: 'rgba(90, 58, 94, 0.10)' },
  // v3 · 四族（按主导维度）
  c: { key: 'c', name: FAMILY_THEME_NAMES.c, color: '#FF6B9D', tint: 'rgba(255, 107, 157, 0.10)' },
  r: { key: 'r', name: FAMILY_THEME_NAMES.r, color: '#FF5252', tint: 'rgba(255, 82, 82, 0.10)' },
  a: { key: 'a', name: FAMILY_THEME_NAMES.a, color: '#FF9AA2', tint: 'rgba(255, 154, 162, 0.10)' },
  s: { key: 's', name: FAMILY_THEME_NAMES.s, color: '#4A90A4', tint: 'rgba(74, 144, 164, 0.10)' },
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
