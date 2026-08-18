-- Media Engine Schema Migration

CREATE TABLE IF NOT EXISTS "media" (
  "id" varchar(26) PRIMARY KEY,
  "application_id" varchar(100) NOT NULL,
  "tenant_id" varchar(26) NOT NULL,
  "owner_id" varchar(26) NOT NULL,
  "type" varchar(20) NOT NULL,
  "privacy" varchar(10) NOT NULL DEFAULT 'private',
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "original_filename" text NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "size" bigint NOT NULL,
  "width" integer,
  "height" integer,
  "format" varchar(10),
  "blurhash" text,
  "checksum" varchar(64) NOT NULL,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "deleted_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "idx_media_application_id" ON "media" ("application_id");
CREATE INDEX IF NOT EXISTS "idx_media_tenant_id" ON "media" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_media_owner_id" ON "media" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_media_status" ON "media" ("status");
CREATE INDEX IF NOT EXISTS "idx_media_type" ON "media" ("type");
CREATE INDEX IF NOT EXISTS "idx_media_created_at" ON "media" ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_media_checksum_tenant" ON "media" ("checksum", "tenant_id");

CREATE TABLE IF NOT EXISTS "media_variants" (
  "id" varchar(26) PRIMARY KEY,
  "media_id" varchar(26) NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
  "size" varchar(20) NOT NULL,
  "format" varchar(10) NOT NULL,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "size_bytes" bigint NOT NULL,
  "storage_key" text NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_media_variants_media_id" ON "media_variants" ("media_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_media_variants_size_media" ON "media_variants" ("media_id", "size", "format");

CREATE TABLE IF NOT EXISTS "media_jobs" (
  "id" varchar(26) PRIMARY KEY,
  "media_id" varchar(26) NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
  "type" varchar(50) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "payload" jsonb DEFAULT '{}',
  "result" jsonb,
  "error" text,
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 3,
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "idx_media_jobs_media_id" ON "media_jobs" ("media_id");
CREATE INDEX IF NOT EXISTS "idx_media_jobs_status" ON "media_jobs" ("status");
CREATE INDEX IF NOT EXISTS "idx_media_jobs_type" ON "media_jobs" ("type");

CREATE TABLE IF NOT EXISTS "media_transformations" (
  "id" varchar(26) PRIMARY KEY,
  "media_id" varchar(26) NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
  "type" varchar(50) NOT NULL,
  "params" jsonb NOT NULL,
  "result_storage_key" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_media_transformations_media_id" ON "media_transformations" ("media_id");
