/**
 * Example usage of the upload utilities
 */

import { uploadFile, UploadOptions } from './upload';
import { getAuthToken } from './auth';

// Example: Upload a video file
async function uploadVideoExample(file: File, orderId: string) {
  const token = getAuthToken();
  
  const options: UploadOptions = {
    file,
    orderId,
    fileType: 'RAW_VIDEO', // or 'PREVIEW_VIDEO', 'FINAL_VIDEO', etc.
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress.percentage}%`);
      // Update UI with progress.percentage
    },
    apiUrl: process.env.NEXT_PUBLIC_API_URL + '/files',
    token
  };

  const result = await uploadFile(options);
  
  if (result.success) {
    console.log('Upload successful! File ID:', result.fileId);
  } else {
    console.error('Upload failed:', result.error);
  }
  
  return result;
}

// Example: React component usage
/*
import { useState } from 'react';
import { uploadFile } from '@/lib/upload';
import { getAuthToken } from '@/lib/auth';

function VideoUploader({ orderId }: { orderId: string }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const result = await uploadFile({
      file,
      orderId,
      fileType: 'RAW_VIDEO',
      onProgress: (p) => setProgress(p.percentage),
      apiUrl: process.env.NEXT_PUBLIC_API_URL + '/files',
      token: getAuthToken()
    });

    setUploading(false);

    if (result.success) {
      alert('Upload complete!');
    } else {
      alert('Upload failed: ' + result.error);
    }
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}
*/

