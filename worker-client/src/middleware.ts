import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware runs on the Edge before any page is rendered.
 *
 * Rules:
 *  1. /worker/* routes  → must have an access_token cookie. If not, redirect to /auth/login.
 *  2. /client/* routes  → must have an access_token cookie. If not, redirect to /auth/login.
 *  3. /auth/*   routes  → if access_token is already present, redirect to the right dashboard
 *     so the user can never "back-navigate" into the login/register page.
 *
 * We can't verify the JWT signature on the edge (no crypto.subtle for HS256 easily), so we
 * only check presence here. The actual signature validation happens in the API gateway / backend.
 * Expired tokens are handled by the axios 401 interceptor (which refreshes via httpOnly cookie).
 */

const ACCESS_TOKEN_KEY = 'access_token'
const USER_KEY         = 'user'

/** Read a cookie value from the request */
function getCookie(req: NextRequest, name: string): string | undefined {
  return req.cookies.get(name)?.value
}

/**
 * Try to parse the stored user JSON from the __Secure- or plain cookie.
 * We store the user object in localStorage on the client, but we can't read
 * localStorage in middleware. Instead we store a lightweight role cookie on login.
 */
function getUserRole(req: NextRequest): string | null {
  const roleCookie = getCookie(req, 'user_role')
  return roleCookie ?? null
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasToken = !!getCookie(req, ACCESS_TOKEN_KEY) || !!getCookie(req, 'access_token')
  const role     = getUserRole(req)

  // ── Protected routes: /worker/* and /client/* ──────────────────────────────
  if (pathname.startsWith('/worker') || pathname.startsWith('/client')) {
    if (!hasToken) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      // Use a redirect response — no caching, no history entry
      const res = NextResponse.redirect(loginUrl)
      return res
    }

    // Role check: /worker/* pages only for WORKER role
    if (pathname.startsWith('/worker') && role && role !== 'WORKER') {
      return NextResponse.redirect(new URL('/client/search', req.url))
    }
  }

  // ── Auth pages: /auth/* — bounce logged-in users away ─────────────────────
  if (pathname.startsWith('/auth')) {
    if (hasToken) {
      const dest = role === 'WORKER' ? '/worker/dashboard' : '/client/search'
      const res = NextResponse.redirect(new URL(dest, req.url))
      // Add Cache-Control so the browser doesn't cache this as a navigable page
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      return res
    }
  }

  // Default — allow through
  const res = NextResponse.next()

  // Prevent caching of protected pages so back-button can't show stale content
  if (pathname.startsWith('/worker') || pathname.startsWith('/client')) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }

  return res
}

export const config = {
  matcher: [
    '/worker/:path*',
    '/client/:path*',
    '/auth/:path*',
  ],
}
