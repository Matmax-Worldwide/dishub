export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  altText?: string;
  uploadedAt: string;
  dimensions?: string;
  s3Key?: string; // S3 key for deleting the file
} 