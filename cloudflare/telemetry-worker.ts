/// <reference types="@cloudflare/workers-types" />

import { questionByIdV3 } from '../src/copy/v3/questions';
import { personalitiesV3 } from '../src/copy/v3/personalities';
import { questionIndex as questionIndexV2Raw } from '../src/copy/questions';
import { personalities as personalitiesV2Raw } from '../src/copy/personalities';

// v3 ingest 只接受 v3 question id；v1/v2 旧链既不再触发 quiz_complete 也不写新表。
function lookupQuestionV3(id: number) {
  return questionByIdV3.get(id) ?? null;
}
function lookupQuestionV2(id: number) {
  return questionIndexV2Raw[id] ?? null;
}

const PERSONALITY_LABELS_V3: Record<string, string> = Object.fromEntries(
  Object.values(personalitiesV3).map((p) => [p.code, p.name]),
);
const PERSONALITY_LABELS_V2: Record<string, string> = Object.fromEntries(
  Object.values(personalitiesV2Raw).map((p) => [p.code, p.name]),
);

const DIMENSION_LABELS_V3: Record<string, string> = {
  C: '接触',
  R: '调节',
  A: '黏附',
  S: '安全',
  META: '前置',
};
const DIMENSION_LABELS_V2: Record<string, string> = {
  GD: '主动',
  ZR: '情绪',
  NL: '亲密',
  YF: '安全',
  META: '前置',
};

// 仪表盘版本配置：决定读哪一组表、列名、lookup 与 label 表。
type DashboardVersion = {
  label: string; // hero eyebrow / brand-sub
  brandSub: string; // top bar 右上角 small text
  basePath: '/dashboard' | '/v2'; // chip 链接
  apiPath: string; // JSON 链接
  tableEvents: string;
  tableAnswers: string;
  tableHidden: string;
  // [{ sqlCol, dimKey }] —— sqlCol 是 telemetry_events* 表的 score 列，dimKey 写入 scoreAverages
  scoreCols: Array<{ sql: string; key: string; label: string }>;
  lookup: (id: number) => { id: number; text: string; dimension: string; options: Array<{ label: string; text: string }> } | null;
  personalityLabels: Record<string, string>;
  dimensionLabels: Record<string, string>;
};

const VERSION_V3: DashboardVersion = {
  label: 'v3 (current)',
  brandSub: 'v3',
  basePath: '/dashboard',
  apiPath: '/api/v3/dashboard',
  tableEvents: 'telemetry_events_v3',
  tableAnswers: 'telemetry_answers_v3',
  tableHidden: 'telemetry_hidden_titles_v3',
  scoreCols: [
    { sql: 'score_c', key: 'C', label: 'C 接触' },
    { sql: 'score_r', key: 'R', label: 'R 调节' },
    { sql: 'score_a', key: 'A', label: 'A 黏附' },
    { sql: 'score_s', key: 'S', label: 'S 安全' },
  ],
  lookup: lookupQuestionV3,
  personalityLabels: PERSONALITY_LABELS_V3,
  dimensionLabels: DIMENSION_LABELS_V3,
};

const VERSION_V2: DashboardVersion = {
  label: 'v1 / v2 legacy',
  brandSub: 'v2 · legacy',
  basePath: '/v2',
  apiPath: '/api/v2/dashboard',
  tableEvents: 'telemetry_events',
  tableAnswers: 'telemetry_answers',
  tableHidden: 'telemetry_hidden_titles',
  scoreCols: [
    { sql: 'score_gd', key: 'GD', label: 'GD 主动' },
    { sql: 'score_zr', key: 'ZR', label: 'ZR 情绪' },
    { sql: 'score_nl', key: 'NL', label: 'NL 亲密' },
    { sql: 'score_yf', key: 'YF', label: 'YF 安全' },
  ],
  lookup: lookupQuestionV2,
  personalityLabels: PERSONALITY_LABELS_V2,
  dimensionLabels: DIMENSION_LABELS_V2,
};

type TelemetryEventType =
  | 'page_view'
  | 'quiz_start'
  | 'quiz_progress'
  | 'quiz_complete'
  | 'result_view'
  | 'share_image_open'
  | 'explain_ai_click';

type KVRow = {
  key: string;
  value: number;
};

type DashboardData = {
  generatedAt: string;
  days: number;
  overview: {
    pageViews: number;
    uniqueVisitors: number;
    uniqueSessions: number;
    quizStarts: number;
    quizCompletes: number;
    resultViews: number;
    shareResultViews: number;
    shareImageOpens: number;
    explainClicks: number;
    completionRate: number;
    avgCompletionMs: number;
  };
  funnel: KVRow[];
  pageViews: KVRow[];
  resultCodes: KVRow[];
  resultShares: KVRow[];
  statuses: KVRow[];
  hiddenTitles: KVRow[];
  wasteLevels: KVRow[];
  countries: KVRow[];
  devices: KVRow[];
  browsers: KVRow[];
  referrers: KVRow[];
  utmSources: KVRow[];
  scoreAverages: Record<string, number>;
  answerQuestions: Array<{
    questionId: number;
    text: string;
    dimension: string;
    tag: string;
    total: number;
    options: Array<{
      label: string;
      text: string;
      value: number;
      pct: number;
    }>;
  }>;
};

interface Env {
  TELEMETRY_DB: D1Database;
  DASHBOARD_USERNAME?: string;
  DASHBOARD_PASSWORD?: string;
}

type IncomingEvent = {
  id: string;
  visitorId: string;
  sessionId: string;
  type: TelemetryEventType;
  occurredAt: number;
  pageKey?: string;
  routePath?: string;
  referrer?: string;
  relationshipStatus?: string;
  resultCode?: string;
  displayCode?: string;
  isHidden: boolean;
  isLegacy: boolean;
  hiddenTitles: string[];
  wasteLevel?: number;
  retreatCount?: number;
  answeredCount?: number;
  mainTotal?: number;
  progressPct?: number;
  durationMs?: number;
  hashVersion?: number;
  source?: string;
  score?: {
    C?: number;
    R?: number;
    A?: number;
    S?: number;
  };
  answers: Array<{
    questionId: number;
    optionIndex: number;
  }>;
  detail?: Record<string, unknown>;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  viewport?: {
    bucket?: string;
  };
};

