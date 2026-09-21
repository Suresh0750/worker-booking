import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import {
  getUserProfile,
  updateUserProfile,
} from '@infrastructure/config/dependencies'

export class UserController {

  // GET /users/me
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getUserProfile.execute((req as any).userId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /users/:id  — any user by ID (used by other services)
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getUserProfile.execute(req.params.id)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await updateUserProfile.execute((req as any).userId, req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }
}
