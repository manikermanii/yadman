import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env.js';

export interface StorageFile {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}

export interface StoredFileResult {
  url: string;
  key: string;
  sizeBytes: number;
  mimeType: string;
}

export interface StorageProvider {
  uploadFile(file: StorageFile, folder?: string): Promise<StoredFileResult>;
  deleteFile(key: string): Promise<boolean>;
  saveVoiceRecording(base64Data: string, mimeType?: string): Promise<string>;
  getProviderName(): string;
  isConfigured(): boolean;
}

export class StorageError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'STORAGE_ERROR', statusCode = 500) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Validate binary magic bytes to guarantee the actual file content matches its declared MIME type.
 * Prevents arbitrary file uploads disguised as safe images.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length < 4) return false;
  const mime = mimeType.toLowerCase();

  // JPEG: 0xFF, 0xD8, 0xFF
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 0x89, 0x50, 0x4E, 0x47 ('.PNG')
  if (mime === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // WebP: RIFF at 0..3 and WEBP at 8..11
  if (mime === 'image/webp') {
    if (buffer.length < 12) return false;
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    return riff === 'RIFF' && webp === 'WEBP';
  }

  // AVIF / MP4 / M4A: contains 'ftyp' at offset 4
  if (mime === 'image/avif' || mime === 'audio/mp4' || mime === 'audio/x-m4a') {
    if (buffer.length < 8) return false;
    return buffer.toString('ascii', 4, 8) === 'ftyp';
  }

  // Audio WebM: 0x1A, 0x45, 0xDF, 0xA3 (EBML Header)
  if (mime === 'audio/webm' || mime === 'audio/ogg') {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }

  // Audio MP3: ID3 tag or MPEG sync word
  if (mime === 'audio/mpeg' || mime === 'audio/mp3') {
    const isId3 = buffer.toString('ascii', 0, 3) === 'ID3';
    const isSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
    return isId3 || isSync;
  }

  return false;
}

/**
 * Common file security validation.
 * Enforces strict MIME allowlist, size limits, binary magic byte checks,
 * and rejects SVGs to prevent Stored Cross-Site Scripting (XSS).
 */
export function validateStorageFile(file: StorageFile, folder = 'products'): void {
  const mime = (file.mimeType || '').toLowerCase();
  const ext = path.extname(file.originalName || '').toLowerCase();

  // 1. Explicitly reject SVG files to eliminate Stored XSS risks
  if (mime === 'image/svg+xml' || ext === '.svg') {
    throw new StorageError(
      'فرمت فایل SVG به دلیل مخاطرات امنیتی مجاز نمی‌باشد. لطفاً از فرمت‌های WebP، JPG، PNG یا AVIF استفاده نمایید.',
      'INVALID_FILE_TYPE',
      400
    );
  }

  // 2. Strict allowed MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/x-m4a',
  ];

  if (!allowedMimeTypes.includes(mime)) {
    throw new StorageError(
      `فرمت فایل ارسالی (${file.mimeType}) مجاز نمی‌باشد. فرمت‌های مجاز: JPG, PNG, WebP, AVIF, Audio`,
      'INVALID_FILE_TYPE',
      400
    );
  }

  // 3. Strict 15 MB file size limit
  const MAX_SIZE = 15 * 1024 * 1024; // 15MB
  if (file.sizeBytes > MAX_SIZE || (file.buffer && file.buffer.length > MAX_SIZE)) {
    const sizeMb = ((file.sizeBytes || file.buffer.length) / (1024 * 1024)).toFixed(1);
    throw new StorageError(
      `حجم فایل بیش از حد مجاز است. حداکثر حجم مجاز: ۱۵ مگابایت (حجم فایل ارسالی: ${sizeMb} مگابایت)`,
      'FILE_TOO_LARGE',
      400
    );
  }

  // 4. Binary header verification (magic bytes)
  if (file.buffer && file.buffer.length >= 4) {
    const isMagicValid = validateMagicBytes(file.buffer, mime);
    if (!isMagicValid) {
      throw new StorageError(
        'محتوای فایل ارسالی با فرمت اعلام‌شده تطابق ندارد یا فایل مخدوش است.',
        'CORRUPT_OR_DISGUISED_FILE',
        400
      );
    }
  }

  // 5. Folder name sanitization to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
    throw new StorageError('نام پوشه مقصد نامعتبر است.', 'INVALID_FOLDER_NAME', 400);
  }
}

