import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./storage'),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_BUCKET: z.string().default('media-engine'),
  STORAGE_S3_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_SECRET_KEY: z.string().optional(),
  STORAGE_S3_REGION: z.string().default('us-east-1'),

  CDN_BASE_URL: z.string().default('http://localhost:9000/media-engine'),

  API_KEY_SALT: z.string().min(16),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(50),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  BACKGROUND_REMOVAL_PROVIDER: z.enum(['local', 'external']).default('local'),

  IMAGE_PROCESSING_CONCURRENCY: z.coerce.number().default(4),
  WORKER_CONCURRENCY: z.coerce.number().default(2),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function loadEnv(): Env {
  if (_env) return _env;
  _env = envSchema.parse(process.env);
  return _env;
}

export function getEnv(): Env {
  if (!_env) throw new Error('Environment not loaded. Call loadEnv() first.');
  return _env;
}
