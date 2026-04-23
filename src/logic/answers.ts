import { metaQuestionV3 } from '../copy/v3/questions';

/**
 * 当前运行时 quiz 的 META 题 id。v3 起 META id=0。
 * 旧版 v1/v2 的 META id（分别为 32、32）只出现在 legacy share-link 解码路径，不走此常量。
 */
export const metaQuestionId = metaQuestionV3.id;

/**
 * 前置题决定整套题的语境。若语境切换，则丢弃旧语境下的作答，
 * 只保留新的前置题答案，避免题干已变而答案仍沿用旧上下文。
 */
export function applyAnswerSelection(
  prev: Record<number, number>,
  qId: number,
  optionIdx: number,
): Record<number, number> {
  if (
    qId === metaQuestionId &&
    prev[qId] !== undefined &&
    prev[qId] !== optionIdx
  ) {
    return { [qId]: optionIdx };
  }
  return { ...prev, [qId]: optionIdx };
}