const EVENT_TYPES = new Set<TelemetryEventType>([
  'page_view',
  'quiz_start',
  'quiz_progress',
  'quiz_complete',
  'result_view',
  'share_image_open',
  'explain_ai_click',
]);

const PAGE_LABELS: Record<string, string> = {
  home: '首页',
  quiz: '答题页',
  result: '结果页',
  history: '历史页',
};

const STATUS_LABELS: Record<string, string> = {
  dating: '恋爱中',
  ambiguous: '暧昧中',
  crush: '心里有人',
  solo: '纯单身',
};

const FUNNEL_LABELS: Record<string, string> = {
  home_view: '首页访问',
  quiz_start: '进入答题',
  quiz_25: '答题 25%',
  quiz_50: '答题 50%',
  quiz_75: '答题 75%',
  quiz_complete: '提交结果',
  result_view: '结果页浏览',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (
      (url.pathname === '/api/v3/events' || url.pathname === '/api/events') &&
      request.method === 'POST'
    ) {
      // 旧 endpoint 与 v3 endpoint 共用同一 ingest，皆写入 v3 表。
      // 旧线上前端在 vercel 重部署前一直走 /api/events，此为 graceful 兼容。
      return handleEventIngest(request, env);
    }

    if (url.pathname === '/api/v3/dashboard' && request.method === 'GET') {
      if (!isDashboardAuthorized(request, env)) {
        return unauthorizedResponse();
      }
      const days = parseDays(url.searchParams.get('days'));
      const data = await loadDashboardData(env.TELEMETRY_DB, days, VERSION_V3);
      return json(data);
    }

    if (url.pathname === '/api/v2/dashboard' && request.method === 'GET') {
      if (!isDashboardAuthorized(request, env)) {
        return unauthorizedResponse();
      }
      const days = parseDays(url.searchParams.get('days'));
      const data = await loadDashboardData(env.TELEMETRY_DB, days, VERSION_V2);
      return json(data);
    }

    if (
      (url.pathname === '/' || url.pathname === '/dashboard') &&
      request.method === 'GET'
    ) {
      if (!isDashboardAuthorized(request, env)) {
        return unauthorizedResponse();
      }
      const days = parseDays(url.searchParams.get('days'));
      const data = await loadDashboardData(env.TELEMETRY_DB, days, VERSION_V3);
      return new Response(renderDashboardHtml(data, VERSION_V3), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }

    if (url.pathname === '/v2' && request.method === 'GET') {
      if (!isDashboardAuthorized(request, env)) {
        return unauthorizedResponse();
      }
      const days = parseDays(url.searchParams.get('days'));
      const data = await loadDashboardData(env.TELEMETRY_DB, days, VERSION_V2);
      return new Response(renderDashboardHtml(data, VERSION_V2), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }

    if (url.pathname === '/healthz' && request.method === 'GET') {
      return json({
        ok: true,
        now: new Date().toISOString(),
      });
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleEventIngest(request: Request, env: Env): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400, corsHeaders());
  }

  const event = normalizeIncomingEvent(rawBody);
  if (!event) {
    return json({ ok: false, error: 'invalid_payload' }, 400, corsHeaders());
  }

  const cf = request.cf;
  const ua = request.headers.get('user-agent') ?? '';
  const referrerHost = getReferrerHost(event.referrer);
  const uaInfo = parseUserAgent(ua);
  const detailsJson = event.detail ? safeJsonStringify(event.detail, 4000) : null;

  const eventStmt = env.TELEMETRY_DB.prepare(
    `INSERT OR IGNORE INTO telemetry_events_v3 (
      id,
      visitor_id,
      session_id,
      event_type,
      occurred_at,
      page_key,
      route_path,
      referrer_host,
      relationship_status,
      result_code,
      display_code,
      is_hidden,
      is_legacy,
      hidden_titles_count,
      waste_level,
      retreat_count,
      answered_count,
      main_total,
      progress_pct,
      duration_ms,
      hash_version,
      source,
      score_c,
      score_r,
      score_a,
      score_s,
      viewport_bucket,
      device_type,
      browser,
      os,
      country,
      colo,
      utm_source,
      utm_medium,
      utm_campaign,
      detail_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    event.id,
    event.visitorId,
    event.sessionId,
    event.type,
    event.occurredAt,
    event.pageKey ?? null,
    event.routePath ?? null,
    referrerHost,
    event.relationshipStatus ?? null,
    event.resultCode ?? null,
    event.displayCode ?? null,
    event.isHidden ? 1 : 0,
    event.isLegacy ? 1 : 0,
    event.hiddenTitles.length,
    event.wasteLevel ?? null,
    event.retreatCount ?? null,
    event.answeredCount ?? null,
    event.mainTotal ?? null,
    event.progressPct ?? null,
    event.durationMs ?? null,
    event.hashVersion ?? null,
    event.source ?? null,
    toFiniteNumber(event.score?.C),
    toFiniteNumber(event.score?.R),
    toFiniteNumber(event.score?.A),
    toFiniteNumber(event.score?.S),
    event.viewport?.bucket ?? null,
    uaInfo.deviceType,
    uaInfo.browser,
    uaInfo.os,
    cf?.country ?? null,
    cf?.colo ?? null,
    event.utm?.source ?? null,
    event.utm?.medium ?? null,
    event.utm?.campaign ?? null,
    detailsJson,
  );

  const statements = [eventStmt];

  if (event.type === 'quiz_complete') {
    for (const answer of event.answers) {
      const question = lookupQuestionV3(answer.questionId);
      if (!question) continue;
      statements.push(
        env.TELEMETRY_DB.prepare(
          `INSERT OR IGNORE INTO telemetry_answers_v3 (
            submission_id,
            visitor_id,
            session_id,
            occurred_at,
            relationship_status,
            question_id,
            question_dimension,
            question_tag,
            option_index
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          event.id,
          event.visitorId,
          event.sessionId,
          event.occurredAt,
          event.relationshipStatus ?? null,
          question.id,
          question.dimension,
          '',
          answer.optionIndex,
        ),
      );
    }

    for (const titleName of event.hiddenTitles) {
      statements.push(
        env.TELEMETRY_DB.prepare(
          `INSERT OR IGNORE INTO telemetry_hidden_titles_v3 (
            submission_id,
            visitor_id,
            session_id,
            occurred_at,
            title_name
          ) VALUES (?, ?, ?, ?, ?)`,
        ).bind(
          event.id,
          event.visitorId,
          event.sessionId,
          event.occurredAt,
          titleName,
        ),
      );
    }
  }

  await env.TELEMETRY_DB.batch(statements);
  return json({ ok: true }, 200, corsHeaders());
}

