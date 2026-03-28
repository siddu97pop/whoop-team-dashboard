import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { getUserByWhoopId } from '@/lib/supabase/queries'

export async function GET() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const user = await getUserByWhoopId(sessionUser.whoop_user_id)
  if (!user) return NextResponse.json({ error: 'User not in DB' }, { status: 404 })

  const expiresAt = new Date(user.token_expires_at)
  const now = new Date()
  const isExpired = expiresAt < now
  const minutesUntilExpiry = Math.round((expiresAt.getTime() - now.getTime()) / 60000)

  const base = 'https://api.prod.whoop.com/developer/v1'
  const h = { Authorization: `Bearer ${user.access_token}` }

  const read = (r: Response) => r.text().then(t => ({ status: r.status, body: t.slice(0, 200) }))

  // First get latest cycle ID
  const cycleListRes = await fetch(`${base}/cycle?limit=1`, { headers: h })
  const cycleListText = await cycleListRes.text()
  let latestCycleId: number | null = null
  try {
    const parsed = JSON.parse(cycleListText)
    latestCycleId = parsed?.records?.[0]?.id ?? null
  } catch { /* ignore */ }

  const requests: Record<string, Promise<Response>> = {
    profile: fetch(`${base}/user/profile/basic`, { headers: h }),
    cycle_collection: fetch(`${base}/cycle?limit=1`, { headers: h }),
    recovery_collection: fetch(`${base}/recovery?limit=1`, { headers: h }),
    sleep_collection: fetch(`${base}/activity/sleep?limit=1`, { headers: h }),
    workout_collection: fetch(`${base}/activity/workout?limit=1`, { headers: h }),
  }

  if (latestCycleId) {
    requests[`recovery_by_cycle_${latestCycleId}`] = fetch(`${base}/recovery/${latestCycleId}`, { headers: h })
  }

  const entries = Object.entries(requests)
  const results = await Promise.all(entries.map(([, p]) => p.then(read)))
  const endpoints: Record<string, unknown> = {}
  entries.forEach(([key], i) => { endpoints[key] = results[i] })

  return NextResponse.json({
    token_expires_at: user.token_expires_at,
    is_expired: isExpired,
    minutes_until_expiry: minutesUntilExpiry,
    latest_cycle_id: latestCycleId,
    endpoints,
  })
}
