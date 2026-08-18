import type { StorageProvider } from '../infrastructure/storage/index.js';
import type { CDNProvider } from '../infrastructure/cdn/index.js';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { getDatabase, schema } from '../infrastructure/database/index.js';
import { getQueue } from '../infrastructure/queue/index.js';
import { computeChecksum, buildStorageKey, isImageMimeType } from '../domain/utils.js';
import { getImageMetadata, generateAllVariants, generateBlurhash, stripMetadata, autoRotate } from '../processors/image/index.js';
import { getProfile } from '../domain/profiles.js';
import { mediaEventBus } from '../infrastructure/events/index.js';
import type { MediaEntity, MediaVariant, MediaStatus } from '../domain/types.js';
import { nanoid } from 'nanoid';

function dbMediaToMediaEntity(row: any): MediaEntity {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    tenantId: row.tenant_id as string,
    ownerId: row.owner_id as string,
    type: row.type as MediaEntity['type'],
    privacy: row.privacy as MediaEntity['privacy'],
    status: row.status as MediaEntity['status'],
    originalFilename: row.original_filename as string,
    mimeType: row.mime_type as string,
    size: row.size as number,
    width: row.width as number | null,
    height: row.height as number | null,
    format: row.format as MediaEntity['format'],
    blurhash: row.blurhash as string | null,
    checksum: row.checksum as string,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() ?? new Date().toISOString(),
    deletedAt: row.deleted_at?.toISOString() ?? null,
  };
}

function dbVariantToMediaVariant(row: any): MediaVariant {
  return {
    id: row.id as string,
    mediaId: row.media_id as string,
    size: row.size as MediaVariant['size'],
    format: row.format as MediaVariant['format'],
    width: row.width as number,
    height: row.height as number,
    sizeBytes: row.size_bytes as number,
    storageKey: row.storage_key as string,
    url: row.url as string,
    createdAt: row.created_at?.toISOString() ?? new Date().toISOString(),
  };
}

export interface UploadParams {
  applicationId: string;
  tenantId: string;
  ownerId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  profile?: string;
  privacy?: 'public' | 'private';
  metadata?: Record<string, unknown>;
}

export interface ProcessResult {
  media: MediaEntity;
  variants: MediaVariant[];
  processingTimeMs: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

export interface MediaVariantOutput {
  id: string;
  mediaId: string;
  size: MediaVariant['size'];
  format: MediaVariant['format'];
  width: number;
  height: number;
  sizeBytes: number;
  storageKey: string;
  url: string;
  createdAt: string;
}

export class MediaService {
  constructor(
    private readonly storage: StorageProvider,
    private readonly cdn: CDNProvider,
    private readonly redisUrl: string,
  ) {}

