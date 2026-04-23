/**
 * FWTI v3 · 分享链接编解码
 *
 * 格式：`v3.<statusChar>.<payload>` · statusChar ∈ {d, a, c, s}
 *   payload = base64url(digit-or-dash × questionIdsV3.length)
 *
 * v3 / v2 / v1 以 hash 前缀分流：
 *   - 新链接走 v3 encoder。
 *   - 旧 `v2.*` 链接仍由 v2 decoder 解码并走 v2 scoring（legacy path）。
 *   - 无前缀链接走 v1 legacy。
 *
 * questionIdsV3 为 append-only：未来加题仅追加，不插入 / 不删除，避免破坏已生成链接。
 */

import { questionIdsV3 } from '../../copy/v3/questions';

export type StatusCharV3 = 'd' | 'a' | 'c' | 's';
export type RelationshipStatusV3 = 'dating' | 'ambiguous' | 'crush' | 'solo';

const STATUS_TO_CHAR: Record<RelationshipStatusV3, StatusCharV3> = {
  dating: 'd',
  ambiguous: 'a',
  crush: 'c',
  solo: 's',
};

const CHAR_TO_STATUS: Record<StatusCharV3, RelationshipStatusV3> = {
  d: 'dating',
  a: 'ambiguous',
  c: 'crush',
  s: 'solo',
};

export interface DecodedAnswersV3 {
  version: 3;
  answers: Record<number, number>;
  status: RelationshipStatusV3;
}

function b64urlEncode(plain: string): string {
  return btoa(plain).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(b64url: string): string | null {
  try {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    return atob(b64 + pad);
  } catch {
    return null;
  }
}

export function encodeAnswersV3(
  answers: Record<number, number>,
  status: RelationshipStatusV3,
  ids: readonly number[] = questionIdsV3,
): string {
  let payload = '';
  for (const id of ids) {
    const v = answers[id];
    payload += v === undefined ? '-' : String(v);
  }
  return `v3.${STATUS_TO_CHAR[status]}.${b64urlEncode(payload)}`;
}

export function decodeAnswersV3(encoded: string): DecodedAnswersV3 | null {
  const m = /^v3\.([dacs])\.([A-Za-z0-9_-]+)$/.exec(encoded);
  if (!m) return null;
  const status = CHAR_TO_STATUS[m[1] as StatusCharV3];
  const raw = b64urlDecode(m[2]);
  if (raw === null) return null;
  let payload = raw;
  if (payload.length < questionIdsV3.length) {
    payload = payload + '-'.repeat(questionIdsV3.length - payload.length);
  }
  if (payload.length !== questionIdsV3.length) return null;
  const answers: Record<number, number> = {};
  for (let i = 0; i < questionIdsV3.length; i += 1) {
    const c = payload[i];
    if (c === '-') continue;
    const n = Number(c);
    if (!Number.isInteger(n) || n < 0 || n > 9) return null;
    answers[questionIdsV3[i]] = n;
  }
  return { version: 3, answers, status };
}
