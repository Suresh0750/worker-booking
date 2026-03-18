import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl }  from '@aws-sdk/s3-request-presigner'
import { s3Client, S3_BUCKET } from '../config/s3'
import { IS3Service, UploadResult } from '../../domain/interfaces/IServiceInterfaces'
import { logger } from '../config/logger'

export class S3Service implements IS3Service {

  async upload(
    file: Express.Multer.File,
    folder: string,
    fileName: string,
  ): Promise<UploadResult> {
    const s3Key = `${folder}/${fileName}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket:      S3_BUCKET,
        Key:         s3Key,
        Body:        file.buffer,
        ContentType: file.mimetype,
        // Files are publicly readable via CDN URL
        ACL:         'public-read',
      }),
    )

    // Build public CDN URL
    const cdnUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION ?? 'ap-south-1'}.amazonaws.com/${s3Key}`

    logger.info(`Uploaded to S3: ${s3Key}`)
    return { s3Key, cdnUrl }
  }

  async delete(s3Key: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key:    s3Key,
      }),
    )
    logger.info(`Deleted from S3: ${s3Key}`)
  }

  async getPresignedUrl(s3Key: string, expiresInSeconds = 3600): Promise<string> {
    // Generates a temporary signed URL — useful for private files
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key })
    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds })
  }
}
