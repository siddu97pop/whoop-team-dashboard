import { cookies } from 'next/headers'
import { createServiceClient } from './supabase/server'

export const SESSION_COOKIE = 'whoop_user_id'

/** Get the currently connected WHOOP user from the session cookie. */
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null

  const whoopUserId = parseInt(raw, 10)
  if (isNaN(whoopUserId)) return null

  const db = createServiceClient()
  const { data } = await db
    .from('whoop_users')
    .select('*')
    .eq('whoop_user_id', whoopUserId)
    .eq('is_active', true)
    .single()

  return data ?? null
}

/** Set the session cookie after successful OAuth. */
export function buildSessionCookie(whoopUserId: number) {
  return {
    name: SESSION_COOKIE,
    value: String(whoopUserId),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    },
  }
}
