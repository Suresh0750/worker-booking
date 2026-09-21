import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const COOKIE_NAME = 'refresh_token'
const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * POST /api/auth/refresh
 *
 * Server-side proxy that reads the httpOnly refresh_token cookie,
 * forwards it to the backend, and sets the new refresh token back
 * in the httpOnly cookie. Returns the new accessToken to the client.
 */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(COOKIE_NAME)?.value

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: 'No refresh token' }, { status: 401 })
  }

  const backendRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const payload = await backendRes.json()

  if (!backendRes.ok || !payload?.data?.accessToken) {
    // Refresh failed — clear the stale cookie
    const errRes = NextResponse.json({ success: false, message: 'Session expired' }, { status: 401 })
    errRes.cookies.set(COOKIE_NAME, '', { httpOnly: true, maxAge: 0, path: '/' })
    return errRes
  }

  const { accessToken, refreshToken: newRefreshToken } = payload.data

  const res = NextResponse.json({ success: true, data: { accessToken } })

  // Rotate the refresh token cookie if the backend issued a new one
  if (newRefreshToken) {
    res.cookies.set(COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return res
}
