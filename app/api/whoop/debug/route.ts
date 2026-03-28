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

  const [profileRes, bodyRes, cycleRes, recoveryRes, sleepRes, workoutRes] = await Promise.all([
    fetch(`${base}/user/profile/basic`, { headers: h }),
    fetch(`${base}/user/measurement/body`, { headers: h }),
    fetch(`${base}/cycle?limit=1`, { headers: h }),
    fetch(`${base}/recovery?limit=1`, { headers: h }),
    fetch(`${base}/activity/sleep?limit=1`, { headers: h }),
    fetch(`${base}/activity/workout?limit=1`, { headers: h }),
  ])

  const read = (r: Response) => r.text().then(t => ({ status: r.status, body: t.slice(0, 150) }))
  const [profile, body, cycle, recovery, sleep, workout] = await Promise.all([
    read(profileRes), read(bodyRes), read(cycleRes),
    read(recoveryRes), read(sleepRes), read(workoutRes),
  ])

  return NextResponse.json({
    token_expires_at: user.token_expires_at,
    is_expired: isExpired,
    minutes_until_expiry: minutesUntilExpiry,
    endpoints: { profile, body, cycle, recovery, sleep, workout },
  })
}
