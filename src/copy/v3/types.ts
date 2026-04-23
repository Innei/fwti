/**
 * FWTI v3 · 类型定义（纯白话网络梗版，题库全重写）
 *
 * 四维（学术锚 + 娱乐皮）：
 *   C · 接触（Contact · Gable approach-avoidance + BIS/BAS）        追 ↔ 避
 *   R · 调节（Regulation · Gross & John ERQ）                       暴 ↔ 闷
 *   A · 黏附（Attachment · ECR-R closeness）                        黏 ↔ 离
 *   S · 安全（Security · ECR-R anxiety）                            疑 ↔ 佛
 *
 * 约束：
 *   - 32 道主干题（每维 8 题），每维内 A 选项极性 +2 与 -2 各 4 题（4+/4-），
 *     避免答题者下意识"恒选 A"造成系统性偏向。
 *   - 3 档：A / B / C = ±2 / 0 / ∓2；5 档：A-E = +2 / +1 / 0 / -1 / -2。
 *   - 每题按 META 状态（dating / ambiguous / crush / solo）提供 4 份措辞 variant。
 *     variant 缺省时 fallback 到 base `text` 与 `options[i].text`。
 *   - 彩蛋题彻底废除，所有 hidden 判定走预定的维度 ratio 与选项 tag。
 */

export type DimV3 = 'C' | 'R' | 'A' | 'S' | 'META';
export type ScoringDim = Exclude<DimV3, 'META'>;
export type Scale = 3 | 5;

export type StatusKey = 'dating' | 'ambiguous' | 'crush' | 'solo';

/**
 * 选项 tag · 用于 hidden 预谓词（predicates）读取特定选项语义。
 *   - 'rat'  : 自贬自轻（RAT 鼠鼠恋人 触发源）。
 *   - 'void' : solo 真空证据（VOID 恋爱绝缘体 触发源）。
 *   - 'mad'  : 发疯现场特征选项（辅助 MAD 判定，非单点决断）。
 */
export type OptionTag = 'rat' | 'void' | 'mad';

export interface OptionV3 {
  label: string;
  text: string;
  score: number;
  tag?: OptionTag;
  /** META 题专用：选项指向的 status。 */
  meta?: StatusKey;
}

export type QuestionVariantV3 = {
  text?: string;
  options?: (string | null)[];
};

export interface QuestionV3 {
  id: number;
  /** v3 维度。字段名用 `dimension` 与 v2 `Question` duck-compatible。 */
  dimension: DimV3;
  scale: Scale;
  text: string;
  options: OptionV3[];
  variants?: Partial<Record<StatusKey, QuestionVariantV3>>;
}

/** 按当前 status 回落题干文案。 */
export function resolveQuestionText(
  q: QuestionV3,
  status: StatusKey | null,
): string {
  if (!status || !q.variants) return q.text;
  return q.variants[status]?.text ?? q.text;
}

/** 按当前 status 回落某选项文案。 */
export function resolveOptionText(
  q: QuestionV3,
  optionIdx: number,
  status: StatusKey | null,
): string {
  const fallback = q.options[optionIdx]?.text ?? '';
  if (!status || !q.variants) return fallback;
  const v = q.variants[status];
  if (!v?.options) return fallback;
  return v.options[optionIdx] ?? fallback;
}
