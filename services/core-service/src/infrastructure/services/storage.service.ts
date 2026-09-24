import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@infrastructure/config/s3";

const BUCKET_NAME = "uploads";

export async function uploadImage(
  file: Express.Multer.File,
  key: string
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  return {
    key,
    bucket: BUCKET_NAME,
  };
}