function normalizeIncomingEvent(raw: unknown): IncomingEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const type = toText(source.type, 48) as TelemetryEventType | null;
  if (!type || !EVENT_TYPES.has(type)) return null;

  const visitorId = toText(source.visitorId, 128);
  const sessionId = toText(source.sessionId, 128);
  if (!visitorId || !sessionId) return null;

  const answers = Array.isArray(source.answers)
    ? source.answers.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const answer = item as Record<string, unknown>;
        const questionId = toInt(answer.questionId, 1, 10_000);
        const optionIndex = toInt(answer.optionIndex, 0, 9);
        if (questionId === null || optionIndex === null) return [];
        if (!lookupQuestionV3(questionId)) return [];
        return [{ questionId, optionIndex }];
      })
    : [];

  const hiddenTitles = Array.isArray(source.hiddenTitles)
    ? source.hiddenTitles.flatMap((item) => {
        const value = toText(item, 120);
        return value ? [value] : [];
      })
    : [];

  return {
    id: toText(source.id, 128) ?? crypto.randomUUID(),
    visitorId,
    sessionId,
    type,
    occurredAt: toInt(source.occurredAt, 1, 9_999_999_999_999) ?? Date.now(),
    pageKey: toText(source.pageKey, 32) ?? undefined,
    routePath: toText(source.routePath, 256) ?? undefined,
    referrer: toText(source.referrer, 1024) ?? undefined,
    relationshipStatus: toText(source.relationshipStatus, 32) ?? undefined,
    resultCode: toText(source.resultCode, 32) ?? undefined,
    displayCode: toText(source.displayCode, 32) ?? undefined,
    isHidden: !!source.isHidden,
    isLegacy: !!source.isLegacy,
    hiddenTitles,
    wasteLevel: toInt(source.wasteLevel, 0, 5) ?? undefined,
    retreatCount: toInt(source.retreatCount, 0, 10_000) ?? undefined,
    answeredCount: toInt(source.answeredCount, 0, 1000) ?? undefined,
    mainTotal: toInt(source.mainTotal, 0, 1000) ?? undefined,
    progressPct: toInt(source.progressPct, 0, 100) ?? undefined,
    durationMs: toInt(source.durationMs, 0, 86_400_000) ?? undefined,
    hashVersion: toInt(source.hashVersion, 1, 9) ?? undefined,
    source: toText(source.source, 64) ?? undefined,
    score: toScore(source.score),
    answers,
    detail: isPlainObject(source.detail)
      ? (source.detail as Record<string, unknown>)
      : undefined,
    utm: isPlainObject(source.utm)
      ? {
          source: toText((source.utm as Record<string, unknown>).source, 120) ?? undefined,
          medium: toText((source.utm as Record<string, unknown>).medium, 120) ?? undefined,
          campaign:
            toText((source.utm as Record<string, unknown>).campaign, 120) ?? undefined,
        }
      : undefined,
    viewport: isPlainObject(source.viewport)
      ? {
          bucket:
            toText((source.viewport as Record<string, unknown>).bucket, 32) ?? undefined,
        }
      : undefined,
  };
}

