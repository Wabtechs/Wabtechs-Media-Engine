import type { StorageProvider } from '../storage/index.js';

export interface CDNProvider {
  getPublicUrl(storageKey: string): string;
  getSignedUrl(storageKey: string, expiresIn?: number): Promise<string>;
  getCacheHeaders(storageKey: string): Record<string, string>;
}

export class StandardCDNProvider implements CDNProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getPublicUrl(storageKey: string): string {
    return `${this.baseUrl}/${storageKey}`;
  }

  async getSignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    return `${this.baseUrl}/${storageKey}?token=signed&expires=${Date.now() + expiresIn * 1000}`;
  }

  getCacheHeaders(storageKey: string): Record<string, string> {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'public, max-age=31536000, immutable',
    };
  }
}

export function createCDNProvider(
  baseUrl: string,
  _storage: StorageProvider,
): CDNProvider {
  return new StandardCDNProvider(baseUrl);
}
