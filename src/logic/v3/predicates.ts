/**
 * FWTI v3 · 隐藏人格与叠加标签触发谓词
 *
 * 所有 trigger 读取统一 `Lens` 接口，避免 scoring 直接暴露答案 map。
 * 优先级（高→低）：VOID > MAD > RAT > ALL > 12 主型。
 *
 * 数值约定：
 *   - `ratio.C/R/A/S ∈ [-1, +1]`，见 scoring.ts。
 *   - 选项 tag 'rat' / 'void' / 'mad' 命中与否通过 `lens.hasOptionTag(qId, tag)`。
 */

import { questionByIdV3 } from '../../copy/v3/questions';
import type {
  OptionTag,
  QuestionV3,
  StatusKey,
} from '../../copy/v3/types';

export type RatioDimV3 = 'C' | 'R' | 'A' | 'S';

export interface RatioMapV3 {
  C: number;
  R: number;
  A: number;
  S: number;
}

export interface LensV3 {
  answers: Record<number, number>;
  ratio: RatioMapV3;
  status: StatusKey | null;
  retreatCount: number;
  tiedDimensions: RatioDimV3[];
  optionAt: (qId: number) => { idx: number; tag?: OptionTag } | null;
  hasOptionTag: (qId: number, tag: OptionTag) => boolean;
  countOptionTag: (tag: OptionTag) => number;
  answerOf: (qId: number) => number | undefined;
}

export function makeAnswerLensV3(input: {
  answers: Record<number, number>;
  ratio: RatioMapV3;
  status: StatusKey | null;
  retreatCount: number;
  tiedDimensions: RatioDimV3[];
}): LensV3 {
  const { answers, ratio, status, retreatCount, tiedDimensions } = input;
  const optionAt = (qId: number) => {
    const q = questionByIdV3.get(qId);
    const idx = answers[qId];
    if (!q || idx === undefined) return null;
    const opt = q.options[idx];
    if (!opt) return null;
    return { idx, tag: opt.tag };
  };
  const hasOptionTag = (qId: number, tag: OptionTag): boolean => {
    const sel = optionAt(qId);
    return !!sel && sel.tag === tag;
  };
  const countOptionTag = (tag: OptionTag): number => {
    let n = 0;
    for (const id of Object.keys(answers).map(Number)) {
      if (hasOptionTag(id, tag)) n += 1;
    }
    return n;
  };
  const answerOf = (qId: number) => answers[qId];
  return {
    answers,
    ratio,
    status,
    retreatCount,
    tiedDimensions,
    optionAt,
    hasOptionTag,
    countOptionTag,
    answerOf,
  };
}

// ───────────────────────────────────────────────────────────────
// Hidden personalities · 4 枚
// ───────────────────────────────────────────────────────────────

export interface HiddenPersonalityTriggerV3 {
  code: 'VOID' | 'MAD' | 'RAT' | 'ALL';
  test: (lens: LensV3) => boolean;
}

export const hiddenPersonalityTriggersV3: HiddenPersonalityTriggerV3[] = [
  {
    code: 'VOID',
    // 母胎 solo / 恋爱绝缘体 · status=solo 且接触近零且至少一枚 void 信号命中。
    test: (l) =>
      l.status === 'solo' &&
      l.ratio.C <= -0.4 &&
      l.ratio.A <= -0.3 &&
      l.countOptionTag('void') >= 1,
  },
  {
    code: 'MAD',
    // 发疯文学家 · 高疑 + 暴调节 + 高黏 三维合击。可辅以 mad 标签命中加权。
    test: (l) => {
      const base = l.ratio.S >= 0.4 && l.ratio.R >= 0.4 && l.ratio.A >= 0.4;
      const boost = l.countOptionTag('mad') >= 1;
      return base && boost;
    },
  },
  {
    code: 'RAT',
    // 鼠鼠恋人 · 自贬选项命中 ≥ 2 且整体主动 / 黏附偏低。
    test: (l) =>
      l.countOptionTag('rat') >= 2 &&
      l.ratio.C <= 0.2 &&
      l.ratio.A <= 0.3,
  },
  {
    code: 'ALL',
    // 我全都要 · 四维均近零。
    test: (l) =>
      Math.max(
        Math.abs(l.ratio.C),
        Math.abs(l.ratio.R),
        Math.abs(l.ratio.A),
        Math.abs(l.ratio.S),
      ) < 0.15,
  },
];

// ───────────────────────────────────────────────────────────────
// Stackable hidden tags · 10 枚
// ───────────────────────────────────────────────────────────────

export interface HiddenTagTriggerV3 {
  key: string; // maps to hiddenTitlesV3 key
  test: (lens: LensV3) => boolean;
}

/** 题 id 上选 A = 0, B = 1, C = 2（3 档）或 A-E = 0-4（5 档）。 */
const isA = (l: LensV3, qId: number) => l.answerOf(qId) === 0;
const isC = (l: LensV3, qId: number) => l.answerOf(qId) === 2;

export const hiddenTagTriggersV3: HiddenTagTriggerV3[] = [
  {
    key: 'cyberReconciler',
    // 赛博对账王：查户口三连（Q27 A 想看 + Q26 C 名单 + Q32 C 醋精）
    test: (l) => isA(l, 27) && isC(l, 26) && isC(l, 32),
  },
  {
    key: 'overDense',
    // 浓度超标：情绪外放三连（Q9 A 当场怼 + Q10 C 当场爆 + Q15 A 当场变脸）
    test: (l) => isA(l, 9) && isC(l, 10) && isA(l, 15),
  },
  {
    key: 'flipFlopper',
    // 反复横跳：改答次数 ≥ 3
    test: (l) => l.retreatCount >= 3,
  },
  {
    key: 'tooDilute',
    // 淡到隐形：多维度向淡端（C≤-0.3 ∧ R≤-0.3 ∧ A≤-0.3）
    test: (l) => l.ratio.C <= -0.3 && l.ratio.R <= -0.3 && l.ratio.A <= -0.3,
  },
  {
    key: 'humanATM',
    // 电子 ATM：主动付出成本极高 · Q1 A 深夜主动 + Q3 A 周末主动 + Q7 A 关心 + Q8 C 主动冲
    test: (l) => isA(l, 1) && isA(l, 3) && isA(l, 7) && isC(l, 8),
  },
  {
    key: 'soBeIt',
    // 如何呢又能怎：关键 佛 三连（Q28 A 异地 ok + Q30 A 合照无所谓 + Q32 A 不吃醋）
    test: (l) => isA(l, 28) && isA(l, 30) && isA(l, 32),
  },
  {
    key: 'momentsPerformer',
    // 朋友圈艺术家：官宣常驻 + 秒 DM（Q21 answer=0 即 A=+2 官宣 + Q4 C 秒 DM 夸）
    test: (l) => l.answerOf(21) === 0 && isC(l, 4),
  },
  {
    key: 'mouthStubborn',
    // 嘴硬王者：三连压制（Q9 C 心存 + Q12 A 装没事 + Q15 C 面无表情）
    test: (l) => isC(l, 9) && isA(l, 12) && isC(l, 15),
  },
  {
    key: 'virginMonument',
    // 母胎 solo 纪念碑：status=solo 且 void tag 命中 ≥ 2（比 VOID 弱一档，允许叠加）
    test: (l) => l.status === 'solo' && l.countOptionTag('void') >= 2,
  },
  {
    key: 'yearBurnout',
    // 年度内耗：Q25 A 脑补 + Q29 A (+2 不够还要证据) + Q31 A 反复确认
    test: (l) => isA(l, 25) && isA(l, 29) && isA(l, 31),
  },
];
