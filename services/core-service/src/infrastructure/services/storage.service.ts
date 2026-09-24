import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@infrastructure/config/s3";

export const BUCKET_NAME = "uploads";

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

export async function getImageUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const imageUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60, // 1 hour
  });
  return imageUrl;
}