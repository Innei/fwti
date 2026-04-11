export interface CompatibilityNarrativeFactorCopy {
  weight: number;
  summary: string;
  reason: string;
}

export const BEST_COMPATIBILITY_FACTOR_COPY = {
  lowSharedVigilance: {
    weight: 3.2,
    summary: '共享警觉较低，关系更容易稳定。',
    reason:
      '双方对不确定信号的放大倾向较低，不容易把一次延迟或沉默直接解释成关系危机。',
  },
  alignedCloseness: {
    weight: 3,
    summary: '亲密需求较同频，日常体感更一致。',
    reason:
      '双方对靠近与留白的需求更接近，不必长期在“太黏”与“太冷”之间拉扯。',
  },
  alignedPacing: {
    weight: 2.8,
    summary: '关系推进节奏接近，较少出现一追一逃。',
    reason:
      '主动性与靠近节奏较一致，关系更容易在协商中前进，而非由单方拖拽。',
  },
  alignedExpression: {
    weight: 2.2,
    summary: '表达方式接近，沟通成本较低。',
    reason:
      '双方更接近同一种表达或克制节奏，冲突较容易说开，而不是互相误读。',
  },
  alignedSecurityThreshold: {
    weight: 2,
    summary: '安全感阈值接近，不必反复对表。',
    reason:
      '双方对关系确认的需求更接近，不容易出现“你太敏感”或“你太迟钝”的互相指责。',
  },
  lowVolatility: {
    weight: 1.6,
    summary: '整体波动较低，更容易沉淀出稳定互动。',
    reason:
      '双方都不太容易把一次互动迅速升级成系统性危机，关系场更平稳。',
  },
  default: {
    weight: 1,
    summary: '整体张力较低，仍属于可协商的组合。',
    reason:
      '虽然不存在单一突出优势，但主要维度没有形成高强度冲突，因此仍相对容易维持。',
  },
} as const satisfies Record<string, CompatibilityNarrativeFactorCopy>;

export const WORST_COMPATIBILITY_FACTOR_COPY = {
  dualHyperactivation: {
    weight: 3.3,
    summary: '双方警觉都高，小信号也容易被放大。',
    reason:
      '两边都更容易把模糊信息读成危险，关系很容易在猜测与验证中反复过热。',
  },
  pursueWithdraw: {
    weight: 3.1,
    summary: '推进节奏错位，容易形成一追一逃。',
    reason:
      '一方更想靠近并推动关系，另一方更倾向后撤或降温，消耗会持续累积。',
  },
  closenessGap: {
    weight: 2.8,
    summary: '亲密需求差距过大，关系体感很难一致。',
    reason:
      '一方需要更多靠近与回应，另一方更需要距离与缓冲，日常相处容易长期失拍。',
  },
  securityGap: {
    weight: 2.4,
    summary: '安全感阈值差距较大，彼此容易觉得对方失真。',
    reason:
      '一方更警觉，另一方更松弛，双方会对同一件事给出完全不同的危险判断。',
  },
  expressionGap: {
    weight: 1.9,
    summary: '表达方式相冲，沟通成本偏高。',
    reason:
      '一方更外放，一方更压抑，情绪进入关系后更容易转化成误读而非修复。',
  },
  initiativeGap: {
    weight: 1.6,
    summary: '主动性落差较大，关系推进会失衡。',
    reason:
      '关系通常会由单方承担大部分推进成本，另一方则更容易显得迟缓、撤退或被动。',
  },
  highVolatility: {
    weight: 1.4,
    summary: '整体波动偏高，稳定性较弱。',
    reason:
      '至少一方的情绪或回应节奏波动较大，关系更难沉淀出可预测的稳定结构。',
  },
  default: {
    weight: 1,
    summary: '总体错配偏高，长期磨合成本会较重。',
    reason:
      '即便没有单一极端冲突，多个维度的小幅错位叠加后，仍会形成持续摩擦。',
  },
} as const satisfies Record<string, CompatibilityNarrativeFactorCopy>;
