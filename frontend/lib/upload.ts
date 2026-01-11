/**
 * File upload utilities for S3 direct and multipart uploads
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  file: File;
  orderId: string;
  fileType: 'RAW_VIDEO' | 'PREVIEW_VIDEO' | 'FINAL_VIDEO' | 'PORTFOLIO_VIDEO' | 'DOCUMENT' | 'OTHER';
  onProgress?: (progress: UploadProgress) => void;
  apiUrl?: string;
  token?: string;
}

export interface UploadResult {
  fileId: string;
  success: boolean;
  error?: string;
}

// Multipart threshold (100MB)
const MULTIPART_THRESHOLD = 100 * 1024 * 1024;
const PART_SIZE = 5 * 1024 * 1024; // 5MB per part

/**
 * Upload file directly to S3 using presigned URL
 * Best for files < 100MB
 */
export async function uploadDirect({
  file,
  orderId,
  fileType,
  onProgress,
  apiUrl = '/api/files',
  token
}: UploadOptions): Promise<UploadResult> {
  try {
    // Step 1: Request presigned URL from backend
    const response = await fetch(`${apiUrl}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        orderId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileType
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        fileId: '',
        success: false,
        error: error.error || 'Failed to get upload URL'
      };
    }

    const { fileId, uploadUrl } = await response.json();

    // Step 2: Upload directly to S3 using presigned URL
    await uploadToS3(file, uploadUrl, onProgress);

    // Step 3: Mark upload as complete
    const completeResponse = await fetch(`${apiUrl}/${fileId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({})
    });

    if (!completeResponse.ok) {
      return {
        fileId,
        success: false,
        error: 'Upload completed but failed to update status'
      };
    }

    return {
      fileId,
      success: true
    };
  } catch (error) {
    return {
      fileId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload large file using multipart upload
 * Best for files >= 100MB
 */
export async function uploadMultipart({
  file,
  orderId,
  fileType,
  onProgress,
  apiUrl = '/api/files',
  token
}: UploadOptions): Promise<UploadResult> {
  try {
    // Step 1: Initiate multipart upload
    const initiateResponse = await fetch(`${apiUrl}/multipart/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        orderId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileType
      })
    });

    if (!initiateResponse.ok) {
      const error = await initiateResponse.json();
      return {
        fileId: '',
        success: false,
        error: error.error || 'Failed to initiate multipart upload'
      };
    }

    const { fileId, uploadId } = await initiateResponse.json();

    // Step 2: Calculate parts
    const totalParts = Math.ceil(file.size / PART_SIZE);
    const parts: Array<{ etag: string; partNumber: number }> = [];
    let uploadedBytes = 0;

    // Step 3: Upload each part
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      // Get presigned URL for this part
      const partUrlResponse = await fetch(`${apiUrl}/multipart/part-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          fileId,
          uploadId,
          partNumber
        })
      });

      if (!partUrlResponse.ok) {
        // Abort multipart upload on failure
        await fetch(`${apiUrl}/multipart/abort`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({ fileId, uploadId })
        });

        return {
          fileId,
          success: false,
          error: 'Failed to get part upload URL'
        };
      }

      const { partUrl } = await partUrlResponse.json();

      // Calculate part boundaries
      const start = (partNumber - 1) * PART_SIZE;
      const end = Math.min(start + PART_SIZE, file.size);
      const partBlob = file.slice(start, end);

      // Upload part
      const uploadResponse = await fetch(partUrl, {
        method: 'PUT',
        body: partBlob
      });

      if (!uploadResponse.ok) {
        // Abort on failure
        await fetch(`${apiUrl}/multipart/abort`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({ fileId, uploadId })
        });

        return {
          fileId,
          success: false,
          error: 'Failed to upload part'
        };
      }

      // Get ETag from response headers
      const etag = uploadResponse.headers.get('ETag')?.replace(/"/g, '') || '';
      parts.push({ etag, partNumber });

      // Update progress
      uploadedBytes += partBlob.size;
      if (onProgress) {
        onProgress({
          loaded: uploadedBytes,
          total: file.size,
          percentage: Math.round((uploadedBytes / file.size) * 100)
        });
      }
    }

    // Step 4: Complete multipart upload
    const completeResponse = await fetch(`${apiUrl}/multipart/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        fileId,
        uploadId,
        parts
      })
    });

    if (!completeResponse.ok) {
      return {
        fileId,
        success: false,
        error: 'Failed to complete multipart upload'
      };
    }

    return {
      fileId,
      success: true
    };
  } catch (error) {
    return {
      fileId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Multipart upload failed'
    };
  }
}

/**
 * Main upload function - automatically chooses direct or multipart
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const useMultipart = options.file.size >= MULTIPART_THRESHOLD;

  if (useMultipart) {
    return uploadMultipart(options);
  } else {
    return uploadDirect(options);
  }
}

/**
 * Helper to upload file directly to S3 using presigned URL
 */
async function uploadToS3(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage: Math.round((e.loaded / e.total) * 100)
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

