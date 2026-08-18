import sharp from 'sharp';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';

export interface MediaProfileVariant {
  size: string;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: ImageFormat;
}

export interface MediaProfile {
  name: string;
  variants: MediaProfileVariant[];
}

export interface ProcessedImage {
  buffer: Buffer;
  format: ImageFormat;
  width: number;
  height: number;
  size: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  channels: number;
  hasAlpha: boolean;
  orientation: number | undefined;
  size: number;
}

export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format ?? 'unknown',
    channels: metadata.channels ?? 0,
    hasAlpha: metadata.hasAlpha ?? false,
    orientation: metadata.orientation,
    size: buffer.length,
  };
}

export async function generateVariant(
  buffer: Buffer,
  variant: MediaProfileVariant,
): Promise<ProcessedImage> {
  let pipeline = sharp(buffer, { failOn: 'none' });

  if (variant.maxWidth !== Infinity || variant.maxHeight !== Infinity) {
    pipeline = pipeline.resize({
      width: variant.maxWidth === Infinity ? undefined : variant.maxWidth,
      height: variant.maxHeight === Infinity ? undefined : variant.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const format = variant.format;

  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: variant.quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: variant.quality, compressionLevel: 9 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: variant.quality, effort: 6 });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: variant.quality, effort: 6 });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
  }

  const result = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    format,
    width: result.info.width,
    height: result.info.height,
    size: result.info.size,
  };
}

export async function generateAllVariants(
  buffer: Buffer,
  profile: MediaProfile,
): Promise<Map<string, ProcessedImage>> {
  const variants = new Map<string, ProcessedImage>();

  for (const variant of profile.variants) {
    const processed = await generateVariant(buffer, variant);
    variants.set(`${variant.size}.${variant.format}`, processed);
  }

  return variants;
}

export async function generateBlurhash(buffer: Buffer): Promise<string> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 100;
  const height = metadata.height ?? 100;

  const placeholder = await sharp(buffer)
    .resize(32, 32, { fit: 'inside' })
    .raw()
    .toBuffer();

  const components = Array.from(placeholder)
    .reduce<{ r: number[]; g: number[]; b: number[] }>(
      (acc, val, i) => {
        const channel = i % 3;
        if (channel === 0) acc.r.push(val);
        else if (channel === 1) acc.g.push(val);
        else acc.b.push(val);
        return acc;
      },
      { r: [], g: [], b: [] },
    );

  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  return `blur:${avg(components.r)},${avg(components.g)},${avg(components.b)},${width},${height}`;
}

export async function convertFormat(
  buffer: Buffer,
  targetFormat: ImageFormat,
  quality: number = 85,
): Promise<ProcessedImage> {
  let pipeline = sharp(buffer, { failOn: 'none' });

  switch (targetFormat) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality });
      break;
    case 'gif':
      pipeline = pipeline.gif();
      break;
  }

  const result = await pipeline.toBuffer({ resolveWithObject: true });
  return {
    buffer: result.data,
    format: targetFormat,
    width: result.info.width,
    height: result.info.height,
    size: result.info.size,
  };
}

export async function stripMetadata(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).toBuffer();
}

export async function autoRotate(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).rotate().toBuffer();
}
