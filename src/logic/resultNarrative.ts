import {
  DEFAULT_TENSION_TEMPLATE,
  DIMENSION_PHRASE_COPY,
  EVIDENCE_COLLECTOR_RULES,
  FALLBACK_SELECTION_COPY,
  NARRATIVE_COPY_RULES,
  PROFILE_DIMENSIONS_TEMPLATE,
  PROFILE_OPENING_COPY,
  SCORE_BAND_THRESHOLDS,
  SUMMARY_LEADING_COPY,
  SUMMARY_TEMPLATE,
  TENSION_TEMPLATE_RULES,
  type EvidenceCollectorRule,
  type EvidenceFacet,
  type EvidenceTag,
  type MatchTier,
  type NarrativeBandKey,
  type NarrativeCopyRule,
  type NarrativeScenarioKey,
  type ScoreRequirement,
  type TensionTemplateRule,
} from '../copy/resultNarrative';

export type NarrativeStatus =
  | 'dating'
  | 'ambiguous'
  | 'crush'
  | 'solo'
  | null;

export interface NarrativeScores {
  GD: number;
  ZR: number;
  NL: number;
  YF: number;
}

export interface NarrativeQuestion {
  id: number;
  dimension: 'GD' | 'ZR' | 'NL' | 'YF' | 'META';
  tag?: string;
  text: string;
  options: Array<{
    text: string;
    score: number;
  }>;
}

export interface ResultEvidenceCard {
  facet: string;
  questionId: number;
  question: string;
  answer: string;
  note: string;
}

export interface ResultNarrative {
  summary: string;
  profileParagraphs: string[];
  evidenceTraits: string[];
  evidenceCards: ResultEvidenceCard[];
}

interface BuildNarrativeParams {
  mode: 'current' | 'legacy';
  answers: Record<number, number>;
  status: NarrativeStatus;
  scores: NarrativeScores;
  path: NarrativeQuestion[];
  questionById: Record<number, NarrativeQuestion>;
  resolveQuestionText: (
    question: NarrativeQuestion,
    status: NarrativeStatus,
  ) => string;
  resolveOptionText: (
    question: NarrativeQuestion,
    optionIdx: number,
    status: NarrativeStatus,
  ) => string;
  personalityCode: string;
  personalityName: string;
  isHidden: boolean;
  isAll: boolean;
}

interface CollectedEvidence {
  facet: EvidenceFacet;
  tag: EvidenceTag;
  questionId: number;
}

interface NarrativeSelection {
  facet: EvidenceFacet;
  tier: MatchTier;
  copy: string;
  note: string;
  primaryQuestionId?: number;
}

type FacetNarrativeState =
  | { facet: EvidenceFacet; state: 'pending' }
  | {
      facet: EvidenceFacet;
      state: 'exact_hit' | 'weak_hit' | 'ratio_fallback';
      selection: NarrativeSelection;
    };

interface NarrativeMachineContext {
  params: BuildNarrativeParams;
  pathIds: Set<number>;
  evidence: CollectedEvidence[];
  facets: Record<EvidenceFacet, FacetNarrativeState>;
}

type NarrativeMachine =
  | { phase: 'idle'; context: NarrativeMachineContext }
  | { phase: 'collecting'; context: NarrativeMachineContext }
  | { phase: 'matching'; context: NarrativeMachineContext }
  | { phase: 'filling'; context: NarrativeMachineContext }
  | { phase: 'finalized'; context: NarrativeMachineContext };

type NarrativeMachineEvent =
  | { type: 'START' }
  | { type: 'COLLECT_EVIDENCE' }
  | { type: 'MATCH_FACETS' }
  | { type: 'FILL_FACETS' };

const FACET_ORDER: EvidenceFacet[] = [
  'initiative',
  'expression',
  'closeness',
  'security',
];

const FACET_DIMENSION: Record<EvidenceFacet, keyof NarrativeScores> = {
  initiative: 'GD',
  expression: 'ZR',
  closeness: 'NL',
  security: 'YF',
};

