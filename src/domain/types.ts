import { z } from 'zod';

export const MediaStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  OPTIMIZING: 'optimizing',
  READY: 'ready',
  FAILED: 'failed',
  DELETED: 'deleted',
} as const;

export type MediaStatus = (typeof MediaStatus)[keyof typeof MediaStatus];

export const MediaType = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const MediaPrivacy = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export type MediaPrivacy = (typeof MediaPrivacy)[keyof typeof MediaPrivacy];

export const ImageFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
  AVIF: 'avif',
  GIF: 'gif',
} as const;

export type ImageFormat = (typeof ImageFormat)[keyof typeof ImageFormat];

export const VariantSize = {
  THUMBNAIL: 'thumbnail',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  ORIGINAL: 'original',
} as const;

export type VariantSize = (typeof VariantSize)[keyof typeof VariantSize];

export const JobStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const JobType = {
  UPLOAD: 'media.upload',
  OPTIMIZE: 'media.optimize',
  GENERATE_VARIANTS: 'media.generate_variants',
  BACKGROUND_REMOVAL: 'media.background_removal',
  VIDEO_TRANSCODE: 'media.video_transcode',
  GENERATE_THUMBNAIL: 'media.generate_thumbnail',
  CLEANUP: 'media.cleanup',
} as const;

export type JobType = (typeof JobType)[keyof typeof JobType];

export const EventTypes = {
  UPLOADED: 'media.uploaded',
  PROCESSING: 'media.processing',
  OPTIMIZED: 'media.optimized',
  VARIANT_CREATED: 'media.variant.created',
  BACKGROUND_REMOVED: 'media.background_removed',
  READY: 'media.ready',
  FAILED: 'media.failed',
  DELETED: 'media.deleted',
} as const;

export type EventTypes = (typeof EventTypes)[keyof typeof EventTypes];

export interface MediaEntity {
  id: string;
  applicationId: string;
  tenantId: string;
  ownerId: string;
  type: MediaType;
  privacy: MediaPrivacy;
  status: MediaStatus;
  originalFilename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  format: ImageFormat | null;
  blurhash: string | null;
  checksum: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MediaVariant {
  id: string;
  mediaId: string;
  size: VariantSize;
  format: ImageFormat;
  width: number;
  height: number;
  sizeBytes: number;
  storageKey: string;
  url: string;
  createdAt: string;
}

export interface MediaJob {
  id: string;
  mediaId: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface MediaProfileVariant {
  size: VariantSize;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: ImageFormat;
}

export interface MediaProfile {
  name: string;
  variants: MediaProfileVariant[];
}
