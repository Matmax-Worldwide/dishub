'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import { MediaItem } from '@/components/cms/media/types';
import S3FilePreview from '@/components/shared/S3FilePreview';
import MediaSelector from '@/components/cms/MediaSelector';
import ColorSelector from '@/components/cms/ColorSelector';
import TransparencySelector from '@/components/cms/TransparencySelector';
import { CmsTabs } from '@/components/cms/CmsTabs';
import { FileText, Palette, Video, Eye } from 'lucide-react';
import { useOptimizedVideo, useOptimizedImage } from '@/hooks/useOptimizedMedia';
import { videoPreloader } from '@/lib/video-preloader';

interface VideoSectionProps {
  videoUrl?: string;
  posterUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsinline?: boolean;
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  textColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
  contentPosition?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  showPlayButton?: boolean;
  playButtonStyle?: 'default' | 'filled' | 'outline';
  playButtonSize?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  maxHeight?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  isEditing?: boolean;
  onUpdate?: (data: Partial<VideoSectionProps>) => void;
}

const VideoSection = React.memo(function VideoSection({
  videoUrl: initialVideoUrl = '',
  posterUrl: initialPosterUrl = '',
  title: initialTitle = '',
  subtitle: initialSubtitle = '',
  description: initialDescription = '',
  autoplay: initialAutoplay = false,
  loop: initialLoop = false,
  muted: initialMuted = true,
  controls: initialControls = true,
  playsinline: initialPlaysinline = true,
  overlayEnabled: initialOverlayEnabled = false,
  overlayColor: initialOverlayColor = '#000000',
  overlayOpacity: initialOverlayOpacity = 50,
  textColor: initialTextColor = '#ffffff',
  textAlignment: initialTextAlignment = 'center',
  contentPosition: initialContentPosition = 'center',
  showPlayButton: initialShowPlayButton = true,
  playButtonStyle: initialPlayButtonStyle = 'filled',
  playButtonSize: initialPlayButtonSize = 'lg',
  fullHeight: initialFullHeight = true,
  maxHeight: initialMaxHeight = '100vh',
  objectFit: initialObjectFit = 'cover',
  isEditing = false,
  onUpdate
}: VideoSectionProps) {
  // Use optimized video hook for better performance
  const optimizedVideo = useOptimizedVideo(initialVideoUrl, {
    enableLazyLoading: !isEditing,
    enablePreloading: true,
    quality: 'auto',
    rootMargin: '300px',
    threshold: 0.1
  });

  // Use optimized image hook for poster
  const optimizedPoster = useOptimizedImage(initialPosterUrl, {
    enableLazyLoading: !isEditing,
    enablePreloading: true,
    quality: 'high',
    enableWebP: true,
    enableAVIF: true
  });

  // Local state for CMS editing
  const [localVideoUrl, setLocalVideoUrl] = useState(initialVideoUrl);
  const [localPosterUrl, setLocalPosterUrl] = useState(initialPosterUrl);
  const [localTitle, setLocalTitle] = useState(initialTitle);
  const [localSubtitle, setLocalSubtitle] = useState(initialSubtitle);
  const [localDescription, setLocalDescription] = useState(initialDescription);
  const [localAutoplay, setLocalAutoplay] = useState(initialAutoplay);
  const [localLoop, setLocalLoop] = useState(initialLoop);
  const [localMuted, setLocalMuted] = useState(initialMuted);
  const [localControls, setLocalControls] = useState(initialControls);
  const [localPlaysinline, setLocalPlaysinline] = useState(initialPlaysinline);
  const [localOverlayEnabled, setLocalOverlayEnabled] = useState(initialOverlayEnabled);
  const [localOverlayColor, setLocalOverlayColor] = useState(initialOverlayColor);
  const [localOverlayOpacity, setLocalOverlayOpacity] = useState(initialOverlayOpacity);
  const [localTextColor, setLocalTextColor] = useState(initialTextColor);
  const [localTextAlignment, setLocalTextAlignment] = useState(initialTextAlignment);
  const [localContentPosition, setLocalContentPosition] = useState(initialContentPosition);
  const [localShowPlayButton, setLocalShowPlayButton] = useState(initialShowPlayButton);
  const [localPlayButtonStyle, setLocalPlayButtonStyle] = useState(initialPlayButtonStyle);
  const [localPlayButtonSize, setLocalPlayButtonSize] = useState(initialPlayButtonSize);
  const [localFullHeight, setLocalFullHeight] = useState(initialFullHeight);
  const [localMaxHeight, setLocalMaxHeight] = useState(initialMaxHeight);
  const [localObjectFit, setLocalObjectFit] = useState(initialObjectFit);

  // UI state
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [showPosterSelector, setShowPosterSelector] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [videoErrorMessage, setVideoErrorMessage] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoLoadProgress, setVideoLoadProgress] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isEditingRef = useRef(false);
  const videoCache = useRef<Map<string, string>>(new Map());
  const videoBlobCache = useRef<Map<string, Blob>>(new Map());
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get optimized URLs for rendering (fallback to original if not loaded)
  const videoSrc = optimizedVideo.src || localVideoUrl;
  const posterSrc = optimizedPoster.src || localPosterUrl;
  const isVideoOptimized = optimizedVideo.isLoaded;
  const videoLoadingProgress = optimizedVideo.progress;

  // Preload video when component mounts or URL changes
  useEffect(() => {
    if (localVideoUrl && !isEditing) {
      videoPreloader.preloadVideo(localVideoUrl, {
        preloadAmount: 3, // 3MB
        quality: 'auto'
      });
    }
  }, [localVideoUrl, isEditing]);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (initialVideoUrl !== localVideoUrl) setLocalVideoUrl(initialVideoUrl);
      if (initialPosterUrl !== localPosterUrl) setLocalPosterUrl(initialPosterUrl);
      if (initialTitle !== localTitle) setLocalTitle(initialTitle);
      if (initialSubtitle !== localSubtitle) setLocalSubtitle(initialSubtitle);
      if (initialDescription !== localDescription) setLocalDescription(initialDescription);
      if (initialAutoplay !== localAutoplay) setLocalAutoplay(initialAutoplay);
      if (initialLoop !== localLoop) setLocalLoop(initialLoop);
      if (initialMuted !== localMuted) setLocalMuted(initialMuted);
      if (initialControls !== localControls) setLocalControls(initialControls);
      if (initialPlaysinline !== localPlaysinline) setLocalPlaysinline(initialPlaysinline);
      if (initialOverlayEnabled !== localOverlayEnabled) setLocalOverlayEnabled(initialOverlayEnabled);
      if (initialOverlayColor !== localOverlayColor) setLocalOverlayColor(initialOverlayColor);
      if (initialOverlayOpacity !== localOverlayOpacity) setLocalOverlayOpacity(initialOverlayOpacity);
      if (initialTextColor !== localTextColor) setLocalTextColor(initialTextColor);
      if (initialTextAlignment !== localTextAlignment) setLocalTextAlignment(initialTextAlignment);
      if (initialContentPosition !== localContentPosition) setLocalContentPosition(initialContentPosition);
      if (initialShowPlayButton !== localShowPlayButton) setLocalShowPlayButton(initialShowPlayButton);
      if (initialPlayButtonStyle !== localPlayButtonStyle) setLocalPlayButtonStyle(initialPlayButtonStyle);
      if (initialPlayButtonSize !== localPlayButtonSize) setLocalPlayButtonSize(initialPlayButtonSize);
      if (initialFullHeight !== localFullHeight) setLocalFullHeight(initialFullHeight);
      if (initialMaxHeight !== localMaxHeight) setLocalMaxHeight(initialMaxHeight);
      if (initialObjectFit !== localObjectFit) setLocalObjectFit(initialObjectFit);
    }
  }, [
    initialVideoUrl, initialPosterUrl, initialTitle, initialSubtitle, initialDescription,
    initialAutoplay, initialLoop, initialMuted, initialControls, initialPlaysinline,
    initialOverlayEnabled, initialOverlayColor, initialOverlayOpacity, initialTextColor,
    initialTextAlignment, initialContentPosition, initialShowPlayButton, initialPlayButtonStyle,
    initialPlayButtonSize, initialFullHeight, initialMaxHeight, initialObjectFit,
    localVideoUrl, localPosterUrl, localTitle, localSubtitle, localDescription,
    localAutoplay, localLoop, localMuted, localControls, localPlaysinline,
    localOverlayEnabled, localOverlayColor, localOverlayOpacity, localTextColor,
    localTextAlignment, localContentPosition, localShowPlayButton, localPlayButtonStyle,
    localPlayButtonSize, localFullHeight, localMaxHeight, localObjectFit
  ]);

  // Optimized update function with debouncing
  const handleUpdateField = useCallback((field: string, value: string | number | boolean) => {
    if (onUpdate) {
      // Mark that we're in editing mode to prevent useEffect override
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        const updateData: Partial<VideoSectionProps> = {};
        
        // @ts-expect-error: Dynamic field assignment
        updateData[field] = value;
        
        onUpdate(updateData);
        
        // Reset editing flag after a short delay to prevent immediate override
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate]);

  // Individual change handlers
  const handleVideoUrlChange = useCallback((newValue: string) => {
    setLocalVideoUrl(newValue);
    handleUpdateField('videoUrl', newValue);
    setShowVideoSelector(false);
  }, [handleUpdateField]);

  const handlePosterUrlChange = useCallback((newValue: string) => {
    setLocalPosterUrl(newValue);
    handleUpdateField('posterUrl', newValue);
    setShowPosterSelector(false);
  }, [handleUpdateField]);

  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);

  const handleSubtitleChange = useCallback((newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  }, [handleUpdateField]);

  const handleDescriptionChange = useCallback((newValue: string) => {
    setLocalDescription(newValue);
    handleUpdateField('description', newValue);
  }, [handleUpdateField]);

  // Video control handlers
  const handleAutoplayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalAutoplay(newValue);
    handleUpdateField('autoplay', newValue);
  }, [handleUpdateField]);

  const handleLoopChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalLoop(newValue);
    handleUpdateField('loop', newValue);
  }, [handleUpdateField]);

  const handleMutedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalMuted(newValue);
    handleUpdateField('muted', newValue);
  }, [handleUpdateField]);

  const handleControlsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalControls(newValue);
    handleUpdateField('controls', newValue);
  }, [handleUpdateField]);

  const handlePlaysinlineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalPlaysinline(newValue);
    handleUpdateField('playsinline', newValue);
  }, [handleUpdateField]);

  // Overlay handlers
  const handleOverlayEnabledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalOverlayEnabled(newValue);
    handleUpdateField('overlayEnabled', newValue);
  }, [handleUpdateField]);

  const handleOverlayColorChange = useCallback((color: string) => {
    setLocalOverlayColor(color);
    handleUpdateField('overlayColor', color);
  }, [handleUpdateField]);

  const handleOverlayOpacityChange = useCallback((opacity: number) => {
    setLocalOverlayOpacity(opacity);
    handleUpdateField('overlayOpacity', opacity);
  }, [handleUpdateField]);

  const handleTextColorChange = useCallback((color: string) => {
    setLocalTextColor(color);
    handleUpdateField('textColor', color);
  }, [handleUpdateField]);

  // Layout handlers
  const handleTextAlignmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'left' | 'center' | 'right';
    setLocalTextAlignment(newValue);
    handleUpdateField('textAlignment', newValue);
  }, [handleUpdateField]);

  const handleContentPositionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as typeof localContentPosition;
    setLocalContentPosition(newValue);
    handleUpdateField('contentPosition', newValue);
  }, [handleUpdateField]);

  const handleShowPlayButtonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalShowPlayButton(newValue);
    handleUpdateField('showPlayButton', newValue);
  }, [handleUpdateField]);

  const handlePlayButtonStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'default' | 'filled' | 'outline';
    setLocalPlayButtonStyle(newValue);
    handleUpdateField('playButtonStyle', newValue);
  }, [handleUpdateField]);

  const handlePlayButtonSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'sm' | 'md' | 'lg';
    setLocalPlayButtonSize(newValue);
    handleUpdateField('playButtonSize', newValue);
  }, [handleUpdateField]);

  const handleFullHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalFullHeight(newValue);
    handleUpdateField('fullHeight', newValue);
  }, [handleUpdateField]);

  const handleMaxHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalMaxHeight(newValue);
    handleUpdateField('maxHeight', newValue);
  }, [handleUpdateField]);

  const handleObjectFitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'cover' | 'contain' | 'fill';
    setLocalObjectFit(newValue);
    handleUpdateField('objectFit', newValue);
  }, [handleUpdateField]);

  // Media selection handlers
  const handleVideoSelection = (mediaItem: MediaItem) => {
    // For S3 files, use the API route instead of direct S3 URL
    let videoUrl = mediaItem.fileUrl;
    
    // Check if this is an S3 file and convert to API route
    if (mediaItem.s3Key) {
      videoUrl = `/api/media/download?key=${encodeURIComponent(mediaItem.s3Key)}&view=true`;
      console.log('Using S3 API route for video:', { s3Key: mediaItem.s3Key, apiUrl: videoUrl });
    } else {
      console.log('Using direct URL for video:', { fileUrl: videoUrl });
    }
    
    console.log('Selected video:', { mediaItem, finalVideoUrl: videoUrl });
    handleVideoUrlChange(videoUrl);
  };

  const handlePosterSelection = (mediaItem: MediaItem) => {
    // For S3 files, use the API route instead of direct S3 URL
    let posterUrl = mediaItem.fileUrl;
    
    // Check if this is an S3 file and convert to API route
    if (mediaItem.s3Key) {
      posterUrl = `/api/media/download?key=${encodeURIComponent(mediaItem.s3Key)}&view=true`;
      console.log('Using S3 API route for poster:', { s3Key: mediaItem.s3Key, apiUrl: posterUrl });
    } else {
      console.log('Using direct URL for poster:', { fileUrl: posterUrl });
    }
    
    console.log('Selected poster:', { mediaItem, finalPosterUrl: posterUrl });
    handlePosterUrlChange(posterUrl);
  };

  // Video play/pause handler
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Video event handlers with improved loading states
  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);
  
  const handleVideoLoadStart = () => {
    setIsVideoLoading(true);
    setVideoLoadProgress(0);
    setHasVideoError(false);
    setVideoErrorMessage('');
  };

  const handleVideoProgress = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const progress = (bufferedEnd / duration) * 100;
          setVideoLoadProgress(Math.min(progress, 100));
          
          // Early loading completion for faster perceived performance
          if (bufferedEnd > 3 || progress > 5) {
            setIsVideoLoading(false);
          }
        }
      }
    }
  };

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false);
    setVideoLoadProgress(100);
    if (localAutoplay && !isEditing && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented by browser:', error);
      });
    }
  };

  const handleVideoLoadedData = () => {
    console.log('Video loaded successfully:', convertS3UrlToApiRoute(localVideoUrl));
    setHasVideoError(false);
    setVideoErrorMessage('');
    setIsVideoLoading(false);
    setVideoLoadProgress(100);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    
    setIsVideoLoading(false);
    
    // Only log if there's actually an error to avoid empty error objects
    if (error && error.code) {
      console.warn('Video error details:', {
        url: localVideoUrl,
        errorCode: error.code,
        errorMessage: error.message || 'No error message',
        networkState: video.networkState,
        readyState: video.readyState
      });
      
      // Provide user-friendly error messages
      let errorMessage = 'Video playback error';
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video playback was aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading video';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video format not supported or corrupted';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format not supported by browser';
          break;
        default:
          errorMessage = 'Unknown video error';
      }
      
      // Use console.warn instead of console.error to avoid Next.js error overlay
      console.warn(`Video Warning: ${errorMessage}`);
      
      // Update error state for UI feedback
      setHasVideoError(true);
      setVideoErrorMessage(errorMessage);
      
      // Optionally show user-friendly message in UI
      if (isEditing && onUpdate) {
        // Could trigger a notification or update state to show error in UI
      }
    } else {
      // Silent handling for cases where error object is empty
      console.log('Video error event triggered but no error details available');
      setHasVideoError(true);
      setVideoErrorMessage('Video failed to load');
    }
  };

  // Utility function to convert hex to rgba
  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  }, []);

  // Get content position classes
  const getContentPositionClasses = () => {
    const positions = {
      'top-left': 'items-start justify-start',
      'top-center': 'items-start justify-center',
      'top-right': 'items-start justify-end',
      'center-left': 'items-center justify-start',
      'center': 'items-center justify-center',
      'center-right': 'items-center justify-end',
      'bottom-left': 'items-end justify-start',
      'bottom-center': 'items-end justify-center',
      'bottom-right': 'items-end justify-end'
    };
    return positions[localContentPosition] || positions.center;
  };

  // Get play button size classes
  const getPlayButtonSizeClasses = () => {
    const sizes = {
      'sm': 'w-12 h-12',
      'md': 'w-16 h-16',
      'lg': 'w-20 h-20'
    };
    return sizes[localPlayButtonSize] || sizes.lg;
  };

  // Get play button style classes
  const getPlayButtonStyleClasses = () => {
    const styles = {
      'default': 'bg-white/20 hover:bg-white/30 text-white',
      'filled': 'bg-white text-black hover:bg-gray-100',
      'outline': 'border-2 border-white text-white hover:bg-white/20'
    };
    return styles[localPlayButtonStyle] || styles.filled;
  };

  // Custom hook for video optimization
  const [isOptimized, setIsOptimized] = useState(false);
  
  const optimizeVideo = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!videoElement || isOptimized) return;
    
    try {
      // Set optimal buffer size
      if ('buffered' in videoElement) {
        // Force immediate buffer loading
        videoElement.load();
        
        // Monitor buffering progress
        const checkBuffer = () => {
          if (videoElement.buffered.length > 0) {
            const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
            if (bufferedEnd > 2) { // 2 seconds of buffer is enough for smooth playback
              setIsVideoLoading(false);
              setIsOptimized(true);
            }
          }
        };
        
        videoElement.addEventListener('progress', checkBuffer);
        videoElement.addEventListener('canplay', checkBuffer);
        
        // Cleanup
        return () => {
          videoElement.removeEventListener('progress', checkBuffer);
          videoElement.removeEventListener('canplay', checkBuffer);
        };
      }
    } catch (error) {
      console.warn('Video optimization failed:', error);
    }
  }, [isOptimized]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      // Reset any pending state changes
      setIsOptimized(false);
    };
  }, []);

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      videoCache.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      videoCache.current.clear();
      videoBlobCache.current.clear();
    };
  }, []);

  // Helper function to detect video format and MIME type
  const getVideoMimeType = useCallback((url: string): string => {
    if (!url) return 'video/mp4';
    
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4':
      case 'm4v':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
      case 'ogv':
        return 'video/ogg';
      case 'avi':
        return 'video/x-msvideo';
      case 'mov':
        return 'video/quicktime';
      case 'wmv':
        return 'video/x-ms-wmv';
      case 'flv':
        return 'video/x-flv';
      case 'mkv':
        return 'video/x-matroska';
      default:
        // Default to mp4 for unknown extensions or S3 URLs without clear extensions
        return 'video/mp4';
    }
  }, []);

  // Helper function to convert S3 URLs to API routes with caching
  const convertS3UrlToApiRoute = useCallback((url: string): string => {
    if (!url) return url;
    
    // Check cache first
    if (videoCache.current.has(url)) {
      return videoCache.current.get(url)!;
    }
    
    // Check if this is a direct S3 URL that needs to be converted
    const s3UrlPattern = /https:\/\/[^\/]+\.s3\.amazonaws\.com\/(.+)/;
    const match = url.match(s3UrlPattern);
    
    let processedUrl = url;
    if (match) {
      const s3Key = decodeURIComponent(match[1]);
      processedUrl = `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true`;
      console.log('Converting S3 URL to API route:', { originalUrl: url, s3Key, apiUrl: processedUrl });
    }
    
    // Cache the result
    videoCache.current.set(url, processedUrl);
    
    return processedUrl;
  }, []);

  // Reset loading and error state when video URL changes
  useEffect(() => {
    if (localVideoUrl) {
      setHasVideoError(false);
      setVideoErrorMessage('');
      setIsVideoLoading(true);
      setVideoLoadProgress(0);
    }
  }, [localVideoUrl]);

  // Advanced video preloading with intersection observer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create intersection observer for smart preloading
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && localVideoUrl && !isEditing) {
            // Start preloading when video section comes into view
            preloadVideo(localVideoUrl);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the video comes into view
        threshold: 0.1
      }
    );

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [localVideoUrl, isEditing]);

  // Attach intersection observer to video element
  useEffect(() => {
    if (videoRef.current && intersectionObserverRef.current) {
      intersectionObserverRef.current.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current && intersectionObserverRef.current) {
        intersectionObserverRef.current.unobserve(videoRef.current);
      }
    };
  }, []);

  // Advanced video preloading function
  const preloadVideo = useCallback(async (videoUrl: string) => {
    if (!videoUrl || videoBlobCache.current.has(videoUrl)) return;

    try {
      const processedUrl = convertS3UrlToApiRoute(videoUrl);
      
      // Use fetch with range requests for progressive loading
      const response = await fetch(processedUrl, {
        headers: {
          'Range': 'bytes=0-1048576', // Load first 1MB for instant playback
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        videoBlobCache.current.set(videoUrl, blob);
        
        // Create object URL for immediate use
        const objectUrl = URL.createObjectURL(blob);
        videoCache.current.set(videoUrl, objectUrl);
        
        console.log('Video chunk preloaded successfully:', videoUrl);
      }
    } catch (error) {
      console.warn('Video preload failed:', error);
    }
  }, [convertS3UrlToApiRoute]);

  // Enhanced video optimization with adaptive quality
  const optimizeVideoForFastLoading = useCallback((videoElement: HTMLVideoElement) => {
    if (!videoElement) return;

    // Set optimal loading attributes
    videoElement.preload = 'auto';
    videoElement.crossOrigin = 'anonymous';
    
    // Enable hardware acceleration
    videoElement.style.willChange = 'transform';
    videoElement.style.transform = 'translateZ(0)';
    
    // Optimize for mobile
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      videoElement.playsInline = true;
      videoElement.muted = true; // Required for autoplay on mobile
    }

    // Set buffer size for faster streaming
    if ('buffered' in videoElement) {
      videoElement.addEventListener('progress', () => {
        if (videoElement.buffered.length > 0) {
          const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
          const duration = videoElement.duration;
          if (duration > 0) {
            const progress = (bufferedEnd / duration) * 100;
            setVideoLoadProgress(Math.min(progress, 100));
            
            // Hide loading when we have enough buffer (5 seconds or 10%)
            if (bufferedEnd > 5 || progress > 10) {
              setIsVideoLoading(false);
            }
          }
        }
      });
    }
  }, []);

  // Enhanced video loading with immediate playback and pre-rendering support
  useEffect(() => {
    if (localVideoUrl && videoRef.current && !isEditing) {
      const video = videoRef.current;
      const processedVideoUrl = convertS3UrlToApiRoute(localVideoUrl);
      
      // Check if video is already preloaded from page-level cache
      const isPreloaded = document.querySelector(`video[src="${processedVideoUrl}"]`);
      
      if (isPreloaded) {
        // Use preloaded video for instant loading
        video.src = processedVideoUrl;
        setIsVideoLoading(false);
        setVideoLoadProgress(100);
        console.log('🎬 Using preloaded video for instant playback');
      } else {
        // Check if we have a preloaded URL in browser cache
        const cachedUrl = videoCache.current.get(localVideoUrl);
        
        if (cachedUrl) {
          // Use cached URL for immediate loading
          video.src = cachedUrl;
          setIsVideoLoading(false);
          console.log('🎬 Using cached video URL for instant loading');
        } else {
          // Check for ultra-fast pre-rendered video from page cache
          const ultraCacheKey = `ultra-video-${localVideoUrl}`;
          const preRenderedVideo = sessionStorage.getItem(ultraCacheKey);
          
          if (preRenderedVideo) {
            try {
              const videoData = JSON.parse(preRenderedVideo);
              if (videoData.objectUrl && videoData.readyState >= 2) {
                video.src = videoData.objectUrl;
                setIsVideoLoading(false);
                setVideoLoadProgress(100);
                console.log('🚀 Using ultra-fast pre-rendered video for instant playback');
              } else {
                video.src = processedVideoUrl;
              }
            } catch (error) {
              console.warn('Failed to parse pre-rendered video data:', error);
              video.src = processedVideoUrl;
            }
          } else {
            // Use original URL with optimizations
            video.src = processedVideoUrl;
          }
        }
      }

      // Apply all optimizations
      optimizeVideoForFastLoading(video);
      optimizeVideo(video);
      
      // Set up video properties
      video.muted = localMuted;
      video.loop = localLoop;
      video.playsInline = localPlaysinline;
      
      // Immediate load attempt with priority
      video.load();
      
      // Auto-play with error handling
      if (localAutoplay) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log('Autoplay prevented by browser:', error);
            // Fallback: show play button
            setLocalShowPlayButton(true);
          });
        }
      }
    }
  }, [localVideoUrl, localAutoplay, localMuted, localLoop, localPlaysinline, isEditing, convertS3UrlToApiRoute, optimizeVideoForFastLoading, optimizeVideo]);

  // Render video content with progressive loading and animated elements
  const renderVideoContent = () => {
    // Use optimized URLs when available, fallback to converted S3 URLs
    const processedVideoUrl = videoSrc ? convertS3UrlToApiRoute(videoSrc) : convertS3UrlToApiRoute(localVideoUrl);
    const processedPosterUrl = posterSrc ? convertS3UrlToApiRoute(posterSrc) : convertS3UrlToApiRoute(localPosterUrl);
    
    // Use optimized loading progress when available
    const currentLoadProgress = isVideoOptimized ? videoLoadingProgress : videoLoadProgress;

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {processedVideoUrl ? (
          hasVideoError ? (
            // Error state with modern design
            <motion.div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 text-red-800"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="text-center p-8 max-w-md">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="mb-6"
                >
                  <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Video Error
                </motion.h3>
                <motion.p 
                  className="text-sm opacity-80 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {videoErrorMessage}
                </motion.p>
                {isEditing && (
                  <motion.button
                    onClick={() => {
                      setHasVideoError(false);
                      setVideoErrorMessage('');
                      setIsVideoLoading(true);
                      if (videoRef.current) {
                        videoRef.current.load();
                      }
                    }}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Retry
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            // Progressive loading with animated content
            <>
              {/* Video element - loads in background */}
              <motion.video
                ref={videoRef}
                className="w-full h-full"
                style={{ 
                  objectFit: localObjectFit,
                  backgroundColor: 'transparent',
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                }}
                autoPlay={localAutoplay && !isEditing}
                muted={localMuted}
                loop={localLoop}
                controls={localControls}
                playsInline={localPlaysinline}
                preload="auto"
                crossOrigin="anonymous"
                poster={processedPosterUrl}
                x-webkit-airplay="allow"
                webkit-playsinline="true"
                buffered="true"
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onError={handleVideoError}
                onLoadStart={handleVideoLoadStart}
                onProgress={handleVideoProgress}
                onLoadedData={handleVideoLoadedData}
                onCanPlay={handleVideoCanPlay}
                onLoadedMetadata={() => {
                  if (videoRef.current && videoRef.current.readyState >= 1) {
                    setIsVideoLoading(false);
                  }
                }}
                onCanPlayThrough={() => {
                  setIsVideoLoading(false);
                  setVideoLoadProgress(100);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isVideoLoading ? 0.3 : 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                data-field-type="videoUrl"
                data-component-type="Video"
              >
                <source src={processedVideoUrl} type={getVideoMimeType(processedVideoUrl)} />
                {processedVideoUrl.includes('.mp4') && (
                  <>
                    <source src={processedVideoUrl} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
                    <source src={processedVideoUrl} type="video/mp4" />
                  </>
                )}
                {processedVideoUrl.includes('.webm') && (
                  <>
                    <source src={processedVideoUrl} type="video/webm; codecs=vp9,opus" />
                    <source src={processedVideoUrl} type="video/webm; codecs=vp8,vorbis" />
                    <source src={processedVideoUrl} type="video/webm" />
                  </>
                )}
                {processedVideoUrl.includes('.ogg') && (
                  <source src={processedVideoUrl} type="video/ogg; codecs=theora,vorbis" />
                )}
                <p className="text-white text-center p-4">
                  Your browser does not support the video tag. 
                  <a href={processedVideoUrl} className="underline ml-1" target="_blank" rel="noopener noreferrer">
                    Download the video
                  </a>
                </p>
              </motion.video>
              
              {/* Modern loading overlay with progressive content reveal */}
              {isVideoLoading && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          opacity: [0.2, 0.8, 0.2],
                          scale: [1, 1.5, 1],
                        }}
                        transition={{
                          duration: 2 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                        }}
                      />
                    ))}
                  </div>

                  {/* Progressive content loading */}
                  <div className="relative z-20 h-full flex flex-col items-center justify-center p-8">
                    {/* Loading indicator */}
                    <motion.div
                      className="mb-8"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-white/20 rounded-full"></div>
                        <motion.div
                          className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                    </motion.div>

                    {/* Progressive text content - appears while video loads */}
                    {localTitle && (
                      <motion.h1 
                        className="text-2xl md:text-4xl font-bold text-white mb-4 text-center max-w-4xl"
                        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                      >
                        {localTitle}
                      </motion.h1>
                    )}
                    
                    {localSubtitle && (
                      <motion.h2 
                        className="text-lg md:text-xl text-white/90 mb-6 text-center max-w-2xl"
                        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                      >
                        {localSubtitle}
                      </motion.h2>
                    )}
                    
                    {localDescription && (
                      <motion.p 
                        className="text-white/80 text-center max-w-xl leading-relaxed mb-8"
                        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
                      >
                        {localDescription}
                      </motion.p>
                    )}

                    {/* Loading progress */}
                    <motion.div 
                      className="w-64 h-1 bg-white/20 rounded-full overflow-hidden"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                    >
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${currentLoadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.div>
                    
                    <motion.p 
                      className="text-white/60 text-sm mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.4 }}
                    >
                      Loading video... {Math.round(currentLoadProgress)}%
                    </motion.p>
                  </div>
                </motion.div>
              )}
              
              {/* Overlay */}
              {localOverlayEnabled && !isVideoLoading && (
                <motion.div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    backgroundColor: hexToRgba(localOverlayColor, localOverlayOpacity)
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              )}
              
              {/* Content overlay - appears after video loads */}
              {!isVideoLoading && (
                <motion.div 
                  className={`absolute inset-0 flex ${getContentPositionClasses()} p-6 sm:p-12 pointer-events-none`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                >
                  <div className={`text-${localTextAlignment} max-w-4xl`} style={{ color: localTextColor }}>
                    {localTitle && (
                      <motion.h1 
                        className="text-4xl sm:text-6xl font-bold mb-6 leading-tight"
                        initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        data-field-type="title"
                        data-component-type="Video"
                      >
                        {localTitle}
                      </motion.h1>
                    )}
                    {localSubtitle && (
                      <motion.h2 
                        className="text-xl sm:text-2xl mb-6 opacity-90"
                        initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        data-field-type="subtitle"
                        data-component-type="Video"
                      >
                        {localSubtitle}
                      </motion.h2>
                    )}
                    {localDescription && (
                      <motion.p 
                        className="text-lg sm:text-xl opacity-80 leading-relaxed"
                        initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        data-field-type="description"
                        data-component-type="Video"
                      >
                        {localDescription}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
              
              {/* Play button */}
              {localShowPlayButton && !localControls && !isVideoLoading && (
                <motion.button
                  onClick={togglePlayPause}
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${getPlayButtonSizeClasses()} ${getPlayButtonStyleClasses()} rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto z-10 backdrop-blur-sm`}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isHovered ? 1.1 : 1 
                  }}
                  transition={{ duration: 0.3, delay: 1.2 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-1/2 h-1/2" />
                  ) : (
                    <PlayIcon className="w-1/2 h-1/2 ml-1" />
                  )}
                </motion.button>
              )}
            </>
          )
        ) : (
          // No video selected state
          <motion.div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center p-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-6"
              >
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                  <PlayIcon className="w-10 h-10 text-gray-400" />
                </div>
              </motion.div>
              <motion.h2 
                className="text-2xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                No Video Selected
              </motion.h2>
              <motion.p 
                className="text-lg opacity-75"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Please select a video in edit mode
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Content Tab Component
  const ContentTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Content</h3>
          
          <StableInput
            value={localTitle}
            onChange={handleTitleChange}
            placeholder="Video title..."
            className="text-foreground font-bold text-xl"
            label="Title"
            debounceTime={300}
            data-field-id="title"
            data-component-type="Video"
          />
          
          <StableInput
            value={localSubtitle}
            onChange={handleSubtitleChange}
            placeholder="Video subtitle..."
            className="text-muted-foreground"
            label="Subtitle"
            debounceTime={300}
            data-field-id="subtitle"
            data-component-type="Video"
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={localDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Enter video description..."
              className="w-full px-3 py-2 border borde Y eso 2:30 ceror-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Settings</h3>
          
          <div>
            <ColorSelector
              label="Text Color"
              value={localTextColor}
              onChange={handleTextColorChange}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="textAlignment" className="text-sm font-medium block mb-2">
                Text Alignment
              </label>
              <select
                id="textAlignment"
                value={localTextAlignment}
                onChange={handleTextAlignmentChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="contentPosition" className="text-sm font-medium block mb-2">
                Content Position
              </label>
              <select
                id="contentPosition"
                value={localContentPosition}
                onChange={handleContentPositionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="top-left">Top Left</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="center-left">Center Left</option>
                <option value="center">Center</option>
                <option value="center-right">Center Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Video Tab Component
  const VideoTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Video File</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Video File</label>
            <div className="flex flex-col gap-2">
              <div className="border rounded-md h-32 w-full flex items-center justify-center overflow-hidden bg-gray-50">
                {localVideoUrl ? (
                  <video
                    src={localVideoUrl}
                    poster={localPosterUrl}
                    className="max-h-full max-w-full object-contain"
                    muted
                  />
                ) : (
                  <div className="text-gray-400 text-sm text-center">
                    No video<br/>selected
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowVideoSelector(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Select Video
                </button>
                {localVideoUrl && (
                  <button 
                    onClick={() => handleVideoUrlChange('')}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Select a video file from your media library
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Poster Image (Optional)</label>
            <div className="flex flex-col gap-2">
              <div className="border rounded-md h-24 w-full flex items-center justify-center overflow-hidden bg-gray-50">
                {localPosterUrl ? (
                  <S3FilePreview
                    src={localPosterUrl}
                    alt="Video poster"
                    className="max-h-full max-w-full object-contain"
                    width={200}
                    height={100}
                  />
                ) : (
                  <div className="text-gray-400 text-sm text-center">
                    No poster<br/>selected
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowPosterSelector(true)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  Select Poster
                </button>
                {localPosterUrl && (
                  <button 
                    onClick={() => handlePosterUrlChange('')}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Image shown before video plays
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Settings</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoplay"
                checked={localAutoplay}
                onChange={handleAutoplayChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoplay" className="text-sm font-medium">
                Autoplay (starts automatically)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="loop"
                checked={localLoop}
                onChange={handleLoopChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="loop" className="text-sm font-medium">
                Loop (repeat continuously)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="muted"
                checked={localMuted}
                onChange={handleMutedChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="muted" className="text-sm font-medium">
                Muted (no sound by default)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="controls"
                checked={localControls}
                onChange={handleControlsChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="controls" className="text-sm font-medium">
                Show video controls
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="playsinline"
                checked={localPlaysinline}
                onChange={handlePlaysinlineChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="playsinline" className="text-sm font-medium">
                Play inline (mobile)
              </label>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-900">Play Button</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPlayButton"
                checked={localShowPlayButton}
                onChange={handleShowPlayButtonChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showPlayButton" className="text-sm font-medium">
                Show custom play button
              </label>
            </div>
            
            {localShowPlayButton && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-6">
                <div>
                  <label htmlFor="playButtonStyle" className="text-sm font-medium block mb-2">
                    Button Style
                  </label>
                  <select
                    id="playButtonStyle"
                    value={localPlayButtonStyle}
                    onChange={handlePlayButtonStyleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Default</option>
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="playButtonSize" className="text-sm font-medium block mb-2">
                    Button Size
                  </label>
                  <select
                    id="playButtonSize"
                    value={localPlayButtonSize}
                    onChange={handlePlayButtonSizeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Styling Tab Component
  const StylingTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout & Appearance</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="fullHeight"
                checked={localFullHeight}
                onChange={handleFullHeightChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="fullHeight" className="text-sm font-medium">
                Full height (100vh)
              </label>
            </div>
            
            {!localFullHeight && (
              <div>
                <label htmlFor="maxHeight" className="text-sm font-medium block mb-2">
                  Max Height
                </label>
                <input
                  type="text"
                  id="maxHeight"
                  value={localMaxHeight}
                  onChange={handleMaxHeightChange}
                  placeholder="e.g., 500px, 50vh"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="objectFit" className="text-sm font-medium block mb-2">
                Video Fit
              </label>
              <select
                id="objectFit"
                value={localObjectFit}
                onChange={handleObjectFitChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cover">Cover (fill container)</option>
                <option value="contain">Contain (fit within container)</option>
                <option value="fill">Fill (stretch to fit)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overlay Settings</h3>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="overlayEnabled"
              checked={localOverlayEnabled}
              onChange={handleOverlayEnabledChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="overlayEnabled" className="text-sm font-medium">
              Enable overlay
            </label>
          </div>
          
          {localOverlayEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ColorSelector
                  label="Overlay Color"
                  value={localOverlayColor}
                  onChange={handleOverlayColorChange}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">
                  Overlay Opacity
                </label>
                <TransparencySelector
                  value={localOverlayOpacity}
                  onChange={handleOverlayOpacityChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Preview Tab Component
  const PreviewTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        <span className="text-sm text-gray-500">This is how your video section will look</span>
      </div>
      <div 
        className="border rounded-lg overflow-hidden bg-black relative"
        style={{ height: '400px' }}
      >
        {renderVideoContent()}
      </div>
    </div>
  );

  return (
    <>
      {/* Media selector modals */}
      {showVideoSelector && (
        <MediaSelector
          isOpen={showVideoSelector}
          onClose={() => setShowVideoSelector(false)}
          onSelect={handleVideoSelection}
          title="Select Video"
          initialType="video"
        />
      )}
      
      {showPosterSelector && (
        <MediaSelector
          isOpen={showPosterSelector}
          onClose={() => setShowPosterSelector(false)}
          onSelect={handlePosterSelection}
          title="Select Poster Image"
          initialType="image"
        />
      )}
      
      <section 
        className={cn(
          "relative w-full overflow-hidden flex items-center video-section",
          isEditing ? "min-h-[600px] h-auto py-8 bg-white" : "min-h-screen",
          localFullHeight && !isEditing ? "h-screen" : ""
        )}
        style={isEditing ? { 
          isolation: 'isolate',
          backgroundColor: '#ffffff' // Always white background in editor
        } : {
          height: localFullHeight ? '100vh' : localMaxHeight,
          minHeight: localFullHeight ? '100vh' : '400px',
          isolation: 'isolate'
        }}
      >
        {isEditing ? (
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <CmsTabs
              tabs={[
                {
                  id: "content",
                  label: "Content",
                  icon: <FileText className="w-4 h-4" />,
                  content: <ContentTab />
                },
                {
                  id: "video",
                  label: "Video",
                  icon: <Video className="w-4 h-4" />,
                  content: <VideoTab />
                },
                {
                  id: "styling",
                  label: "Styling",
                  icon: <Palette className="w-4 h-4" />,
                  content: <StylingTab />
                },
                {
                  id: "preview",
                  label: "Preview",
                  icon: <Eye className="w-4 h-4" />,
                  content: <PreviewTab />
                }
              ]}
            />
          </div>
        ) : (
          <div className="w-full h-full relative">
            {renderVideoContent()}
          </div>
        )}
      </section>
    </>
  );
});

export default VideoSection; 