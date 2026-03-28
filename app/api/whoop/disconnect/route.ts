import { NextRequest, NextResponse } from 'next/server'
import { deactivateUser, getUserByWhoopId } from '@/lib/supabase/queries'
import { whoopFetch } from '@/lib/whoop/client'

export async function POST(request: NextRequest) {
  const { whoopUserId } = await request.json()

  if (!whoopUserId || typeof whoopUserId !== 'number') {
    return NextResponse.json({ error: 'whoopUserId required' }, { status: 400 })
  }

  // Confirm user exists
  const user = await getUserByWhoopId(whoopUserId).catch(() => null)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Revoke access on WHOOP's side (best effort — don't fail if this errors)
  try {
    await whoopFetch(whoopUserId, 'https://api.prod.whoop.com/developer/v1/user/access', {
      method: 'DELETE',
    })
  } catch (err) {
    console.warn(`WHOOP token revocation failed for ${whoopUserId}:`, err)
  }

  // Clear tokens and mark inactive in our DB
  await deactivateUser(whoopUserId)

  return NextResponse.json({ success: true })
}
