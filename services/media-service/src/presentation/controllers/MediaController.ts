import { Request, Response, NextFunction } from 'express'
import { UploadMedia }              from '../../application/use-cases/UploadMedia'
import { DeleteMedia, GetMyMedia }  from '../../application/use-cases/MediaUseCases'
import { PrismaMediaRepository }   from '../../infrastructure/repositories/PrismaMediaRepository'
import { S3Service }               from '../../infrastructure/services/S3Service'
import { WorkerClient }            from '../../infrastructure/services/WorkerClient'

// ── Compose dependencies ──────────────────────────────────
const mediaRepo    = new PrismaMediaRepository()
const s3Service    = new S3Service()
const workerClient = new WorkerClient()

const uploadMedia = new UploadMedia(mediaRepo, s3Service, workerClient)
const deleteMedia = new DeleteMedia(mediaRepo, s3Service)
const getMyMedia  = new GetMyMedia(mediaRepo)

export class MediaController {
  // POST /media/upload
  // Accepts a single file via multipart/form-data field name "file"
  static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file provided' })
        return
      }

      const caption = req.body.caption as string | undefined
      const result  = await uploadMedia.execute(workerId, req.file, caption)

      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // GET /media/my
  static async getMy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      const result   = await getMyMedia.execute(workerId)
      res.status(200).json({ success: true, data: result, count: result.length })
    } catch (err) {
      next(err)
    }
  }

  // DELETE /media/:id
  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      await deleteMedia.execute(req.params.id, workerId)
      res.status(200).json({ success: true, message: 'File deleted successfully' })
    } catch (err) {
      next(err)
    }
  }
}
