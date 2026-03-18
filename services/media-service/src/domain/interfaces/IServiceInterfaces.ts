// ── S3 Service ────────────────────────────────────────────
export interface UploadResult {
  s3Key:  string
  cdnUrl: string
}

export interface IS3Service {
  upload(
    file: Express.Multer.File,
    folder: string,
    fileName: string,
  ): Promise<UploadResult>
  delete(s3Key: string): Promise<void>
  getPresignedUrl(s3Key: string, expiresInSeconds?: number): Promise<string>
}

// ── Worker Service client ─────────────────────────────────
export interface IWorkerClient {
  attachPortfolio(payload: {
    workerId:  string
    mediaUrl:  string
    mediaType: string
    caption?:  string
  }): Promise<void>
}
