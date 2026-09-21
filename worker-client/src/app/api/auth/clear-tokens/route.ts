import { NextResponse } from 'next/server'

const COOKIE_NAME = 'refresh_token'

/**
 * POST /api/auth/clear-tokens
 *
 * Clears the httpOnly refresh-token cookie on logout.
 */
export async function POST() {
  const res = NextResponse.json({ success: true })

  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,   // expire immediately
  })

  return res
}
