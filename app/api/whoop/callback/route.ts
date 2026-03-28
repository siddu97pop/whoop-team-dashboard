import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { waitUntil } from '@vercel/functions'
import { upsertWhoopUser, upsertRecovery, upsertSleep, upsertWorkout } from '@/lib/supabase/queries'
import { backfillUser } from '@/lib/whoop/endpoints'
import { WhoopSleep, WhoopRecovery, WhoopWorkout, WHOOP_SPORT_NAMES } from '@/lib/whoop/types'
import { buildSessionCookie } from '@/lib/session'

const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('WHOOP OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin?error=oauth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin?error=missing_params`)
  }

  // Validate CSRF state
  const cookieStore = await cookies()
  const storedState = cookieStore.get('whoop_oauth_state')?.value
  cookieStore.delete('whoop_oauth_state')

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin?error=invalid_state`)
  }

  // Exchange code for tokens
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
    redirect_uri: process.env.WHOOP_REDIRECT_URI!,
  })

  const tokenRes = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    console.error('Token exchange failed:', text)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin?error=token_exchange`)
  }

  const tokens = await tokenRes.json()
  const { access_token, refresh_token, expires_in } = tokens
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

  // Temporarily store token to fetch the profile
  // We need the whoop_user_id first — upsert a placeholder so whoopFetch works
  // Strategy: fetch profile using the access_token directly (no DB round-trip yet)
  const profileRes = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!profileRes.ok) {
    console.error('Profile fetch failed:', await profileRes.text())
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin?error=profile_fetch`)
  }

  const profile = await profileRes.json()
  const whoopUserId: number = profile.user_id

  // Upsert user row with tokens
  await upsertWhoopUser({
    whoop_user_id: whoopUserId,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    access_token,
    refresh_token,
    token_expires_at: expiresAt,
  })

  // Trigger background 90-day backfill — waitUntil keeps the function alive on Vercel
  waitUntil(
    runBackfill(whoopUserId).catch((err) =>
      console.error(`Backfill failed for user ${whoopUserId}:`, err)
    )
  )

  // Set session cookie via a 200 HTML response rather than on a redirect —
  // Set-Cookie on a 302 can be silently dropped by the Next.js runtime before
  // the browser sees it. A 200 response guarantees the browser stores the cookie
  // before the JS redirect fires.
  const session = buildSessionCookie(whoopUserId)
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  const html = `<!DOCTYPE html><html><head>
<meta http-equiv="refresh" content="0;url=${dashboardUrl}">
<script>window.location.replace(${JSON.stringify(dashboardUrl)})</script>
</head><body>Redirecting…</body></html>`

  const response = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  response.cookies.set(session.name, session.value, session.options)
  return response
}

// ── Background backfill ───────────────────────────────────────

async function runBackfill(whoopUserId: number) {
  const { recoveries, sleeps, workouts } = await backfillUser(whoopUserId, 90)

  for (const r of recoveries) {
    await upsertRecovery(mapRecovery(r, whoopUserId))
  }
  for (const s of sleeps) {
    await upsertSleep(mapSleep(s, whoopUserId))
  }
  for (const w of workouts) {
    await upsertWorkout(mapWorkout(w, whoopUserId))
  }
}

// ── Data mappers ──────────────────────────────────────────────

function mapRecovery(r: WhoopRecovery, whoopUserId: number) {
  return {
    id: r.cycle_id,
    whoop_user_id: whoopUserId,
    sleep_id: r.sleep_id,
    recovery_score: r.score?.recovery_score ?? null,
    hrv_rmssd_milli: r.score?.hrv_rmssd_milli ?? null,
    resting_heart_rate: r.score?.resting_heart_rate ?? null,
    spo2_percentage: r.score?.spo2_percentage ?? null,
    skin_temp_celsius: r.score?.skin_temp_celsius ?? null,
    user_calibrating: r.score?.user_calibrating ?? false,
    score_state: r.score_state,
    recorded_at: r.created_at,
    updated_at: r.updated_at,
  }
}

function mapSleep(s: WhoopSleep, whoopUserId: number) {
  return {
    id: s.id,
    whoop_user_id: whoopUserId,
    start_time: s.start,
    end_time: s.end,
    nap: s.nap,
    total_in_bed_milli: s.score?.stage_summary?.total_in_bed_time_milli ?? null,
    total_awake_milli: s.score?.stage_summary?.total_awake_time_milli ?? null,
    total_light_milli: s.score?.stage_summary?.total_light_sleep_time_milli ?? null,
    total_deep_milli: s.score?.stage_summary?.total_slow_wave_sleep_time_milli ?? null,
    total_rem_milli: s.score?.stage_summary?.total_rem_sleep_time_milli ?? null,
    sleep_cycle_count: s.score?.stage_summary?.sleep_cycle_count ?? null,
    disturbance_count: s.score?.stage_summary?.disturbance_count ?? null,
    respiratory_rate: s.score?.respiratory_rate ?? null,
    sleep_performance_pct: s.score?.sleep_performance_percentage ?? null,
    sleep_efficiency_pct: s.score?.sleep_efficiency_percentage ?? null,
    sleep_consistency_pct: s.score?.sleep_consistency_percentage ?? null,
    baseline_milli: s.score?.sleep_needed?.baseline_milli ?? null,
    need_from_sleep_debt_milli: s.score?.sleep_needed?.need_from_sleep_debt_milli ?? null,
    need_from_recent_strain_milli: s.score?.sleep_needed?.need_from_recent_strain_milli ?? null,
    score_state: s.score_state,
    updated_at: s.updated_at,
  }
}

function mapWorkout(w: WhoopWorkout, whoopUserId: number) {
  return {
    id: w.id,
    whoop_user_id: whoopUserId,
    start_time: w.start,
    end_time: w.end,
    sport_id: w.sport_id,
    sport_name: WHOOP_SPORT_NAMES[w.sport_id] ?? 'Activity',
    strain: w.score?.strain ?? null,
    avg_heart_rate: w.score?.average_heart_rate ?? null,
    max_heart_rate: w.score?.max_heart_rate ?? null,
    kilojoule: w.score?.kilojoule ?? null,
    distance_meter: w.score?.distance_meter ?? null,
    altitude_gain_meter: w.score?.altitude_gain_meter ?? null,
    percent_recorded: w.score?.percent_recorded ?? null,
    zone_0_milli: w.score?.zone_duration?.zone_zero_milli ?? null,
    zone_1_milli: w.score?.zone_duration?.zone_one_milli ?? null,
    zone_2_milli: w.score?.zone_duration?.zone_two_milli ?? null,
    zone_3_milli: w.score?.zone_duration?.zone_three_milli ?? null,
    zone_4_milli: w.score?.zone_duration?.zone_four_milli ?? null,
    zone_5_milli: w.score?.zone_duration?.zone_five_milli ?? null,
    score_state: w.score_state,
    updated_at: w.updated_at,
  }
}