  async upload(params: UploadParams): Promise<MediaEntity> {
    const db = getDatabase();
    const mediaId = nanoid(26);
    const checksum = computeChecksum(params.buffer);

    const existing = await db
      .select()
      .from(schema.media)
      .where(
        and(
          eq(schema.media.checksum, checksum),
          eq(schema.media.tenantId, params.tenantId),
          eq(schema.media.applicationId, params.applicationId),
          isNull(schema.media.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return dbMediaToMediaEntity(existing[0]);
    }

    await db.insert(schema.media).values({
      id: mediaId,
      applicationId: params.applicationId,
      tenantId: params.tenantId,
      ownerId: params.ownerId,
      type: isImageMimeType(params.mimeType) ? 'image' : 'document',
      privacy: params.privacy ?? 'private',
      status: 'pending',
      originalFilename: params.filename,
      mimeType: params.mimeType,
      size: params.buffer.length,
      format: null,
      checksum,
      metadata: params.metadata ?? {},
    });

    await mediaEventBus.publish({
      type: 'media.uploaded',
      version: 1,
      aggregateId: mediaId,
      tenantId: params.tenantId,
      applicationId: params.applicationId,
      occurredAt: new Date().toISOString(),
      payload: { mediaId, mimeType: params.mimeType, size: params.buffer.length },
    });

    return {
      id: mediaId,
      applicationId: params.applicationId,
      tenantId: params.tenantId,
      ownerId: params.ownerId,
      type: isImageMimeType(params.mimeType) ? 'image' : 'document',
      privacy: params.privacy ?? 'private',
      status: 'pending',
      originalFilename: params.filename,
      mimeType: params.mimeType,
      size: params.buffer.length,
      width: null,
      height: null,
      format: null,
      blurhash: null,
      checksum,
      metadata: params.metadata ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
  }

  async processImage(mediaId: string, profileName: string = 'generic'): Promise<ProcessResult> {
    const db = getDatabase();
    const startTime = Date.now();

    const mediaRecord = await this.getById(mediaId);
    if (!mediaRecord) throw new Error('Media not found');

    await this.updateStatus(mediaId, 'processing');

    try {
      const originalBuffer = await this.storage.download(
        buildStorageKey(mediaRecord.applicationId, 'original', mediaId, 'original', mediaRecord.mimeType.split('/')[1] ?? 'bin'),
      );

      let buffer = await autoRotate(originalBuffer);
      buffer = await stripMetadata(buffer);

      const metadata = await getImageMetadata(buffer);
      const profile = getProfile(profileName);
      const variants = await generateAllVariants(buffer, profile);
      const blurhash = await generateBlurhash(buffer);

      const variantRecords: MediaVariantOutput[] = [];

      for (const [key, processed] of variants) {
        const [size, format] = key.split('.');
        const outputFormat = (format ?? 'webp') as string;
        const outputSize = size as string;
        const storageKey = buildStorageKey(
          mediaRecord.applicationId,
          'image',
          mediaId,
          outputSize,
          outputFormat,
        );

        await this.storage.upload(storageKey, processed.buffer, `image/${outputFormat}`);

        const variantId = nanoid(26);
        const url = this.cdn.getPublicUrl(storageKey);

        await db.insert(schema.mediaVariants).values({
          id: variantId,
          mediaId,
          size: size as MediaVariant['size'],
          format: outputFormat,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.size,
          storageKey,
          url,
        } as any);

        variantRecords.push({
          id: variantId,
          mediaId,
          size: size as MediaVariant['size'],
          format: format as MediaVariant['format'],
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.size,
          storageKey,
          url,
          createdAt: new Date().toISOString(),
        });
      }

      const optimizedSize = variants.get('medium.webp')?.size ?? variants.values().next().value?.size ?? 0;
      const compressionRatio = metadata.size > 0
        ? ((metadata.size - optimizedSize) / metadata.size) * 100
        : 0;

      await db
        .update(schema.media)
        .set({
          status: 'ready',
          width: metadata.width,
          height: metadata.height,
          format: metadata.format as MediaEntity['format'],
          blurhash,
          updatedAt: new Date(),
        })
        .where(eq(schema.media.id, mediaId));

      const processingTimeMs = Date.now() - startTime;

      await mediaEventBus.publish({
        type: 'media.ready',
        version: 1,
        aggregateId: mediaId,
        tenantId: mediaRecord.tenantId,
        applicationId: mediaRecord.applicationId,
        occurredAt: new Date().toISOString(),
        payload: {
          mediaId,
          variantCount: variantRecords.length,
          processingTimeMs,
          compressionRatio,
        },
      });

      return {
        media: dbMediaToMediaEntity({ ...mediaRecord, updatedAt: new Date() } as any),
        variants: variantRecords.map(dbVariantToMediaVariant),
        processingTimeMs,
        originalSize: metadata.size,
        optimizedSize,
        compressionRatio,
      };
    } catch (error) {
      await this.updateStatus(mediaId, 'failed');
      throw error;
    }
  }

  async getById(id: string): Promise<MediaEntity | null> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.media)
      .where(and(eq(schema.media.id, id), isNull(schema.media.deletedAt)))
      .limit(1);
    if (result.length === 0) return null;
    return dbMediaToMediaEntity(result[0]);
  }

  async getVariants(mediaId: string): Promise<MediaVariant[]> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(schema.mediaVariants)
      .where(eq(schema.mediaVariants.mediaId, mediaId))
      .orderBy(schema.mediaVariants.size);
    return result.map(dbVariantToMediaVariant) as MediaVariant[];
  }

  async getUrl(mediaId: string, options?: { width?: number; variant?: string }): Promise<string | null> {
    const variants = await this.getVariants(mediaId);
    if (variants.length === 0) return null;

    if (options?.variant) {
      const found = variants.find((v) => v.size === options.variant);
      if (found) return found.url;
    }

    if (options?.width) {
      const sorted = [...variants].sort((a, b) => a.width - b.width);
      let best = sorted[0];
      for (const v of sorted) {
        if (v.width >= options.width) {
          best = v;
          break;
        }
        best = v;
      }
      return best?.url ?? null;
    }

    const medium = variants.find((v) => v.size === 'medium');
    return medium?.url ?? variants[0]?.url ?? null;
  }

  async softDelete(id: string, applicationId: string, tenantId: string): Promise<boolean> {
    const db = getDatabase();
    const media = await this.getById(id);
    if (!media || media.applicationId !== applicationId || media.tenantId !== tenantId) {
      return false;
    }

    await db
      .update(schema.media)
      .set({ status: 'deleted', deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.media.id, id));

    const queue = getQueue(this.redisUrl);
    await queue.add('media.cleanup', { mediaId: id }, { priority: 10 });

    await mediaEventBus.publish({
      type: 'media.deleted',
      version: 1,
      aggregateId: id,
      tenantId,
      applicationId,
      occurredAt: new Date().toISOString(),
      payload: { mediaId: id },
    });

    return true;
  }

  async listByApplication(
    applicationId: string,
    tenantId: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<{ items: MediaEntity[]; nextCursor: string | null }> {
    const db = getDatabase();
    const limit = options?.limit ?? 20;

    const conditions = [
      eq(schema.media.applicationId, applicationId),
      eq(schema.media.tenantId, tenantId),
      isNull(schema.media.deletedAt),
    ];

    if (options?.cursor) {
      conditions.push(sql`${schema.media.createdAt} < (SELECT created_at FROM media WHERE id = ${options.cursor})`);
    }

    const result = await db
      .select()
      .from(schema.media)
      .where(and(...conditions))
      .orderBy(desc(schema.media.createdAt))
      .limit(limit + 1);

    const hasMore = result.length > limit;
    const mappedItems = result.slice(0, hasMore ? limit : limit).map(dbMediaToMediaEntity);

    const nextCursorId = hasMore && result[limit]
      ? (dbMediaToMediaEntity(result[limit]) as any).id
      : null;

    return {
      items: mappedItems,
      nextCursor: nextCursorId,
    };
  }

  private async updateStatus(id: string, status: MediaStatus): Promise<void> {
    const db = getDatabase();
    await db
      .update(schema.media)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.media.id, id));
  }
}