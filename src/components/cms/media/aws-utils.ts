import { MediaItem } from './types';

/**
 * Configuration for AWS S3
 * These should be set in your environment variables
 */
interface S3Config {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrlPrefix: string;
}

// This should be configured from environment variables
export const getS3Config = (): S3Config => {
  return {
    bucketName: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || '',
    region: process.env.NEXT_PUBLIC_S3_REGION || '',
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || '',
    publicUrlPrefix: process.env.NEXT_PUBLIC_S3_URL_PREFIX || '',
  };
};

/**
 * Generates a unique file name for S3 upload
 */
export const generateS3FileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Creates a full S3 URL from the key
 */
export const getS3PublicUrl = (key: string): string => {
  const { publicUrlPrefix } = getS3Config();
  return `${publicUrlPrefix}/${key}`;
};

/**
 * Prepares media item for display after upload
 */
export const createMediaItemFromUpload = (
  file: File, 
  uploadedUrl: string
): MediaItem => {
  return {
    id: `s3-${Date.now()}`,
    title: file.name.split('.')[0],
    fileUrl: uploadedUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedAt: new Date().toISOString().split('T')[0],
    dimensions: file.type.startsWith('image/') ? 'calculating...' : undefined,
  };
};

/**
 * Simulated S3 upload - to be replaced with actual AWS SDK implementation
 * For real implementation, you would use AWS SDK v3 or specialized libraries
 */
export const uploadToS3 = async (
  file: File, 
  progressCallback: (progress: number) => void
): Promise<string> => {
  // Simulate upload progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressCallback(Math.min(progress, 95));
    if (progress >= 100) clearInterval(interval);
  }, 300);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  clearInterval(interval);
  progressCallback(100);

  // In a real implementation, you would upload to S3 here
  // and return the actual URL from S3
  
  // In a real implementation, you would return the S3 URL
  const s3Key = generateS3FileName(file.name);
  return getS3PublicUrl(s3Key);
}; 