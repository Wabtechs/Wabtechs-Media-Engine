export const MEDIA_EVENT_TYPES = {
  UPLOADED: 'media.uploaded',
  PROCESSING: 'media.processing',
  OPTIMIZED: 'media.optimized',
  VARIANT_CREATED: 'media.variant.created',
  BACKGROUND_REMOVED: 'media.background_removed',
  READY: 'media.ready',
  FAILED: 'media.failed',
  DELETED: 'media.deleted',
} as const;

export type MediaEventType = (typeof MEDIA_EVENT_TYPES)[keyof typeof MEDIA_EVENT_TYPES];

export interface MediaEventEnvelope {
  type: MediaEventType;
  version: number;
  aggregateId: string;
  tenantId: string;
  applicationId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}
