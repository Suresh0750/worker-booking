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

  // PATCH /users/me/avatar
  static async updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // File uploaded via multer middleware is available at req.file
      const file = (req as any).file
      
      if (!file) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          success: false, 
          message: 'No image file uploaded' 
        })
        return
      }

      // Build the public URL for the uploaded file
      // In production, this should be a cloud storage URL (S3, Cloudinary, etc.)
      const profileImage = `/uploads/${file.filename}`

      const result = await updateUserProfile.execute((req as any).userId, { profileImage })
      res.status(HttpStatus.OK).json({ success: true, data: { profileImage: result.profileImage } })
    } catch (err) { next(err) }
  }
}
