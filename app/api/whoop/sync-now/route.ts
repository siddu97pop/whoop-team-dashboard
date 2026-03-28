import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { getRecoveries, getSleeps, getWorkouts } from '@/lib/whoop/endpoints'
import { upsertRecovery, upsertSleep, upsertWorkout } from '@/lib/supabase/queries'
import { WhoopRecovery, WhoopSleep, WhoopWorkout, WHOOP_SPORT_NAMES } from '@/lib/whoop/types'

const DAYS = 30

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const uid = user.whoop_user_id
  const start = new Date()
  start.setDate(start.getDate() - DAYS)
  const params = { start: start.toISOString() }

  const result: Record<string, unknown> = {}

  // ── Recoveries ────────────────────────────────────────────────
  try {
    const recoveries = await getRecoveries(uid, params)
    let saved = 0
    for (const r of recoveries) {
      try { await upsertRecovery(mapRecovery(r, uid)); saved++ }
      catch (e) { console.error('recovery upsert:', e) }
    }
    result.recoveries = { fetched: recoveries.length, saved }
  } catch (e) {
    result.recoveries = { error: e instanceof Error ? e.message : String(e) }
  }

  // ── Sleeps ────────────────────────────────────────────────────
  try {
    const sleeps = await getSleeps(uid, params)
    let saved = 0
    for (const s of sleeps) {
      try { await upsertSleep(mapSleep(s, uid)); saved++ }
      catch (e) { console.error('sleep upsert:', e) }
    }
    result.sleeps = { fetched: sleeps.length, saved }
  } catch (e) {
    result.sleeps = { error: e instanceof Error ? e.message : String(e) }
  }

  // ── Workouts ──────────────────────────────────────────────────
  try {
    const workouts = await getWorkouts(uid, params)
    let saved = 0
    for (const w of workouts) {
      try { await upsertWorkout(mapWorkout(w, uid)); saved++ }
      catch (e) { console.error('workout upsert:', e) }
    }
    result.workouts = { fetched: workouts.length, saved }
  } catch (e) {
    result.workouts = { error: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json({ ok: true, days: DAYS, ...result })
}

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
