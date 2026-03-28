import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth'

const SCOPES = [
  'read:recovery',
  'read:cycles',
  'read:sleep',
  'read:workout',
  'read:profile',
  'read:body_measurement',
  'offline',
].join(' ')

export async function GET() {
  // Generate and store a CSRF state token
  const state = randomBytes(32).toString('hex')

  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: process.env.WHOOP_REDIRECT_URI!,
    scope: SCOPES,
    response_type: 'code',
    state,
  })

  // Set the state cookie directly on the redirect response so it's always sent
  const response = NextResponse.redirect(`${WHOOP_AUTH_URL}?${params.toString()}`)
  response.cookies.set('whoop_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })
  return response
}
