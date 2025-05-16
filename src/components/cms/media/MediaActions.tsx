import { useState } from 'react';
import { CopyIcon, ExternalLinkIcon, TrashIcon, CheckIcon, DownloadIcon } from 'lucide-react';

interface MediaActionsProps {
  fileUrl: string;
  s3Key?: string;
  onDelete: () => void;
  horizontal?: boolean;
}

export function MediaActions({ fileUrl, s3Key, onDelete, horizontal = false }: MediaActionsProps) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const openInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (s3Key) {
      // For S3 files, use our API route to view the file instead of direct access
      // We'll use the same download route but with a different display approach
      window.open(`/api/media/download?key=${encodeURIComponent(s3Key)}&view=true`, '_blank');
    } else {
      // For other files, open directly
      window.open(fileUrl, '_blank');
    }
  };

  const downloadFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (s3Key) {
      // Use the download API route
      window.open(`/api/media/download?key=${encodeURIComponent(s3Key)}`, '_blank');
    } else {
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileUrl.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return horizontal ? (
    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={copyToClipboard}
        className="text-gray-600 hover:text-gray-900"
        title="Copy URL"
      >
        {copied ? (
          <CheckIcon className="h-5 w-5 text-green-500" />
        ) : (
          <CopyIcon className="h-5 w-5" />
        )}
      </button>
      <button
        onClick={downloadFile}
        className="text-blue-600 hover:text-blue-900"
        title="Download file"
      >
        <DownloadIcon className="h-5 w-5" />
      </button>
      <button
        onClick={openInNewTab}
        className="text-indigo-600 hover:text-indigo-900"
        title="View file"
      >
        <ExternalLinkIcon className="h-5 w-5" />
      </button>
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-900"
        title="Delete file"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  ) : (
    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={copyToClipboard}
        className="p-2 bg-white rounded-full hover:bg-gray-100"
        title="Copy URL"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-green-500" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={downloadFile}
        className="p-2 bg-white rounded-full hover:bg-gray-100"
        title="Download file"
      >
        <DownloadIcon className="h-4 w-4 text-blue-500" />
      </button>
      <button
        onClick={openInNewTab}
        className="p-2 bg-white rounded-full hover:bg-gray-100"
        title="Open in new tab"
      >
        <ExternalLinkIcon className="h-4 w-4" />
      </button>
      <button
        onClick={handleDelete}
        className="p-2 bg-white rounded-full hover:bg-gray-100"
        title="Delete file"
      >
        <TrashIcon className="h-4 w-4 text-red-500" />
      </button>
    </div>
  );
}