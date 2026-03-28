# WHOOP Team Health Dashboard

A full-stack multi-user team health dashboard that connects to the WHOOP v2 API. Team members each connect their own WHOOP account via OAuth. The app stores all data in Supabase and displays a unified dashboard showing recovery, sleep, HRV, and workout data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | WHOOP OAuth 2.0 |
| Charts | Recharts |
| Animations | Custom (requestAnimationFrame) |
| Deployment | Vercel |

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [WHOOP Developer](https://developer.whoop.com) account with an app registered

---

## Step-by-Step Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd whoop-team-dashboard
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run the database migration

In your Supabase dashboard, go to **SQL Editor** and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates the `whoop_users`, `recoveries`, `sleeps`, and `workouts` tables with indexes and RLS enabled.

### 4. Register your WHOOP app

1. Log in to [developer.whoop.com](https://developer.whoop.com).
2. Create a new application.
3. Set the redirect URI to:
   - **Local dev:** `http://localhost:3000/api/whoop/callback`
   - **Production:** `https://whoop.lexitools.tech/api/whoop/callback`
4. Copy:
   - `Client ID` → `WHOOP_CLIENT_ID`
   - `Client Secret` → `WHOOP_CLIENT_SECRET`
5. Register a webhook URL pointing to `/api/webhooks/whoop` (production only).

### 5. Set environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

WHOOP_CLIENT_ID=your-client-id
WHOOP_CLIENT_SECRET=your-client-secret
WHOOP_REDIRECT_URI=http://localhost:3000/api/whoop/callback
WHOOP_WEBHOOK_SECRET=your-client-secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=generate-a-random-string
```

> **Never commit `.env.local`** — it contains secrets. It is git-ignored by default.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Connect your WHOOP** to link your account.

---

## How Team Members Connect

1. Direct each team member to `https://whoop.lexitools.tech` (or your app URL).
2. They click **Connect your WHOOP** and approve the OAuth permissions on WHOOP's site.
3. After approval they are redirected to the dashboard and a 90-day backfill begins automatically.
4. Their data appears in the **Team Overview** page immediately.

To manage connections (view status, disconnect users), go to **Admin** in the sidebar.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
gh repo create whoop-team-dashboard --public --push
```

### 2. Import in Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
2. Framework preset: **Next.js** (auto-detected).
3. Add all environment variables from `.env.local` in the Vercel dashboard, updating:
   ```
   WHOOP_REDIRECT_URI=https://whoop.lexitools.tech/api/whoop/callback
   NEXT_PUBLIC_APP_URL=https://whoop.lexitools.tech
   ```
4. Deploy.

### 3. Add custom domain (whoop.lexitools.tech)

1. In Vercel: **Settings → Domains** → add `whoop.lexitools.tech`.
2. Vercel will show a CNAME record. Add it in Hostinger:
   ```
   Type:   CNAME
   Name:   whoop
   Value:  cname.vercel-dns.com
   ```
3. Wait ~15 min for DNS to propagate. Vercel auto-provisions SSL.

### 4. Register the production redirect URI

In the WHOOP developer portal, add `https://whoop.lexitools.tech/api/whoop/callback` as an additional allowed redirect URI (keep localhost too for local dev).

### 5. Register the webhook

In the WHOOP developer portal, add your webhook URL:
```
https://whoop.lexitools.tech/api/webhooks/whoop
```

---

## Architecture Overview

The app uses Next.js 14 App Router with a clean separation between server and client. All WHOOP API calls happen exclusively in Server Components or API Route Handlers — tokens are never exposed to the browser. When a user connects via OAuth, the server exchanges the code for tokens, stores them in Supabase (service role, server-side only), and fires a background 90-day backfill. From that point, WHOOP webhooks keep the data current in real time by calling the `/api/webhooks/whoop` endpoint, which validates the HMAC-SHA256 signature before processing any event. A nightly Vercel cron job at 04:00 UTC reconciles the last 48 hours for each active user as a safety net. The dashboard pages are Server Components that query Supabase directly and pass data down to lightweight Recharts client components for rendering.

---

## Dashboard Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with OAuth CTA |
| `/dashboard` | Personal overview — recovery, sleep, HRV trend, recent workouts |
| `/dashboard/team` | All connected members sorted by recovery score (lowest first) |
| `/dashboard/sleep` | 30-day sleep stage charts, efficiency and consistency trends |
| `/dashboard/workouts` | Full workout log, weekly training load, sport breakdown |
| `/dashboard/hrv` | 90-day HRV with rolling average, baseline, and red-day annotations |
| `/dashboard/admin` | Manage team connections, view sync status, disconnect users |

---

## Project Structure

```
app/
├── layout.tsx              Root layout + theme init script
├── page.tsx                Landing / login page
├── error.tsx               Global error boundary
├── not-found.tsx           404 page
├── dashboard/
│   ├── layout.tsx          Sidebar + TopBar shell
│   ├── page.tsx            Personal overview
│   ├── loading.tsx         Skeleton while data loads
│   ├── error.tsx           Dashboard error boundary
│   ├── team/               Team overview
│   ├── sleep/              Sleep analytics + charts
│   ├── workouts/           Workout log + charts
│   ├── hrv/                HRV trends
│   └── admin/              Team settings
└── api/
    ├── whoop/connect        OAuth step 1 — redirect to WHOOP
    ├── whoop/callback       OAuth step 2 — exchange code, backfill
    ├── whoop/disconnect     Revoke + deactivate user
    ├── webhooks/whoop       Real-time WHOOP event handler
    └── cron/sync            Nightly 48h reconciliation

components/
├── layout/                 Sidebar, TopBar
├── dashboard/              RecoveryCard, SleepBreakdown, HRVChart,
│                           WorkoutList, TeamGrid, ScoreZoneBadge,
│                           AnimatedNumber
└── ui/                     card, skeleton, badge, button

lib/
├── whoop/                  client, endpoints, types, webhook
├── supabase/               client, server, queries
├── session.ts              Cookie-based session helpers
└── utils.ts                Formatters, color helpers, score zones

supabase/migrations/        001_initial_schema.sql
```
