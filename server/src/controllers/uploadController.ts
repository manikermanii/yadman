import { Request, Response, NextFunction } from 'express';
import { storageService, StorageError } from '../services/storageService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class UploadController {
  async uploadSingleImage(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return sendError(res, 'NO_FILE', 'هیچ فایلی برای آپلود انتخاب نشده است.', 400);
      }

      const rawFolder = (req.body.folder as string) || 'products';
      const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'products';

      const stored = await storageService.uploadFile(
        {
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          buffer: file.buffer,
        },
        folder
      );

      return sendSuccess(res, stored, 201);
    } catch (err: any) {
      if (err instanceof StorageError || err.statusCode) {
        return sendError(res, err.code || 'STORAGE_ERROR', err.message, err.statusCode || 400);
      }
      next(err);
    }
  }

  async uploadMultipleImages(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return sendError(res, 'NO_FILES', 'فایلی برای آپلود یافت نشد.', 400);
      }

      const rawFolder = (req.body.folder as string) || 'products';
      const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'products';

      const uploadedResults = await Promise.all(
        files.map((file) =>
          storageService.uploadFile(
            {
              originalName: file.originalname,
              mimeType: file.mimetype,
              sizeBytes: file.size,
              buffer: file.buffer,
            },
            folder
          )
        )
      );

      return sendSuccess(res, uploadedResults, 201);
    } catch (err: any) {
      if (err instanceof StorageError || err.statusCode) {
        return sendError(res, err.code || 'STORAGE_ERROR', err.message, err.statusCode || 400);
      }
      next(err);
    }
  }

  async uploadVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { base64Data, mimeType } = req.body;
      if (!base64Data) {
        return sendError(res, 'NO_AUDIO_DATA', 'داده‌های صوتی دریافت نشد.', 400);
      }

      const url = await storageService.saveVoiceRecording(base64Data, mimeType);
      return sendSuccess(res, { url }, 201);
    } catch (err: any) {
      if (err instanceof StorageError || err.statusCode) {
        return sendError(res, err.code || 'STORAGE_ERROR', err.message, err.statusCode || 400);
      }
      next(err);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.body;
      if (!key || typeof key !== 'string') {
        return sendError(res, 'NO_KEY', 'شناسه یا آدرس فایل الزامی است.', 400);
      }

      if (key.includes('..')) {
        return sendError(res, 'INVALID_KEY', 'شناسه فایل نامعتبر است.', 400);
      }

      const deleted = await storageService.deleteFile(key);
      return sendSuccess(res, { success: deleted, key });
    } catch (err: any) {
      if (err instanceof StorageError || err.statusCode) {
        return sendError(res, err.code || 'STORAGE_ERROR', err.message, err.statusCode || 400);
      }
      next(err);
    }
  }
}

export const uploadController = new UploadController();
