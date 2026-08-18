import { createHash } from 'node:crypto';

export function computeChecksum(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getMimeTypeExtension(mimeType: string): string | null {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'application/pdf': 'pdf',
  };
  return map[mimeType] ?? null;
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function isAudioMimeType(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

export const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

export const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

export const ALLOWED_AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
]);

export function buildStorageKey(
  applicationId: string,
  mediaType: string,
  mediaId: string,
  variant: string,
  format: string,
): string {
  return `${applicationId}/${mediaType}/${mediaId}/${variant}.${format}`;
}
