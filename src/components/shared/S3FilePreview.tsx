import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useS3FileCache } from '@/hooks/useS3FileCache';
import { 
  FileIcon, 
  FileTextIcon, 
  FileSpreadsheetIcon, 
  PresentationIcon, 
  FileCodeIcon, 
  FileArchiveIcon, 
  FileAudioIcon, 
  FileVideoIcon, 
  FileImageIcon, 
  FileJsonIcon
} from 'lucide-react';

interface S3FilePreviewProps {
  src: string;
  alt?: string;
  className?: string;
  fileType?: string;
  showDownload?: boolean;
  fileName?: string;
  showMetadata?: boolean;
  onDimensionsLoaded?: (dimensions: {width: number; height: number}) => void;
}

// Función para determinar el tipo de archivo a partir de la URL
const getFileTypeFromUrl = (url: string): string => {
  // Check for query params and get the real file extension
  const cleanUrl = url.split('?')[0];
  const extension = cleanUrl.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    // Try to detect PDFs from the pattern in S3 key
    if (url.includes('-') && url.toLowerCase().includes('pdf')) {
      return 'application/pdf';
    }
    return 'application/octet-stream';
  }
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'doc':
    case 'docx':
      return 'application/msword';
    case 'xls':
    case 'xlsx':
      return 'application/vnd.ms-excel';
    case 'ppt':
    case 'pptx':
      return 'application/vnd.ms-powerpoint';
    case 'csv':
      return 'text/csv';
    case 'txt':
      return 'text/plain';
    case 'json':
      return 'application/json';
    case 'html':
    case 'htm':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'zip':
    case 'rar':
      return 'application/zip';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
};

// Función para categorizar tipos de archivos
const categorizeFileType = (fileType: string): string => {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType === 'application/msword' || fileType.includes('wordprocessingml')) return 'document';
  if (fileType === 'application/vnd.ms-excel' || fileType.includes('spreadsheetml')) return 'spreadsheet';
  if (fileType === 'application/vnd.ms-powerpoint' || fileType.includes('presentationml')) return 'presentation';
  if (fileType === 'text/csv') return 'csv';
  if (fileType === 'text/plain') return 'text';
  if (fileType === 'application/json' || fileType === 'text/json') return 'json';
  if (fileType.includes('html')) return 'html';
  if (fileType.includes('javascript') || fileType.includes('typescript')) return 'code';
  if (fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('archive')) return 'archive';
  return 'other';
};

// Utility functions for formatting metadata
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
  }
};



