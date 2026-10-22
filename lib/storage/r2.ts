import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'sanime-media';

export const isR2Configured = Boolean(accountId && accessKeyId && secretAccessKey);

let s3Client: S3Client | null = null;

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

export class R2StorageService {
  /**
   * Generates a pre-signed URL for direct browser-to-R2 uploads.
   */
  async createPresignedUploadUrl(
    objectKey: string,
    contentType: string,
    expiresInSeconds = 900 // 15 mins
  ): Promise<{ uploadUrl: string; objectKey: string }> {
    if (s3Client && isR2Configured) {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: contentType,
      });
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
      return { uploadUrl, objectKey };
    }

    // Local / Dev fallback endpoint
    const uploadUrl = `/api/storage/mock-upload?key=${encodeURIComponent(objectKey)}`;
    return { uploadUrl, objectKey };
  }

  /**
   * Generates a short-lived pre-signed URL for streaming or downloading.
   */
  async createPresignedDownloadUrl(
    objectKey: string,
    originalFilename?: string,
    expiresInSeconds = 7200 // 2 hours
  ): Promise<string> {
    if (s3Client && isR2Configured) {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ResponseContentDisposition: originalFilename
          ? `attachment; filename="${encodeURIComponent(originalFilename)}"`
          : undefined,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    }

    // Fallback: If downloading (filename provided), route to mock-download
    if (originalFilename) {
      return `/api/storage/mock-download?key=${encodeURIComponent(objectKey)}&filename=${encodeURIComponent(originalFilename)}`;
    }

    // Streaming fallback
    return `/api/storage/mock-media?key=${encodeURIComponent(objectKey)}`;
  }

  /**
   * Verifies an uploaded object in R2 and returns its verified size.
   */
  async verifyObject(objectKey: string, expectedSize?: number): Promise<{ verified: boolean; actualSizeBytes: number }> {
    if (s3Client && isR2Configured) {
      try {
        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });
        const res = await s3Client.send(command);
        return {
          verified: true,
          actualSizeBytes: res.ContentLength || expectedSize || 0,
        };
      } catch (err) {
        return {
          verified: false,
          actualSizeBytes: 0,
        };
      }
    }

    // Dev fallback: trust expected size or return verified
    return {
      verified: true,
      actualSizeBytes: expectedSize || 1024 * 1024 * 50,
    };
  }

  /**
   * Deletes an object from R2 and local disk storage.
   */
  async deleteObject(objectKey: string): Promise<boolean> {
    try {
      const cleanKey = objectKey.replace(/\.\./g, '');
      const localPaths = [
        path.join(process.cwd(), '.data', 'uploads', cleanKey),
        path.join(process.cwd(), '.data', 'uploads', path.basename(cleanKey)),
      ];
      for (const p of localPaths) {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
          try {
            fs.rmdirSync(path.dirname(p));
          } catch {}
        }
      }
    } catch {}

    if (s3Client && isR2Configured) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });
        await s3Client.send(command);
        return true;
      } catch (err) {
        return false;
      }
    }
    return true;
  }
}

export const r2Storage = new R2StorageService();
