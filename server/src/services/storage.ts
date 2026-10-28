import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ENV } from '../config/env';

export interface UploadedFileResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  provider: string;
}

export interface IStorageProvider {
  saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFileResult>;
  deleteFile(filename: string): Promise<boolean>;
}

class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), ENV.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadedFileResult> {
    const ext = path.extname(originalName) || (mimeType.includes('audio') ? '.webm' : '.jpg');
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${Date.now()}-${hash}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;
    return {
      url,
      filename,
      sizeBytes: buffer.length,
      mimeType,
      provider: 'local',
    };
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const cleanFilename = path.basename(filename);
      const filePath = path.join(this.uploadDir, cleanFilename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  }
}

// Storage Provider Factory
export function getStorageProvider(): IStorageProvider {
  return new LocalStorageProvider();
}

export const storage = getStorageProvider();
