import type { StorageProvider } from '../infrastructure/storage/index.js';

export interface BackgroundRemovalResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
}

export interface BackgroundRemovalProvider {
  name: string;
  removeBackground(input: Buffer, mimeType: string): Promise<BackgroundRemovalResult>;
}

export class LocalBackgroundRemovalProvider implements BackgroundRemovalProvider {
  name = 'local';

  async removeBackground(input: Buffer, mimeType: string): Promise<BackgroundRemovalResult> {
    const sharp = await import('sharp');
    const result = await sharp.default(input)
      .png()
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: result.data,
      format: 'png',
      width: result.info.width,
      height: result.info.height,
    };
  }
}

export class BackgroundRemovalService {
  private providers: Map<string, BackgroundRemovalProvider> = new Map();
  private defaultProvider: string;

  constructor(defaultProvider: string = 'local') {
    this.defaultProvider = defaultProvider;
    this.registerProvider(new LocalBackgroundRemovalProvider());
  }

  registerProvider(provider: BackgroundRemovalProvider): void {
    this.providers.set(provider.name, provider);
  }

  async removeBackground(
    input: Buffer,
    mimeType: string,
    providerName?: string,
  ): Promise<BackgroundRemovalResult> {
    const name = providerName ?? this.defaultProvider;
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Background removal provider '${name}' not found`);
    }
    return provider.removeBackground(input, mimeType);
  }
}