async function loadDashboardData(
  db: D1Database,
  days: number,
  v: DashboardVersion,
): Promise<DashboardData> {
  const fromTs = Date.now() - days * 24 * 60 * 60 * 1000;

  const [
    overview,
    funnel,
    pageViews,
    resultCodes,
    resultShares,
    statuses,
    hiddenTitles,
    wasteLevels,
    countries,
    devices,
    browsers,
    referrers,
    utmSources,
    scoreAverages,
    answerRows,
  ] = await Promise.all([
    fetchOverview(db, fromTs, v),
    fetchFunnelRows(db, fromTs, v),
    fetchRows(
      db,
      `SELECT COALESCE(page_key, '(unknown)') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'page_view'
        GROUP BY 1
        ORDER BY value DESC`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(result_code, '(unknown)') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'quiz_complete'
        GROUP BY 1
        ORDER BY value DESC`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(result_code, '(unknown)') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'result_view' AND source = 'share_link'
        GROUP BY 1
        ORDER BY value DESC`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(relationship_status, '(unknown)') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'quiz_complete'
        GROUP BY 1
        ORDER BY value DESC`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT title_name AS key, COUNT(*) AS value
         FROM ${v.tableHidden}
        WHERE occurred_at >= ?
        GROUP BY 1
        ORDER BY value DESC`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(CAST(waste_level AS TEXT), '(unknown)') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'quiz_complete'
        GROUP BY 1
        ORDER BY key ASC`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(country, 'Unknown') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'page_view'
        GROUP BY 1
        ORDER BY value DESC
        LIMIT 12`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(device_type, 'unknown') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'page_view'
        GROUP BY 1
        ORDER BY value DESC`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(browser, 'unknown') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'page_view'
        GROUP BY 1
        ORDER BY value DESC
        LIMIT 12`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(NULLIF(referrer_host, ''), '(direct)') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'page_view'
        GROUP BY 1
        ORDER BY value DESC
        LIMIT 12`,
      [fromTs],
    ),
    fetchRows(
      db,
      `SELECT COALESCE(NULLIF(utm_source, ''), '(direct)') AS key, COUNT(*) AS value
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'page_view'
        GROUP BY 1
        ORDER BY value DESC
        LIMIT 12`,
      [fromTs],
    ),
    fetchScoreAverages(db, fromTs, v),
    fetchAnswerRows(db, fromTs, v),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    days,
    overview,
    funnel,
    pageViews,
    resultCodes,
    resultShares,
    statuses,
    hiddenTitles,
    wasteLevels,
    countries,
    devices,
    browsers,
    referrers,
    utmSources,
    scoreAverages,
    answerQuestions: groupAnswerRows(answerRows, v),
  };
}

async function fetchOverview(db: D1Database, fromTs: number, v: DashboardVersion) {
  const row =
    (await db
      .prepare(
        `SELECT
          SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS page_views,
          COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN visitor_id END) AS unique_visitors,
          COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) AS unique_sessions,
          SUM(CASE WHEN event_type = 'quiz_start' THEN 1 ELSE 0 END) AS quiz_starts,
          SUM(CASE WHEN event_type = 'quiz_complete' THEN 1 ELSE 0 END) AS quiz_completes,
          SUM(CASE WHEN event_type = 'result_view' THEN 1 ELSE 0 END) AS result_views,
          SUM(CASE WHEN event_type = 'result_view' AND source = 'share_link' THEN 1 ELSE 0 END) AS share_result_views,
          SUM(CASE WHEN event_type = 'share_image_open' THEN 1 ELSE 0 END) AS share_image_opens,
          SUM(CASE WHEN event_type = 'explain_ai_click' THEN 1 ELSE 0 END) AS explain_clicks,
          AVG(CASE WHEN event_type = 'quiz_complete' THEN duration_ms END) AS avg_completion_ms
         FROM ${v.tableEvents}
        WHERE occurred_at >= ?`,
      )
      .bind(fromTs)
      .first<{
        page_views?: number;
        unique_visitors?: number;
        unique_sessions?: number;
        quiz_starts?: number;
        quiz_completes?: number;
        result_views?: number;
        share_result_views?: number;
        share_image_opens?: number;
        explain_clicks?: number;
        avg_completion_ms?: number;
      }>()) ?? {};

  const quizStarts = row.quiz_starts ?? 0;
  const quizCompletes = row.quiz_completes ?? 0;

  return {
    pageViews: row.page_views ?? 0,
    uniqueVisitors: row.unique_visitors ?? 0,
    uniqueSessions: row.unique_sessions ?? 0,
    quizStarts,
    quizCompletes,
    resultViews: row.result_views ?? 0,
    shareResultViews: row.share_result_views ?? 0,
    shareImageOpens: row.share_image_opens ?? 0,
    explainClicks: row.explain_clicks ?? 0,
    completionRate: quizStarts > 0 ? quizCompletes / quizStarts : 0,
    avgCompletionMs: Math.round(row.avg_completion_ms ?? 0),
  };
}

async function fetchFunnelRows(
  db: D1Database,
  fromTs: number,
  v: DashboardVersion,
): Promise<KVRow[]> {
  const row =
    (await db
      .prepare(
        `SELECT
          COUNT(DISTINCT CASE
            WHEN event_type = 'page_view' AND page_key = 'home' THEN session_id
          END) AS home_view,
          COUNT(DISTINCT CASE
            WHEN event_type = 'quiz_start' THEN session_id
          END) AS quiz_start,
          COUNT(DISTINCT CASE
            WHEN event_type = 'quiz_progress' AND progress_pct = 25 THEN session_id
          END) AS quiz_25,
          COUNT(DISTINCT CASE
            WHEN event_type = 'quiz_progress' AND progress_pct = 50 THEN session_id
          END) AS quiz_50,
          COUNT(DISTINCT CASE
            WHEN event_type = 'quiz_progress' AND progress_pct = 75 THEN session_id
          END) AS quiz_75,
          COUNT(DISTINCT CASE
            WHEN event_type = 'quiz_complete' THEN session_id
          END) AS quiz_complete,
          COUNT(DISTINCT CASE
            WHEN event_type = 'result_view' THEN session_id
          END) AS result_view
         FROM ${v.tableEvents}
        WHERE occurred_at >= ?`,
      )
      .bind(fromTs)
      .first<Record<string, number | null>>()) ?? {};

  return [
    'home_view',
    'quiz_start',
    'quiz_25',
    'quiz_50',
    'quiz_75',
    'quiz_complete',
    'result_view',
  ].map((key) => ({
    key,
    value: row[key] ?? 0,
  }));
}

async function fetchScoreAverages(
  db: D1Database,
  fromTs: number,
  v: DashboardVersion,
): Promise<Record<string, number>> {
  const selects = v.scoreCols.map((c) => `AVG(${c.sql}) AS ${c.sql}`).join(', ');
  const row =
    (await db
      .prepare(
        `SELECT ${selects}
         FROM ${v.tableEvents}
        WHERE occurred_at >= ? AND event_type = 'quiz_complete'`,
      )
      .bind(fromTs)
      .first<Record<string, number | null>>()) ?? {};
  const out: Record<string, number> = {};
  for (const col of v.scoreCols) {
    out[col.key] = round2(row[col.sql] ?? 0);
  }
  return out;
}

async function fetchAnswerRows(
  db: D1Database,
  fromTs: number,
  v: DashboardVersion,
) {
  const result = await db
    .prepare(
      `SELECT question_id, option_index, COUNT(*) AS value
         FROM ${v.tableAnswers}
        WHERE occurred_at >= ?
        GROUP BY question_id, option_index
        ORDER BY question_id ASC, option_index ASC`,
    )
    .bind(fromTs)
    .all<{ question_id: number; option_index: number; value: number }>();
  return result.results ?? [];
}

function groupAnswerRows(
  rows: Array<{ question_id: number; option_index: number; value: number }>,
  v: DashboardVersion,
) {
  const grouped = new Map<number, Array<{ optionIndex: number; value: number }>>();
  for (const row of rows) {
    const current = grouped.get(row.question_id) ?? [];
    current.push({
      optionIndex: row.option_index,
      value: row.value,
    });
    grouped.set(row.question_id, current);
  }

  return Array.from(grouped.entries())
    .map(([questionId, optionRows]) => {
      const question = v.lookup(questionId);
      if (!question) return null;
      const total = optionRows.reduce((sum, row) => sum + row.value, 0);
      return {
        questionId,
        text: question.text,
        dimension: question.dimension,
        tag: '',
        total,
        options: optionRows.map((row) => ({
          label: question.options[row.optionIndex]?.label ?? `#${row.optionIndex}`,
          text: question.options[row.optionIndex]?.text ?? '(unknown)',
          value: row.value,
          pct: total > 0 ? row.value / total : 0,
        })),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

async function fetchRows(
  db: D1Database,
  sql: string,
  binds: unknown[],
): Promise<KVRow[]> {
  const result = await db.prepare(sql).bind(...binds).all<{ key: string; value: number }>();
  return (result.results ?? []).map((row) => ({
    key: row.key,
    value: row.value,
  }));
}

