import { whoopGet } from './client'
import {
  WhoopUser,
  WhoopBodyMeasurement,
  WhoopRecovery,
  WhoopSleep,
  WhoopWorkout,
  WhoopCycle,
  WhoopPaginatedResponse,
} from './types'

const BASE = 'https://api.prod.whoop.com/developer/v1'

// ── Pagination helper ─────────────────────────────────────────

async function fetchAllPages<T>(
  userId: number,
  endpoint: string,
  params: { start?: string; end?: string } = {}
): Promise<T[]> {
  const results: T[] = []
  let nextToken: string | undefined

  do {
    const url = new URL(endpoint)
    if (params.start) url.searchParams.set('start', params.start)
    if (params.end) url.searchParams.set('end', params.end)
    url.searchParams.set('limit', '25')
    if (nextToken) url.searchParams.set('nextToken', nextToken)

    const data = await whoopGet<WhoopPaginatedResponse<T>>(userId, url.toString())
    results.push(...data.records)
    nextToken = data.next_token ?? undefined
  } while (nextToken)

  return results
}

// ── User ──────────────────────────────────────────────────────

export async function getWhoopProfile(userId: number): Promise<WhoopUser> {
  return whoopGet<WhoopUser>(userId, `${BASE}/user/profile/basic`)
}

export async function getWhoopBodyMeasurement(userId: number): Promise<WhoopBodyMeasurement> {
  return whoopGet<WhoopBodyMeasurement>(userId, `${BASE}/user/measurement/body`)
}

// ── Recovery ──────────────────────────────────────────────────

export async function getRecoveries(
  userId: number,
  params: { start?: string; end?: string } = {}
): Promise<WhoopRecovery[]> {
  return fetchAllPages<WhoopRecovery>(userId, `${BASE}/recovery`, params)
}

export async function getRecoveryByCycleId(
  userId: number,
  cycleId: number
): Promise<WhoopRecovery> {
  return whoopGet<WhoopRecovery>(userId, `${BASE}/recovery/${cycleId}`)
}

// ── Sleep ─────────────────────────────────────────────────────

export async function getSleeps(
  userId: number,
  params: { start?: string; end?: string } = {}
): Promise<WhoopSleep[]> {
  return fetchAllPages<WhoopSleep>(userId, `${BASE}/activity/sleep`, params)
}

export async function getSleepById(userId: number, sleepId: string): Promise<WhoopSleep> {
  return whoopGet<WhoopSleep>(userId, `${BASE}/activity/sleep/${sleepId}`)
}

// ── Workout ───────────────────────────────────────────────────

export async function getWorkouts(
  userId: number,
  params: { start?: string; end?: string } = {}
): Promise<WhoopWorkout[]> {
  return fetchAllPages<WhoopWorkout>(userId, `${BASE}/activity/workout`, params)
}

export async function getWorkoutById(userId: number, workoutId: string): Promise<WhoopWorkout> {
  return whoopGet<WhoopWorkout>(userId, `${BASE}/activity/workout/${workoutId}`)
}

// ── Cycle ─────────────────────────────────────────────────────

export async function getCycles(
  userId: number,
  params: { start?: string; end?: string } = {}
): Promise<WhoopCycle[]> {
  return fetchAllPages<WhoopCycle>(userId, `${BASE}/cycle`, params)
}

export async function getLatestCycle(userId: number): Promise<WhoopCycle | null> {
  const url = new URL(`${BASE}/cycle`)
  url.searchParams.set('limit', '1')
  const data = await whoopGet<WhoopPaginatedResponse<WhoopCycle>>(userId, url.toString())
  return data.records[0] ?? null
}

// ── Backfill helper ───────────────────────────────────────────

/**
 * Fetch last N days of all data types for a user.
 * Returns raw WHOOP API records for the caller to upsert.
 */
export async function backfillUser(
  userId: number,
  days = 90
): Promise<{
  recoveries: WhoopRecovery[]
  sleeps: WhoopSleep[]
  workouts: WhoopWorkout[]
}> {
  const start = new Date()
  start.setDate(start.getDate() - days)
  const params = { start: start.toISOString() }

  const [recoveries, sleeps, workouts] = await Promise.all([
    getRecoveries(userId, params),
    getSleeps(userId, params),
    getWorkouts(userId, params),
  ])

  return { recoveries, sleeps, workouts }
}
