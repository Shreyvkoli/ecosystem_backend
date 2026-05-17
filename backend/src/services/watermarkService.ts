/**
 * Watermark Service
 * 
 * Server-side video watermarking using FFmpeg.
 * 
 * Flow:
 * 1. Editor uploads preview link (Google Drive/Dropbox)
 * 2. Server downloads the file temporarily
 * 3. FFmpeg: Compress to 720p + Add diagonal watermark text
 * 4. Upload watermarked version to a temporary public location
 * 5. Creator gets ONLY the watermarked preview URL
 * 6. On "Approve" → Original link is unlocked
 * 
 * Watermark text: "CreatorBridge Preview — Order #{shortId}"
 */

import { spawn } from 'child_process';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface WatermarkResult {
  success: boolean;
  watermarkedPath?: string;
  originalLink: string;
  error?: string;
}

/**
 * Check if FFmpeg is available on the system
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Download a file from a public URL to a temporary location
 */
async function downloadToTemp(url: string, orderId: string): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), 'creatorbridge-watermark');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const ext = '.mp4'; // Default to mp4
  const fileName = `raw_${orderId}_${crypto.randomBytes(4).toString('hex')}${ext}`;
  const filePath = path.join(tmpDir, fileName);

  console.log(`[Watermark] Downloading from: ${url.substring(0, 50)}...`);
  
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download file: HTTP ${response.status}`);
  }

  // Stream to file
  const { Readable } = await import('stream');
  const { pipeline } = await import('stream/promises');
  const nodeStream = Readable.fromWeb(response.body as any);
  const writeStream = fs.createWriteStream(filePath);
  
  await pipeline(nodeStream, writeStream);
  
  const stats = fs.statSync(filePath);
  console.log(`[Watermark] Downloaded: ${fileName} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
  
  return filePath;
}

/**
 * Apply watermark + compress to 720p using FFmpeg
 */
async function applyWatermark(
  inputPath: string,
  orderId: string,
  orderTitle?: string
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), 'creatorbridge-watermark');
  const outputFileName = `preview_${orderId}_${crypto.randomBytes(4).toString('hex')}.mp4`;
  const outputPath = path.join(tmpDir, outputFileName);

  // Short order ID for watermark
  const shortId = orderId.substring(0, 8).toUpperCase();
  const watermarkText = `CreatorBridge Preview - Order #${shortId}`;

  // FFmpeg command:
  // 1. Scale to max 720p height (preserving aspect ratio)
  // 2. Add diagonal watermark text
  // 3. Use fast encoding preset
  const ffmpegArgs = [
    '-i', inputPath,
    '-vf', [
      // Scale to 720p max height, preserve aspect ratio
      'scale=-2:\'min(720,ih)\'',
      // Add watermark text (diagonal, semi-transparent, repeating)
      `drawtext=text='${watermarkText}':fontsize=28:fontcolor=white@0.3:x='(w-text_w)/2':y='(h-text_h)/2':borderw=1:bordercolor=black@0.2`,
      // Add a second watermark offset for more coverage
      `drawtext=text='${watermarkText}':fontsize=20:fontcolor=white@0.2:x='w/4':y='h/4'`,
      `drawtext=text='${watermarkText}':fontsize=20:fontcolor=white@0.2:x='w*3/4-text_w':y='h*3/4'`
    ].join(','),
    // Video codec: H.264 with fast preset
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '28', // Lower quality for preview (smaller file)
    // Audio: Copy as-is
    '-c:a', 'aac',
    '-b:a', '128k',
    // Max duration: 30 minutes (safety limit)
    '-t', '1800',
    // Overwrite output
    '-y',
    outputPath
  ];

  console.log(`[Watermark] Processing: ${inputPath} → ${outputPath}`);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    
    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const stats = fs.statSync(outputPath);
        console.log(`[Watermark] Done! Output: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
        resolve(outputPath);
      } else {
        console.error(`[Watermark] FFmpeg failed with code ${code}`);
        console.error(`[Watermark] stderr: ${stderr.substring(stderr.length - 500)}`);
        reject(new Error(`FFmpeg failed with exit code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg process error: ${err.message}`));
    });

    // Timeout: 10 minutes max processing time
    setTimeout(() => {
      ffmpeg.kill('SIGTERM');
      reject(new Error('FFmpeg processing timed out (10 min limit)'));
    }, 10 * 60 * 1000);
  });
}

/**
 * Clean up temporary files
 */
export function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Watermark] Cleaned up: ${path.basename(filePath)}`);
    }
  } catch (e) {
    console.error(`[Watermark] Cleanup failed for ${filePath}:`, e);
  }
}

/**
 * Clean up all old watermark temp files (older than 24 hours)
 */
export function cleanupOldTempFiles(): void {
  const tmpDir = path.join(os.tmpdir(), 'creatorbridge-watermark');
  if (!fs.existsSync(tmpDir)) return;

  const files = fs.readdirSync(tmpDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const file of files) {
    const filePath = path.join(tmpDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`[Watermark] Cleaned old temp: ${file}`);
      }
    } catch (e) { /* ignore */ }
  }
}

/**
 * Main watermark pipeline
 * 
 * Downloads → Watermarks → Returns local path for serving
 * 
 * NOTE: In production, you'd upload the watermarked file to cloud storage (S3/R2)
 * and return a public URL. For MVP, we serve it from the server's temp directory.
 */
export async function processPreviewWatermark(
  fileId: string,
  publicLink: string,
  orderId: string
): Promise<WatermarkResult> {
  // Check FFmpeg availability
  const ffmpegReady = await isFFmpegAvailable();
  if (!ffmpegReady) {
    console.warn('[Watermark] FFmpeg not available. Falling back to direct link (NO WATERMARK).');
    return {
      success: false,
      originalLink: publicLink,
      error: 'FFMPEG_NOT_AVAILABLE'
    };
  }

  let downloadedPath: string | null = null;
  let watermarkedPath: string | null = null;

  try {
    // Step 1: Download
    downloadedPath = await downloadToTemp(publicLink, orderId);

    // Step 2: Watermark + Compress
    watermarkedPath = await applyWatermark(downloadedPath, orderId);

    // Step 3: Update file record with watermark info
    await (prisma.file as any).update({
      where: { id: fileId },
      data: {
        metadata: JSON.stringify({
          watermarked: true,
          watermarkedAt: new Date().toISOString(),
          watermarkedPath: watermarkedPath,
          originalLink: publicLink
        })
      }
    });

    console.log(`[Watermark] ✅ Preview watermarked for Order ${orderId.substring(0, 8)}`);

    return {
      success: true,
      watermarkedPath,
      originalLink: publicLink
    };

  } catch (error: any) {
    console.error(`[Watermark] Pipeline failed for ${orderId}:`, error.message);

    // Cleanup on failure
    if (downloadedPath) cleanupTempFile(downloadedPath);
    if (watermarkedPath) cleanupTempFile(watermarkedPath);

    return {
      success: false,
      originalLink: publicLink,
      error: error.message
    };
  } finally {
    // Always clean up the downloaded raw file
    if (downloadedPath) cleanupTempFile(downloadedPath);
  }
}
