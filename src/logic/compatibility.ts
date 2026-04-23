import { personalities } from '../copy/personalities';
import {
  BEST_COMPATIBILITY_FACTOR_COPY,
  WORST_COMPATIBILITY_FACTOR_COPY,
} from '../copy/compatibility';

export interface CompatibilityChoice {
  code: string;
  score: number;
  summary: string;
  reasons: string[];
}

export interface CompatibilityOutcome {
  best: CompatibilityChoice;
  worst: CompatibilityChoice;
}

interface CompatibilityVector {
  GD: number;
  ZR: number;
  NL: number;
  YF: number;
  volatility: number;
}

interface PairMetrics {
  a: CompatibilityVector;
  b: CompatibilityVector;
  center: Omit<CompatibilityVector, 'volatility'>;
  gdDiff: number;
  zrDiff: number;
  nlDiff: number;
  yfDiff: number;
  volatilitySum: number;
  dualHyperactivation: boolean;
  pursueWithdraw: boolean;
}

interface NarrativeFactor {
  weight: number;
  summary: string;
  reason: string;
}

const LETTER_VALUE: Record<string, number> = {
  G: 1,
  D: -1,
  Z: 1,
  R: -1,
  N: 1,
  L: -1,
  Y: 1,
  F: -1,
};

/**
 * Hidden personas are overlays on top of the same four-dimensional space. They still need
 * a prototype vector so compatibility remains explainable and can be computed consistently.
 *
 * Important boundary:
 * this is a theory-informed heuristic, not a validated matching model. We optimize for:
 *   1. lower pair-level insecurity, especially lower anxious vigilance (`YF`)
 *   2. moderate pair equilibrium rather than two simultaneous extremes
 *   3. low interpersonal mismatch on closeness, emotional expression, and initiative
 *   4. explicit penalties for pursue-withdraw and high-anxiety collisions
 */
const HIDDEN_PROTOTYPES: Record<string, CompatibilityVector> = {
  ALL: { GD: 0, ZR: 0, NL: 0, YF: 0, volatility: 0.2 },
  RAT: { GD: -0.8, ZR: -0.7, NL: -0.7, YF: 0.9, volatility: 0.5 },
  PURE: { GD: 0.9, ZR: 0.1, NL: 0.9, YF: -0.9, volatility: 0.2 },
  MAD: { GD: 1, ZR: 1, NL: 1, YF: 1, volatility: 1 },
  'E-DOG': { GD: 0.7, ZR: 0.2, NL: 0, YF: 0.2, volatility: 0.4 },
  CHAOS: { GD: 0, ZR: 0.1, NL: -0.2, YF: -0.1, volatility: 0.95 },
  CPU: { GD: 0.1, ZR: 0.1, NL: 0.3, YF: 1, volatility: 0.85 },
  BENCH: { GD: 0.4, ZR: -0.5, NL: -0.3, YF: 0.6, volatility: 0.45 },
  VOID: { GD: -0.9, ZR: -0.2, NL: -0.8, YF: -0.2, volatility: 0.2 },
  LIMBO: { GD: 0, ZR: 0, NL: 0.4, YF: 0.9, volatility: 0.65 },
  // ─── v3 · 12 主型 prototype（GD/ZR/NL/YF alias of C/R/A/S）──
  CHS: { GD: 0.8, ZR: 0.1, NL: 0.3, YF: 0.3, volatility: 0.35 },
  CMD: { GD: 0, ZR: -0.1, NL: 0, YF: -0.2, volatility: 0.15 },
  CNV: { GD: -0.8, ZR: -0.3, NL: -0.4, YF: -0.2, volatility: 0.2 },
  RSO: { GD: 0.2, ZR: 0.9, NL: 0.2, YF: 0.3, volatility: 0.7 },
  RBS: { GD: 0.1, ZR: 0, NL: 0.1, YF: -0.4, volatility: 0.1 },
  RSU: { GD: -0.2, ZR: -0.9, NL: 0.1, YF: 0.4, volatility: 0.45 },
  ACL: { GD: 0.4, ZR: 0.3, NL: 0.9, YF: 0.3, volatility: 0.45 },
  ANR: { GD: 0.1, ZR: 0, NL: 0, YF: -0.3, volatility: 0.15 },
  ADS: { GD: -0.3, ZR: -0.2, NL: -0.9, YF: -0.3, volatility: 0.2 },
  SCA: { GD: 0.3, ZR: 0.5, NL: 0.4, YF: 0.9, volatility: 0.7 },
  SNT: { GD: 0.1, ZR: 0, NL: 0.1, YF: 0, volatility: 0.1 },
  SFL: { GD: -0.1, ZR: -0.3, NL: -0.3, YF: -0.9, volatility: 0.2 },
};