// Metadata display component
const MetadataOverlay = ({ 
  imageDimensions, 
  videoDuration, 
  videoDimensions,
  fileSize, 
  showMetadata 
}: {
  imageDimensions: { width: number; height: number } | null;
  videoDuration: number | null;
  videoDimensions: { width: number; height: number } | null;
  fileSize: string | null;
  showMetadata: boolean;
}) => {
  if (!showMetadata) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 space-y-1 z-20">
      {imageDimensions && (
        <div className="flex justify-between">
          <span>Dimensions:</span>
          <span>{imageDimensions.width} × {imageDimensions.height}px</span>
        </div>
      )}
      {videoDimensions && (
        <div className="flex justify-between">
          <span>Resolution:</span>
          <span>{videoDimensions.width} × {videoDimensions.height}px</span>
        </div>
      )}
      {videoDuration && (
        <div className="flex justify-between">
          <span>Duration:</span>
          <span>{formatDuration(videoDuration)}</span>
        </div>
      )}
      {fileSize && (
        <div className="flex justify-between">
          <span>Size:</span>
          <span>{fileSize}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Componente optimizado para mostrar previsualizaciones de archivos de S3
 * Usa caché global para evitar múltiples llamadas a la API
 */
const S3FilePreview = ({ 
  src, 
  alt = 'File preview', 
  className = '', 
  fileType: providedFileType,
  fileName,
  showMetadata = false,
  onDimensionsLoaded
}: S3FilePreviewProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<{width: number; height: number} | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{width: number; height: number} | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  
  // Use the S3 file cache hook with error handling
  const s3CacheResult = useS3FileCache(src || '');
  const { finalUrl, isS3Url, s3Key } = s3CacheResult || {};
  
  // Add safety checks for the hook results
  const safeFinalUrl = finalUrl || src;
  const safeIsS3Url = Boolean(isS3Url);
  const safeS3Key = s3Key || null;
  
  // Memoize the file analysis to avoid recalculation on every render
  const fileAnalysis = useMemo(() => {
    if (!src) return null;
    
    // Determinar el tipo de archivo
    let detectedFileType = providedFileType || getFileTypeFromUrl(src);
    
    // More robust file type detection based on URL patterns
    const urlLower = src.toLowerCase();
    
    // Override detection for common image formats
    if (urlLower.includes('.png') || urlLower.includes('png')) {
      detectedFileType = 'image/png';
    } else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('jpg') || urlLower.includes('jpeg')) {
      detectedFileType = 'image/jpeg';
    } else if (urlLower.includes('.gif') || urlLower.includes('gif')) {
      detectedFileType = 'image/gif';
    } else if (urlLower.includes('.webp') || urlLower.includes('webp')) {
      detectedFileType = 'image/webp';
    } else if (urlLower.includes('.svg') || urlLower.includes('svg')) {
      detectedFileType = 'image/svg+xml';
    } else if (urlLower.includes('.pdf') || urlLower.includes('pdf')) {
      detectedFileType = 'application/pdf';
    } else if (urlLower.includes('.mp4') || urlLower.includes('mp4')) {
      detectedFileType = 'video/mp4';
    } else if (urlLower.includes('.webm') || urlLower.includes('webm')) {
      detectedFileType = 'video/webm';
    } else if (urlLower.includes('.mov') || urlLower.includes('mov')) {
      detectedFileType = 'video/quicktime';
    }
    
    // Special case: check filename for PDF if not already detected
    if (!detectedFileType.includes('pdf') && 
        (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
      detectedFileType = 'application/pdf';
    }
    
    // Actualizar estados derivados del tipo de archivo
    const isImage = detectedFileType.startsWith('image/');
    const isPdf = detectedFileType === 'application/pdf';
    const isVideo = detectedFileType.startsWith('video/');
    const isSvg = detectedFileType === 'image/svg+xml' || 
                  urlLower.includes('.svg') || urlLower.includes('svg');
    
    // Determinar la categoría del archivo
    const fileCategory = categorizeFileType(detectedFileType);
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[S3FilePreview] Analysis:', {
        src,
        providedFileType,
        detectedFileType,
        isImage,
        isPdf,
        isVideo,
        isSvg,
        fileCategory,
        urlLower: urlLower.substring(0, 100) + '...' // Truncate for readability
      });
      
      // Special logging for common image formats
      if (urlLower.includes('png') || detectedFileType.includes('png') ||
          urlLower.includes('webp') || detectedFileType.includes('webp') ||
          urlLower.includes('jpg') || urlLower.includes('jpeg') || 
          detectedFileType.includes('jpeg')) {
        
        const formatType = urlLower.includes('png') ? 'PNG' :
                          urlLower.includes('webp') ? 'WebP' :
                          (urlLower.includes('jpg') || urlLower.includes('jpeg')) ? 'JPEG' : 'Image';
        
        console.log(`[S3FilePreview] ${formatType} Detection:`, {
          urlIncludesFormat: urlLower.includes(formatType.toLowerCase()),
          detectedTypeIncludesFormat: detectedFileType.includes(formatType.toLowerCase()),
          finalDetectedType: detectedFileType,
          isImageFlag: isImage,
          formatType
        });
      }
    }
    
    return {
      detectedFileType,
      isImage,
      isPdf,
      isVideo,
      isSvg,
      fileCategory
    };
  }, [src, providedFileType, fileName]);

  // Reset error and loading state when src changes
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
    setLoadStartTime(Date.now());
    setImageDimensions(null);
    setVideoDuration(null);
    setVideoDimensions(null);
    setFileSize(null);
  }, [src]);

  // Preload image for faster loading
  useEffect(() => {
    if (safeFinalUrl && fileAnalysis?.isImage) {
      const img = new window.Image();
      img.onload = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[S3FilePreview] Image preloaded successfully:', safeFinalUrl);
        }
      };
      img.onerror = () => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[S3FilePreview] Image preload failed:', safeFinalUrl);
        }
      };
      img.src = safeFinalUrl;
    }
  }, [safeFinalUrl, fileAnalysis?.isImage]);

  // Early return for invalid src - moved after all hooks
  if (!src || typeof src !== 'string' || src.trim() === '') {
    return null;
  }
  
  // Handler for successful image load
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    try {
      const target = event.currentTarget as HTMLImageElement;
      const loadTime = Date.now() - loadStartTime;
      
      setIsLoading(false);
      
      // Capture image dimensions
      if (target.naturalWidth && target.naturalHeight) {
        const dimensions = {
          width: target.naturalWidth,
          height: target.naturalHeight
        };
        setImageDimensions(dimensions);
        
        // Call the callback if provided
        if (onDimensionsLoaded) {
          onDimensionsLoaded(dimensions);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log("[S3FilePreview] Image loaded successfully");
        console.log("- Source URL:", src || 'unknown');
        console.log("- Final URL:", safeFinalUrl || 'unknown');
        console.log("- Natural width:", target?.naturalWidth || 0);
        console.log("- Natural height:", target?.naturalHeight || 0);
        console.log("- Complete:", Boolean(target?.complete));
        console.log("- Load time:", `${loadTime}ms`);
        console.log("- Timestamp:", new Date().toISOString());
      }
    } catch {
      setIsLoading(false);
      if (process.env.NODE_ENV === 'development') {
        console.warn("[S3FilePreview] Image loaded but logging failed");
      }
    }
  };

  // Handler for video metadata load
  const handleVideoLoadedMetadata = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    try {
      const target = event.currentTarget as HTMLVideoElement;
      
      if (target.duration && !isNaN(target.duration) && target.duration !== Infinity) {
        setVideoDuration(target.duration);
      }
      
      // Capture video dimensions
      if (target.videoWidth && target.videoHeight) {
        const dimensions = {
          width: target.videoWidth,
          height: target.videoHeight
        };
        setVideoDimensions(dimensions);
        
        // Call the callback if provided for videos too
        if (onDimensionsLoaded) {
          onDimensionsLoaded(dimensions);
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log("[S3FilePreview] Video metadata loaded");
        console.log("- Duration:", target.duration);
        console.log("- Video width:", target.videoWidth);
        console.log("- Video height:", target.videoHeight);
      }
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.warn("[S3FilePreview] Video metadata load failed");
      }
    }
  };

  // Handler for image error - completely silent to prevent Next.js unhandled errors
  const handleImageError = (error?: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Prevent the error from bubbling up and being treated as unhandled
    if (error) {
      try {
        error.preventDefault();
        error.stopPropagation();
      } catch {
        // Silently handle any preventDefault/stopPropagation errors
      }
    }

    setIsLoading(false);
    setImageError(true);

    try {
      const target = error?.currentTarget as HTMLImageElement;
      const loadTime = Date.now() - loadStartTime;
      
      // Only log in development mode to avoid console errors in production
      if (process.env.NODE_ENV === 'development') {
        console.warn("[S3FilePreview] Error loading image");
        console.warn("- Source URL:", src || 'unknown');
        console.warn("- Final URL:", safeFinalUrl || 'unknown');
        console.warn("- Is S3 URL:", safeIsS3Url);
        console.warn("- S3 Key:", safeS3Key || 'unknown');
        console.warn("- Error Type:", error?.type || 'unknown');
        console.warn("- File Name:", fileName || 'unknown');
        console.warn("- Failed after:", `${loadTime}ms`);
        console.warn("- Timestamp:", new Date().toISOString());
        
        // Special debugging for common image formats
        const srcLower = src.toLowerCase();
        if (srcLower.includes('png') || srcLower.includes('webp') || 
            srcLower.includes('jpg') || srcLower.includes('jpeg')) {
          
          const formatType = srcLower.includes('png') ? 'PNG' :
                            srcLower.includes('webp') ? 'WebP' :
                            (srcLower.includes('jpg') || srcLower.includes('jpeg')) ? 'JPEG' : 'Image';
          
          console.warn(`🔴 ${formatType} FILE ERROR DETECTED:`);
          console.warn(`- Original ${formatType} URL:`, src);
          console.warn(`- Final ${formatType} URL:`, safeFinalUrl);
          console.warn("- Is being served through API:", safeIsS3Url);
        }
        
        // Log target information separately
        if (target) {
          console.warn("Image element details:");
          console.warn("- Target src:", target?.src || 'unknown');
          console.warn("- Target complete:", Boolean(target?.complete));
          console.warn("- Target natural width:", target?.naturalWidth || 0);
          console.warn("- Target natural height:", target?.naturalHeight || 0);
          
          // Try to provide more specific error information
          if (target.naturalWidth === 0 && target.naturalHeight === 0) {
            console.warn("Image failed to load - likely a network or CORS issue");
          }
        }
      }
      
      // Store cache issue indicator for the cache warning component
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('media-cache-issue-detected', Date.now().toString());
        }
      } catch (storageError) {
        // Silently fail if localStorage is not available
        if (process.env.NODE_ENV === 'development') {
          console.warn("Could not store cache issue indicator:", storageError);
        }
      }
      
    } catch {
      // Completely silent fallback - no logging to avoid any console errors
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('media-cache-issue-detected', Date.now().toString());
        }
      } catch {
        // Silently fail
      }
    }
  };
  
  // Mostrar nada si no hay URL o análisis
  if (!src || !fileAnalysis) {
    return null;
  }
  
  const { isImage, isPdf, isVideo, fileCategory } = fileAnalysis;
  
  // Determinar el nombre del archivo para descargas
  const displayFileName = fileName || src.split('/').pop() || 'download';
  
  // Función para renderizar el icono basado en el tipo de archivo
  const renderFileIcon = () => {
    switch (fileCategory) {
      case 'pdf':
        return <FileTextIcon className="h-12 w-12 text-red-500" />;
      case 'document':
        return <FileTextIcon className="h-12 w-12 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheetIcon className="h-12 w-12 text-green-500" />;
      case 'presentation':
        return <PresentationIcon className="h-12 w-12 text-orange-500" />;
      case 'code':
        return <FileCodeIcon className="h-12 w-12 text-purple-500" />;
      case 'archive':
        return <FileArchiveIcon className="h-12 w-12 text-yellow-600" />;
      case 'audio':
        return <FileAudioIcon className="h-12 w-12 text-pink-500" />;
      case 'video':
        return <FileVideoIcon className="h-12 w-12 text-purple-600" />;
      case 'image':
        return <FileImageIcon className="h-12 w-12 text-blue-400" />;
      case 'json':
        return <FileJsonIcon className="h-12 w-12 text-amber-500" />;
      default:
        return <FileIcon className="h-12 w-12 text-gray-500" />;
    }
  };
  
  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className={`flex items-center justify-center w-full h-full bg-gray-200 animate-shimmer ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-16 h-2 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-12 h-1 bg-gray-300 rounded animate-pulse"></div>
      </div>
    </div>
  );

  // Renderizar componente de imagen
  const renderImage = () => {
    if (imageError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400 p-4 text-center">
          <div>
            <FileImageIcon className="h-8 w-8 mx-auto mb-2" />
            <span className="text-xs block mb-1">Error loading image</span>
            <span className="text-xs text-gray-500 block">
              Try refreshing with Ctrl+Shift+R
            </span>
          </div>
        </div>
      );
    }
    
    // Special handling for common image formats - try direct loading first
    const srcLower = src.toLowerCase();
    const isCommonImageFormat = srcLower.includes('.png') || 
                               srcLower.includes('.jpg') || 
                               srcLower.includes('.jpeg') || 
                               srcLower.includes('.webp') ||
                               srcLower.includes('.svg');
    
    // Check if it's a PNG file for transparency background
    const isPngFile = srcLower.includes('.png');
    
    if (isCommonImageFormat) {
      const imageType = srcLower.includes('.png') ? 'PNG' : 
                       srcLower.includes('.webp') ? 'WebP' : 
                       srcLower.includes('.svg') ? 'SVG' :
                       (srcLower.includes('.jpg') || srcLower.includes('.jpeg')) ? 'JPEG' : 'Image';
      
      console.log(`[S3FilePreview] ${imageType} detected, trying direct load:`, src);
      return (
        <div className="relative w-full h-full overflow-hidden">
          {/* Transparency checker background for PNG files */}
          {isPngFile && (
            <div 
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #ccc 25%, transparent 25%), 
                  linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #ccc 75%), 
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            />
          )}
          <img
            src={src} // Use original URL directly for common image formats
            alt={alt}
            className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
            onLoad={handleImageLoad}
            onError={(e) => {
              console.log(`[S3FilePreview] ${imageType} direct load failed, trying API route`);
              // If direct load fails, try the API route
              const target = e.currentTarget as HTMLImageElement;
              target.src = safeFinalUrl;
            }}
            loading="lazy"
          />
          {isLoading && (
            <div className="absolute inset-0 z-20">
              <SkeletonLoader />
            </div>
          )}
          <MetadataOverlay 
            imageDimensions={imageDimensions} 
            videoDuration={videoDuration} 
            videoDimensions={videoDimensions}
            fileSize={fileSize} 
            showMetadata={showMetadata} 
          />
        </div>
      );
    }
    
    // For SVG files served through our API, use regular img tag
    // This avoids issues with Next.js Image optimization and SVG handling
    if (safeIsS3Url && safeS3Key && (safeFinalUrl.includes('.svg') || src.includes('.svg'))) {
      const isSvgFile = safeFinalUrl.includes('.svg') || src.includes('.svg');
      
      return (
        <div className="relative w-full h-full overflow-hidden">
          {/* Transparency checker background for SVG files too */}
          {isSvgFile && (
            <div 
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #ccc 25%, transparent 25%), 
                  linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #ccc 75%), 
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            />
          )}
          <img
            src={safeFinalUrl} 
            alt={alt}
            className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          {isLoading && (
            <div className="absolute inset-0 z-20">
              <SkeletonLoader />
            </div>
          )}
          <MetadataOverlay 
            imageDimensions={imageDimensions} 
            videoDuration={videoDuration} 
            videoDimensions={videoDimensions}
            fileSize={fileSize} 
            showMetadata={showMetadata} 
          />
        </div>
      );
    }
    
    // For all other S3 files served through our API, use Next.js Image component
    if (safeIsS3Url && safeS3Key) {
      const isPngFromS3 = safeFinalUrl.includes('.png') || src.includes('.png');
      
      return (
        <div className="relative w-full h-full overflow-hidden">
          {/* Transparency checker background for PNG files from S3 */}
          {isPngFromS3 && (
            <div 
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #ccc 25%, transparent 25%), 
                  linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #ccc 75%), 
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            />
          )}
          <Image
            src={safeFinalUrl} 
            alt={alt}
            className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          {isLoading && (
            <div className="absolute inset-0 z-20">
              <SkeletonLoader />
            </div>
          )}
          <MetadataOverlay 
            imageDimensions={imageDimensions} 
            videoDuration={videoDuration} 
            videoDimensions={videoDimensions}
            fileSize={fileSize} 
            showMetadata={showMetadata} 
          />
        </div>
      );
    }
    
    // For external images (non-S3), use Next.js Image component
    const isExternalPng = src.toLowerCase().includes('.png');
    
    return (
      <div className="relative w-full h-full overflow-hidden">
        {/* Transparency checker background for external PNG files */}
        {isExternalPng && (
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%), 
                linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #ccc 75%), 
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
        )}
        <Image 
          src={safeFinalUrl}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        {isLoading && (
          <div className="absolute inset-0 z-20">
            <SkeletonLoader />
          </div>
        )}
        <MetadataOverlay 
          imageDimensions={imageDimensions} 
          videoDuration={videoDuration} 
          videoDimensions={videoDimensions}
          fileSize={fileSize} 
          showMetadata={showMetadata} 
        />
      </div>
    );
  };
  
  // Renderizar según el tipo de archivo
  if (process.env.NODE_ENV === 'development') {
    const srcLower = src.toLowerCase();
    const formatInfo = {
      isPNG: srcLower.includes('png'),
      isWebP: srcLower.includes('webp'),
      isJPEG: srcLower.includes('jpg') || srcLower.includes('jpeg'),
      isCommonFormat: srcLower.includes('png') || srcLower.includes('webp') || 
                     srcLower.includes('jpg') || srcLower.includes('jpeg')
    };
    
    console.log('[S3FilePreview] Render decision:', {
      src,
      isImage,
      isPdf,
      isVideo,
      imageError,
      fileCategory,
      safeFinalUrl,
      safeIsS3Url,
      safeS3Key,
      formatInfo,
      fileAnalysisResult: fileAnalysis
    });
  }
  
  return (
    <div className="relative group">
      {isImage && !imageError ? (
        // All images (including SVGs) - render as image
        renderImage()
      ) : isPdf ? (
        // Para PDFs, mostrar un icono de PDF con opción para ver
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <FileTextIcon className="h-12 w-12 text-red-500" />
          <span className="text-xs mt-1 text-center truncate max-w-full">
            {displayFileName}
          </span>
          <a 
            href={safeFinalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            Ver PDF
          </a>
        </div>
      ) : isVideo ? (
        // Para videos, usar un tag de video
        <div className="relative w-full h-full overflow-hidden">
          <video 
            src={safeFinalUrl} 
            controls 
            className={className || "w-full h-full object-cover"}
            onClick={(e) => e.stopPropagation()}
            onLoadedMetadata={handleVideoLoadedMetadata}
          >
            Tu navegador no soporta el tag de video.
          </video>
          <MetadataOverlay 
            imageDimensions={imageDimensions} 
            videoDuration={videoDuration} 
            videoDimensions={videoDimensions}
            fileSize={fileSize} 
            showMetadata={showMetadata} 
          />
        </div>
      ) : (
        // Para otros archivos, mostrar un icono basado en el tipo
        <div className={`flex flex-col items-center justify-center ${className}`}>
          {renderFileIcon()}
          <span className="text-xs mt-1 text-center truncate max-w-full">
            {displayFileName}
          </span>
        </div>
      )}
    </div>
  );
};

export default S3FilePreview; 