const PRIORITY_QUESTION_IDS: Record<EvidenceFacet, number[]> = {
  initiative: [68, 5, 8, 37, 44, 45, 46, 52, 60, 61, 62, 77],
  expression: [41, 42, 10, 12, 15, 47, 48, 54, 58, 63, 78, 79],
  closeness: [70, 20, 16, 23, 36, 38, 50, 51, 55, 59, 64, 65, 76],
  security: [26, 27, 29, 43, 49, 53, 57, 67, 24, 30, 40, 66, 69, 74, 75],
};

function createPendingFacetState(facet: EvidenceFacet): FacetNarrativeState {
  return { facet, state: 'pending' };
}

function createInitialContext(
  params: BuildNarrativeParams,
): NarrativeMachineContext {
  return {
    params,
    pathIds: new Set(params.path.map((question) => question.id)),
    evidence: [],
    facets: {
      initiative: createPendingFacetState('initiative'),
      expression: createPendingFacetState('expression'),
      closeness: createPendingFacetState('closeness'),
      security: createPendingFacetState('security'),
    },
  };
}

function createMachine(params: BuildNarrativeParams): NarrativeMachine {
  return {
    phase: 'idle',
    context: createInitialContext(params),
  };
}

function matchesCollectorRule(
  context: NarrativeMachineContext,
  rule: EvidenceCollectorRule,
): boolean {
  if (!context.pathIds.has(rule.questionId)) return false;
  const answer = context.params.answers[rule.questionId];
  return answer !== undefined && rule.optionIndexes.includes(answer);
}

function collectEvidence(context: NarrativeMachineContext): CollectedEvidence[] {
  return EVIDENCE_COLLECTOR_RULES
    .filter((rule) => matchesCollectorRule(context, rule))
    .map((rule) => ({
      facet: rule.facet,
      tag: rule.tag,
      questionId: rule.questionId,
    }));
}

function groupEvidenceByFacet(
  evidence: CollectedEvidence[],
  facet: EvidenceFacet,
): CollectedEvidence[] {
  return evidence.filter((entry) => entry.facet === facet);
}

function hasTag(entries: CollectedEvidence[], tag: EvidenceTag): boolean {
  return entries.some((entry) => entry.tag === tag);
}

function matchesCopyRule(
  entries: CollectedEvidence[],
  rule: NarrativeCopyRule,
): boolean {
  if (rule.all && !rule.all.every((tag) => hasTag(entries, tag))) return false;
  if (rule.any && !rule.any.some((tag) => hasTag(entries, tag))) return false;
  if (rule.none && rule.none.some((tag) => hasTag(entries, tag))) return false;
  return true;
}

function findPrimaryQuestionId(
  entries: CollectedEvidence[],
  rule: NarrativeCopyRule,
): number | undefined {
  if (rule.preferQuestionIds) {
    for (const id of rule.preferQuestionIds) {
      if (entries.some((entry) => entry.questionId === id)) return id;
    }
  }
  return entries[0]?.questionId;
}

function createSelectionFromRule(
  facet: EvidenceFacet,
  rule: NarrativeCopyRule,
  entries: CollectedEvidence[],
): NarrativeSelection {
  return {
    facet,
    tier: rule.tier,
    copy: rule.copy,
    note: rule.note,
    primaryQuestionId: findPrimaryQuestionId(entries, rule),
  };
}

function buildFallbackSelection(
  context: NarrativeMachineContext,
  facet: EvidenceFacet,
): NarrativeSelection {
  const score = context.params.scores[FACET_DIMENSION[facet]];
  const primaryQuestionId = pickFallbackQuestionId(context, facet);
  const band = getScoreBand(score);
  const copy = FALLBACK_SELECTION_COPY[facet][band];
  return {
    facet,
    tier: 'ratio_fallback',
    copy: copy.copy,
    note: copy.note,
    primaryQuestionId,
  };
}

