import { describe, it, expect } from 'vitest';
import {
  computeChecksum,
  formatBytes,
  getMimeTypeExtension,
  isImageMimeType,
  isVideoMimeType,
  isAudioMimeType,
  buildStorageKey,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
} from '../src/domain/utils.js';

describe('Domain Utils', () => {
  describe('computeChecksum', () => {
    it('should compute sha256 checksum', () => {
      const data = Buffer.from('hello world');
      const checksum = computeChecksum(data);
      expect(checksum).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('should return different checksums for different data', () => {
      const checksum1 = computeChecksum(Buffer.from('hello'));
      const checksum2 = computeChecksum(Buffer.from('world'));
      expect(checksum1).not.toBe(checksum2);
    });

    it('should be deterministic', () => {
      const data = Buffer.from('test data');
      const checksum1 = computeChecksum(data);
      const checksum2 = computeChecksum(data);
      expect(checksum1).toBe(checksum2);
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should format fractional values', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('getMimeTypeExtension', () => {
    it('should return jpg for image/jpeg', () => {
      expect(getMimeTypeExtension('image/jpeg')).toBe('jpg');
    });

    it('should return png for image/png', () => {
      expect(getMimeTypeExtension('image/png')).toBe('png');
    });

    it('should return webp for image/webp', () => {
      expect(getMimeTypeExtension('image/webp')).toBe('webp');
    });

    it('should return null for unknown mime type', () => {
      expect(getMimeTypeExtension('application/unknown')).toBeNull();
    });
  });

  describe('MIME type checks', () => {
    it('should identify image mime types', () => {
      expect(isImageMimeType('image/jpeg')).toBe(true);
      expect(isImageMimeType('image/png')).toBe(true);
      expect(isImageMimeType('image/webp')).toBe(true);
      expect(isImageMimeType('video/mp4')).toBe(false);
    });

    it('should identify video mime types', () => {
      expect(isVideoMimeType('video/mp4')).toBe(true);
      expect(isVideoMimeType('video/webm')).toBe(true);
      expect(isVideoMimeType('image/jpeg')).toBe(false);
    });

    it('should identify audio mime types', () => {
      expect(isAudioMimeType('audio/mpeg')).toBe(true);
      expect(isAudioMimeType('audio/wav')).toBe(true);
      expect(isAudioMimeType('image/jpeg')).toBe(false);
    });
  });

  describe('buildStorageKey', () => {
    it('should build correct storage key', () => {
      const key = buildStorageKey('bilengi', 'image', 'media-123', 'medium', 'webp');
      expect(key).toBe('bilengi/image/media-123/medium.webp');
    });

    it('should handle different application IDs', () => {
      const key = buildStorageKey('dhayaro', 'image', 'media-456', 'thumbnail', 'avif');
      expect(key).toBe('dhayaro/image/media-456/thumbnail.avif');
    });
  });

  describe('Allowed MIME types', () => {
    it('should contain expected image types', () => {
      expect(ALLOWED_IMAGE_MIMES.has('image/jpeg')).toBe(true);
      expect(ALLOWED_IMAGE_MIMES.has('image/png')).toBe(true);
      expect(ALLOWED_IMAGE_MIMES.has('image/webp')).toBe(true);
      expect(ALLOWED_IMAGE_MIMES.has('image/avif')).toBe(true);
      expect(ALLOWED_IMAGE_MIMES.has('image/gif')).toBe(true);
    });

    it('should contain expected video types', () => {
      expect(ALLOWED_VIDEO_MIMES.has('video/mp4')).toBe(true);
      expect(ALLOWED_VIDEO_MIMES.has('video/quicktime')).toBe(true);
      expect(ALLOWED_VIDEO_MIMES.has('video/webm')).toBe(true);
    });
  });
});
