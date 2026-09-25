import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
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
    Bucket: BUCKET_NAME!,
    Key: key,
  });

  const imageUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60, // 1 hour
  });
  return imageUrl;
}


export async function deleteImage(key: string | null | undefined): Promise<boolean> {
  if (!key) return false;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
  return true;
}

export async function deleteImageSilent(key: string | null | undefined): Promise<void> {
  if (!key) return;
  deleteImage(key).catch(() => {
    // intentionally fire-and-forget; caller is not affected by cleanup failures
  });
}
