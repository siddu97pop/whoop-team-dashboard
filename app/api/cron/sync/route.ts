import { NextRequest, NextResponse } from 'next/server'
import {
  getAllActiveUsers,
  upsertRecovery,
  upsertSleep,
  upsertWorkout,
  updateLastSync,
} from '@/lib/supabase/queries'
import { getRecoveries, getSleeps, getWorkouts } from '@/lib/whoop/endpoints'
import { WhoopRecovery, WhoopSleep, WhoopWorkout, WHOOP_SPORT_NAMES } from '@/lib/whoop/types'
import { daysAgoISO, nowISO } from '@/lib/utils'

export async function GET(request: NextRequest) {
  // Protect with Bearer token
  const authHeader = request.headers.get('Authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await getAllActiveUsers()
  const results: { userId: number; status: string; error?: string }[] = []

  // Process users sequentially to respect the 10k/day rate limit
  for (const user of users) {
    try {
      const params = { start: daysAgoISO(2), end: nowISO() }

      const [recoveries, sleeps, workouts] = await Promise.all([
        getRecoveries(user.whoop_user_id, params),
        getSleeps(user.whoop_user_id, params),
        getWorkouts(user.whoop_user_id, params),
      ])

      for (const r of recoveries) {
        await upsertRecovery(mapRecovery(r, user.whoop_user_id))
      }
      for (const s of sleeps) {
        await upsertSleep(mapSleep(s, user.whoop_user_id))
      }
      for (const w of workouts) {
        await upsertWorkout(mapWorkout(w, user.whoop_user_id))
      }

      await updateLastSync(user.whoop_user_id)
      results.push({ userId: user.whoop_user_id, status: 'ok' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Sync failed for user ${user.whoop_user_id}:`, message)
      results.push({ userId: user.whoop_user_id, status: 'error', error: message })
    }
  }

  return NextResponse.json({ synced: results.length, results })
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
