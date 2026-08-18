import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageProvider } from '../src/infrastructure/storage/index.js';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const TEST_STORAGE_PATH = join(process.cwd(), '.test-storage');

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    await mkdir(TEST_STORAGE_PATH, { recursive: true });
    provider = new LocalStorageProvider(TEST_STORAGE_PATH, 'http://localhost:9000/test');
  });

  afterEach(async () => {
    await rm(TEST_STORAGE_PATH, { recursive: true, force: true });
  });

  it('should upload and download a file', async () => {
    const data = Buffer.from('hello world');
    await provider.upload('test/file.txt', data, 'text/plain');
    const downloaded = await provider.download('test/file.txt');
    expect(downloaded.toString()).toBe('hello world');
  });

  it('should check file existence', async () => {
    expect(await provider.exists('nonexistent.txt')).toBe(false);
    await provider.upload('existing.txt', Buffer.from('data'), 'text/plain');
    expect(await provider.exists('existing.txt')).toBe(true);
  });

  it('should delete a file', async () => {
    await provider.upload('to-delete.txt', Buffer.from('data'), 'text/plain');
    expect(await provider.exists('to-delete.txt')).toBe(true);
    await provider.delete('to-delete.txt');
    expect(await provider.exists('to-delete.txt')).toBe(false);
  });

  it('should not throw when deleting nonexistent file', async () => {
    await expect(provider.delete('nonexistent.txt')).resolves.not.toThrow();
  });

  it('should generate public URL', () => {
    const url = provider.getPublicUrl('bilengi/image/123/medium.webp');
    expect(url).toBe('http://localhost:9000/test/bilengi/image/123/medium.webp');
  });

  it('should return same URL for getSignedUrl', async () => {
    const url = await provider.getSignedUrl('test/file.txt');
    expect(url).toContain('test/file.txt');
  });

  it('should create nested directories', async () => {
    const data = Buffer.from('nested data');
    await provider.upload('a/b/c/file.txt', data, 'text/plain');
    const downloaded = await provider.download('a/b/c/file.txt');
    expect(downloaded.toString()).toBe('nested data');
  });
});
