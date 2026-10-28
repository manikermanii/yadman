/**
 * Luxury Gift Box Store - Client-Side Image Optimizer & Processor
 * 
 * Provides:
 * - High-fidelity image compression (WebP / JPEG) with automatic dimension capping.
 * - Responsive thumbnail generation.
 * - Metadata extraction (width, height, size in bytes, mimeType).
 * - Automatic sensible ALT text generation.
 * - Cloud Storage abstraction (ready to plug AWS S3 / Cloudinary / Supabase).
 */

import { ProductImage } from '../types';

export interface OptimizedImageResult {
  dataUrl: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Cloud Storage Adapter Interface for future zero-friction migration
 * to Cloudinary, AWS S3, or Supabase Storage without rewriting database schemas.
 */
export interface CloudStorageAdapter {
  uploadImage(file: File | Blob, path?: string): Promise<{ url: string; thumbnailUrl: string }>;
  deleteImage?(url: string): Promise<boolean>;
}

/**
 * Compresses an image file using browser Canvas to optimize memory and network load.
 * @param file Browser File object
 * @param maxWidth Max dimension for display (default 1400px)
 * @param quality Compression quality (0.0 to 1.0, default 0.85)
 */
export async function optimizeImageFile(
  file: File,
  maxWidth = 1400,
  quality = 0.85
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Calculate display dimensions
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          // Render main compressed image on canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context not available');
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer WebP if supported, fallback to JPEG
          let mimeType = 'image/webp';
          let dataUrl = canvas.toDataURL(mimeType, quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            mimeType = 'image/jpeg';
            dataUrl = canvas.toDataURL(mimeType, quality);
          }

          // Calculate approximate size in bytes
          const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          const sizeBytes = Math.round((base64Length * 3) / 4);

          // Generate smaller thumbnail (400px width)
          const thumbWidth = Math.min(400, width);
          const thumbHeight = Math.round((height * thumbWidth) / width);
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbWidth;
          thumbCanvas.height = thumbHeight;
          const thumbCtx = thumbCanvas.getContext('2d');
          let thumbnailDataUrl = dataUrl;
          if (thumbCtx) {
            thumbCtx.imageSmoothingEnabled = true;
            thumbCtx.imageSmoothingQuality = 'high';
            thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            thumbnailDataUrl = thumbCanvas.toDataURL(mimeType, 0.75);
          }

          resolve({
            dataUrl,
            thumbnailDataUrl,
            width,
            height,
            sizeBytes,
            mimeType,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generates sensible Persian ALT text for product images based on product title & position.
 */
export function generateDefaultAltText(
  productTitle: string,
  index: number,
  isPrimary: boolean
): string {
  const cleanTitle = productTitle.trim() || 'پک هدیه فاخر';
  if (isPrimary || index === 0) {
    return `تصویر اصلی و نمای کامل ${cleanTitle}`;
  }
  return `نمای زاویه‌دار و محتویات ${cleanTitle} - تصویر شماره ${index + 1}`;
}

/**
 * Batch processes multiple files (unlimited number) and converts them to ProductImage objects.
 */
export async function processBatchImageFiles(
  files: File[] | FileList,
  productTitle: string,
  startingSortOrder = 0,
  hasExistingPrimary = false
): Promise<ProductImage[]> {
  const fileArray = Array.from(files);
  const results: ProductImage[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    // Check if it's an image
    if (!file.type.startsWith('image/')) continue;

    try {
      const optimized = await optimizeImageFile(file);
      const isPrimary = !hasExistingPrimary && startingSortOrder === 0 && i === 0;
      const sortOrder = startingSortOrder + i;
      const altText = generateDefaultAltText(productTitle, sortOrder, isPrimary);

      results.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        url: optimized.dataUrl,
        thumbnailUrl: optimized.thumbnailDataUrl,
        altText,
        sortOrder,
        isPrimary,
        width: optimized.width,
        height: optimized.height,
        sizeBytes: optimized.sizeBytes,
        mimeType: optimized.mimeType,
      });
    } catch (err) {
      console.error(`Error processing image ${file.name}:`, err);
    }
  }

  return results;
}

/**
 * Creates a ProductImage object from a remote URL or preset asset.
 */
export function createProductImageFromUrl(
  url: string,
  productTitle: string,
  sortOrder = 0,
  isPrimary = false,
  customAltText?: string
): ProductImage {
  return {
    id: `img-url-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    url,
    thumbnailUrl: url,
    altText: customAltText || generateDefaultAltText(productTitle, sortOrder, isPrimary),
    sortOrder,
    isPrimary,
    mimeType: 'image/jpeg',
  };
}

/**
 * Ensures a Product object has a fully initialized `images` array with at least one primary image.
 */
export function normalizeProductImages(
  productImages?: ProductImage[],
  fallbackMainUrl?: string,
  fallbackAdditionalUrls?: string[],
  productTitle = 'پک هدیه'
): ProductImage[] {
  // Filter out any broken or outdated deleted filenames
  const validProductImages = (productImages || []).filter(
    (img) => img && img.url && !img.url.includes('luxury_gift_')
  );

  if (validProductImages.length > 0) {
    // Ensure sortOrder is set and there is exactly one primary image
    const sorted = [...validProductImages].sort((a, b) => a.sortOrder - b.sortOrder);
    const hasPrimary = sorted.some((img) => img.isPrimary);
    if (!hasPrimary && sorted.length > 0) {
      sorted[0].isPrimary = true;
    }
    return sorted;
  }

  // If no valid images array exists, construct from fallback URLs
  const result: ProductImage[] = [];
  const cleanMainUrl = fallbackMainUrl && !fallbackMainUrl.includes('luxury_gift_') ? fallbackMainUrl : '';

  if (cleanMainUrl) {
    result.push({
      id: `img-main-${Date.now()}`,
      url: cleanMainUrl,
      thumbnailUrl: cleanMainUrl,
      altText: generateDefaultAltText(productTitle, 0, true),
      sortOrder: 0,
      isPrimary: true,
    });
  }

  if (fallbackAdditionalUrls && fallbackAdditionalUrls.length > 0) {
    fallbackAdditionalUrls.forEach((url, idx) => {
      if (url && !url.includes('luxury_gift_') && url !== cleanMainUrl) {
        result.push({
          id: `img-add-${idx}-${Date.now()}`,
          url,
          thumbnailUrl: url,
          altText: generateDefaultAltText(productTitle, result.length, false),
          sortOrder: result.length,
          isPrimary: result.length === 0,
        });
      }
    });
  }

  return result;
}

/**
 * Formats file size in bytes to human readable string (KB / MB)
 */
export function formatImageSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}
