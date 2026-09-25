import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { ITokenRefreshService } from '@domain/interfaces/ITokenRefreshService'
import { TokenRefreshService } from '@infrastructure/services/TokenRefreshService'
import { childLogger } from '@infrastructure/config/logger'

interface JwtPayload {
  userId: string
  role:   string
  email:  string
  iat?:   number
  exp?:   number
}

export function authenticateJwtWith(
  tokenRefreshService: ITokenRefreshService,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const log = childLogger(req)
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success:   false,
        message:   'Authorization token required',
        requestId: req.requestId,
      })
      return
    }

    const token = authHeader.split(' ')[1]

    try {
      // ── Happy path: valid, non-expired access token ──────────────────────
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

      ;(req as any).userId    = payload.userId
      ;(req as any).userRole  = payload.role
      ;(req as any).userEmail = payload.email

      next()
    } catch (err: any) {
      if (err.name !== 'TokenExpiredError') {
        // Malformed / wrong-secret token — reject immediately
        log.warn('Invalid access token presented', { reason: err.message })
        res.status(HttpStatus.UNAUTHORIZED).json({
          success:   false,
          message:   'Invalid token',
          requestId: req.requestId,
        })
        return
      }

      // ── Access token expired → try silent refresh ────────────────────────
      log.info('Access token expired — attempting silent refresh')

      const refreshed = await tokenRefreshService.refresh(req, res)

      if (!refreshed) {
        // Refresh token missing, expired, or invalid → force re-login
        log.warn('Silent refresh failed — clearing session')
        TokenRefreshService.clearCookies(res)
        res.status(HttpStatus.UNAUTHORIZED).json({
          success:   false,
          message:   'Session expired, please login',
          requestId: req.requestId,
        })
        return
      }

      // ── Refresh succeeded: inject payload and continue the original request
      log.info('Silent refresh succeeded — continuing request', { userId: refreshed.userId })

      ;(req as any).userId    = refreshed.userId
      ;(req as any).userRole  = refreshed.role
      ;(req as any).userEmail = refreshed.email

      next()
    }
  }
}

import { tokenRefreshService } from '@infrastructure/config/dependencies'
export const authenticateJwt = authenticateJwtWith(tokenRefreshService)
