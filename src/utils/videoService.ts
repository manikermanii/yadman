import { ProductVideo, VideoPlatform } from '../types';

export interface VideoPlatformMetadata {
  platform: VideoPlatform;
  nameFa: string;
  nameEn: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  domainWhitelist: string[];
}

export const SUPPORTED_PLATFORMS: Record<VideoPlatform, VideoPlatformMetadata> = {
  aparat: {
    platform: 'aparat',
    nameFa: 'آپارات (Aparat)',
    nameEn: 'Aparat',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
    badgeText: 'آپارات',
    iconName: 'PlaySquare',
    domainWhitelist: ['aparat.com', 'www.aparat.com', 'static.cdn.asset.aparat.com'],
  },
  youtube: {
    platform: 'youtube',
    nameFa: 'یوتیوب (YouTube)',
    nameEn: 'YouTube',
    badgeBg: 'bg-red-50 border-red-200 text-red-700',
    badgeText: 'یوتیوب',
    iconName: 'Youtube',
    domainWhitelist: ['youtube.com', 'www.youtube.com', 'youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'img.youtube.com'],
  },
  vimeo: {
    platform: 'vimeo',
    nameFa: 'ویمیو (Vimeo)',
    nameEn: 'Vimeo',
    badgeBg: 'bg-sky-50 border-sky-200 text-sky-700',
    badgeText: 'ویمیو',
    iconName: 'Video',
    domainWhitelist: ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'],
  },
  direct: {
    platform: 'direct',
    nameFa: 'لینک مستقیم ویدیو (MP4/CDN)',
    nameEn: 'Direct Video URL',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badgeText: 'فایل مستقیم',
    iconName: 'FileVideo',
    domainWhitelist: [],
  },
};

/**
 * Extract Aparat Video ID from various link formats:
 * - https://www.aparat.com/v/kL3x9
 * - https://aparat.com/v/kL3x9/title_of_video
 * - https://www.aparat.com/video/video/embed/videohash/kL3x9/vt/frame
 * - https://www.aparat.com/embed/kL3x9
 * - kL3x9 (direct hash/ID)
 */
export function extractAparatVideoId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();

  // Pattern 1: /v/HASH
  const vMatch = clean.match(/aparat\.com\/v\/([a-zA-Z0-9_-]+)/i);
  if (vMatch && vMatch[1]) return vMatch[1];

  // Pattern 2: /videohash/HASH
  const hashMatch = clean.match(/videohash\/([a-zA-Z0-9_-]+)/i);
  if (hashMatch && hashMatch[1]) return hashMatch[1];

  // Pattern 3: /embed/HASH
  const embedMatch = clean.match(/aparat\.com\/embed\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Pattern 4: Raw hash (5-15 alphanumeric characters) if user just entered ID
  if (/^[a-zA-Z0-9_-]{4,15}$/.test(clean)) {
    return clean;
  }

  return null;
}

/**
 * Extract YouTube Video ID from standard YouTube formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = clean.match(regExp);

  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  return null;
}

/**
 * Extract Vimeo Video ID:
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 */
export function extractVimeoVideoId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();
  const match = clean.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Check if URL points directly to an MP4/WebM video
 */
export function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith('http://') || clean.startsWith('https://')
  ) && (
    clean.includes('.mp4') || clean.includes('.webm') || clean.includes('.ogg') || clean.includes('.m3u8')
  );
}

/**
 * Validate and parse any external video URL
 */
