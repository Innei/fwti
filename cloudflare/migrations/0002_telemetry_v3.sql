-- v3 telemetry tables · 与 0001 schema 同形，惟 score 列改名 c/r/a/s 以对齐 v3 维度。
-- 旧 v1/v2 表保留不动，仅作历史留档；ingestion 与 dashboard 一律走 *_v3。

CREATE TABLE IF NOT EXISTS telemetry_events_v3 (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  page_key TEXT,
  route_path TEXT,
  referrer_host TEXT,
  relationship_status TEXT,
  result_code TEXT,
  display_code TEXT,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_legacy INTEGER NOT NULL DEFAULT 0,
  hidden_titles_count INTEGER NOT NULL DEFAULT 0,
  waste_level INTEGER,
  retreat_count INTEGER,
  answered_count INTEGER,
  main_total INTEGER,
  progress_pct INTEGER,
  duration_ms INTEGER,
  hash_version INTEGER,
  source TEXT,
  score_c REAL,
  score_r REAL,
  score_a REAL,
  score_s REAL,
  viewport_bucket TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  colo TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  detail_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_v3_occurred_at
  ON telemetry_events_v3 (occurred_at);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_v3_type_occurred_at
  ON telemetry_events_v3 (event_type, occurred_at);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_v3_session_type
  ON telemetry_events_v3 (session_id, event_type);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_v3_result_code
  ON telemetry_events_v3 (result_code, occurred_at);

CREATE TABLE IF NOT EXISTS telemetry_answers_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  relationship_status TEXT,
  question_id INTEGER NOT NULL,
  question_dimension TEXT,
  question_tag TEXT,
  option_index INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_answers_v3_submission
  ON telemetry_answers_v3 (submission_id);

CREATE INDEX IF NOT EXISTS idx_telemetry_answers_v3_question
  ON telemetry_answers_v3 (question_id, occurred_at);

CREATE UNIQUE INDEX IF NOT EXISTS ux_telemetry_answers_v3_submission_question_option
  ON telemetry_answers_v3 (submission_id, question_id, option_index);

CREATE TABLE IF NOT EXISTS telemetry_hidden_titles_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  title_name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_hidden_titles_v3_name
  ON telemetry_hidden_titles_v3 (title_name, occurred_at);

CREATE UNIQUE INDEX IF NOT EXISTS ux_telemetry_hidden_titles_v3_submission_title
  ON telemetry_hidden_titles_v3 (submission_id, title_name);
