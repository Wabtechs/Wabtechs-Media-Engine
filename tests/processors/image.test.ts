import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import {
  getImageMetadata,
  generateVariant,
  generateAllVariants,
  generateBlurhash,
  stripMetadata,
  autoRotate,
  convertFormat,
} from '../src/processors/image/index.js';
import { getProfile } from '../src/domain/profiles.js';

describe('Image Processor', () => {
  let testImage: Buffer;
  let largeImage: Buffer;
  let transparentImage: Buffer;

  beforeAll(async () => {
    testImage = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 128, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    largeImage = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: { r: 0, g: 100, b: 200 },
      },
    })
      .jpeg()
      .toBuffer();

    transparentImage = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();
  });

  describe('getImageMetadata', () => {
    it('should extract metadata from JPEG', async () => {
      const metadata = await getImageMetadata(testImage);
      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
      expect(metadata.format).toBe('jpeg');
      expect(metadata.size).toBeGreaterThan(0);
    });

    it('should extract metadata from large image', async () => {
      const metadata = await getImageMetadata(largeImage);
      expect(metadata.width).toBe(3000);
      expect(metadata.height).toBe(2000);
    });

    it('should detect alpha channel in PNG', async () => {
      const metadata = await getImageMetadata(transparentImage);
      expect(metadata.hasAlpha).toBe(true);
    });
  });

  describe('generateVariant', () => {
    it('should resize to thumbnail', async () => {
      const result = await generateVariant(testImage, {
        size: 'thumbnail',
        maxWidth: 150,
        maxHeight: 150,
        quality: 80,
        format: 'webp',
      });

      expect(result.width).toBeLessThanOrEqual(150);
      expect(result.height).toBeLessThanOrEqual(150);
      expect(result.format).toBe('webp');
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should resize to medium', async () => {
      const result = await generateVariant(testImage, {
        size: 'medium',
        maxWidth: 800,
        maxHeight: 800,
        quality: 82,
        format: 'webp',
      });

      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(800);
      expect(result.format).toBe('webp');
    });

    it('should convert to AVIF', async () => {
      const result = await generateVariant(testImage, {
        size: 'medium',
        maxWidth: 800,
        maxHeight: 800,
        quality: 82,
        format: 'avif',
      });

      expect(result.format).toBe('avif');
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should not enlarge small images', async () => {
      const result = await generateVariant(testImage, {
        size: 'large',
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 85,
        format: 'webp',
      });

      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(600);
    });
  });

  describe('generateAllVariants', () => {
    it('should generate all product variants', async () => {
      const profile = getProfile('product');
      const variants = await generateAllVariants(testImage, profile);

      expect(variants.size).toBe(5);
      expect(variants.has('thumbnail.webp')).toBe(true);
      expect(variants.has('small.webp')).toBe(true);
      expect(variants.has('medium.webp')).toBe(true);
      expect(variants.has('large.webp')).toBe(true);
      expect(variants.has('original.webp')).toBe(true);
    });

    it('should generate avatar variants', async () => {
      const profile = getProfile('avatar');
      const variants = await generateAllVariants(testImage, profile);

      expect(variants.size).toBe(4);
    });

    it('should generate medical variants with PNG', async () => {
      const profile = getProfile('medical');
      const variants = await generateAllVariants(transparentImage, profile);

      expect(variants.size).toBe(3);
      for (const [key, variant] of variants) {
        expect(key.endsWith('.png')).toBe(true);
        expect(variant.format).toBe('png');
      }
    });
  });

  describe('generateBlurhash', () => {
    it('should generate a blurhash placeholder', async () => {
      const hash = await generateBlurhash(testImage);
      expect(hash).toMatch(/^blur:\d+,\d+,\d+,\d+,\d+$/);
    });
  });

  describe('stripMetadata', () => {
    it('should strip EXIF metadata', async () => {
      const stripped = await stripMetadata(testImage);
      const metadata = await getImageMetadata(stripped);
      expect(metadata.size).toBeGreaterThan(0);
    });
  });

  describe('autoRotate', () => {
    it('should auto-rotate based on EXIF', async () => {
      const rotated = await autoRotate(testImage);
      const metadata = await getImageMetadata(rotated);
      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
    });
  });

  describe('convertFormat', () => {
    it('should convert JPEG to WebP', async () => {
      const result = await convertFormat(testImage, 'webp', 85);
      expect(result.format).toBe('webp');
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should convert JPEG to AVIF', async () => {
      const result = await convertFormat(testImage, 'avif', 80);
      expect(result.format).toBe('avif');
    });

    it('should convert to PNG', async () => {
      const result = await convertFormat(testImage, 'png', 90);
      expect(result.format).toBe('png');
    });
  });

  describe('Compression ratios', () => {
    it('should achieve compression with WebP', async () => {
      const original = await getImageMetadata(testImage);
      const webp = await generateVariant(testImage, {
        size: 'medium',
        maxWidth: 800,
        maxHeight: 800,
        quality: 82,
        format: 'webp',
      });

      const ratio = ((original.size - webp.size) / original.size) * 100;
      expect(ratio).toBeGreaterThan(0);
    });

    it('should achieve better compression with AVIF', async () => {
      const webp = await generateVariant(testImage, {
        size: 'medium',
        maxWidth: 800,
        maxHeight: 800,
        quality: 82,
        format: 'webp',
      });

      const avif = await generateVariant(testImage, {
        size: 'medium',
        maxWidth: 800,
        maxHeight: 800,
        quality: 82,
        format: 'avif',
      });

      expect(avif.buffer.length).toBeLessThanOrEqual(webp.buffer.length);
    });
  });
});
