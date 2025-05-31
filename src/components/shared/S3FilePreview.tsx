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
  width?: number;
  height?: number;
  fileType?: string;
  showDownload?: boolean;
  fileName?: string;
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

/**
 * Componente optimizado para mostrar previsualizaciones de archivos de S3
 * Usa caché global para evitar múltiples llamadas a la API
 */
const S3FilePreview = ({ 
  src, 
  alt = 'File preview', 
  className = '', 
  width = 100, 
  height = 100,
  fileType: providedFileType,
  fileName
}: S3FilePreviewProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Use the S3 file cache hook
  const { finalUrl, isS3Url, s3Key } = useS3FileCache(src);
  
  // Memoize the file analysis to avoid recalculation on every render
  const fileAnalysis = useMemo(() => {
    if (!src) return null;
    
    // Determinar el tipo de archivo
    let detectedFileType = providedFileType || getFileTypeFromUrl(src);
    
    // Special case: check filename for PDF if not already detected
    if (!detectedFileType.includes('pdf') && 
        (src.toLowerCase().endsWith('.pdf') || 
         (fileName && fileName.toLowerCase().endsWith('.pdf')))) {
      detectedFileType = 'application/pdf';
    }
    
    // Actualizar estados derivados del tipo de archivo
    const isImage = detectedFileType.startsWith('image/');
    const isPdf = detectedFileType === 'application/pdf';
    const isVideo = detectedFileType.startsWith('video/');
    const isSvg = detectedFileType === 'image/svg+xml' || 
                  (src && src.toLowerCase().endsWith('.svg')) ||
                  getFileTypeFromUrl(src) === 'image/svg+xml';
    
    // Determinar la categoría del archivo
    const fileCategory = categorizeFileType(detectedFileType);
    
    return {
      detectedFileType,
      isImage,
      isPdf,
      isVideo,
      isSvg,
      fileCategory
    };
  }, [src, providedFileType, fileName]);

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  // Handler for image error
  const handleImageError = (error?: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("S3FilePreview: Error loading image:", {
      src,
      finalUrl,
      isS3Url,
      s3Key,
      error: error?.type || 'unknown'
    });
    setImageError(true);
  };
  
  // Mostrar nada si no hay URL o análisis
  if (!src || !fileAnalysis) {
    return null;
  }
  
  const { isImage, isPdf, isVideo, isSvg, fileCategory } = fileAnalysis;
  
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
  
  // Renderizar componente de imagen
  const renderImage = () => {
    if (imageError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400 p-4 text-center">
          <div>
            <FileImageIcon className="h-8 w-8 mx-auto mb-2" />
            <span className="text-xs">Error loading image</span>
          </div>
        </div>
      );
    }
    
    // For SVGs, always use regular img tag to avoid issues
    if (isSvg) {
      return (
        <img 
          src={finalUrl} 
          alt={alt}
          className={`object-contain ${className}`}
          width={width} 
          height={height}
          onError={handleImageError}
          loading="lazy"
        />
      );
    }
    
    // For S3 files served through our API, use regular img tag instead of Next.js Image
    // This avoids issues with Next.js Image optimization and our custom API route
    if (isS3Url && s3Key) {
      return (
        <img 
          src={finalUrl} 
          alt={alt}
          className={`object-contain ${className}`}
          width={width} 
          height={height}
          onError={handleImageError}
          loading="lazy"
        />
      );
    }
    
    // For non-S3 images, use Next.js Image component
    return (
      <Image 
        src={finalUrl}
        alt={alt}
        width={width}
        height={height}
        className={`object-contain ${className}`}
        onError={handleImageError}
      />
    );
  };
  
  // Renderizar según el tipo de archivo
  return (
    <div className="relative group">
      {(isImage || isSvg) && !imageError ? (
        renderImage()
      ) : isPdf ? (
        // Para PDFs, mostrar un icono de PDF con opción para ver
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <FileTextIcon className="h-12 w-12 text-red-500" />
          <span className="text-xs mt-1 text-center truncate max-w-full">
            {displayFileName}
          </span>
          <a 
            href={finalUrl} 
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
        <video 
          src={finalUrl} 
          controls 
          className={className || "max-h-full max-w-full"}
          onClick={(e) => e.stopPropagation()}
        >
          Tu navegador no soporta el tag de video.
        </video>
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