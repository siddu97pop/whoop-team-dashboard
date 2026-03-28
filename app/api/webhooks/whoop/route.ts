import { NextRequest, NextResponse } from 'next/server'
import { validateWhoopSignature } from '@/lib/whoop/webhook'
import {
  upsertRecovery,
  upsertSleep,
  upsertWorkout,
  deleteRecovery,
  deleteSleep,
  deleteWorkout,
} from '@/lib/supabase/queries'
import {
  getRecoveryByCycleId,
  getSleepById,
  getWorkoutById,
} from '@/lib/whoop/endpoints'
import { WhoopWebhookEvent, WHOOP_SPORT_NAMES } from '@/lib/whoop/types'

export async function POST(request: NextRequest) {
  // Read the raw body BEFORE parsing — signature requires it
  const rawBody = await request.text()

  const timestamp = request.headers.get('X-WHOOP-Signature-Timestamp')
  const signature = request.headers.get('X-WHOOP-Signature')

  if (!timestamp || !signature) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 })
  }

  // Validate HMAC signature — reject immediately if invalid
  const isValid = validateWhoopSignature(timestamp, rawBody, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Return 200 immediately; process async
  const event: WhoopWebhookEvent = JSON.parse(rawBody)

  // Process in background (don't await)
  processWebhookEvent(event).catch((err) =>
    console.error(`Webhook processing failed for event ${event.id}:`, err)
  )

  return NextResponse.json({ received: true })
}

// ── Event dispatcher ──────────────────────────────────────────

async function processWebhookEvent(event: WhoopWebhookEvent) {
  const { user_id, id, type } = event

  switch (type) {
    case 'recovery.updated': {
      const cycleId = parseInt(id, 10)
      const recovery = await getRecoveryByCycleId(user_id, cycleId)
      await upsertRecovery({
        id: recovery.cycle_id,
        whoop_user_id: user_id,
        sleep_id: recovery.sleep_id,
        recovery_score: recovery.score?.recovery_score ?? null,
        hrv_rmssd_milli: recovery.score?.hrv_rmssd_milli ?? null,
        resting_heart_rate: recovery.score?.resting_heart_rate ?? null,
        spo2_percentage: recovery.score?.spo2_percentage ?? null,
        skin_temp_celsius: recovery.score?.skin_temp_celsius ?? null,
        user_calibrating: recovery.score?.user_calibrating ?? false,
        score_state: recovery.score_state,
        recorded_at: recovery.created_at,
        updated_at: recovery.updated_at,
      })
      break
    }

    case 'recovery.deleted': {
      await deleteRecovery(parseInt(id, 10))
      break
    }

    case 'sleep.updated': {
      const sleep = await getSleepById(user_id, id)
      await upsertSleep({
        id: sleep.id,
        whoop_user_id: user_id,
        start_time: sleep.start,
        end_time: sleep.end,
        nap: sleep.nap,
        total_in_bed_milli: sleep.score?.stage_summary?.total_in_bed_time_milli ?? null,
        total_awake_milli: sleep.score?.stage_summary?.total_awake_time_milli ?? null,
        total_light_milli: sleep.score?.stage_summary?.total_light_sleep_time_milli ?? null,
        total_deep_milli: sleep.score?.stage_summary?.total_slow_wave_sleep_time_milli ?? null,
        total_rem_milli: sleep.score?.stage_summary?.total_rem_sleep_time_milli ?? null,
        sleep_cycle_count: sleep.score?.stage_summary?.sleep_cycle_count ?? null,
        disturbance_count: sleep.score?.stage_summary?.disturbance_count ?? null,
        respiratory_rate: sleep.score?.respiratory_rate ?? null,
        sleep_performance_pct: sleep.score?.sleep_performance_percentage ?? null,
        sleep_efficiency_pct: sleep.score?.sleep_efficiency_percentage ?? null,
        sleep_consistency_pct: sleep.score?.sleep_consistency_percentage ?? null,
        baseline_milli: sleep.score?.sleep_needed?.baseline_milli ?? null,
        need_from_sleep_debt_milli: sleep.score?.sleep_needed?.need_from_sleep_debt_milli ?? null,
        need_from_recent_strain_milli: sleep.score?.sleep_needed?.need_from_recent_strain_milli ?? null,
        score_state: sleep.score_state,
        updated_at: sleep.updated_at,
      })
      break
    }

    case 'sleep.deleted': {
      await deleteSleep(id)
      break
    }

    case 'workout.updated': {
      const workout = await getWorkoutById(user_id, id)
      await upsertWorkout({
        id: workout.id,
        whoop_user_id: user_id,
        start_time: workout.start,
        end_time: workout.end,
        sport_id: workout.sport_id,
        sport_name: WHOOP_SPORT_NAMES[workout.sport_id] ?? 'Activity',
        strain: workout.score?.strain ?? null,
        avg_heart_rate: workout.score?.average_heart_rate ?? null,
        max_heart_rate: workout.score?.max_heart_rate ?? null,
        kilojoule: workout.score?.kilojoule ?? null,
        distance_meter: workout.score?.distance_meter ?? null,
        altitude_gain_meter: workout.score?.altitude_gain_meter ?? null,
        percent_recorded: workout.score?.percent_recorded ?? null,
        zone_0_milli: workout.score?.zone_duration?.zone_zero_milli ?? null,
        zone_1_milli: workout.score?.zone_duration?.zone_one_milli ?? null,
        zone_2_milli: workout.score?.zone_duration?.zone_two_milli ?? null,
        zone_3_milli: workout.score?.zone_duration?.zone_three_milli ?? null,
        zone_4_milli: workout.score?.zone_duration?.zone_four_milli ?? null,
        zone_5_milli: workout.score?.zone_duration?.zone_five_milli ?? null,
        score_state: workout.score_state,
        updated_at: workout.updated_at,
      })
      break
    }

    case 'workout.deleted': {
      await deleteWorkout(id)
      break
    }

    default:
      console.warn(`Unhandled WHOOP webhook event type: ${type}`)
  }
}
