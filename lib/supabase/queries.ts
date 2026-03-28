import { createServiceClient } from './server'

// ── Whoop Users ──────────────────────────────────────────────

export async function getAllActiveUsers() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('whoop_users')
    .select('*')
    .eq('is_active', true)
    .order('connected_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getUserByWhoopId(whoopUserId: number) {
  const db = createServiceClient()
  const { data, error } = await db
    .from('whoop_users')
    .select('*')
    .eq('whoop_user_id', whoopUserId)
    .single()

  if (error) throw error
  return data
}

export async function upsertWhoopUser(user: {
  whoop_user_id: number
  email: string
  first_name?: string
  last_name?: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  is_active?: boolean
}) {
  const db = createServiceClient()
  const { data, error } = await db
    .from('whoop_users')
    .upsert(user, { onConflict: 'whoop_user_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTokens(
  whoopUserId: number,
  tokens: { access_token: string; refresh_token: string; token_expires_at: string }
) {
  const db = createServiceClient()
  const { error } = await db
    .from('whoop_users')
    .update(tokens)
    .eq('whoop_user_id', whoopUserId)

  if (error) throw error
}

export async function updateLastSync(whoopUserId: number) {
  const db = createServiceClient()
  const { error } = await db
    .from('whoop_users')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('whoop_user_id', whoopUserId)

  if (error) throw error
}

export async function deactivateUser(whoopUserId: number) {
  const db = createServiceClient()
  const { error } = await db
    .from('whoop_users')
    .update({ is_active: false, access_token: '', refresh_token: '' })
    .eq('whoop_user_id', whoopUserId)

  if (error) throw error
}

// ── Recoveries ───────────────────────────────────────────────

export async function getLatestRecovery(whoopUserId: number) {
  const db = createServiceClient()
  const { data, error } = await db
    .from('recoveries')
    .select('*')
    .eq('whoop_user_id', whoopUserId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function getRecoveriesForUser(whoopUserId: number, days = 30) {
  const db = createServiceClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await db
    .from('recoveries')
    .select('*')
    .eq('whoop_user_id', whoopUserId)
    .gte('recorded_at', since.toISOString())
    .order('recorded_at', { ascending: true })

  if (error) throw error
  return data
}

export async function upsertRecovery(recovery: Record<string, unknown>) {
  const db = createServiceClient()
  const { error } = await db
    .from('recoveries')
    .upsert(recovery, { onConflict: 'id' })

  if (error) throw error
}

export async function deleteRecovery(id: number) {
  const db = createServiceClient()
  const { error } = await db.from('recoveries').delete().eq('id', id)
  if (error) throw error
}

// ── Sleeps ───────────────────────────────────────────────────

export async function getLatestSleep(whoopUserId: number) {
  const db = createServiceClient()
  const { data, error } = await db
    .from('sleeps')
    .select('*')
    .eq('whoop_user_id', whoopUserId)
    .eq('nap', false)
    .order('start_time', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function getSleepsForUser(whoopUserId: number, days = 30) {
  const db = createServiceClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await db
    .from('sleeps')
    .select('*')
    .eq('whoop_user_id', whoopUserId)
    .eq('nap', false)
    .gte('start_time', since.toISOString())
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export async function upsertSleep(sleep: Record<string, unknown>) {
  const db = createServiceClient()
  const { error } = await db
    .from('sleeps')
    .upsert(sleep, { onConflict: 'id' })

  if (error) throw error
}

export async function deleteSleep(id: string) {
  const db = createServiceClient()
  const { error } = await db.from('sleeps').delete().eq('id', id)
  if (error) throw error
}

// ── Workouts ─────────────────────────────────────────────────

export async function getWorkoutsForUser(whoopUserId: number, days = 30) {
  const db = createServiceClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await db
    .from('workouts')
    .select('*')
    .eq('whoop_user_id', whoopUserId)
    .gte('start_time', since.toISOString())
    .order('start_time', { ascending: false })

  if (error) throw error
  return data
}

export async function upsertWorkout(workout: Record<string, unknown>) {
  const db = createServiceClient()
  const { error } = await db
    .from('workouts')
    .upsert(workout, { onConflict: 'id' })

  if (error) throw error
}

export async function deleteWorkout(id: string) {
  const db = createServiceClient()
  const { error } = await db.from('workouts').delete().eq('id', id)
  if (error) throw error
}
