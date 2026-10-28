import multer from 'multer';
import path from 'path';

// Use memory storage so StorageProvider can process buffers (local disk, cloud, etc.)
const memoryStorage = multer.memoryStorage();

// Safe image MIME types (SVGs strictly excluded to prevent Stored XSS)
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

export const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();

    // Explicit rejection of SVG uploads to prevent Stored XSS
    if (mime === 'image/svg+xml' || ext === '.svg') {
      const error: any = new Error('فرمت فایل SVG به دلیل ملاحظات امنیتی مجاز نمی‌باشد. لطفاً از فرمت‌های WebP، JPG، PNG یا AVIF استفاده نمایید.');
      error.code = 'INVALID_FILE_TYPE';
      error.statusCode = 400;
      return cb(error);
    }

    if (ALLOWED_IMAGE_MIMES.includes(mime)) {
      cb(null, true);
    } else {
      const error: any = new Error(`فرمت فایل ارسالی (${file.mimetype}) مجاز نمی‌باشد. فرمت‌های مجاز: JPG, PNG, WebP, AVIF`);
      error.code = 'INVALID_FILE_TYPE';
      error.statusCode = 400;
      cb(error);
    }
  },
});
