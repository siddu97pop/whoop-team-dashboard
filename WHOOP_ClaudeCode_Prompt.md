# Claude Code Prompt — WHOOP Team Health Dashboard

---

## Project Overview

Build a full-stack multi-user team health dashboard that connects to the WHOOP v2 API.
Team members each connect their own WHOOP account via OAuth. The app stores all data in
Supabase and displays a unified dashboard showing recovery, sleep, HRV, and workout data.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth (for app login) + WHOOP OAuth (for data access)
- **Deployment**: Vercel

---

## Environment Variables Required

Create a `.env.local` file with these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret
WHOOP_REDIRECT_URI=https://yourdomain.com/api/whoop/callback
WHOOP_WEBHOOK_SECRET=your_whoop_client_secret

NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Project File Structure

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                         # Landing / login page
│   ├── dashboard/
│   │   ├── layout.tsx                   # Sidebar + nav shell
│   │   ├── page.tsx                     # Personal overview (today)
│   │   ├── team/page.tsx                # Team overview — all members
│   │   ├── sleep/page.tsx               # Sleep analytics (30-day)
│   │   ├── workouts/page.tsx            # Workout log
│   │   ├── hrv/page.tsx                 # HRV trends
│   │   └── admin/page.tsx               # Team connections / settings
│   └── api/
│       ├── whoop/
│       │   ├── connect/route.ts         # Step 1: redirect user to WHOOP OAuth
│       │   ├── callback/route.ts        # Step 2: exchange code for tokens
│       │   └── disconnect/route.ts      # Revoke + delete tokens
│       ├── webhooks/
│       │   └── whoop/route.ts           # Receive WHOOP webhook events
│       └── cron/
│           └── sync/route.ts            # Nightly reconciliation job
├── components/
│   ├── ui/                              # shadcn/ui components
│   ├── dashboard/
│   │   ├── RecoveryCard.tsx
│   │   ├── SleepBreakdown.tsx
│   │   ├── HRVChart.tsx
│   │   ├── WorkoutList.tsx
│   │   ├── TeamGrid.tsx
│   │   └── ScoreZoneBadge.tsx           # Green/Yellow/Red score indicator
│   └── layout/
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── lib/
│   ├── whoop/
│   │   ├── client.ts                    # Authenticated fetch wrapper + auto-refresh
│   │   ├── endpoints.ts                 # All WHOOP API calls
│   │   ├── types.ts                     # TypeScript types for all WHOOP responses
│   │   └── webhook.ts                   # Signature validation logic
│   ├── supabase/
│   │   ├── client.ts                    # Browser Supabase client
│   │   ├── server.ts                    # Server Supabase client
│   │   └── queries.ts                   # Reusable DB queries
│   └── utils.ts                         # Helpers (ms to hours, sleep stage colors, etc)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql       # Full DB schema
└── README.md
```

---

## Database Schema (Supabase)

Create file `supabase/migrations/001_initial_schema.sql`:

```sql
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
CREATE INDEX idx_sleeps_user_date ON sleeps(whoop_user_id, start_time DESC);
CREATE INDEX idx_workouts_user_date ON workouts(whoop_user_id, start_time DESC);
```

---

## Key Implementation Details

### 1. WHOOP OAuth Connect (`/api/whoop/connect/route.ts`)

Redirect the user to WHOOP's auth URL with all required scopes:

```
GET https://api.prod.whoop.com/oauth/oauth2/auth
  ?client_id=WHOOP_CLIENT_ID
  &redirect_uri=WHOOP_REDIRECT_URI
  &scope=read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline
  &response_type=code
  &state=<random_csrf_token_stored_in_cookie>
```

Include `offline` in scope to get a refresh_token.

### 2. Token Exchange & Storage (`/api/whoop/callback/route.ts`)

```
POST https://api.prod.whoop.com/oauth/oauth2/token
  grant_type=authorization_code
  code=<code_from_query>
  client_id=WHOOP_CLIENT_ID
  client_secret=WHOOP_CLIENT_SECRET
  redirect_uri=WHOOP_REDIRECT_URI
```

After receiving tokens:
1. Call `GET /v2/user/profile/basic` to get the WHOOP user_id and email
2. Upsert a row in `whoop_users` with access_token, refresh_token, token_expires_at
3. Trigger a background historical backfill for this user (last 90 days of recoveries, sleeps, workouts)
4. Redirect to `/dashboard`

### 3. Token Refresh (`lib/whoop/client.ts`)

Build a `whoopFetch(userId, url, options)` wrapper that:
1. Loads the user's token from Supabase
2. If `token_expires_at < now + 5 minutes`, calls the refresh endpoint first
3. Sets `Authorization: Bearer <access_token>` header
4. Handles 429 responses by waiting for `X-RateLimit-Reset` seconds and retrying once

```
POST https://api.prod.whoop.com/oauth/oauth2/token
  grant_type=refresh_token
  refresh_token=<current_refresh_token>
  client_id=WHOOP_CLIENT_ID
  client_secret=WHOOP_CLIENT_SECRET
```

### 4. Webhook Handler (`/api/webhooks/whoop/route.ts`)

```typescript
// 1. Validate signature first — reject immediately if invalid
const timestamp = request.headers.get('X-WHOOP-Signature-Timestamp');
const signature = request.headers.get('X-WHOOP-Signature');
const body = await request.text();
const expected = base64(HMAC_SHA256(timestamp + body, WHOOP_CLIENT_SECRET));
if (expected !== signature) return Response.json({}, { status: 401 });

