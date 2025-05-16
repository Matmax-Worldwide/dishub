import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  FileIcon, 
  FileTextIcon, 
  DownloadIcon, 
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
  showDownload = false,
  fileName
}: S3FilePreviewProps) => {
  const [isS3Url, setIsS3Url] = useState(false);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [fileCategory, setFileCategory] = useState<string>('other');
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // No hacer nada si no hay URL
    if (!src) return;
    
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
    const detectedFileType = providedFileType || getFileTypeFromUrl(src);
    
    // Actualizar estados derivados del tipo de archivo
    setIsImage(detectedFileType.startsWith('image/'));
    setIsPdf(detectedFileType === 'application/pdf');
    setIsVideo(detectedFileType.startsWith('video/'));
    
    // Determinar la categoría del archivo
    setFileCategory(categorizeFileType(detectedFileType));
  }, [src, providedFileType]);

  // Función para determinar el tipo de archivo a partir de la URL
  const getFileTypeFromUrl = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (!extension) return 'application/octet-stream';
    
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
  
  // Obtener la URL de visualización
  const getFileUrl = (): string => {
    if (isS3Url && s3Key) {
      return `/api/media/download?key=${encodeURIComponent(s3Key)}&view=true`;
    }
    return src;
  };
  
  // Obtener la URL de descarga
  const getDownloadUrl = (): string => {
    if (isS3Url && s3Key) {
      return `/api/media/download?key=${encodeURIComponent(s3Key)}`;
    }
    return src;
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
  
  // Handler for image error
  const handleImageError = () => {
    console.error("Error loading image:", src);
    setImageError(true);
  };
  
  // Renderizar según el tipo de archivo
  return (
    <div className="relative group">
      {isImage && !imageError ? (
        // Para imágenes, mostrar con Image component
        <div className={className || "max-h-full max-w-full flex items-center justify-center"}>
          <Image
            src={getFileUrl()}
            alt={alt}
            width={width}
            height={height}
            className="max-h-full max-w-full object-contain"
            onError={handleImageError}
            unoptimized={isS3Url} // Skip optimization for S3 URLs to prevent potential issues
          />
        </div>
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
      
      {/* Botón de descarga si está habilitado */}
      {showDownload && (
        <a 
          href={getDownloadUrl()}
          download={displayFileName}
          className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          title="Descargar archivo"
          onClick={(e) => e.stopPropagation()}
        >
          <DownloadIcon className="h-4 w-4 text-gray-700" />
        </a>
      )}
    </div>
  );
};

export default S3FilePreview; 