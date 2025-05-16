import { MediaItem } from './types';
import { MediaActions } from './MediaActions';
import { formatFileSize } from './utils';
import S3FilePreview from '@/components/shared/S3FilePreview';

interface MediaCardProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MediaCard({ item, isSelected, onSelect, onDelete }: MediaCardProps) {
  const {
    id,
    title,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    altText
  } = item;

  const handleSelect = () => {
    onSelect(id);
  };

  const handleDelete = () => {
    onDelete(id);
  };

  return (
    <div 
      className={`border rounded-lg overflow-hidden group cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={handleSelect}
    >
      <div className="relative aspect-square bg-gray-50">
        <S3FilePreview
          src={fileUrl}
          alt={altText || title}
          className="w-full h-full object-contain flex items-center justify-center"
          width={300}
          height={300}
          fileType={fileType}
          fileName={fileName}
          showDownload={true}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
          <MediaActions fileUrl={fileUrl} s3Key={item.s3Key} onDelete={handleDelete} />
        </div>
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4"
          />
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm truncate" title={title}>
          {title}
        </h3>
        <p className="text-xs text-gray-500 truncate" title={fileName}>
          {fileName}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatFileSize(fileSize)}
        </p>
      </div>
    </div>
  );
} 