import { ImageIcon, VideoIcon, FileIcon } from 'lucide-react';

interface MediaItemIconProps {
  fileType: string;
  className?: string;
}

export function MediaItemIcon({ fileType, className = "h-8 w-8" }: MediaItemIconProps) {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className={`${className} text-blue-500`} />;
  }
  
  if (fileType.startsWith('video/')) {
    return <VideoIcon className={`${className} text-purple-500`} />;
  }
  
  return <FileIcon className={`${className} text-orange-500`} />;
} 