import { google } from 'googleapis';
import { Readable } from 'stream';
import axios from 'axios';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Helper to authenticate
const getAuth = () => {
    // 1. Try Service Account
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        return new google.auth.JWT(
            process.env.GOOGLE_CLIENT_EMAIL,
            undefined,
            process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            SCOPES
        );
    }
    // 2. Try API Key (Limited, usually only for metadata, not alt=media on private files)
    if (process.env.GOOGLE_API_KEY) {
        return process.env.GOOGLE_API_KEY; // Managed by Drive construction
    }
    return null; // Fallback
};

export const driveService = {
    /**
     * Get file metadata
     */
    async getFileMetadata(fileId: string) {
        const auth = getAuth();
        if (auth && typeof auth !== 'string') {
            const drive = google.drive({ version: 'v3', auth });
            const res = await drive.files.get({ fileId, fields: 'id, name, mimeType, size' });
            return res.data;
        }

        // If no auth, we can't get private metadata easily. 
        // We'll return minimal info or throw.
        return { id: fileId, name: 'Unknown', mimeType: 'video/mp4' };
    },

    /**
     * Get a readable stream of the file content
     * Supports Range header for seeking
     */
    async getFileStream(fileId: string, range?: string): Promise<{ stream: Readable; contentLength: number; contentType: string; contentRange?: string }> {
        const auth = getAuth();

        if (auth && typeof auth !== 'string') {
            // Use Authenticated Drive API (Service Account)
            const drive = google.drive({ version: 'v3', auth });

            // Note: 'drive.files.get' with 'stream' doesn't explicitly support 'Range' header via library easily in all versions, 
            // but we can pass it in headers.
            const res = await drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'stream', headers: range ? { Range: range } : {} }
            );

            // Extract headers
            const contentLength = Number(res.headers['content-length'] || 0);
            const contentType = res.headers['content-type'] || 'application/octet-stream';
            const contentRange = res.headers['content-range'];

            return {
                stream: res.data,
                contentLength,
                contentType,
                contentRange
            };
        }

        // Fallback: Try Public Link download (Axios)
        // Works for "Anyone with link"
        const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const axiosRes = await axios.get(publicUrl, {
            responseType: 'stream',
            headers: range ? { Range: range } : {}
        });

        return {
            stream: axiosRes.data,
            contentLength: Number(axiosRes.headers['content-length'] || 0),
            contentType: axiosRes.headers['content-type'] || 'application/octet-stream',
            contentRange: axiosRes.headers['content-range']
        };
    }
};
