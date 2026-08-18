import type { MediaService } from './media-service.js';
import type { UploadParams } from './media-service.js';

export class UploadService {
  constructor(private mediaService: MediaService) {}

  async handleUpload(params: UploadParams) {
    const media = await this.mediaService.upload(params);
    return media;
  }

  async processAndUpload(params: UploadParams, profile: string = 'generic') {
    const media = await this.mediaService.upload(params);
    const result = await this.mediaService.processImage(media.id, profile);
    return result;
  }
}
