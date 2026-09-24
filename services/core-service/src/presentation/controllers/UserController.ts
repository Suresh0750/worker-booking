import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { HttpStatus } from '@domain/enums/HttpStatus'
import {
  getUserProfile,
  updateUserProfile,
} from '@infrastructure/config/dependencies'
import { s3Client } from '@infrastructure/config/s3'
import { BUCKET_NAME, getImageUrl, uploadImage } from '@infrastructure/services/storage.service'

const REGION = process.env.AWS_REGION!


function extractS3Key(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url)
    // virtual-hosted style: <bucket>.s3[.<region>].amazonaws.com/<key>
    if (hostname.endsWith('.amazonaws.com') && hostname.includes('.s3')) {
      return decodeURIComponent(pathname.slice(1)) // strip leading /
    }
    // path style: s3[.<region>].amazonaws.com/<bucket>/<key>
    if (hostname.startsWith('s3') && hostname.endsWith('.amazonaws.com')) {
      const parts = pathname.slice(1).split('/') // ['<bucket>', '<key...>']
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
      const file = (req as any).file as Express.Multer.File | undefined

      if (!file) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'No image file uploaded',
        })
        return
      }

      const userId = (req as any).userId as string

      // ── 1. Fetch the user so we can delete any existing avatar ───────────
      const existing = await getUserProfile.execute(userId)

      // ── 2. Build a unique S3 key ─────────────────────────────────────────
      const ext = path.extname(file.originalname).toLowerCase() // e.g. ".jpg"
      const key = `workers/${userId}/profile-${Date.now()}${ext}`;
//  `avatars/${userId}-${Date.now()}${ext}`
      // ── 3. Upload the new image to S3 ────────────────────────────────────
      await uploadImage(file,key)
      // ── 4. Build the public URL for the new object ───────────────────────
      const profileImage =key;
        // `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`

      // ── 5. Persist the new URL in the database ───────────────────────────
      const result = await updateUserProfile.execute(userId, { profileImage })

      // ── 6. Delete the old S3 object (best-effort, after DB is updated) ───
      if (existing.profileImage) {
        const oldKey = extractS3Key(existing.profileImage)
        if (oldKey) {
          // Fire-and-forget — a failure here must not fail the whole request
          s3Client
            .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: oldKey }))
            .catch(() => {
              // Log in production; silently ignore here so the response
              // is not blocked by a stale-object cleanup failure.
            })
        }
      }
      const imageUlr = await getImageUrl(result.profileImage ?? key)
      res.status(HttpStatus.OK).json({ success: true, data: { profileImage: imageUlr } })
    } catch (err) { next(err) }
  }
}
