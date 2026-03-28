import { updateTokens, getUserByWhoopId } from '@/lib/supabase/queries'

const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

// ── Token refresh ─────────────────────────────────────────────

async function refreshAccessToken(whoopUserId: number, refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
  })

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token refresh failed (${res.status}): ${text}`)
  }

  const tokens: TokenResponse = await res.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await updateTokens(whoopUserId, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: expiresAt,
  })

  return tokens.access_token
}

// ── Authenticated fetch wrapper ───────────────────────────────

/**
 * Authenticated WHOOP API fetch.
 * - Auto-refreshes the token if it expires within 5 minutes.
 * - Retries once on 429 after waiting for X-RateLimit-Reset.
 */
export async function whoopFetch(
  whoopUserId: number,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const user = await getUserByWhoopId(whoopUserId)
  if (!user) throw new Error(`No WHOOP user found for id ${whoopUserId}`)

  // Refresh if expiring within 5 minutes
  const expiresAt = new Date(user.token_expires_at).getTime()
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000

  let accessToken = user.access_token
  if (expiresAt < fiveMinutesFromNow) {
    accessToken = await refreshAccessToken(whoopUserId, user.refresh_token)
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  const res = await fetch(url, { ...options, headers })

  // Handle rate limiting — retry once
  if (res.status === 429) {
    const resetHeader = res.headers.get('X-RateLimit-Reset')
    const waitSeconds = resetHeader ? parseInt(resetHeader, 10) : 5
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000))
    return fetch(url, { ...options, headers })
  }

  return res
}

/**
 * Convenience wrapper that parses JSON and throws on non-2xx.
 */
export async function whoopGet<T>(whoopUserId: number, url: string): Promise<T> {
  const res = await whoopFetch(whoopUserId, url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WHOOP API error ${res.status} for ${url}: ${text}`)
  }
  return res.json() as Promise<T>
}
