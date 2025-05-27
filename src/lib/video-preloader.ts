// Video Preloader Utility for optimized video loading
// Inspired by Netflix and Apple's video optimization strategies

interface VideoPreloadOptions {
  quality?: 'low' | 'medium' | 'high' | 'auto';
  preloadAmount?: number; // MB to preload
  enableAdaptiveStreaming?: boolean;
  enableIntersectionObserver?: boolean;
  rootMargin?: string;
  threshold?: number;
}

interface VideoCache {
  url: string;
  blob?: Blob;
  objectUrl?: string;
  quality: string;
  preloadedBytes: number;
  lastAccessed: number;
  isPreloading: boolean;
}

class VideoPreloader {
  private cache = new Map<string, VideoCache>();
  private preloadQueue = new Set<string>();
  private intersectionObserver?: IntersectionObserver;
  private maxCacheSize = 100 * 1024 * 1024; // 100MB cache limit
  private currentCacheSize = 0;

  constructor(private options: VideoPreloadOptions = {}) {
    this.setupIntersectionObserver();
    this.setupCacheCleanup();
  }

  private setupIntersectionObserver() {
    if (typeof window === 'undefined' || !this.options.enableIntersectionObserver) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          const videoUrl = videoElement.src || videoElement.currentSrc;
          
          if (entry.isIntersecting && videoUrl) {
            this.preloadVideo(videoUrl);
          }
        });
      },
      {
        rootMargin: this.options.rootMargin || '200px',
        threshold: this.options.threshold || 0.1
      }
    );
  }

  private setupCacheCleanup() {
    // Clean up cache every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000);
  }

  private cleanupCache() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [url, cache] of this.cache.entries()) {
      if (now - cache.lastAccessed > maxAge) {
        this.removeFromCache(url);
      }
    }

    // If still over limit, remove oldest entries
    while (this.currentCacheSize > this.maxCacheSize) {
      const oldestEntry = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)[0];
      
      if (oldestEntry) {
        this.removeFromCache(oldestEntry[0]);
      } else {
        break;
      }
    }
  }

  private removeFromCache(url: string) {
    const cache = this.cache.get(url);
    if (cache) {
      if (cache.objectUrl) {
        URL.revokeObjectURL(cache.objectUrl);
      }
      if (cache.blob) {
        this.currentCacheSize -= cache.blob.size;
      }
      this.cache.delete(url);
    }
  }

  private getOptimalQuality(): string {
    if (this.options.quality !== 'auto') {
      return this.options.quality || 'medium';
    }

    // Auto-detect based on connection and device capabilities
    const connection = (navigator as Navigator & { 
      connection?: { 
        effectiveType?: string; 
        downlink?: number; 
      } 
    }).connection;
    if (connection) {
      if (connection.effectiveType === '4g' && (connection.downlink || 0) > 10) {
        return 'high';
      } else if (connection.effectiveType === '3g' || (connection.downlink || 0) > 1.5) {
        return 'medium';
      } else {
        return 'low';
      }
    }

    // Fallback based on screen size
    const screenWidth = window.screen.width;
    if (screenWidth >= 1920) return 'high';
    if (screenWidth >= 1280) return 'medium';
    return 'low';
  }

  private async fetchVideoChunk(url: string, start: number, end: number): Promise<Blob> {
    const response = await fetch(url, {
      headers: {
        'Range': `bytes=${start}-${end}`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video chunk: ${response.status}`);
    }

    return response.blob();
  }

  async preloadVideo(url: string, options?: Partial<VideoPreloadOptions>): Promise<string | null> {
    if (!url || this.preloadQueue.has(url)) return null;

    const mergedOptions = { ...this.options, ...options };
    const preloadAmount = mergedOptions.preloadAmount || 2; // 2MB default
    const quality = this.getOptimalQuality();

    this.preloadQueue.add(url);

    try {
      // Check if already cached
      let cache = this.cache.get(url);
      if (cache && cache.preloadedBytes >= preloadAmount * 1024 * 1024) {
        cache.lastAccessed = Date.now();
        this.preloadQueue.delete(url);
        return cache.objectUrl || null;
      }

      // Convert S3 URLs to API routes if needed
      const processedUrl = this.convertS3UrlToApiRoute(url);

      // Start preloading
      if (!cache) {
        cache = {
          url,
          quality,
          preloadedBytes: 0,
          lastAccessed: Date.now(),
          isPreloading: true
        };
        this.cache.set(url, cache);
      }

      cache.isPreloading = true;

      // Fetch initial chunk for immediate playback
      const chunkSize = Math.min(preloadAmount * 1024 * 1024, 5 * 1024 * 1024); // Max 5MB
      const blob = await this.fetchVideoChunk(processedUrl, 0, chunkSize - 1);

      // Update cache
      cache.blob = blob;
      cache.preloadedBytes = blob.size;
      cache.isPreloading = false;
      this.currentCacheSize += blob.size;

      // Create object URL for immediate use
      if (cache.objectUrl) {
        URL.revokeObjectURL(cache.objectUrl);
      }
      cache.objectUrl = URL.createObjectURL(blob);

      this.preloadQueue.delete(url);
      
      console.log(`Video preloaded: ${url} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
      
      return cache.objectUrl;

    } catch (error) {
      console.error('Video preload failed:', error);
      this.preloadQueue.delete(url);
      return null;
    }
  }

  private convertS3UrlToApiRoute(url: string): string {
    if (!url) return url;
    
    // Check if this is a direct S3 URL that needs to be converted
    const s3UrlPattern = /https:\/\/[^\/]+\.s3\.amazonaws\.com\/(.+)/;
    const match = url.match(s3UrlPattern);
    
    if (match) {
      const s3Key = decodeURIComponent(match[1]);
      return `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true&optimize=true`;
    }
    
    return url;
  }

  observeVideo(videoElement: HTMLVideoElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(videoElement);
    }
  }

  unobserveVideo(videoElement: HTMLVideoElement) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(videoElement);
    }
  }

  getCachedVideoUrl(url: string): string | null {
    const cache = this.cache.get(url);
    if (cache && cache.objectUrl) {
      cache.lastAccessed = Date.now();
      return cache.objectUrl;
    }
    return null;
  }

  isVideoPreloading(url: string): boolean {
    const cache = this.cache.get(url);
    return cache?.isPreloading || this.preloadQueue.has(url);
  }

  getPreloadProgress(url: string): number {
    const cache = this.cache.get(url);
    if (!cache) return 0;
    
    const targetSize = (this.options.preloadAmount || 2) * 1024 * 1024;
    return Math.min(cache.preloadedBytes / targetSize, 1);
  }

  // Preload multiple videos in priority order
  async preloadVideos(urls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const concurrency = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
    const chunks = [];
    
    for (let i = 0; i < urls.length; i += concurrency) {
      chunks.push(urls.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(url => this.preloadVideo(url))
      );
    }
  }

  // Clear all cached videos
  clearCache() {
    for (const [url] of this.cache.entries()) {
      this.removeFromCache(url);
    }
    this.currentCacheSize = 0;
  }

  // Get cache statistics
  getCacheStats() {
    return {
      totalEntries: this.cache.size,
      totalSize: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilizationPercent: (this.currentCacheSize / this.maxCacheSize) * 100
    };
  }

  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.clearCache();
  }
}

// Global video preloader instance
export const videoPreloader = new VideoPreloader({
  quality: 'auto',
  preloadAmount: 3, // 3MB
  enableAdaptiveStreaming: true,
  enableIntersectionObserver: true,
  rootMargin: '300px',
  threshold: 0.1
});

export default VideoPreloader; 