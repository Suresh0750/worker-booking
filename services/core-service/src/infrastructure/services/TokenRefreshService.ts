import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import {
  ITokenRefreshService,
  RefreshedTokenPayload,
} from '@domain/interfaces/ITokenRefreshService'
import { RefreshAccessToken } from '@application/use-cases/auth/RefreshAccessToken'
import { logger } from '@infrastructure/config/logger'

const COOKIE_NAME  = 'refresh_token'
const IS_PROD      = process.env.NODE_ENV === 'production'
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30')


export class TokenRefreshService implements ITokenRefreshService {
  constructor(private readonly refreshUseCase: RefreshAccessToken) {}

  async refresh(req: Request, res: Response): Promise<RefreshedTokenPayload | null> {
    const rawToken = req.cookies?.[COOKIE_NAME] as string | undefined

    // No cookie present — nothing to refresh
    if (!rawToken) return null

    try {
      const result = await this.refreshUseCase.execute({ refreshToken: rawToken })

      // ── Rotate cookie ─────────────────────────────────────────────────────
      res.cookie(COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure:   IS_PROD,
        sameSite: 'strict',
        path:     '/',
        maxAge:   REFRESH_DAYS * 24 * 60 * 60 * 1000,
      })

      // ── Expose new access token in a response header ───────────────────────
      // The client reads this header and silently replaces its in-memory JWT.
      res.setHeader('x-new-access-token', result.accessToken)

      // ── Decode payload to hand back to the middleware ─────────────────────
      const payload = jwt.decode(result.accessToken) as {
        userId: string
        role:   string
        email:  string
      }

      logger.info({
        message:   'Access token silently refreshed',
        requestId: (req as any).requestId,
        userId:    payload.userId,
      })

      return { userId: payload.userId, role: payload.role, email: payload.email }
    } catch (err: any) {
      // Refresh token was expired or invalid — signal the caller to clear & 401
      logger.warn({
        message:   'Silent token refresh failed',
        reason:    err?.message ?? 'unknown',
        requestId: (req as any).requestId,
      })
      return null
    }
  }

  /** Clears both the refresh-token cookie (call after a failed refresh). */
  static clearCookies(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure:   IS_PROD,
      sameSite: 'strict',
      path:     '/',
    })
  }
}
