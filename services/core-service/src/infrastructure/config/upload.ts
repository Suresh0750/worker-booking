import multer from 'multer'

// Use memory storage — the file buffer is handed off to S3 in the controller.
// No temporary files are written to disk.

const AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (AVATAR_MIME.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'))
    }
  },
})

const DOCUMENT_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (DOCUMENT_MIME.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPEG, PNG and WebP files are allowed for documents'))
    }
  },
})

const PORTFOLIO_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
])

export const portfolioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (PORTFOLIO_MIME.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only images (JPEG, PNG, WebP, GIF) and videos (MP4, MOV, WebM, AVI) are allowed'))
    }
  },
})