function pickFallbackQuestionId(
  context: NarrativeMachineContext,
  facet: EvidenceFacet,
): number | undefined {
  for (const id of PRIORITY_QUESTION_IDS[facet]) {
    if (!context.pathIds.has(id)) continue;
    if (context.params.answers[id] !== undefined) return id;
  }

  const dimension = FACET_DIMENSION[facet];
  let best: { id: number; strength: number } | null = null;
  for (const question of context.params.path) {
    if (question.dimension !== dimension || question.tag === '彩蛋') continue;
    const answerIdx = context.params.answers[question.id];
    if (answerIdx === undefined) continue;
    const option = question.options[answerIdx];
    if (!option) continue;
    const strength = Math.abs(option.score);
    if (!best || strength > best.strength) {
      best = { id: question.id, strength };
    }
  }
  return best?.id;
}

function resolveFacetFromRules(
  context: NarrativeMachineContext,
  facet: EvidenceFacet,
): FacetNarrativeState {
  const entries = groupEvidenceByFacet(context.evidence, facet);

  for (const rule of NARRATIVE_COPY_RULES) {
    if (rule.facet !== facet || rule.tier !== 'exact_hit') continue;
    if (!matchesCopyRule(entries, rule)) continue;
    return {
      facet,
      state: 'exact_hit',
      selection: createSelectionFromRule(facet, rule, entries),
    };
  }

  for (const rule of NARRATIVE_COPY_RULES) {
    if (rule.facet !== facet || rule.tier !== 'weak_hit') continue;
    if (!matchesCopyRule(entries, rule)) continue;
    return {
      facet,
      state: 'weak_hit',
      selection: createSelectionFromRule(facet, rule, entries),
    };
  }

  return createPendingFacetState(facet);
}

function transition(
  machine: NarrativeMachine,
  event: NarrativeMachineEvent,
): NarrativeMachine {
  if (machine.phase === 'idle' && event.type === 'START') {
    return { phase: 'collecting', context: machine.context };
  }

  if (machine.phase === 'collecting' && event.type === 'COLLECT_EVIDENCE') {
    return {
      phase: 'matching',
      context: {
        ...machine.context,
        evidence: collectEvidence(machine.context),
      },
    };
  }

  if (machine.phase === 'matching' && event.type === 'MATCH_FACETS') {
    const facets = { ...machine.context.facets };
    for (const facet of FACET_ORDER) {
      facets[facet] = resolveFacetFromRules(machine.context, facet);
    }
    return {
      phase: 'filling',
      context: {
        ...machine.context,
        facets,
      },
    };
  }

  if (machine.phase === 'filling' && event.type === 'FILL_FACETS') {
    const facets = { ...machine.context.facets };
    for (const facet of FACET_ORDER) {
      if (facets[facet].state !== 'pending') continue;
      facets[facet] = {
        facet,
        state: 'ratio_fallback',
        selection: buildFallbackSelection(machine.context, facet),
      };
    }
    return {
      phase: 'finalized',
      context: {
        ...machine.context,
        facets,
      },
    };
  }

  return machine;
}

function runNarrativeMachine(
  params: BuildNarrativeParams,
): Extract<NarrativeMachine, { phase: 'finalized' }> {
  let machine = createMachine(params);
  machine = transition(machine, { type: 'START' });
  machine = transition(machine, { type: 'COLLECT_EVIDENCE' });
  machine = transition(machine, { type: 'MATCH_FACETS' });
  machine = transition(machine, { type: 'FILL_FACETS' });
  if (machine.phase !== 'finalized') {
    throw new Error('[result narrative] machine failed to reach finalized state');
  }
  return machine;
}

function buildEvidenceCard(
  context: NarrativeMachineContext,
  selection: NarrativeSelection,
): ResultEvidenceCard | null {
  const questionId = selection.primaryQuestionId;
  if (questionId === undefined) return null;

  const question = context.params.questionById[questionId];
  if (!question) return null;

  const answerIdx = context.params.answers[questionId];
  if (answerIdx === undefined) return null;

  return {
    facet: selection.facet,
    questionId,
    question: context.params.resolveQuestionText(question, context.params.status),
    answer: context.params.resolveOptionText(
      question,
      answerIdx,
      context.params.status,
    ),
    note: selection.note,
  };
}

