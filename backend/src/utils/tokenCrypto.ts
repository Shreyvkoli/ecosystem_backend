import crypto from 'crypto';

type EncPayload = {
  alg: 'aes-256-gcm';
  iv: string;
  tag: string;
  data: string;
};

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not defined');
  }

  const raw = Buffer.from(key, 'base64');
  if (raw.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes base64-encoded (44 chars)');
  }

  return raw;
}

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);

  const enc = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncPayload = {
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: enc.toString('base64')
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

export function decryptToken(encToken: string): string {
  const json = Buffer.from(encToken, 'base64').toString('utf8');
  const payload = JSON.parse(json) as EncPayload;

  if (payload.alg !== 'aes-256-gcm') {
    throw new Error('Unsupported encryption algorithm');
  }

  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);

  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}
