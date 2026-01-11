import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_S3_ENDPOINT || process.env.R2_ENDPOINT,
  forcePathStyle: (process.env.AWS_S3_FORCE_PATH_STYLE || process.env.R2_FORCE_PATH_STYLE) === 'true',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
  }
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.R2_BUCKET!;
export const PRESIGNED_URL_EXPIRY_SECONDS = Number(process.env.AWS_PRESIGNED_URL_EXPIRY_SECONDS || process.env.R2_PRESIGNED_URL_EXPIRY_SECONDS || 600);

/**
 * Generate presigned URL for direct upload (best for files < 100MB)
 */
export const generateUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = PRESIGNED_URL_EXPIRY_SECONDS
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType
    // Files are private by default - no ACL needed
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Generate presigned URL for downloading/viewing files
 */
export const generateDownloadUrl = async (
  key: string,
  expiresIn: number = PRESIGNED_URL_EXPIRY_SECONDS,
  opts?: {
    responseContentType?: string;
    responseContentDisposition?: string;
  }
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ResponseContentType: opts?.responseContentType,
    ResponseContentDisposition: opts?.responseContentDisposition
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Initialize multipart upload
 * Returns uploadId for subsequent part uploads
 */
export const initiateMultipartUpload = async (
  key: string,
  contentType: string
): Promise<string> => {
  const command = new CreateMultipartUploadCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType
    // Files are private by default
  });

  const response = await s3Client.send(command);
  
  if (!response.UploadId) {
    throw new Error('Failed to initiate multipart upload');
  }

  return response.UploadId;
};

/**
 * Generate presigned URL for uploading a specific part
 */
export const generatePartUploadUrl = async (
  key: string,
  uploadId: string,
  partNumber: number,
  expiresIn: number = PRESIGNED_URL_EXPIRY_SECONDS
): Promise<string> => {
  const command = new UploadPartCommand({
    Bucket: S3_BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Complete multipart upload
 */
export const completeMultipartUpload = async (
  key: string,
  uploadId: string,
  parts: Array<{ ETag: string; PartNumber: number }>
): Promise<void> => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: S3_BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts
    }
  });

  await s3Client.send(command);
};

/**
 * Abort multipart upload (cleanup on failure)
 */
export const abortMultipartUpload = async (
  key: string,
  uploadId: string
): Promise<void> => {
  const command = new AbortMultipartUploadCommand({
    Bucket: S3_BUCKET,
    Key: key,
    UploadId: uploadId
  });

  await s3Client.send(command);
};

/**
 * List parts of an in-progress multipart upload
 */
export const listMultipartParts = async (
  key: string,
  uploadId: string
): Promise<Array<{ PartNumber: number; ETag: string; Size: number }>> => {
  const command = new ListPartsCommand({
    Bucket: S3_BUCKET,
    Key: key,
    UploadId: uploadId
  });

  const response = await s3Client.send(command);
  return (response.Parts || []).map(part => ({
    PartNumber: part.PartNumber!,
    ETag: part.ETag!,
    Size: part.Size || 0
  }));
};

/**
 * Generate S3 key for file storage
 */
export const generateS3Key = (
  orderId: string,
  fileType: string,
  fileName: string,
  version?: number
): string => {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extMatch = sanitizedFileName.match(/(\.[a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';

  if (fileType === 'RAW_VIDEO') {
    const timestamp = Date.now();
    return `orders/${orderId}/raw/${timestamp}-${sanitizedFileName}`;
  }

  if (fileType === 'PREVIEW_VIDEO') {
    const v = version || 1;
    return `orders/${orderId}/preview/v${v}${ext}`;
  }

  if (fileType === 'FINAL_VIDEO') {
    return `orders/${orderId}/final/final${ext}`;
  }

  const timestamp = Date.now();
  return `orders/${orderId}/${fileType}/${timestamp}-${sanitizedFileName}`;
};

