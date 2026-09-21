import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'refresh_token'
const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * POST /api/auth/set-tokens
 * Body: { refreshToken: string }
 *
 * Stores the refresh token in an httpOnly, Secure, SameSite=Strict cookie
 * that is never accessible from client-side JavaScript.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body?.refreshToken) {
    return NextResponse.json({ success: false, message: 'refreshToken is required' }, { status: 400 })
  }

  const res = NextResponse.json({ success: true })

  res.cookies.set(COOKIE_NAME, body.refreshToken, {
    httpOnly: true,                    // not accessible via document.cookie
    secure: IS_PROD,                   // HTTPS only in production
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,        // 30 days
  })

  return res
}
