import type {
  MediaProfile,
  MediaProfileVariant,
  VariantSize,
  ImageFormat,
} from './types.js';

const thumbnailVariant: MediaProfileVariant = {
  size: 'thumbnail',
  maxWidth: 150,
  maxHeight: 150,
  quality: 80,
  format: 'webp',
};

const smallVariant: MediaProfileVariant = {
  size: 'small',
  maxWidth: 400,
  maxHeight: 400,
  quality: 80,
  format: 'webp',
};

const mediumVariant: MediaProfileVariant = {
  size: 'medium',
  maxWidth: 800,
  maxHeight: 800,
  quality: 82,
  format: 'webp',
};

const largeVariant: MediaProfileVariant = {
  size: 'large',
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 85,
  format: 'webp',
};

const originalVariant: MediaProfileVariant = {
  size: 'original',
  maxWidth: Infinity,
  maxHeight: Infinity,
  quality: 90,
  format: 'webp',
};

const defaultVariants: MediaProfileVariant[] = [
  thumbnailVariant,
  smallVariant,
  mediumVariant,
  largeVariant,
  originalVariant,
];

export const PROFILES: Record<string, MediaProfile> = {
  avatar: {
    name: 'avatar',
    variants: [
      { size: 'thumbnail', maxWidth: 100, maxHeight: 100, quality: 80, format: 'webp' },
      { size: 'small', maxWidth: 200, maxHeight: 200, quality: 80, format: 'webp' },
      { size: 'medium', maxWidth: 400, maxHeight: 400, quality: 85, format: 'webp' },
      { size: 'original', maxWidth: Infinity, maxHeight: Infinity, quality: 90, format: 'webp' },
    ],
  },
  product: {
    name: 'product',
    variants: [
      { size: 'thumbnail', maxWidth: 150, maxHeight: 150, quality: 80, format: 'webp' },
      { size: 'small', maxWidth: 400, maxHeight: 400, quality: 80, format: 'webp' },
      { size: 'medium', maxWidth: 800, maxHeight: 800, quality: 82, format: 'webp' },
      { size: 'large', maxWidth: 1200, maxHeight: 1200, quality: 85, format: 'webp' },
      { size: 'original', maxWidth: Infinity, maxHeight: Infinity, quality: 90, format: 'webp' },
    ],
  },
  feed: {
    name: 'feed',
    variants: [
      { size: 'thumbnail', maxWidth: 200, maxHeight: 200, quality: 75, format: 'webp' },
      { size: 'small', maxWidth: 600, maxHeight: 600, quality: 78, format: 'webp' },
      { size: 'medium', maxWidth: 1080, maxHeight: 1080, quality: 80, format: 'webp' },
      { size: 'original', maxWidth: Infinity, maxHeight: Infinity, quality: 85, format: 'webp' },
    ],
  },
  story: {
    name: 'story',
    variants: [
      { size: 'small', maxWidth: 720, maxHeight: 1280, quality: 78, format: 'webp' },
      { size: 'medium', maxWidth: 1080, maxHeight: 1920, quality: 80, format: 'webp' },
      { size: 'original', maxWidth: Infinity, maxHeight: Infinity, quality: 85, format: 'webp' },
    ],
  },
  'reel-cover': {
    name: 'reel-cover',
    variants: [
      { size: 'thumbnail', maxWidth: 200, maxHeight: 360, quality: 75, format: 'webp' },
      { size: 'small', maxWidth: 540, maxHeight: 960, quality: 78, format: 'webp' },
      { size: 'medium', maxWidth: 720, maxHeight: 1280, quality: 80, format: 'webp' },
      { size: 'original', maxWidth: Infinity, maxHeight: Infinity, quality: 85, format: 'webp' },
    ],
  },
  banner: {
    name: 'banner',
    variants: [
      { size: 'small', maxWidth: 800, maxHeight: 200, quality: 78, format: 'webp' },
      { size: 'medium', maxWidth: 1600, maxHeight: 400, quality: 82, format: 'webp' },
      { size: 'original', maxWidth: Infinity, maxHeight: Infinity, quality: 90, format: 'webp' },
    ],
  },
  document: {
    name: 'document',
    variants: [
      { size: 'small', maxWidth: 800, maxHeight: 1100, quality: 80, format: 'webp' },
      { size: 'medium', maxWidth: 1600, maxHeight: 2200, quality: 85, format: 'webp' },
      { size: 'original', maxWidth: Infinity, maxHeight: Infinity, quality: 95, format: 'webp' },
    ],
  },
  medical: {
    name: 'medical',
    variants: [
      { size: 'small', maxWidth: 800, maxHeight: 800, quality: 90, format: 'png' },
      { size: 'medium', maxWidth: 1600, maxHeight: 1600, quality: 92, format: 'png' },
      { size: 'original', maxWidth: Infinity, maxHeight: Infinity, quality: 100, format: 'png' },
    ],
  },
  generic: {
    name: 'generic',
    variants: defaultVariants,
  },
};

export function getProfile(name: string): MediaProfile {
  const profile = PROFILES[name];
  if (profile) return profile;
  return PROFILES.generic as MediaProfile;
}

export function getVariantConfig(
  profile: MediaProfile,
  size: VariantSize,
): MediaProfileVariant | undefined {
  return profile.variants.find((v) => v.size === size);
}

export function getVariantsForProfile(profile: MediaProfile): MediaProfileVariant[] {
  return profile.variants;
}

export function getOutputFormats(profile: MediaProfile): Set<ImageFormat> {
  const formats = new Set<ImageFormat>();
  for (const variant of profile.variants) {
    formats.add(variant.format);
  }
  return formats;
}
