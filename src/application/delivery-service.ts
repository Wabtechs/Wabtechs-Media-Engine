import type { MediaService } from './media-service.js';
import type { CDNProvider } from '../infrastructure/cdn/index.js';

export class DeliveryService {
  constructor(
    private mediaService: MediaService,
    private cdn: CDNProvider,
  ) {}

  async getMediaUrl(
    mediaId: string,
    options?: { width?: number; variant?: string },
  ): Promise<string | null> {
    return this.mediaService.getUrl(mediaId, options);
  }

  async getMediaUrls(mediaId: string): Promise<Record<string, string> | null> {
    const variants = await this.mediaService.getVariants(mediaId);
    if (variants.length === 0) return null;

    const urls: Record<string, string> = {};
    for (const variant of variants) {
      urls[`${variant.size}_${variant.format}`] = variant.url;
    }
    return urls;
  }

  getCacheHeaders(): Record<string, string> {
    return this.cdn.getCacheHeaders('');
  }
}
