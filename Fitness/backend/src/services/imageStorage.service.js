/**
 * Image Storage Service Abstraction
 * 
 * Provides a clean interface for managing, resolving, and generating
 * image assets for workouts and exercises. Ready to be integrated with
 * Cloudinary, AWS S3, or Google Cloud Storage in production.
 */

const WORKOUT_CATEGORY_COVERS = {
  Chest: {
    coverImageUrl: '/assets/images/workouts/chest.svg',
    coverThumbnailUrl: '/assets/images/workouts/chest.svg',
    altText: 'Chest and pectoral workout training demonstration',
  },
  Back: {
    coverImageUrl: '/assets/images/workouts/back.svg',
    coverThumbnailUrl: '/assets/images/workouts/back.svg',
    altText: 'Back, lats, and posterior chain workout demonstration',
  },
  Legs: {
    coverImageUrl: '/assets/images/workouts/legs.svg',
    coverThumbnailUrl: '/assets/images/workouts/legs.svg',
    altText: 'Quadriceps, hamstrings, and lower body workout demonstration',
  },
  Shoulders: {
    coverImageUrl: '/assets/images/workouts/shoulders.svg',
    coverThumbnailUrl: '/assets/images/workouts/shoulders.svg',
    altText: 'Deltoid and shoulder press workout demonstration',
  },
  Arms: {
    coverImageUrl: '/assets/images/workouts/arms.svg',
    coverThumbnailUrl: '/assets/images/workouts/arms.svg',
    altText: 'Biceps and triceps arm hypertrophy workout demonstration',
  },
  Core: {
    coverImageUrl: '/assets/images/workouts/core.svg',
    coverThumbnailUrl: '/assets/images/workouts/core.svg',
    altText: 'Abdominal and core strength training demonstration',
  },
  'Full Body': {
    coverImageUrl: '/assets/images/workouts/fullbody.svg',
    coverThumbnailUrl: '/assets/images/workouts/fullbody.svg',
    altText: 'Full body compound conditioning workout demonstration',
  },
  Cardio: {
    coverImageUrl: '/assets/images/workouts/cardio.svg',
    coverThumbnailUrl: '/assets/images/workouts/cardio.svg',
    altText: 'Cardiovascular endurance and conditioning demonstration',
  },
  Rest: {
    coverImageUrl: '/assets/images/workouts/rest.svg',
    coverThumbnailUrl: '/assets/images/workouts/rest.svg',
    altText: 'Active recovery and mobility rest day visual',
  },
};

export class ImageStorageService {
  /**
   * Resolves an image URL or provides a safe local fallback.
   * @param {string} url 
   * @param {string} type 'exercise' | 'workout'
   * @param {string} fallbackLabel
   * @returns {string}
   */
  static resolveImageUrl(url, type = 'exercise', fallbackLabel = 'Fitness') {
    if (url && typeof url === 'string' && url.trim().length > 0) {
      return url.trim();
    }
    return this.getFallbackPlaceholder(type, fallbackLabel);
  }

  /**
   * Retrieves predefined cover visuals for workout categories.
   * @param {string} category 
   * @returns {{ coverImageUrl: string, coverThumbnailUrl: string, altText: string }}
   */
  static getWorkoutCoverByCategory(category) {
    if (category && WORKOUT_CATEGORY_COVERS[category]) {
      return WORKOUT_CATEGORY_COVERS[category];
    }
    return WORKOUT_CATEGORY_COVERS['Full Body'];
  }

  /**
   * Generates a clean, modern SVG fallback data URI.
   * @param {'exercise' | 'workout'} type 
   * @param {string} label 
   * @returns {string}
   */
  static getFallbackPlaceholder(type = 'exercise', label = 'Fitness') {
    const encodedLabel = encodeURIComponent(label || 'Exercise');
    const color = type === 'workout' ? '%236366f1' : '%2306b6d4';
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%230f172a"/><circle cx="300" cy="180" r="60" fill="${color}" opacity="0.2"/><path d="M280 180 L320 180 M300 160 L300 200" stroke="${color}" stroke-width="4" stroke-linecap="round"/><text x="50%" y="280" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23cbd5e1" text-anchor="middle">${encodedLabel}</text><text x="50%" y="310" font-family="sans-serif" font-size="14" fill="%2364748b" text-anchor="middle">FitPlatform Demonstration</text></svg>`;
  }

  /**
   * Mock upload method for future Cloudinary / S3 integration.
   * @param {Buffer|string} file 
   * @param {object} metadata 
   * @returns {Promise<{ url: string, thumbnailUrl: string }>}
   */
  static async uploadImage(file, metadata = {}) {
    // In production, upload to S3/Cloudinary and return public URL.
    // For local development, returns placeholder or relative path.
    const slug = (metadata.name || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    return {
      url: `/assets/images/${metadata.type || 'exercises'}/${slug}.svg`,
      thumbnailUrl: `/assets/images/${metadata.type || 'exercises'}/${slug}.svg`,
      altText: metadata.altText || `${metadata.name || 'Exercise'} demonstration`,
    };
  }
}

export default ImageStorageService;
