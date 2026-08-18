import {
  pgTable,
  text,
  varchar,
  integer,
  bigint,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const media = pgTable(
  'media',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    applicationId: varchar('application_id', { length: 100 }).notNull(),
    tenantId: varchar('tenant_id', { length: 26 }).notNull(),
    ownerId: varchar('owner_id', { length: 26 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    privacy: varchar('privacy', { length: 10 }).notNull().default('private'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    originalFilename: text('original_filename').notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    width: integer('width'),
    height: integer('height'),
    format: varchar('format', { length: 10 }),
    blurhash: text('blurhash'),
    checksum: varchar('checksum', { length: 64 }).notNull(),
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_media_application_id').on(table.applicationId),
    index('idx_media_tenant_id').on(table.tenantId),
    index('idx_media_owner_id').on(table.ownerId),
    index('idx_media_status').on(table.status),
    index('idx_media_type').on(table.type),
    index('idx_media_created_at').on(table.createdAt),
    uniqueIndex('idx_media_checksum_tenant').on(table.checksum, table.tenantId),
  ],
);

export const mediaVariants = pgTable(
  'media_variants',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    mediaId: varchar('media_id', { length: 26 })
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    size: varchar('size', { length: 20 }).notNull(),
    format: varchar('format', { length: 10 }).notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    storageKey: text('storage_key').notNull(),
    url: text('url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_media_variants_media_id').on(table.mediaId),
    uniqueIndex('idx_media_variants_size_media').on(table.mediaId, table.size, table.format),
  ],
);

export const mediaJobs = pgTable(
  'media_jobs',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    mediaId: varchar('media_id', { length: 26 })
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    payload: jsonb('payload').default({}).$type<Record<string, unknown>>(),
    result: jsonb('result').$type<Record<string, unknown>>(),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_media_jobs_media_id').on(table.mediaId),
    index('idx_media_jobs_status').on(table.status),
    index('idx_media_jobs_type').on(table.type),
  ],
);

export const mediaTransformations = pgTable(
  'media_transformations',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    mediaId: varchar('media_id', { length: 26 })
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    params: jsonb('params').notNull().$type<Record<string, unknown>>(),
    resultStorageKey: text('result_storage_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_media_transformations_media_id').on(table.mediaId),
  ],
);