function standardVectorFromCode(code: string): CompatibilityVector | null {
  if (code.length !== 4) return null;
  const gd = LETTER_VALUE[code[0]];
  const zr = LETTER_VALUE[code[1]];
  const nl = LETTER_VALUE[code[2]];
  const yf = LETTER_VALUE[code[3]];
  if (
    gd === undefined ||
    zr === undefined ||
    nl === undefined ||
    yf === undefined
  ) {
    return null;
  }

  return {
    GD: gd,
    ZR: zr,
    NL: nl,
    YF: yf,
    volatility: Math.max(0, zr) * 0.45 + Math.max(0, yf) * 0.55,
  };
}

function vectorOf(code: string): CompatibilityVector {
  return HIDDEN_PROTOTYPES[code] ?? standardVectorFromCode(code) ?? {
    GD: 0,
    ZR: 0,
    NL: 0,
    YF: 0,
    volatility: 0.2,
  };
}

function getPairMetrics(aCode: string, bCode: string): PairMetrics {
  const a = vectorOf(aCode);
  const b = vectorOf(bCode);
  const center = {
    GD: (a.GD + b.GD) / 2,
    ZR: (a.ZR + b.ZR) / 2,
    NL: (a.NL + b.NL) / 2,
    YF: (a.YF + b.YF) / 2,
  };
  const gdDiff = Math.abs(a.GD - b.GD);
  const zrDiff = Math.abs(a.ZR - b.ZR);
  const nlDiff = Math.abs(a.NL - b.NL);
  const yfDiff = Math.abs(a.YF - b.YF);

  return {
    a,
    b,
    center,
    gdDiff,
    zrDiff,
    nlDiff,
    yfDiff,
    volatilitySum: a.volatility + b.volatility,
    dualHyperactivation: a.YF > 0.6 && b.YF > 0.6,
    pursueWithdraw:
      (a.GD > 0.6 && a.NL > 0.4 && b.GD < -0.6 && b.NL < -0.4) ||
      (b.GD > 0.6 && b.NL > 0.4 && a.GD < -0.6 && a.NL < -0.4),
  };
}

function pairScore(aCode: string, bCode: string): number {
  const { a, b, center, gdDiff, zrDiff, nlDiff, yfDiff, volatilitySum, dualHyperactivation, pursueWithdraw } =
    getPairMetrics(aCode, bCode);

  // Pair-level target state: some initiative, moderated expression, modest closeness, low vigilance.
  let score = 100;
  score -= 10 * Math.abs(center.GD - 0.15);
  score -= 7 * Math.abs(center.ZR - 0);
  score -= 8 * Math.abs(center.NL - 0.1);
  score -= 14 * Math.abs(center.YF + 0.5);

  // Interpersonal fit: strong mismatches raise friction even if the pair centroid looks acceptable.
  score -= 8 * gdDiff;
  score -= 7 * zrDiff;
  score -= 10 * nlDiff;
  score -= 12 * yfDiff;

  // Known unstable dyads from attachment / regulation logic.
  if (dualHyperactivation) score -= 16;
  if (pursueWithdraw) score -= 16;
  if (
    (a.ZR > 0.6 && b.ZR < -0.6) ||
    (b.ZR > 0.6 && a.ZR < -0.6)
  ) {
    score -= 8;
  }
  if (
    (a.NL > 0.6 && b.NL < -0.6) ||
    (b.NL > 0.6 && a.NL < -0.6)
  ) {
    score -= 10;
  }

  // Mild rewards for matched pacing and a calmer shared field.
  if (center.YF <= -0.4) score += 6;
  if (Math.abs(a.GD - b.GD) <= 0.4) score += 3;
  if (Math.abs(a.ZR - b.ZR) <= 0.4) score += 4;
  if (Math.abs(a.NL - b.NL) <= 0.4) score += 5;

  // Volatility hurts pair stability even when poles align.
  score -= volatilitySum * 5;

  return score;
}

