import { useState, useEffect, useRef, useCallback } from 'react';
import { videoPreloader } from '@/lib/video-preloader';

interface MediaOptions {
  enableLazyLoading?: boolean;
  enablePreloading?: boolean;
  rootMargin?: string;
  threshold?: number;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  enableWebP?: boolean;
  enableAVIF?: boolean;
  placeholder?: string;
}

interface MediaState {
  src: string | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  progress: number;
}

export function useOptimizedMedia(
  originalSrc: string,
  type: 'image' | 'video' = 'image',
  options: MediaOptions = {}
) {
  const [state, setState] = useState<MediaState>({
    src: null,
    isLoading: false,
    isLoaded: false,
    error: null,
    progress: 0
  });

  const elementRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasStartedLoading = useRef(false);

  const {
    enableLazyLoading = true,
    enablePreloading = true,
    rootMargin = '50px',
    threshold = 0.1,
    quality = 'auto',
    enableWebP = true,
    enableAVIF = true,
    placeholder
  } = options;

  // Convert image to modern formats if supported
  const getOptimizedImageSrc = useCallback((src: string): string => {
    if (!src || type !== 'image') return src;

    // Check if browser supports modern formats
    const supportsAVIF = enableAVIF && CSS.supports('image-format', 'avif');
    const supportsWebP = enableWebP && CSS.supports('image-format', 'webp');

    // If it's an S3 URL, we can request optimized versions
    const s3UrlPattern = /https:\/\/[^\/]+\.s3\.amazonaws\.com\/(.+)/;
    const match = src.match(s3UrlPattern);
    
    if (match) {
      const s3Key = decodeURIComponent(match[1]);
      let format = 'jpeg';
      
      if (supportsAVIF) {
        format = 'avif';
      } else if (supportsWebP) {
        format = 'webp';
      }

      return `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true&format=${format}&quality=${quality}`;
    }

    return src;
  }, [type, enableAVIF, enableWebP, quality]);

  // Preload media
  const preloadMedia = useCallback(async (src: string) => {
    if (!src || hasStartedLoading.current) return;

    hasStartedLoading.current = true;
    setState(prev => ({ ...prev, isLoading: true, progress: 0 }));

    try {
      if (type === 'video') {
        // Use video preloader for videos
        const preloadedUrl = await videoPreloader.preloadVideo(src);
        if (preloadedUrl) {
          setState(prev => ({ 
            ...prev, 
            src: preloadedUrl, 
            isLoaded: true, 
            isLoading: false, 
            progress: 100 
          }));
        } else {
          // Fallback to original URL
          setState(prev => ({ 
            ...prev, 
            src, 
            isLoaded: true, 
            isLoading: false, 
            progress: 100 
          }));
        }
      } else {
        // Preload images
        const optimizedSrc = getOptimizedImageSrc(src);
        const img = new Image();
        
        img.onload = () => {
          setState(prev => ({ 
            ...prev, 
            src: optimizedSrc, 
            isLoaded: true, 
            isLoading: false, 
            progress: 100 
          }));
        };
        
        img.onerror = () => {
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to load image', 
            isLoading: false 
          }));
        };

        // Simulate progress for images (since we can't track actual progress)
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          setState(prev => ({ ...prev, progress: Math.min(progress, 90) }));
        }, 50);

        img.src = optimizedSrc;

        // Clear progress interval when image loads
        img.onload = () => {
          clearInterval(progressInterval);
          setState(prev => ({ 
            ...prev, 
            src: optimizedSrc, 
            isLoaded: true, 
            isLoading: false, 
            progress: 100 
          }));
        };
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load media', 
        isLoading: false 
      }));
    }
  }, [type, getOptimizedImageSrc]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || !originalSrc) {
      // If lazy loading is disabled, start loading immediately
      if (originalSrc && enablePreloading) {
        preloadMedia(originalSrc);
      } else if (originalSrc) {
        setState(prev => ({ ...prev, src: getOptimizedImageSrc(originalSrc) }));
      }
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStartedLoading.current) {
            if (enablePreloading) {
              preloadMedia(originalSrc);
            } else {
              setState(prev => ({ ...prev, src: getOptimizedImageSrc(originalSrc) }));
            }
            
            // Stop observing once we start loading
            if (observerRef.current && elementRef.current) {
              observerRef.current.unobserve(elementRef.current);
            }
          }
        });
      },
      {
        rootMargin,
        threshold
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [originalSrc, enableLazyLoading, enablePreloading, preloadMedia, getOptimizedImageSrc, rootMargin, threshold]);

  // Observe element when ref is set
  useEffect(() => {
    if (elementRef.current && observerRef.current && enableLazyLoading) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current && observerRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    };
  }, [enableLazyLoading]);

  // For videos, also register with video preloader's intersection observer
  useEffect(() => {
    if (type === 'video' && elementRef.current && originalSrc) {
      const videoElement = elementRef.current as HTMLVideoElement;
      videoPreloader.observeVideo(videoElement);

      return () => {
        videoPreloader.unobserveVideo(videoElement);
      };
    }
  }, [type, originalSrc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      hasStartedLoading.current = false;
    };
  }, []);

  // Get placeholder src
  const getPlaceholderSrc = useCallback(() => {
    if (placeholder) return placeholder;
    
    if (type === 'image') {
      // Generate a simple placeholder
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui">
            Loading...
          </text>
        </svg>
      `)}`;
    }
    
    return '';
  }, [placeholder, type]);

  return {
    ...state,
    elementRef,
    placeholderSrc: getPlaceholderSrc(),
    // Helper methods
    retry: () => {
      hasStartedLoading.current = false;
      setState({
        src: null,
        isLoading: false,
        isLoaded: false,
        error: null,
        progress: 0
      });
      if (originalSrc) {
        preloadMedia(originalSrc);
      }
    }
  };
}

// Hook specifically for images with additional image-specific features
export function useOptimizedImage(src: string, options?: MediaOptions) {
  return useOptimizedMedia(src, 'image', options);
}

// Hook specifically for videos with additional video-specific features
export function useOptimizedVideo(src: string, options?: MediaOptions) {
  const result = useOptimizedMedia(src, 'video', options);
  
  return {
    ...result,
    // Video-specific methods
    isPreloading: videoPreloader.isVideoPreloading(src),
    preloadProgress: videoPreloader.getPreloadProgress(src),
    getCachedUrl: () => videoPreloader.getCachedVideoUrl(src)
  };
} 