function renderDashboardHtml(data: DashboardData, v: DashboardVersion): string {
  const otherVersion = v.basePath === '/v2' ? VERSION_V3 : VERSION_V2;
  const switchLink = `<a class="chip chip-mono" href="${otherVersion.basePath}?days=${data.days}">${otherVersion.brandSub.toUpperCase()}</a>`;
  const scoreBoxes = v.scoreCols
    .map((c) => renderScoreBox(c.label, data.scoreAverages[c.key] ?? 0))
    .join('');
  const scoreSubLabels = v.scoreCols.map((c) => c.label.split(' ').slice(1).join(' ') || c.label).join(' / ');
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FWTI Telemetry</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg: #ffffff;
        --surface: #ffffff;
        --text: #171717;
        --muted: #4d4d4d;
        --muted-2: #666666;
        --muted-3: #808080;
        --line: #ebebeb;
        --gray-50: #fafafa;
        --link: #0072f5;
        --focus: hsla(212, 100%, 48%, 1);
        --develop: #0a72ef;
        --preview: #de1d8d;
        --ship: #ff5b4f;
        --badge-bg: #ebf5ff;
        --badge-text: #0068d6;
        --ring-border: rgba(0, 0, 0, 0.08) 0px 0px 0px 1px;
        --light-ring: rgb(235, 235, 235) 0px 0px 0px 1px;
        --card-shadow:
          rgba(0, 0, 0, 0.08) 0px 0px 0px 1px,
          rgba(0, 0, 0, 0.04) 0px 2px 2px,
          rgba(0, 0, 0, 0.04) 0px 8px 8px -8px,
          #fafafa 0px 0px 0px 1px inset;
      }
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: var(--bg);
        color: var(--text);
        font-family:
          'Geist', Arial, 'Apple Color Emoji', 'Segoe UI Emoji',
          'Segoe UI Symbol';
        font-feature-settings: 'liga' 1;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      a { color: var(--link); text-decoration: none; }
      a:hover { text-decoration: underline; }
      :focus-visible {
        outline: 2px solid var(--focus);
        outline-offset: 2px;
        border-radius: 6px;
      }
      .mono {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, 'Roboto Mono', Menlo,
          Monaco, 'Liberation Mono', 'DejaVu Sans Mono', 'Courier New';
        font-feature-settings: 'liga' 1, 'tnum' 1;
      }

      header.topbar {
        position: sticky;
        top: 0;
        z-index: 10;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: saturate(180%) blur(10px);
        box-shadow: var(--ring-border);
      }
      .topbar-inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 14px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.32px;
        color: var(--text);
      }
      .brand-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--text);
      }
      .brand-sub {
        font-size: 12px;
        font-weight: 500;
        color: var(--muted-2);
        letter-spacing: 0;
        text-transform: uppercase;
      }
      .top-actions { display: flex; align-items: center; gap: 8px; }

      .shell {
        max-width: 1200px;
        margin: 0 auto;
        padding: 56px 24px 96px;
      }

      .hero {
        margin-bottom: 64px;
      }
      .hero-eyebrow {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0;
        text-transform: uppercase;
        color: var(--muted-2);
        margin-bottom: 16px;
      }
      .hero-title {
        margin: 0 0 16px;
        font-size: 48px;
        font-weight: 600;
        line-height: 1.05;
        letter-spacing: -2.4px;
        color: var(--text);
      }
      .hero-sub {
        margin: 0;
        max-width: 720px;
        font-size: 20px;
        line-height: 1.6;
        color: var(--muted);
      }
      .hero-controls {
        margin-top: 28px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        height: 32px;
        padding: 0 12px;
        border-radius: 9999px;
        background: var(--surface);
        color: var(--text);
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        box-shadow: var(--light-ring);
        transition: box-shadow 0.15s ease;
      }
      .chip:hover {
        text-decoration: none;
        box-shadow: rgba(0, 0, 0, 0.18) 0px 0px 0px 1px;
      }
      .chip.is-active {
        background: var(--text);
        color: #fff;
        box-shadow: none;
      }
      .chip-mono {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        height: 22px;
        padding: 0 10px;
        border-radius: 9999px;
        background: var(--badge-bg);
        color: var(--badge-text);
        font-size: 12px;
        font-weight: 500;
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
      }
      .meta-strip {
        margin-top: 32px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0;
        box-shadow: var(--ring-border);
        border-radius: 8px;
        background: var(--surface);
        overflow: hidden;
      }
      .meta-cell {
        padding: 18px 20px;
        box-shadow: inset -1px 0 0 var(--line);
      }
      .meta-cell:last-child { box-shadow: none; }
      .meta-cell-label {
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--muted-2);
        margin-bottom: 8px;
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
      }
      .meta-cell-value {
        font-size: 16px;
        font-weight: 500;
        color: var(--text);
        letter-spacing: -0.32px;
      }

      section.section { margin-top: 56px; }
      .section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
      }
      .section-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        letter-spacing: -0.96px;
        color: var(--text);
      }
      .section-meta {
        font-size: 14px;
        color: var(--muted-2);
      }

      .card {
        background: var(--surface);
        border-radius: 8px;
        box-shadow: var(--card-shadow);
      }
      .card-pad { padding: 24px; }
      .card-header {
        padding: 20px 24px 16px;
        box-shadow: inset 0 -1px 0 var(--line);
      }
      .card-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -0.32px;
        color: var(--text);
      }
      .card-sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--muted-2);
      }
      .card-body { padding: 20px 24px 24px; }

      .grid { display: grid; gap: 20px; }
      .grid-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
      .col-12 { grid-column: span 12; }
      .col-8 { grid-column: span 8; }
      .col-6 { grid-column: span 6; }
      .col-4 { grid-column: span 4; }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0;
        box-shadow: var(--ring-border);
        border-radius: 8px;
        background: var(--surface);
        overflow: hidden;
      }
      .kpi-cell {
        padding: 24px;
        box-shadow: inset -1px 0 0 var(--line);
      }
      .kpi-cell:last-child { box-shadow: none; }
      .kpi-label {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--muted-2);
        margin-bottom: 14px;
      }
      .kpi-value {
        font-size: 32px;
        font-weight: 600;
        line-height: 1.1;
        letter-spacing: -1.28px;
        color: var(--text);
        font-feature-settings: 'tnum' 1;
      }
      .kpi-note {
        margin-top: 10px;
        font-size: 13px;
        color: var(--muted-2);
        line-height: 1.45;
      }

      .funnel-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 0;
        box-shadow: var(--ring-border);
        border-radius: 8px;
        overflow: hidden;
      }
      .funnel-step {
        padding: 20px 18px;
        background: var(--surface);
        box-shadow: inset -1px 0 0 var(--line);
        position: relative;
      }
      .funnel-step:last-child { box-shadow: none; }
      .funnel-step .label {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--muted-2);
        margin-bottom: 10px;
      }
      .funnel-step .value {
        font-size: 24px;
        font-weight: 600;
        letter-spacing: -0.96px;
        color: var(--text);
        font-feature-settings: 'tnum' 1;
      }

      .bar-list { display: grid; gap: 10px; }
      .bar-row {
        display: grid;
        grid-template-columns: minmax(120px, 200px) minmax(0, 1fr) 64px;
        gap: 16px;
        align-items: center;
      }
      .bar-label {
        font-size: 14px;
        color: var(--text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .bar-track {
        position: relative;
        height: 6px;
        border-radius: 9999px;
        background: var(--gray-50);
        box-shadow: var(--ring-border);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 9999px;
        background: var(--text);
      }
      .bar-value {
        text-align: right;
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'tnum' 1;
        font-size: 13px;
        color: var(--muted);
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }
      .table th, .table td {
        padding: 12px 0;
        text-align: left;
        font-size: 14px;
        box-shadow: inset 0 -1px 0 var(--line);
      }
      .table tr:last-child td { box-shadow: none; }
      .table th {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--muted-2);
        letter-spacing: 0;
      }
      .table td {
        color: var(--text);
        vertical-align: top;
      }
      .table .tnum {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'tnum' 1;
        text-align: right;
        color: var(--muted);
      }

      .score-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0;
        box-shadow: var(--ring-border);
        border-radius: 8px;
        overflow: hidden;
      }
      .score-cell {
        padding: 20px;
        background: var(--surface);
        box-shadow: inset -1px 0 0 var(--line);
      }
      .score-cell:last-child { box-shadow: none; }
      .score-cell .name {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--muted-2);
        margin-bottom: 10px;
      }
      .score-cell .alias {
        font-size: 11px;
        color: var(--muted-3);
        margin-left: 6px;
        text-transform: none;
      }
      .score-cell .value {
        font-size: 28px;
        font-weight: 600;
        letter-spacing: -0.96px;
        color: var(--text);
        font-feature-settings: 'tnum' 1;
      }
      .score-cell .delta {
        margin-top: 6px;
        font-size: 12px;
        color: var(--muted-2);
      }

      .answer-stack { display: grid; gap: 0; }
      .answer-card {
        padding: 24px;
        box-shadow: inset 0 -1px 0 var(--line);
      }
      .answer-card:last-child { box-shadow: none; }
      .answer-head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .answer-id {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        color: var(--muted-2);
        margin-right: 10px;
      }
      .answer-title {
        font-size: 16px;
        font-weight: 500;
        letter-spacing: -0.32px;
        color: var(--text);
      }
      .answer-meta {
        font-family:
          'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-feature-settings: 'liga' 1, 'tnum' 1;
        font-size: 12px;
        color: var(--muted-2);
        text-transform: uppercase;
      }

      .empty {
        margin: 0;
        padding: 24px 0;
        font-size: 14px;
        color: var(--muted-2);
        text-align: center;
      }

      footer.footer {
        max-width: 1200px;
        margin: 80px auto 0;
        padding: 32px 24px;
        box-shadow: inset 0 1px 0 var(--line);
        font-size: 13px;
        color: var(--muted-2);
        display: flex;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      @media (max-width: 1024px) {
        .hero-title { font-size: 40px; letter-spacing: -2px; }
        .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .kpi-cell { box-shadow: inset -1px -1px 0 var(--line); }
        .kpi-cell:nth-child(2n) { box-shadow: inset 0 -1px 0 var(--line); }
        .kpi-cell:nth-last-child(-n+2) { box-shadow: inset -1px 0 0 var(--line); }
        .kpi-cell:last-child { box-shadow: none; }
        .funnel-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .funnel-step { box-shadow: inset -1px -1px 0 var(--line); }
        .col-8, .col-6, .col-4 { grid-column: span 12; }
        .meta-strip { grid-template-columns: 1fr; }
        .meta-cell { box-shadow: inset 0 -1px 0 var(--line); }
        .meta-cell:last-child { box-shadow: none; }
      }
      @media (max-width: 640px) {
        .shell { padding: 32px 16px 64px; }
        .hero { margin-bottom: 40px; }
        .hero-title { font-size: 32px; letter-spacing: -1.28px; }
        .hero-sub { font-size: 16px; }
        .kpi-grid { grid-template-columns: 1fr; }
        .kpi-cell { box-shadow: inset 0 -1px 0 var(--line); }
        .kpi-cell:last-child { box-shadow: none; }
        .funnel-grid { grid-template-columns: 1fr; }
        .score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .score-cell { box-shadow: inset -1px -1px 0 var(--line); }
        .score-cell:nth-child(2n) { box-shadow: inset 0 -1px 0 var(--line); }
        .bar-row { grid-template-columns: minmax(0, 1fr) 64px; row-gap: 6px; }
        .bar-label { grid-column: span 2; }
        .answer-head { flex-direction: column; align-items: flex-start; gap: 8px; }
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="/dashboard?days=${data.days}">
          <span class="brand-dot" aria-hidden="true"></span>
          <span>FWTI Telemetry</span>
          <span class="brand-sub mono">${escapeHtml(v.brandSub)}</span>
        </a>
        <div class="top-actions">
          ${switchLink}
          <a class="chip chip-mono" href="${v.apiPath}?days=${data.days}">JSON</a>
        </div>
      </div>
    </header>

    <main class="shell">
      <section class="hero">
        <div class="hero-eyebrow mono">Last ${data.days} days · ${escapeHtml(formatDateTime(data.generatedAt))}</div>
        <h1 class="hero-title">FWTI 遥测面板</h1>
        <p class="hero-sub">
          聚合访问、答题漏斗、结果分布与题目选项分布——观流失、察偏斜、量传播。
        </p>
        <div class="hero-controls" role="group" aria-label="时间窗口">
          ${renderDayChip(1, data.days)}
          ${renderDayChip(7, data.days)}
          ${renderDayChip(30, data.days)}
        </div>
        <div class="meta-strip">
          <div class="meta-cell">
            <div class="meta-cell-label">Window</div>
            <div class="meta-cell-value mono">${data.days}d</div>
          </div>
          <div class="meta-cell">
            <div class="meta-cell-label">Generated</div>
            <div class="meta-cell-value mono">${escapeHtml(formatDateTime(data.generatedAt))}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-cell-label">Endpoint</div>
            <div class="meta-cell-value mono">POST /api/events</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">核心概览</h2>
          <span class="section-meta">Overview</span>
        </div>
        <div class="kpi-grid">
          ${renderKpi('Page Views', formatInteger(data.overview.pageViews), `访客 ${formatInteger(data.overview.uniqueVisitors)} · 会话 ${formatInteger(data.overview.uniqueSessions)}`)}
          ${renderKpi('Quiz Starts', formatInteger(data.overview.quizStarts), `提交 ${formatInteger(data.overview.quizCompletes)}`)}
          ${renderKpi('Completion', formatPercent(data.overview.completionRate), 'quiz_start → quiz_complete')}
          ${renderKpi('Avg Duration', formatDuration(data.overview.avgCompletionMs), '仅统计完成答卷')}
          ${renderKpi('Shares', formatInteger(data.overview.shareResultViews), `分享图 ${formatInteger(data.overview.shareImageOpens)} · AI 解读 ${formatInteger(data.overview.explainClicks)}`)}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">答题漏斗</h2>
          <span class="section-meta">Funnel</span>
        </div>
        <div class="funnel-grid">
          ${data.funnel
            .map(
              (row) => `<div class="funnel-step">
                <div class="label">${escapeHtml(FUNNEL_LABELS[row.key] ?? row.key)}</div>
                <div class="value">${formatInteger(row.value)}</div>
              </div>`,
            )
            .join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">分布</h2>
          <span class="section-meta">Distributions</span>
        </div>
        <div class="grid grid-12">
          <div class="card col-6">
            <div class="card-header">
              <h3 class="card-title">访问页面</h3>
              <p class="card-sub">Page views by route</p>
            </div>
            <div class="card-body">
              ${renderBarList(data.pageViews, (row) => PAGE_LABELS[row.key] ?? row.key)}
            </div>
          </div>

          <div class="card col-6">
            <div class="card-header">
              <h3 class="card-title">答卷结果分布</h3>
              <p class="card-sub">Personality codes</p>
            </div>
            <div class="card-body">
              ${renderBarList(data.resultCodes, (row) =>
                v.personalityLabels[row.key]
                  ? `${row.key} · ${v.personalityLabels[row.key]}`
                  : row.key,
              )}
            </div>
          </div>

          <div class="card col-4">
            <div class="card-header">
              <h3 class="card-title">关系状态</h3>
              <p class="card-sub">META status</p>
            </div>
            <div class="card-body">
              ${renderBarList(data.statuses, (row) => STATUS_LABELS[row.key] ?? row.key)}
            </div>
          </div>

          <div class="card col-4">
            <div class="card-header">
              <h3 class="card-title">隐藏称号</h3>
              <p class="card-sub">Hidden titles unlocked</p>
            </div>
            <div class="card-body">
              ${renderBarList(data.hiddenTitles, (row) => row.key)}
            </div>
          </div>

          <div class="card col-4">
            <div class="card-header">
              <h3 class="card-title">分享结果来源</h3>
              <p class="card-sub">Share traffic sources</p>
            </div>
            <div class="card-body">
              ${renderBarList(data.resultShares, (row) =>
                v.personalityLabels[row.key]
                  ? `${row.key} · ${v.personalityLabels[row.key]}`
                  : row.key,
              )}
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">设备 · 地域 · 来源</h2>
          <span class="section-meta">Audience</span>
        </div>
        <div class="grid grid-12">
          <div class="card col-6">
            <div class="card-header">
              <h3 class="card-title">设备 / 浏览器</h3>
              <p class="card-sub">Device class &amp; browser</p>
            </div>
            <div class="card-body">
              <div style="display:grid; gap:24px;">
                <div>
                  <div class="kpi-label" style="margin-bottom:10px;">Devices</div>
                  ${renderBarList(data.devices, (row) => row.key)}
                </div>
                <div>
                  <div class="kpi-label" style="margin-bottom:10px;">Browsers</div>
                  ${renderInlineTable(data.browsers)}
                </div>
              </div>
            </div>
          </div>

          <div class="card col-6">
            <div class="card-header">
              <h3 class="card-title">地域 &amp; 引荐</h3>
              <p class="card-sub">Country, referrer, UTM</p>
            </div>
            <div class="card-body">
              <div style="display:grid; gap:24px;">
                <div>
                  <div class="kpi-label" style="margin-bottom:10px;">Country</div>
                  ${renderBarList(data.countries, (row) => row.key)}
                </div>
                <div>
                  <div class="kpi-label" style="margin-bottom:10px;">Referrer</div>
                  ${renderBarList(data.referrers, (row) => row.key)}
                </div>
                <div>
                  <div class="kpi-label" style="margin-bottom:10px;">UTM Source</div>
                  ${renderBarList(data.utmSources, (row) => row.key)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">维度信号</h2>
          <span class="section-meta">Dimensional signals</span>
        </div>
        <div class="grid grid-12">
          <div class="card col-6">
            <div class="card-header">
              <h3 class="card-title">废物等级分布</h3>
              <p class="card-sub">Waste level (1–5)</p>
            </div>
            <div class="card-body">
              ${renderBarList(data.wasteLevels, (row) => `Lv ${row.key} / 5`)}
            </div>
          </div>

          <div class="card col-6">
            <div class="card-header">
              <h3 class="card-title">四维平均分</h3>
              <p class="card-sub">Mean ratio per dimension · ${escapeHtml(scoreSubLabels)}</p>
            </div>
            <div class="card-body">
              <div class="score-grid">
                ${scoreBoxes}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2 class="section-title">题目选项分布</h2>
          <span class="section-meta">Per-question option breakdown</span>
        </div>
        <div class="card">
          <div class="answer-stack">
            ${renderAnswerQuestions(data.answerQuestions, v)}
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <span>FWTI Telemetry · ${escapeHtml(formatDateTime(data.generatedAt))}</span>
      <span class="mono">window=${data.days}d</span>
    </footer>
  </body>
</html>`;
}

function renderDayChip(days: number, activeDays: number): string {
  const active = days === activeDays;
  return `<a class="chip${active ? ' is-active' : ''}" href="/dashboard?days=${days}" aria-pressed="${active}">${days}d</a>`;
}

function renderKpi(label: string, value: string, note: string): string {
  return `<div class="kpi-cell">
    <div class="kpi-label">${escapeHtml(label)}</div>
    <div class="kpi-value">${escapeHtml(value)}</div>
    <div class="kpi-note">${escapeHtml(note)}</div>
  </div>`;
}

function renderBarList(
  rows: KVRow[],
  label: (row: KVRow) => string,
): string {
  if (rows.length === 0) {
    return '<p class="empty">暂无数据</p>';
  }
  const max = Math.max(...rows.map((row) => row.value), 1);
  return `<div class="bar-list">
    ${rows
      .map((row) => {
        const pct = Math.max((row.value / max) * 100, 2);
        return `<div class="bar-row">
          <div class="bar-label" title="${escapeHtml(label(row))}">${escapeHtml(label(row))}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <div class="bar-value">${formatInteger(row.value)}</div>
        </div>`;
      })
      .join('')}
  </div>`;
}

function renderInlineTable(rows: KVRow[]): string {
  if (rows.length === 0) {
    return '<p class="empty">暂无数据</p>';
  }
  return `<table class="table">
    <tbody>
      ${rows
        .slice(0, 6)
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.key)}</td>
            <td class="tnum">${formatInteger(row.value)}</td>
          </tr>`,
        )
        .join('')}
    </tbody>
  </table>`;
}

function renderScoreBox(label: string, value: number): string {
  const sign = value > 0 ? '+' : '';
  return `<div class="score-cell">
    <div class="name">${escapeHtml(label)}</div>
    <div class="value mono">${sign}${escapeHtml(value.toFixed(2))}</div>
    <div class="delta">range −1.00 ~ +1.00</div>
  </div>`;
}

function renderAnswerQuestions(
  data: DashboardData['answerQuestions'],
  v: DashboardVersion,
): string {
  if (data.length === 0) {
    return '<p class="empty">暂无答题分布数据</p>';
  }
  return data
    .map((question) => {
      const tag = question.tag
        ? `<span class="badge">${escapeHtml(question.tag)}</span>`
        : '';
      const dimLabel = v.dimensionLabels[question.dimension];
      return `<article class="answer-card">
        <div class="answer-head">
          <div>
            <span class="answer-id mono">Q${question.questionId}</span>
            <span class="answer-title">${escapeHtml(question.text)}</span>
            ${tag}
          </div>
          <div class="answer-meta mono">DIM ${escapeHtml(question.dimension)}${dimLabel ? ' ' + escapeHtml(dimLabel) : ''} · N ${formatInteger(question.total)}</div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:60px;">Option</th>
              <th>Text</th>
              <th class="tnum" style="width:80px;">Count</th>
              <th class="tnum" style="width:80px;">Share</th>
            </tr>
          </thead>
          <tbody>
            ${question.options
              .map(
                (option) => `<tr>
                  <td class="mono">${escapeHtml(option.label)}</td>
                  <td>${escapeHtml(option.text)}</td>
                  <td class="tnum">${formatInteger(option.value)}</td>
                  <td class="tnum">${formatPercent(option.pct)}</td>
                </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </article>`;
    })
    .join('');
}

function isDashboardAuthorized(request: Request, env: Env): boolean {
  if (!env.DASHBOARD_USERNAME || !env.DASHBOARD_PASSWORD) {
    return true;
  }
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) return false;
  const encoded = header.slice(6);
  let decoded = '';
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }
  const [username, password] = decoded.split(':');
  return (
    username === env.DASHBOARD_USERNAME && password === env.DASHBOARD_PASSWORD
  );
}

function unauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'www-authenticate': 'Basic realm="FWTI Telemetry"',
    },
  });
}

function corsHeaders(): HeadersInit {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS, GET',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
  };
}

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(extraHeaders ?? {}),
    },
  });
}

function parseDays(raw: string | null): number {
  if (!raw) return 7;
  const value = Number(raw);
  if (!Number.isInteger(value)) return 7;
  if (value <= 1) return 1;
  if (value >= 30) return 30;
  return 7;
}

function toText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function toInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

function toScore(value: unknown): IncomingEvent['score'] | undefined {
  if (!isPlainObject(value)) return undefined;
  const source = value as Record<string, unknown>;
  // 兼容旧 client：GD/ZR/NL/YF 是 ScoresV3 中 C/R/A/S 的 alias，数值同。
  return {
    C: toFiniteNumber(source.C ?? source.GD) ?? undefined,
    R: toFiniteNumber(source.R ?? source.ZR) ?? undefined,
    A: toFiniteNumber(source.A ?? source.NL) ?? undefined,
    S: toFiniteNumber(source.S ?? source.YF) ?? undefined,
  };
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getReferrerHost(raw?: string): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

function parseUserAgent(ua: string): {
  browser: string | null;
  os: string | null;
  deviceType: string | null;
} {
  const browser =
    /edg\//i.test(ua)
      ? 'Edge'
      : /chrome\//i.test(ua)
        ? 'Chrome'
        : /firefox\//i.test(ua)
          ? 'Firefox'
          : /safari\//i.test(ua) && !/chrome\//i.test(ua)
            ? 'Safari'
            : /wechat/i.test(ua)
              ? 'WeChat'
              : 'Other';

  const os =
    /iphone|ipad|ios/i.test(ua)
      ? 'iOS'
      : /android/i.test(ua)
        ? 'Android'
        : /mac os x/i.test(ua)
          ? 'macOS'
          : /windows nt/i.test(ua)
            ? 'Windows'
            : /linux/i.test(ua)
              ? 'Linux'
              : 'Other';

  const deviceType =
    /ipad|tablet/i.test(ua)
      ? 'tablet'
      : /mobile|iphone|android/i.test(ua)
        ? 'mobile'
        : 'desktop';

  return {
    browser,
    os,
    deviceType,
  };
}

function safeJsonStringify(value: unknown, maxLength: number): string {
  const jsonText = JSON.stringify(value);
  return jsonText.length <= maxLength
    ? jsonText
    : `${jsonText.slice(0, maxLength - 1)}…`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}

function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