function summarizeMatchCounts(
  machine: Extract<NarrativeMachine, { phase: 'finalized' }>,
): { exact: number; weak: number; fallback: number } {
  let exact = 0;
  let weak = 0;
  let fallback = 0;

  for (const facet of FACET_ORDER) {
    const state = machine.context.facets[facet];
    if (state.state === 'exact_hit') exact += 1;
    else if (state.state === 'weak_hit') weak += 1;
    else if (state.state === 'ratio_fallback') fallback += 1;
  }

  return { exact, weak, fallback };
}

function renderTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] === undefined ? '' : String(values[key]),
  );
}

function getNarrativeScenario(
  params: BuildNarrativeParams,
): NarrativeScenarioKey {
  if (params.mode === 'legacy') return 'legacy';
  if (params.isAll) return 'all';
  if (params.isHidden) return 'hidden';
  return 'default';
}

function getScoreBand(score: number): NarrativeBandKey {
  if (score >= SCORE_BAND_THRESHOLDS.high) return 'high';
  if (score <= SCORE_BAND_THRESHOLDS.low) return 'low';
  return 'mid';
}

function matchesScoreRequirement(
  score: number,
  requirement: ScoreRequirement,
): boolean {
  if (requirement.min !== undefined && score < requirement.min) return false;
  if (requirement.max !== undefined && score > requirement.max) return false;
  return true;
}

function matchesTensionRule(
  scores: NarrativeScores,
  rule: TensionTemplateRule,
): boolean {
  return rule.requirements.every((requirement) =>
    matchesScoreRequirement(scores[requirement.dim], requirement),
  );
}

function buildSummary(
  params: BuildNarrativeParams,
  counts: { exact: number; weak: number; fallback: number },
): string {
  const leading = SUMMARY_LEADING_COPY[getNarrativeScenario(params)];
  return renderTemplate(SUMMARY_TEMPLATE, {
    leading,
    exact: counts.exact,
    weak: counts.weak,
    fallback: counts.fallback,
  });
}

function buildDimensionPhrase(
  facet: EvidenceFacet,
  score: number,
): string {
  return DIMENSION_PHRASE_COPY[facet][getScoreBand(score)];
}

function buildTensionParagraph(params: BuildNarrativeParams): string {
  const matchedRule = TENSION_TEMPLATE_RULES.find((rule) =>
    matchesTensionRule(params.scores, rule),
  );
  return matchedRule?.template ?? DEFAULT_TENSION_TEMPLATE;
}

function buildProfileParagraphs(
  params: BuildNarrativeParams,
): string[] {
  const opening = renderTemplate(
    PROFILE_OPENING_COPY[getNarrativeScenario(params)],
    {
      personalityName: params.personalityName,
      personalityCode: params.personalityCode,
    },
  );
  const dimensions = renderTemplate(PROFILE_DIMENSIONS_TEMPLATE, {
    initiativePhrase: buildDimensionPhrase('initiative', params.scores.GD),
    expressionPhrase: buildDimensionPhrase('expression', params.scores.ZR),
    closenessPhrase: buildDimensionPhrase('closeness', params.scores.NL),
    securityPhrase: buildDimensionPhrase('security', params.scores.YF),
  });
  return [opening, dimensions, buildTensionParagraph(params)];
}

export function buildResultNarrative(
  params: BuildNarrativeParams,
): ResultNarrative {
  const machine = runNarrativeMachine(params);
  const counts = summarizeMatchCounts(machine);

  const selections = FACET_ORDER.map((facet) => {
    const state = machine.context.facets[facet];
    if (state.state === 'pending') {
      throw new Error(`[result narrative] facet ${facet} unexpectedly left pending`);
    }
    return state.selection;
  });

  const evidenceCards = selections
    .map((selection) => buildEvidenceCard(machine.context, selection))
    .filter((card): card is ResultEvidenceCard => card !== null);

  return {
    summary: buildSummary(params, counts),
    profileParagraphs: buildProfileParagraphs(params),
    evidenceTraits: selections.map((selection) => selection.copy),
    evidenceCards,
  };
}