/**
 * Local filesystem storage provider for offline / local development.
 * Used ONLY when STORAGE_PROVIDER=local is explicitly configured.
 */
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    const localPath = (config as any).storageLocalPath || config.uploadDir || 'uploads';
    this.uploadDir = path.resolve(process.cwd(), localPath);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getProviderName(): string {
    return 'local';
  }

  isConfigured(): boolean {
    return true;
  }

  async uploadFile(file: StorageFile, folder = 'products'): Promise<StoredFileResult> {
    validateStorageFile(file, folder);

    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = path.join(this.uploadDir, cleanFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.originalName) || '.png';
    const randomHash = crypto.randomBytes(8).toString('hex');
    const fileName = `${Date.now()}-${randomHash}${ext}`;
    const filePath = path.join(targetDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const relativeUrl = `/uploads/${cleanFolder}/${fileName}`;
    return {
      url: relativeUrl,
      key: `${cleanFolder}/${fileName}`,
      sizeBytes: file.sizeBytes,
      mimeType: file.mimeType,
    };
  }

  async deleteFile(keyOrUrl: string): Promise<boolean> {
    if (!keyOrUrl) return false;

    // Sanitize path to prevent directory traversal
    let cleanKey = keyOrUrl.replace(/^\/uploads\//, '').replace(/^\/+/, '');
    if (cleanKey.includes('..')) {
      console.warn('[LocalStorageProvider] Potential path traversal blocked in deleteFile:', keyOrUrl);
      return false;
    }

    try {
      const filePath = path.join(this.uploadDir, cleanKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[LocalStorageProvider] Safe delete failure:', err);
      return false;
    }
  }

  async saveVoiceRecording(base64Data: string, mimeType = 'audio/webm'): Promise<string> {
    let cleanBase64 = base64Data;
    if (base64Data.includes(';base64,')) {
      cleanBase64 = base64Data.split(';base64,')[1];
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    const ext = mimeType.includes('mp4') ? '.m4a' : mimeType.includes('mp3') ? '.mp3' : '.webm';
    const fileName = `voice-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

    const fileResult = await this.uploadFile(
      {
        originalName: fileName,
        mimeType,
        sizeBytes: buffer.length,
        buffer,
      },
      'voices'
    );

    return fileResult.url;
  }
}

/**
 * Production-grade Supabase Storage provider for persistent object storage on Google Cloud Run.
 * Used when STORAGE_PROVIDER=supabase is configured.
 *
 * CRITICAL PRODUCTION RULE:
 * Never silently fall back to ephemeral local storage when configured for Supabase.
 * If credentials are missing or Supabase upload fails, an explicit StorageError is thrown.
 */
export class SupabaseStorageProvider implements StorageProvider {
  private supabaseUrl: string;
  private serviceKey: string;
  private bucket: string;

  constructor() {
    this.supabaseUrl = (config.supabaseUrl || '').replace(/\/$/, '');
    this.serviceKey = config.supabaseServiceRoleKey || '';
    this.bucket = config.supabaseStorageBucket || 'product-media';
  }

  getProviderName(): string {
    return 'supabase';
  }

  isConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.serviceKey && this.bucket);
  }

  async uploadFile(file: StorageFile, folder = 'products'): Promise<StoredFileResult> {
    validateStorageFile(file, folder);

    if (!this.isConfigured()) {
      throw new StorageError(
        'سرویس ذخیره‌سازی ابری (Supabase Storage) پیکربندی نشده است. کلیدهای دسترسی سرور در محیط برنامه تنظیم نشده‌اند.',
        'STORAGE_UNAVAILABLE',
        503
      );
    }

    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(file.originalName) || '.png';
    const randomHash = crypto.randomBytes(8).toString('hex');
    const fileName = `${Date.now()}-${randomHash}${ext}`;
    const objectPath = `${cleanFolder}/${fileName}`;

    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${objectPath}`;

    let res: Response;
    try {
      res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey,
          'Content-Type': file.mimeType,
          'x-upsert': 'true',
        },
        body: file.buffer,
      });
    } catch (networkErr: any) {
      console.error('[SupabaseStorageProvider] Network error during upload to Supabase');
      throw new StorageError(
        'عدم برقراری ارتباط با فضای ابری ذخیره‌سازی. لطفاً اتصال شبکه یا وضعیت سرور ابری را بررسی فرمایید.',
        'STORAGE_NETWORK_ERROR',
        502
      );
    }

    if (!res.ok) {
      let errorSummary = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errorSummary = errJson?.message || errJson?.error || errorSummary;
      } catch {
        // Non-JSON error response
      }

      console.error(`[SupabaseStorageProvider] Supabase storage upload rejected: ${errorSummary}`);
      throw new StorageError(
        `بارگذاری فایل در فضای ابری ناموفق بود (${errorSummary}).`,
        'STORAGE_UPLOAD_FAILED',
        502
      );
    }

    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${objectPath}`;

    return {
      url: publicUrl,
      key: objectPath,
      sizeBytes: file.sizeBytes,
      mimeType: file.mimeType,
    };
  }

  async deleteFile(keyOrUrl: string): Promise<boolean> {
    if (!keyOrUrl) return false;

    // If a legacy local URL is requested for deletion, safely clean up if file exists
    if (keyOrUrl.startsWith('/uploads/')) {
      const cleanKey = keyOrUrl.replace(/^\/uploads\//, '');
      if (!cleanKey.includes('..')) {
        const localPath = path.resolve(process.cwd(), config.uploadDir || 'uploads', cleanKey);
        try {
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            return true;
          }
        } catch {}
      }
      return false;
    }

    if (!this.isConfigured()) {
      console.warn('[SupabaseStorageProvider] Cannot delete object: Supabase Storage is not configured.');
      return false;
    }

    try {
      // Extract object path from full public CDN URL if provided
      let objectPath = keyOrUrl;
      const publicPrefix = `/storage/v1/object/public/${this.bucket}/`;
      if (objectPath.includes(publicPrefix)) {
        objectPath = objectPath.split(publicPrefix)[1];
      }

      // Sanitize key
      objectPath = objectPath.replace(/^\/+/, '');
      if (objectPath.includes('..')) {
        console.warn('[SupabaseStorageProvider] Invalid key for deletion:', keyOrUrl);
        return false;
      }

      const deleteUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${objectPath}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey,
        },
      });

      return res.ok || res.status === 404;
    } catch (err) {
      console.warn('[SupabaseStorageProvider] Safe delete failure:', err);
      return false;
    }
  }

  async saveVoiceRecording(base64Data: string, mimeType = 'audio/webm'): Promise<string> {
    if (!this.isConfigured()) {
      throw new StorageError(
        'سرویس ذخیره‌سازی ابری پیکربندی نشده است. امکان ثبت فایل صوتی بدون فضای ذخیره‌سازی پایدار وجود ندارد.',
        'STORAGE_UNAVAILABLE',
        503
      );
    }

    let cleanBase64 = base64Data;
    if (base64Data.includes(';base64,')) {
      cleanBase64 = base64Data.split(';base64,')[1];
    }
    const buffer = Buffer.from(cleanBase64, 'base64');
    const ext = mimeType.includes('mp4') ? '.m4a' : mimeType.includes('mp3') ? '.mp3' : '.webm';
    const fileName = `voice-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

    const fileResult = await this.uploadFile(
      {
        originalName: fileName,
        mimeType,
        sizeBytes: buffer.length,
        buffer,
      },
      'voices'
    );

    return fileResult.url;
  }
}

// Storage Provider Factory
export function createStorageProvider(): StorageProvider {
  const provider = (config.storageProvider || 'local').toLowerCase();
  if (provider === 'supabase') {
    return new SupabaseStorageProvider();
  }
  return new LocalStorageProvider();
}

// Active storage provider
export const storageService: StorageProvider = createStorageProvider();
