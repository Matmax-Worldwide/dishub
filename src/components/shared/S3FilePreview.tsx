import { useState, useEffect } from 'react';
import Image from 'next/image';
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

/**
 * Componente para mostrar previsualizaciones de archivos de S3 a través de nuestra API
 * 
 * Este componente detecta automáticamente si es una URL de S3 y utiliza nuestra API 
 * para mostrar el archivo, evitando problemas de CORS
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
  const [isS3Url, setIsS3Url] = useState(false);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [fileCategory, setFileCategory] = useState<string>('other');
  const [imageError, setImageError] = useState(false);
  const [isSvg, setIsSvg] = useState(false);
  
  useEffect(() => {
    // No hacer nada si no hay URL
    if (!src) return;
    
    console.log('S3FilePreview: Processing src:', src);
    
    // Reset error state on src change
    setImageError(false);
    
    // Detectar si es una URL de S3
    if (src.includes('s3.amazonaws.com') || 
        src.includes('vercelvendure') ||
        (process.env.NEXT_PUBLIC_S3_URL_PREFIX && src.startsWith(process.env.NEXT_PUBLIC_S3_URL_PREFIX))) {
      // Es una URL de S3, extraer la clave
      setIsS3Url(true);
      
      try {
        // Intentar extraer la clave de S3 de la URL
        const url = new URL(src);
        const pathParts = url.pathname.split('/');
        // Eliminar la primera parte vacía del pathname que comienza con /
        pathParts.shift();
        
        // La clave es el resto del path
        const key = pathParts.join('/');
        setS3Key(key);
      } catch (error) {
        console.error('Error parsing S3 URL:', error);
        setS3Key(null);
      }
    } else {
      setIsS3Url(false);
      setS3Key(null);
    }
    
    // Determinar el tipo de archivo
    let detectedFileType = providedFileType || getFileTypeFromUrl(src);
    
    // Special case: check filename for PDF if not already detected
    if (!detectedFileType.includes('pdf') && 
        (src.toLowerCase().endsWith('.pdf') || 
         (fileName && fileName.toLowerCase().endsWith('.pdf')))) {
      console.log('Detected PDF by filename extension');
      detectedFileType = 'application/pdf';
    }
    
    console.log(`File type detection for ${src}: ${detectedFileType}`);
    console.log(`SVG detection: isSvg=${detectedFileType === 'image/svg+xml' || (src && src.toLowerCase().endsWith('.svg')) || getFileTypeFromUrl(src) === 'image/svg+xml'}, detectedFileType=${detectedFileType}, srcEndsWithSvg=${src && src.toLowerCase().endsWith('.svg')}`);
    
    // Actualizar estados derivados del tipo de archivo
    setIsImage(detectedFileType.startsWith('image/'));
    setIsPdf(detectedFileType === 'application/pdf');
    setIsVideo(detectedFileType.startsWith('video/'));
    
    // Determinar la categoría del archivo
    setFileCategory(categorizeFileType(detectedFileType));
    
    // Set SVG flag based on file type
    setIsSvg(detectedFileType === 'image/svg+xml' || 
             (src && src.toLowerCase().endsWith('.svg')) ||
             getFileTypeFromUrl(src) === 'image/svg+xml');
  }, [src, providedFileType, fileName]);

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
  
  // Handler for image error
  const handleImageError = (error?: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const errorDetails = {
      src: src || 'undefined',
      isS3Url: isS3Url,
      s3Key: s3Key || 'null',
      finalUrl: (() => {
        try {
          return getFileUrl() || 'empty';
        } catch (e) {
          return `error: ${e instanceof Error ? e.message : 'unknown'}`;
        }
      })(),
      fileType: providedFileType || 'not provided',
      fileName: fileName || 'not provided',
      errorEvent: error ? {
        type: error.type || 'unknown',
        target: error.currentTarget ? {
          src: error.currentTarget.src || 'no src',
          tagName: error.currentTarget.tagName || 'unknown'
        } : 'no target'
      } : 'no error event'
    };
    
    console.error("S3FilePreview: Error loading image:", errorDetails);
    setImageError(true);
  };
  
  // Ensure URL is properly encoded
  const getSafeUrl = (url: string): string => {
    if (!url) return '';
    
    try {
      // Try to parse the URL
      const parsedUrl = new URL(url);
      
      // Properly encode the pathname segments while preserving the slashes
      const encodedPathSegments = parsedUrl.pathname
        .split('/')
        .map(segment => segment ? encodeURIComponent(segment) : '')
        .join('/');
      
      // Rebuild the URL with encoded path
      parsedUrl.pathname = encodedPathSegments;
      
      return parsedUrl.toString();
    } catch {
      // If URL parsing fails, try basic encoding
      return url
        .split('/')
        .map((part, i) => i === 0 ? part : encodeURIComponent(part))
        .join('/');
    }
  };
  
  // Obtener la URL de visualización
  const getFileUrl = (): string => {
    if (isS3Url && s3Key) {
      const apiUrl = `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true`;
      console.log('S3FilePreview: Converting S3 URL to API route:', { original: src, s3Key, apiUrl });
      return apiUrl;
    }
    const safeUrl = getSafeUrl(src);
    console.log('S3FilePreview: Using direct URL:', { original: src, safeUrl });
    return safeUrl;
  };
  
  // Mostrar nada si no hay URL
  if (!src) {
    return null;
  }
  
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
    const imageUrl = getFileUrl();
    
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
          src={imageUrl} 
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
          src={imageUrl} 
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
        src={imageUrl}
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
            href={getFileUrl()} 
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
          src={getFileUrl()} 
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