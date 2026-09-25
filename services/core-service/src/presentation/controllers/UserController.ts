import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { BadRequestError } from '@domain/errors/AppError'
import {
  getUserProfile,
  updateUserProfile,
} from '@infrastructure/config/dependencies'
import { s3Client } from '@infrastructure/config/s3'
import { BUCKET_NAME, getImageUrl, uploadImage } from '@infrastructure/services/storage.service'
import { childLogger } from '@infrastructure/config/logger'


function extractS3Key(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname.endsWith('.amazonaws.com') && hostname.includes('.s3')) {
      return decodeURIComponent(pathname.slice(1))
    }
    if (hostname.startsWith('s3') && hostname.endsWith('.amazonaws.com')) {
      const parts = pathname.slice(1).split('/')
      return decodeURIComponent(parts.slice(1).join('/'))
    }
  } catch {
    // not a valid URL — skip
  }
  return null
}

export class UserController {

  // GET /users/me
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Get own user profile requested', { userId })
    try {
      const result = await getUserProfile.execute(userId)
      log.info('Own user profile fetched', { userId })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /users/:id  — any user by ID (used by other services)
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    log.info('Get user by id requested', { userId: req.params.id })
    try {
      const result = await getUserProfile.execute(req.params.id)
      log.info('User profile fetched by id', { userId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Update own user profile requested', { userId })
    try {
      const result = await updateUserProfile.execute(userId, req.body)
      log.info('User profile updated', { userId })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /users/me/avatar
  static async updateAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId as string
    log.info('Update user avatar requested', { userId })
    try {
      const file = (req as any).file as Express.Multer.File | undefined
      if (!file) throw new BadRequestError('No image file uploaded')

      // ── 1. Fetch the user to delete any existing avatar ──────────────────
      const existing = await getUserProfile.execute(userId)

      // ── 2. Build a unique S3 key ─────────────────────────────────────────
      const ext = path.extname(file.originalname).toLowerCase()
      const key = `workers/${userId}/profile-${Date.now()}${ext}`

      // ── 3. Upload the new image to S3 ────────────────────────────────────
      await uploadImage(file, key)

      // ── 4. Persist the new key in the database ───────────────────────────
      const result = await updateUserProfile.execute(userId, { profileImage: key })

      // ── 5. Delete the old S3 object (best-effort) ────────────────────────
      if (existing.profileImage) {
        const oldKey = extractS3Key(existing.profileImage)
        if (oldKey) {
          s3Client
            .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: oldKey }))
            .catch(() => { /* silently ignore stale-object cleanup failures */ })
        }
      }

      const imageUrl = await getImageUrl(result.profileImage ?? key)
      log.info('User avatar updated', { userId })
      res.status(HttpStatus.OK).json({ success: true, data: { profileImage: imageUrl } })
    } catch (err) { next(err) }
  }
}
