import multer, { FileFilterCallback } from 'multer'
import { Request }                    from 'express'

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10')

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
]

// Use memoryStorage — file goes into buffer then straight to S3
// Never touches the disk
const storage = multer.memoryStorage()

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed. Allowed: jpeg, png, webp, mp4, mov`))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024, // Convert MB to bytes
  },
})
