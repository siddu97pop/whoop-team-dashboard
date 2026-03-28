-- ============================================================
-- WHOOP Team Health Dashboard — Initial Schema
-- ============================================================

-- Users connected via WHOOP OAuth
CREATE TABLE whoop_users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whoop_user_id     BIGINT UNIQUE NOT NULL,
  email             TEXT NOT NULL,
  first_name        TEXT,
  last_name         TEXT,
  access_token      TEXT NOT NULL,
  refresh_token     TEXT NOT NULL,
  token_expires_at  TIMESTAMPTZ NOT NULL,
  connected_at      TIMESTAMPTZ DEFAULT now(),
  last_sync_at      TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT true
);

-- Recovery scores (one per day per user, linked to a sleep)
CREATE TABLE recoveries (
  id                  BIGINT PRIMARY KEY,
  whoop_user_id       BIGINT REFERENCES whoop_users(whoop_user_id) ON DELETE CASCADE,
  sleep_id            UUID,
  recovery_score      INTEGER,
  hrv_rmssd_milli     FLOAT,
  resting_heart_rate  INTEGER,
  spo2_percentage     FLOAT,
  skin_temp_celsius   FLOAT,
  user_calibrating    BOOLEAN,
  score_state         TEXT NOT NULL DEFAULT 'PENDING_SCORE',
  recorded_at         TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Sleep sessions including naps
CREATE TABLE sleeps (
  id                              UUID PRIMARY KEY,
  whoop_user_id                   BIGINT REFERENCES whoop_users(whoop_user_id) ON DELETE CASCADE,
  cycle_id                        BIGINT,
  start_time                      TIMESTAMPTZ,
  end_time                        TIMESTAMPTZ,
  nap                             BOOLEAN DEFAULT false,
  total_in_bed_milli              BIGINT,
  total_awake_milli               BIGINT,
  total_light_milli               BIGINT,
  total_deep_milli                BIGINT,
  total_rem_milli                 BIGINT,
  sleep_cycle_count               INTEGER,
  disturbance_count               INTEGER,
  respiratory_rate                FLOAT,
  sleep_performance_pct           FLOAT,
  sleep_efficiency_pct            FLOAT,
  sleep_consistency_pct           FLOAT,
  baseline_milli                  BIGINT,
  need_from_sleep_debt_milli      BIGINT,
  need_from_recent_strain_milli   BIGINT,
  score_state                     TEXT NOT NULL DEFAULT 'PENDING_SCORE',
  created_at                      TIMESTAMPTZ DEFAULT now(),
  updated_at                      TIMESTAMPTZ DEFAULT now()
);

-- Workout / activity records
CREATE TABLE workouts (
  id                   UUID PRIMARY KEY,
  whoop_user_id        BIGINT REFERENCES whoop_users(whoop_user_id) ON DELETE CASCADE,
  start_time           TIMESTAMPTZ,
  end_time             TIMESTAMPTZ,
  sport_name           TEXT,
  sport_id             INTEGER,
  strain               FLOAT,
  avg_heart_rate       INTEGER,
  max_heart_rate       INTEGER,
  kilojoule            FLOAT,
  distance_meter       FLOAT,
  altitude_gain_meter  FLOAT,
  percent_recorded     FLOAT,
  zone_0_milli         BIGINT,
  zone_1_milli         BIGINT,
  zone_2_milli         BIGINT,
  zone_3_milli         BIGINT,
  zone_4_milli         BIGINT,
  zone_5_milli         BIGINT,
  score_state          TEXT NOT NULL DEFAULT 'PENDING_SCORE',
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_recoveries_user_date ON recoveries(whoop_user_id, recorded_at DESC);
CREATE INDEX idx_sleeps_user_date     ON sleeps(whoop_user_id, start_time DESC);
CREATE INDEX idx_workouts_user_date   ON workouts(whoop_user_id, start_time DESC);

-- Row-level security (enable but allow service role full access)
ALTER TABLE whoop_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE recoveries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleeps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts     ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default; no additional policies needed
-- for server-side only access patterns.