function bestFactors(metrics: PairMetrics): NarrativeFactor[] {
  const factors: NarrativeFactor[] = [];

  if (metrics.center.YF <= -0.4) {
    factors.push(BEST_COMPATIBILITY_FACTOR_COPY.lowSharedVigilance);
  }
  if (metrics.nlDiff <= 0.4) {
    factors.push(BEST_COMPATIBILITY_FACTOR_COPY.alignedCloseness);
  }
  if (metrics.gdDiff <= 0.4 && metrics.nlDiff <= 0.4) {
    factors.push(BEST_COMPATIBILITY_FACTOR_COPY.alignedPacing);
  }
  if (metrics.zrDiff <= 0.4) {
    factors.push(BEST_COMPATIBILITY_FACTOR_COPY.alignedExpression);
  }
  if (metrics.yfDiff <= 0.5) {
    factors.push(BEST_COMPATIBILITY_FACTOR_COPY.alignedSecurityThreshold);
  }
  if (metrics.volatilitySum <= 0.9) {
    factors.push(BEST_COMPATIBILITY_FACTOR_COPY.lowVolatility);
  }

  if (factors.length === 0) {
    factors.push(BEST_COMPATIBILITY_FACTOR_COPY.default);
  }

  return factors.sort((a, b) => b.weight - a.weight);
}

function worstFactors(metrics: PairMetrics): NarrativeFactor[] {
  const factors: NarrativeFactor[] = [];

  if (metrics.dualHyperactivation) {
    factors.push(WORST_COMPATIBILITY_FACTOR_COPY.dualHyperactivation);
  }
  if (metrics.pursueWithdraw) {
    factors.push(WORST_COMPATIBILITY_FACTOR_COPY.pursueWithdraw);
  }
  if (metrics.nlDiff > 1.2) {
    factors.push(WORST_COMPATIBILITY_FACTOR_COPY.closenessGap);
  }
  if (metrics.yfDiff > 1.1) {
    factors.push(WORST_COMPATIBILITY_FACTOR_COPY.securityGap);
  }
  if (metrics.zrDiff > 1.2) {
    factors.push(WORST_COMPATIBILITY_FACTOR_COPY.expressionGap);
  }
  if (metrics.gdDiff > 1.2) {
    factors.push(WORST_COMPATIBILITY_FACTOR_COPY.initiativeGap);
  }
  if (metrics.volatilitySum > 1.4) {
    factors.push(WORST_COMPATIBILITY_FACTOR_COPY.highVolatility);
  }

  if (factors.length === 0) {
    factors.push(WORST_COMPATIBILITY_FACTOR_COPY.default);
  }

  return factors.sort((a, b) => b.weight - a.weight);
}

function buildChoice(
  code: string,
  score: number,
  factors: NarrativeFactor[],
): CompatibilityChoice {
  return {
    code,
    score,
    summary: factors[0]?.summary ?? '',
    reasons: factors.slice(0, 3).map((factor) => factor.reason),
  };
}

const COMPATIBILITY_CACHE = new Map<string, CompatibilityOutcome>();

export function getCompatibilityOutcome(code: string): CompatibilityOutcome {
  const cached = COMPATIBILITY_CACHE.get(code);
  if (cached) return cached;

  const allCodes = Object.keys(personalities).filter(
    (candidate) => candidate !== code,
  );
  let bestCode = code;
  let worstCode = code;
  let bestScore = Number.NEGATIVE_INFINITY;
  let worstScore = Number.POSITIVE_INFINITY;

  for (const candidate of allCodes) {
    const score = pairScore(code, candidate);
    if (
      score > bestScore ||
      (score === bestScore && candidate.localeCompare(bestCode) < 0)
    ) {
      bestCode = candidate;
      bestScore = score;
    }
    if (
      score < worstScore ||
      (score === worstScore && candidate.localeCompare(worstCode) < 0)
    ) {
      worstCode = candidate;
      worstScore = score;
    }
  }

  const outcome = {
    best: buildChoice(bestCode, bestScore, bestFactors(getPairMetrics(code, bestCode))),
    worst: buildChoice(worstCode, worstScore, worstFactors(getPairMetrics(code, worstCode))),
  };
  COMPATIBILITY_CACHE.set(code, outcome);
  return outcome;
}
