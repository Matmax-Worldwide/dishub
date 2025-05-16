import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileIcon, FileTextIcon, DownloadIcon } from 'lucide-react';

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
  fileType,
  showDownload = false,
  fileName
}: S3FilePreviewProps) => {
  const [isS3Url, setIsS3Url] = useState(false);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  
  useEffect(() => {
    // No hacer nada si no hay URL
    if (!src) return;
    
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
    const determinedFileType = fileType || getFileTypeFromUrl(src);
    setIsImage(determinedFileType.startsWith('image/'));
    setIsPdf(determinedFileType === 'application/pdf');
    setIsVideo(determinedFileType.startsWith('video/'));
  }, [src, fileType]);

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
      case 'pdf':
        return 'application/pdf';
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'doc':
      case 'docx':
        return 'application/msword';
      case 'xls':
      case 'xlsx':
        return 'application/vnd.ms-excel';
      case 'ppt':
      case 'pptx':
        return 'application/vnd.ms-powerpoint';
      default:
        return 'application/octet-stream';
    }
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
  
  // Renderizar según el tipo de archivo
  return (
    <div className="relative group">
      {isImage ? (
        // Para imágenes, mostrar con Image component
        <Image
          src={getFileUrl()}
          alt={alt}
          width={width}
          height={height}
          className={className || "max-h-full max-w-full object-contain"}
        />
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
        >
          Tu navegador no soporta el tag de video.
        </video>
      ) : (
        // Para otros archivos, mostrar un icono genérico
        <div className={`flex flex-col items-center justify-center ${className}`}>
          <FileIcon className="h-12 w-12 text-gray-500" />
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
        >
          <DownloadIcon className="h-4 w-4 text-gray-700" />
        </a>
      )}
    </div>
  );
};

export default S3FilePreview; 