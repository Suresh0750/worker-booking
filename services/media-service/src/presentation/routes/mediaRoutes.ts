import { Router }          from 'express'
import { MediaController } from '../controllers/MediaController'
import { upload }          from '../../infrastructure/config/multer'
import {
  extractUser,
  multerErrorHandler,
  validateRequest,
} from '../middlewares/index'
import {
  uploadMediaSchema,
  idParamsSchema,
} from '../../application/schemas/MediaSchemas'

const router = Router()

// All media routes require authentication
// API Gateway injects x-user-id and x-user-role after JWT validation

// POST   /media/upload
// Content-Type: multipart/form-data
// Field:  file  (the actual file)
// Field:  caption (optional text)
router.post(
  '/upload',
  extractUser,
  upload.single('file'),   // 'file' is the field name in the form
  multerErrorHandler,      // catches multer size/type errors before they hit global handler
  validateRequest({ body: uploadMediaSchema }),
  MediaController.upload,
)

// GET    /media/my  → list all uploaded files for the logged-in worker
router.get('/my', extractUser, MediaController.getMy)

// DELETE /media/:id → delete file from S3 + database
router.delete(
  '/:id',
  extractUser,
  validateRequest({ params: idParamsSchema }),
  MediaController.remove,
)

export default router
