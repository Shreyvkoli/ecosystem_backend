import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import type { Readable } from 'stream';
import { decryptToken, encryptToken } from './tokenCrypto.js';

const prisma = new PrismaClient();

export function getYouTubeOAuthClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing YouTube OAuth env vars (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI)');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function buildYouTubeAuthUrl(state: string) {
  const oauth2Client = getYouTubeOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    state
  });
}

export async function upsertYouTubeAccountFromCode(userId: string, code: string) {
  const oauth2Client = getYouTubeOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    // Refresh token may be missing if the user already consented and Google didn't re-issue.
    // In that case, we cannot proceed because uploads will stop working once access token expires.
    throw new Error('Google did not return a refresh token. Try disconnecting the app in Google Account permissions and reconnect.');
  }

  const accessToken = tokens.access_token || '';
  const refreshToken = tokens.refresh_token;

  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const channelResp = await youtube.channels.list({
    part: ['id', 'snippet'],
    mine: true
  });

  const channelId = channelResp.data.items?.[0]?.id || null;

  await prisma.youTubeAccount.upsert({
    where: { userId },
    create: {
      userId,
      channelId,
      accessTokenEnc: encryptToken(accessToken),
      refreshTokenEnc: encryptToken(refreshToken),
      scope: typeof tokens.scope === 'string' ? tokens.scope : null,
      tokenType: tokens.token_type || null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    },
    update: {
      channelId,
      accessTokenEnc: encryptToken(accessToken),
      refreshTokenEnc: encryptToken(refreshToken),
      scope: typeof tokens.scope === 'string' ? tokens.scope : null,
      tokenType: tokens.token_type || null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    }
  });

  return { channelId };
}

export async function getAuthorizedYouTubeClientForUser(userId: string) {
  const account = await prisma.youTubeAccount.findUnique({ where: { userId } });
  if (!account) {
    throw new Error('YouTube account not connected');
  }

  const oauth2Client = getYouTubeOAuthClient();

  const accessToken = decryptToken(account.accessTokenEnc);
  const refreshToken = decryptToken(account.refreshTokenEnc);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: account.expiryDate ? account.expiryDate.getTime() : undefined
  });

  // Ensure we have a non-expired access token (googleapis refreshes automatically)
  await oauth2Client.getAccessToken();

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  return { youtube, oauth2Client, account };
}

export type YouTubeVisibility = 'public' | 'private' | 'unlisted';

export async function uploadVideoToYouTube(params: {
  userId: string;
  videoStream: Readable;
  title: string;
  description?: string;
  tags?: string[];
  visibility: YouTubeVisibility;
  scheduledPublishAt?: string;
}): Promise<{ videoId: string; videoUrl: string }> {
  const { youtube } = await getAuthorizedYouTubeClientForUser(params.userId);

  const status: any = {
    privacyStatus: params.visibility
  };

  if (params.scheduledPublishAt) {
    status.publishAt = params.scheduledPublishAt;
    // YouTube requires scheduled videos to start as private
    status.privacyStatus = 'private';
  }

  const resp = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: params.title,
        description: params.description || '',
        tags: params.tags || []
      },
      status
    },
    media: {
      body: params.videoStream
    }
  });

  const videoId = resp.data.id;
  if (!videoId) {
    throw new Error('YouTube upload failed (missing video id)');
  }

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
}
