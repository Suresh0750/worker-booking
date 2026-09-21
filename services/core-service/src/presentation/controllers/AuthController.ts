import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { HttpStatus } from '@domain/enums/HttpStatus'
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  otpUseCase,
} from '@infrastructure/config/dependencies'

const COOKIE_NAME = 'refresh_token'
const IS_PROD     = process.env.NODE_ENV === 'production'
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30')

function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: 'strict',
    path:     '/',
    maxAge:   REFRESH_DAYS * 24 * 60 * 60 * 1000,
  })
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: IS_PROD, sameSite: 'strict', path: '/' })
}

export class AuthController {

  // POST /auth/register
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registerUser.execute(req.body)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /auth/login
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loginUser.execute(req.body)

      // Store refresh token in httpOnly cookie — never expose it in the body
      setRefreshCookie(res, result.refreshToken)

      res.status(HttpStatus.OK).json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      })
    } catch (err) { next(err) }
  }

  // POST /auth/send-otp
  static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await otpUseCase.send(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /auth/verify-otp
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await otpUseCase.verify(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /auth/refresh — reads refresh token from cookie, not body
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAME] as string | undefined

      if (!refreshToken) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'No refresh token' })
        return
      }

      const result = await refreshAccessToken.execute({ refreshToken })

      // Rotate cookie with the new refresh token
      setRefreshCookie(res, result.refreshToken)

      res.status(HttpStatus.OK).json({
        success: true,
        data: { accessToken: result.accessToken },
      })
    } catch (err) { next(err) }
  }

  // POST /auth/logout — reads refresh token from cookie, not body
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAME] as string | undefined

      if (refreshToken) {
        await logoutUser.execute({ refreshToken })
      }

      clearRefreshCookie(res)
      res.status(HttpStatus.OK).json({ success: true, message: 'Logged out successfully' })
    } catch (err) { next(err) }
  }

  // POST /auth/send-login-otp  — sends OTP to an already-registered email/phone
  static async sendLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await otpUseCase.sendForRegistered(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /auth/verify-login-otp  — verifies a LOGIN-purpose OTP
  static async verifyLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await otpUseCase.verify(req.body, 'LOGIN')
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId // injected by API Gateway → extractUser
      await logoutUser.executeAll(userId)
      clearRefreshCookie(res)
      res.status(HttpStatus.OK).json({ success: true, message: 'Logged out from all devices' })
    } catch (err) { next(err) }
  }

  // POST /internal/auth/verify — called by API Gateway to validate any JWT
  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body
      const payload = jwt.verify(token, process.env.JWT_SECRET as string)
      res.status(HttpStatus.OK).json({ success: true, data: payload })
    } catch {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Invalid or expired token' })
    }
  }
}
