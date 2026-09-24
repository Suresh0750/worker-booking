import { NextResponse } from 'next/server'

/**
 * POST /api/auth/clear-tokens
 *
 * Clears the httpOnly refresh-token cookie AND the access_token cookie on logout.
 * The access_token cookie is read by Next.js middleware to check auth status,
 * so it must be cleared here to prevent middleware redirect loops.
 */
export async function POST() {
  const res = NextResponse.json({ success: true })
  const IS_PROD = process.env.NODE_ENV === 'production'

  // Clear httpOnly refresh token
  res.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })

  // Clear the middleware-readable access_token cookie
  res.cookies.set('access_token', '', {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })

  // Clear the role cookie
  res.cookies.set('user_role', '', {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })

  return res
}
