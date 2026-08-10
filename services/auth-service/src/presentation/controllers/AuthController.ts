import { Request, Response, NextFunction } from 'express'
import { HttpStatus }         from '../../domain/enums/HttpStatus'
import { registerUser,loginUser,refreshAccessToken,logoutUser,otp } from '../../config/dependencies'

export class AuthController {
  // POST /auth/register
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registerUser.execute(req.body)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/login
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await loginUser.execute(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/refresh
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await refreshAccessToken.execute(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/send-otp
  static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await otp.send(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/verify-otp
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await otp.verify(req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/logout
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await logoutUser.execute(req.body)
      res.status(HttpStatus.OK).json({ success: true, message: 'Logged out successfully' })
    } catch (err) {
      next(err)
    }
  }

  // POST /auth/logout-all  — logs out from every device
  static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId // set by JWT middleware in API Gateway
      await logoutUser.executeAll(userId)
      res.status(HttpStatus.OK).json({ success: true, message: 'Logged out from all devices' })
    } catch (err) {
      next(err)
    }
  }

  // POST /internal/auth/verify — called by API Gateway to validate a JWT
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jwt = await import('jsonwebtoken')
      const { token } = req.body

      const payload = jwt.default.verify(token, process.env.JWT_SECRET as string)
      res.status(HttpStatus.OK).json({ success: true, data: payload })
    } catch (err: any) {
      res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: 'Invalid or expired token' })
    }
  }
}