// 2. Return 200 immediately — process asynchronously
const event = JSON.parse(body); // { user_id, id, type, trace_id }

// 3. Dispatch based on event type
switch (event.type) {
  case 'sleep.updated':   // fetch and upsert sleep + recovery
  case 'sleep.deleted':   // delete sleep + recovery from DB
  case 'recovery.updated': // fetch and upsert recovery
  case 'recovery.deleted': // delete recovery from DB
  case 'workout.updated': // fetch and upsert workout
  case 'workout.deleted': // delete workout from DB
}
```

### 5. Pagination Helper (`lib/whoop/endpoints.ts`)

All collection endpoints are paginated (max 25 per page). Build a generic paginator:

```typescript
async function fetchAllPages<T>(
  userId: number,
  endpoint: string,
  params: { start?: string; end?: string }
): Promise<T[]> {
  const results: T[] = [];
  let nextToken: string | undefined;
  do {
    const url = new URL(endpoint);
    if (params.start) url.searchParams.set('start', params.start);
    if (params.end) url.searchParams.set('end', params.end);
    url.searchParams.set('limit', '25');
    if (nextToken) url.searchParams.set('nextToken', nextToken);
    const data = await whoopFetch(userId, url.toString());
    results.push(...data.records);
    nextToken = data.next_token;
  } while (nextToken);
  return results;
}
```

### 6. score_state Handling

**Always check score_state before rendering any score.** Three possible values:
- `SCORED` — render the score normally
- `PENDING_SCORE` — show a skeleton/loading indicator ("Processing...")
- `UNSCORABLE` — show "N/A" with a tooltip explaining why

### 7. Nightly Reconciliation Cron (`/api/cron/sync/route.ts`)

Protect with a `Authorization: Bearer <CRON_SECRET>` header (set in Vercel cron config).

For each active user in `whoop_users`:
1. Fetch recoveries for the last 48 hours and upsert
2. Fetch sleeps for the last 48 hours and upsert
3. Fetch workouts for the last 48 hours and upsert
4. Update `last_sync_at`

Run sequentially across users (not parallel) to stay within rate limits.

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "0 4 * * *"
  }]
}
```

---

## Dashboard Pages — What to Show

### `/dashboard` — Personal Overview
- Today's recovery score (large, color-coded: green ≥67, yellow 34–66, red ≤33)
- HRV (from this morning's recovery)
- Last night's sleep: total time, efficiency %, stage breakdown bar
- Day strain so far (from latest cycle)
- HRV trend chart (last 30 days, line chart)
- Last 3 workouts

### `/dashboard/team` — Team Overview
- Grid of cards, one per connected team member
- Each card: avatar/initials, name, recovery score badge, HRV, sleep score
- Sort by recovery score ascending (lowest = most at risk shown first)
- "Not connected" state for team members who haven't done OAuth yet

### `/dashboard/sleep` — Sleep Analytics
- 30-day stacked bar chart (deep / REM / light / awake per night)
- Sleep efficiency trend (line chart)
- Average sleep debt over last 7 days
- Consistency score trend

### `/dashboard/workouts` — Workout Log
- Table of all workouts, newest first: sport, date, duration, strain, avg HR
- HR zone breakdown (stacked bar per workout)
- Total strain by sport (pie/donut chart)
- Weekly training load bar chart

### `/dashboard/hrv` — HRV Trends
- HRV time series chart (last 90 days)
- 7-day rolling average overlay
- Personal baseline line
- Annotations when recovery was red

### `/dashboard/admin` — Settings
- List of all team members with connection status
- "Connect WHOOP" button for unconnected members
- Last sync time per user
- "Disconnect" button (calls DELETE /v2/user/access then removes tokens from DB)

---

## TypeScript Types (`lib/whoop/types.ts`)

Define interfaces for all WHOOP API responses:
- `WhoopRecovery`, `WhoopSleep`, `WhoopWorkout`, `WhoopCycle`
- `WhoopUser`, `WhoopBodyMeasurement`
- `WhoopWebhookEvent`
- `ScoreState = 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'`
- `StageSummary`, `SleepNeeded`, `ZoneDurations`

---

## Design Requirements

- Clean, minimal aesthetic — white surfaces, thin borders, generous whitespace
- Font: Geist or Inter
- Color palette: neutral grays + teal accent (#0F6E56) matching WHOOP brand green
- Recovery score colors: green (#16a34a), yellow (#ca8a04), red (#dc2626)
- Dark mode support via Tailwind `dark:` classes and CSS variables
- Fully responsive — works on mobile and desktop
- All charts use Recharts library
- All score values animate in on load (use framer-motion for number counting)
- Empty/loading states for every data card
- Error boundaries around all data-fetching components

---

## Important Constraints

1. **Never expose tokens client-side** — all WHOOP API calls go through Next.js API routes or Server Components
2. **Always check `score_state`** before rendering a score — never show null as 0
3. **Validate webhook signatures** before processing any webhook event
4. **Run backfills sequentially** per user, not in parallel — respect the 10k/day rate limit
5. **Handle naps separately** from main sleep — `nap === true` records should not appear in the main sleep analytics
6. **Store tokens server-side only** — use Supabase service role key for token operations, never the anon key

---

## README.md Requirements

Include:
- Project description
- Prerequisites (Node 18+, Supabase project, WHOOP developer account)
- Step-by-step setup: clone → env vars → Supabase migration → run dev
- How to register your WHOOP app and get credentials
- How team members connect their WHOOP account
- Deploy to Vercel instructions
- Architecture overview (1 paragraph)
