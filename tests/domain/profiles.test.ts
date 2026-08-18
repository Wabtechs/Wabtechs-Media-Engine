import { describe, it, expect } from 'vitest';
import {
  getProfile,
  getVariantConfig,
  getVariantsForProfile,
  getOutputFormats,
  PROFILES,
} from '../src/domain/profiles.js';

describe('Media Profiles', () => {
  describe('getProfile', () => {
    it('should return avatar profile', () => {
      const profile = getProfile('avatar');
      expect(profile.name).toBe('avatar');
      expect(profile.variants.length).toBeGreaterThan(0);
    });

    it('should return product profile', () => {
      const profile = getProfile('product');
      expect(profile.name).toBe('product');
      expect(profile.variants.length).toBe(5);
    });

    it('should return generic profile for unknown name', () => {
      const profile = getProfile('unknown');
      expect(profile.name).toBe('generic');
    });

    it('should return feed profile', () => {
      const profile = getProfile('feed');
      expect(profile.name).toBe('feed');
    });

    it('should return medical profile with png format', () => {
      const profile = getProfile('medical');
      expect(profile.name).toBe('medical');
      const originalVariant = profile.variants.find((v) => v.size === 'original');
      expect(originalVariant?.format).toBe('png');
    });
  });

  describe('getVariantConfig', () => {
    it('should return variant config for existing size', () => {
      const profile = getProfile('product');
      const variant = getVariantConfig(profile, 'thumbnail');
      expect(variant).toBeDefined();
      expect(variant?.size).toBe('thumbnail');
      expect(variant?.maxWidth).toBe(150);
      expect(variant?.maxHeight).toBe(150);
    });

    it('should return undefined for non-existing size', () => {
      const profile = getProfile('avatar');
      const variant = getVariantConfig(profile, 'large');
      expect(variant).toBeUndefined();
    });
  });

  describe('getVariantsForProfile', () => {
    it('should return all variants for a profile', () => {
      const profile = getProfile('product');
      const variants = getVariantsForProfile(profile);
      expect(variants.length).toBe(5);
      expect(variants.map((v) => v.size)).toEqual([
        'thumbnail',
        'small',
        'medium',
        'large',
        'original',
      ]);
    });
  });

  describe('getOutputFormats', () => {
    it('should return unique formats for a profile', () => {
      const profile = getProfile('product');
      const formats = getOutputFormats(profile);
      expect(formats.has('webp')).toBe(true);
    });

    it('should include png for medical profile', () => {
      const profile = getProfile('medical');
      const formats = getOutputFormats(profile);
      expect(formats.has('png')).toBe(true);
    });
  });

  describe('All profiles have valid structure', () => {
    it('should have at least one variant per profile', () => {
      for (const [name, profile] of Object.entries(PROFILES)) {
        expect(profile.variants.length).toBeGreaterThan(0);
        expect(profile.name).toBe(name);
        for (const variant of profile.variants) {
          expect(variant.maxWidth).toBeGreaterThan(0);
          expect(variant.maxHeight).toBeGreaterThan(0);
          expect(variant.quality).toBeGreaterThan(0);
          expect(variant.quality).toBeLessThanOrEqual(100);
        }
      }
    });
  });
});
