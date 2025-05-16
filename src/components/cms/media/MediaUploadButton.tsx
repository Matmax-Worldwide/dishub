import { useRef } from 'react';
import { UploadIcon } from 'lucide-react';

interface MediaUploadButtonProps {
  onFileSelect: (files: FileList) => void;
  children?: React.ReactNode;
  className?: string;
}

export function MediaUploadButton({ 
  onFileSelect, 
  children, 
  className = "px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
}: MediaUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileSelect(e.target.files);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
      >
        {children || (
          <>
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload
          </>
        )}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,video/*,application/pdf"
      />
    </>
  );
} 