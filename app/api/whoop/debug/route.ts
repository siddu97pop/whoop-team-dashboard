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

  // Test the profile endpoint directly with the stored access token
  const profileRes = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
    headers: { Authorization: `Bearer ${user.access_token}` },
  })
  const profileBody = await profileRes.text()

  // Test recovery with the stored access token
  const recoveryRes = await fetch('https://api.prod.whoop.com/developer/v1/recovery?limit=1', {
    headers: { Authorization: `Bearer ${user.access_token}` },
  })
  const recoveryBody = await recoveryRes.text()

  return NextResponse.json({
    token_expires_at: user.token_expires_at,
    is_expired: isExpired,
    minutes_until_expiry: minutesUntilExpiry,
    access_token_length: user.access_token?.length ?? 0,
    refresh_token_length: user.refresh_token?.length ?? 0,
    profile_status: profileRes.status,
    profile_body: profileBody.slice(0, 200),
    recovery_status: recoveryRes.status,
    recovery_body: recoveryBody.slice(0, 200),
  })
}
