import { MediaItem, Folder } from './types';
import { MediaActions } from './MediaActions';
import { MediaFileMenu } from './MediaFileMenu';
import { formatFileSize } from './utils';
import S3FilePreview from '@/app/components/shared/S3FilePreview';
import { useRef, useState, useCallback } from 'react';

interface MediaCardProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onMove: (id: string, targetFolder: string) => void;
  folders: Folder[];
  currentFolder: Folder;
  position?: 'up' | 'down' | 'auto';
}

export function MediaCard({ 
  item, 
  isSelected, 
  onSelect, 
  onDelete,
  onRename,
  onMove,
  folders,
  currentFolder,
  position = 'up'
}: MediaCardProps) {
  const {
    id,
    title,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    altText
  } = item;
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [mediaDimensions, setMediaDimensions] = useState<{width: number; height: number} | null>(null);

  const handleSelect = () => {
    onSelect(id);
  };

  // Calculate aspect ratio based on media dimensions
  const getAspectRatio = () => {
    if (!mediaDimensions) return 'aspect-square'; // Default fallback
    
    const { width, height } = mediaDimensions;
    const ratio = width / height;
    
    // Define common aspect ratios
    if (Math.abs(ratio - 1) < 0.1) return 'aspect-square'; // 1:1
    if (Math.abs(ratio - 16/9) < 0.1) return 'aspect-video'; // 16:9
    if (Math.abs(ratio - 4/3) < 0.1) return 'aspect-[4/3]'; // 4:3
    if (Math.abs(ratio - 3/2) < 0.1) return 'aspect-[3/2]'; // 3:2
    if (Math.abs(ratio - 2/1) < 0.1) return 'aspect-[2/1]'; // 2:1
    
    // For other ratios, create custom aspect ratio
    if (ratio > 2) return 'aspect-[3/1]'; // Very wide
    if (ratio > 1.5) return 'aspect-[2/1]'; // Wide
    if (ratio > 1.2) return 'aspect-[4/3]'; // Slightly wide
    if (ratio < 0.5) return 'aspect-[1/3]'; // Very tall
    if (ratio < 0.8) return 'aspect-[2/3]'; // Tall
    
    return 'aspect-square'; // Default
  };

  // Callback to receive dimensions from S3FilePreview
  const handleDimensionsLoaded = useCallback((dimensions: {width: number; height: number}) => {
    setMediaDimensions(dimensions);
  }, []);

  return (
    <div 
      ref={cardRef}
      className={`border rounded-lg overflow-hidden group cursor-pointer relative ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={handleSelect}
    >
      <div className={`relative ${getAspectRatio()} bg-gray-50 min-h-[200px] max-h-[400px]`}>
        <S3FilePreview
          src={fileUrl}
          alt={altText || title}
          className="w-full h-full"
          fileType={fileType}
          fileName={fileName}
          showDownload={true}
          onDimensionsLoaded={handleDimensionsLoaded}
        />
        <div className="absolute top-2 left-2 z-[9998]">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4"
          />
        </div>
      </div>
      
      {/* Hover controls covering the entire card */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100 z-[9999]">
        <MediaActions fileUrl={fileUrl} s3Key={item.s3Key} onDelete={() => onDelete(id)} />
      </div>
      
      <div className="p-3 relative">
        <h3 className="font-medium text-sm truncate pr-8" title={title}>
          {title}
        </h3>
        <p className="text-xs text-gray-500 truncate pr-8" title={fileName}>
          {fileName}
        </p>
        <p className="text-xs text-gray-400 mt-1 pr-8">
          {formatFileSize(fileSize)}
        </p>
        <div className="absolute bottom-3 right-3" onClick={(e) => e.stopPropagation()}>
          <MediaFileMenu
            id={id}
            fileName={fileName}
            fileUrl={fileUrl}
            s3Key={item.s3Key}
            onDelete={onDelete}
            onRename={onRename}
            onMove={onMove}
            folders={folders}
            currentFolder={currentFolder}
            position={position}
          />
        </div>
      </div>
    </div>
  );
} 