export function parseExternalVideoUrl(
  inputUrl: string,
  title?: string,
  existingId?: string,
  customThumbnail?: string
): { success: boolean; video?: ProductVideo; error?: string } {
  if (!inputUrl || !inputUrl.trim()) {
    return {
      success: false,
      error: 'لطفاً آدرس (URL) ویدیو را وارد فرمایید.',
    };
  }

  const cleanUrl = inputUrl.trim();

  // 1. Try Aparat
  if (cleanUrl.toLowerCase().includes('aparat.com') || (!cleanUrl.includes('://') && /^[a-zA-Z0-9_-]{4,15}$/.test(cleanUrl))) {
    const videoId = extractAparatVideoId(cleanUrl);
    if (!videoId) {
      return {
        success: false,
        error: 'شناسه یا لینک ویدیو آپارات معتبر نیست. مثال صحیح: https://www.aparat.com/v/abcdef',
      };
    }

    const embedUrl = `https://www.aparat.com/video/video/embed/videohash/${videoId}/vt/frame?recom=none&t=0`;
    const canonicalUrl = `https://www.aparat.com/v/${videoId}`;
    const defaultThumbnail = customThumbnail || `https://static.cdn.asset.aparat.com/avt/${videoId}-600.jpg`;

    const video: ProductVideo = {
      id: existingId || `vid-aparat-${Date.now()}-${videoId}`,
      platform: 'aparat',
      videoId,
      videoUrl: canonicalUrl,
      embedUrl,
      title: title?.trim() || 'ویدیوی معرفی و بررسی محصول در آپارات',
      thumbnailUrl: defaultThumbnail,
      sortOrder: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, video };
  }

  // 2. Try YouTube
  if (cleanUrl.toLowerCase().includes('youtube.com') || cleanUrl.toLowerCase().includes('youtu.be')) {
    const videoId = extractYouTubeVideoId(cleanUrl);
    if (!videoId) {
      return {
        success: false,
        error: 'شناسه یا لینک ویدیو یوتیوب معتبر نیست. مثال صحیح: https://www.youtube.com/watch?v=abcdefghijk',
      };
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const defaultThumbnail = customThumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const video: ProductVideo = {
      id: existingId || `vid-yt-${Date.now()}-${videoId}`,
      platform: 'youtube',
      videoId,
      videoUrl: canonicalUrl,
      embedUrl,
      title: title?.trim() || 'ویدیوی معرفی محصول در یوتیوب',
      thumbnailUrl: defaultThumbnail,
      sortOrder: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, video };
  }

  // 3. Try Vimeo
  if (cleanUrl.toLowerCase().includes('vimeo.com')) {
    const videoId = extractVimeoVideoId(cleanUrl);
    if (!videoId) {
      return {
        success: false,
        error: 'شناسه یا لینک ویدیو ویمیو معتبر نیست. مثال صحیح: https://vimeo.com/123456789',
      };
    }

    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    const canonicalUrl = `https://vimeo.com/${videoId}`;

    const video: ProductVideo = {
      id: existingId || `vid-vimeo-${Date.now()}-${videoId}`,
      platform: 'vimeo',
      videoId,
      videoUrl: canonicalUrl,
      embedUrl,
      title: title?.trim() || 'ویدیوی محصول در ویمیو',
      thumbnailUrl: customThumbnail,
      sortOrder: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, video };
  }

  // 4. Try Direct MP4/CDN
  if (isDirectVideoUrl(cleanUrl)) {
    const video: ProductVideo = {
      id: existingId || `vid-direct-${Date.now()}`,
      platform: 'direct',
      videoId: cleanUrl.split('/').pop() || 'video-file',
      videoUrl: cleanUrl,
      embedUrl: cleanUrl,
      title: title?.trim() || 'ویدیوی پخش مستقیم محصول',
      thumbnailUrl: customThumbnail,
      sortOrder: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { success: true, video };
  }

  return {
    success: false,
    error: 'لینک ویدیو معتبر نیست. لطفاً یک لینک معتبر از آپارات (Aparat) یا یوتیوب (YouTube) وارد کنید.',
  };
}

/**
 * Validate that a given embed URL belongs to a whitelisted safe provider
 */
export function isWhitelistedEmbedUrl(url: string, platform: VideoPlatform): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const config = SUPPORTED_PLATFORMS[platform];
    if (!config) return false;

    if (platform === 'direct') {
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    }

    return config.domainWhitelist.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Normalize and sort product videos
 */
export function normalizeProductVideos(videos?: ProductVideo[]): ProductVideo[] {
  if (!videos || !Array.isArray(videos)) return [];
  return [...videos]
    .filter((v) => v && v.videoUrl && v.embedUrl)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * Generate Schema.org VideoObject JSON-LD
 */
export function generateVideoObjectSchema(
  video: ProductVideo,
  productTitle: string,
  productDescription?: string,
  productThumbnail?: string
) {
  return {
    '@type': 'VideoObject',
    name: video.title || `ویدیوی معرفی ${productTitle}`,
    description: video.description || productDescription || `بررسی و آنباکسینگ پک هدیه ${productTitle}`,
    thumbnailUrl: [video.thumbnailUrl || productThumbnail || 'https://yadman.ir/favicon.ico'],
    uploadDate: video.uploadDate || video.createdAt || new Date().toISOString(),
    embedUrl: video.embedUrl,
    contentUrl: video.videoUrl,
  };
}
