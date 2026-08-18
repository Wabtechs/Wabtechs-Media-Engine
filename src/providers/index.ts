import type { Env } from '../config/env.js';
import {
  LocalStorageProvider,
  S3StorageProvider,
  type StorageProvider,
} from '../infrastructure/storage/index.js';
import { createCDNProvider, type CDNProvider } from '../infrastructure/cdn/index.js';

export function getStorageProvider(env: Env): StorageProvider {
  if (env.STORAGE_PROVIDER === 's3' && env.STORAGE_S3_ENDPOINT && env.STORAGE_S3_ACCESS_KEY && env.STORAGE_S3_SECRET_KEY) {
    return new S3StorageProvider({
      endpoint: env.STORAGE_S3_ENDPOINT,
      bucket: env.STORAGE_S3_BUCKET,
      accessKey: env.STORAGE_S3_ACCESS_KEY,
      secretKey: env.STORAGE_S3_SECRET_KEY,
      region: env.STORAGE_S3_REGION,
      publicBaseUrl: env.CDN_BASE_URL,
    });
  }

  return new LocalStorageProvider(env.STORAGE_LOCAL_PATH, env.CDN_BASE_URL);
}

export function getCdnProvider(env: Env, storage: StorageProvider): CDNProvider {
  return createCDNProvider(env.CDN_BASE_URL, storage);
}
