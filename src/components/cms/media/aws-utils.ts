import { MediaItem } from './types';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';

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

// Check if environment variables are set
const isConfigured = (): boolean => {
  // Check both process.env and window.env (if in browser)
  console.log('Environment mode:', process.env.NODE_ENV);
  console.log('S3 Environment Variables:');
  console.log('NEXT_PUBLIC_S3_REGION:', process.env.NEXT_PUBLIC_S3_REGION);
  console.log('NEXT_PUBLIC_S3_BUCKET_NAME:', process.env.NEXT_PUBLIC_S3_BUCKET_NAME);
  console.log('NEXT_PUBLIC_S3_ACCESS_KEY_ID:', process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID ? 'Set (hidden for security)' : 'Not set');
  console.log('NEXT_PUBLIC_S3_SECRET_ACCESS_KEY:', process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY ? 'Set (hidden for security)' : 'Not set');
  console.log('NEXT_PUBLIC_S3_URL_PREFIX:', process.env.NEXT_PUBLIC_S3_URL_PREFIX);
  
  // For browser debugging - check if env variables are properly exposed
  if (typeof window !== 'undefined') {
    console.log('Running in browser environment');
  } else {
    console.log('Running in server environment');
  }
  
  // Additional debug information to help troubleshoot
  if (!process.env.NEXT_PUBLIC_S3_REGION) console.log('Missing: NEXT_PUBLIC_S3_REGION');
  if (!process.env.NEXT_PUBLIC_S3_BUCKET_NAME) console.log('Missing: NEXT_PUBLIC_S3_BUCKET_NAME');
  if (!process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID) console.log('Missing: NEXT_PUBLIC_S3_ACCESS_KEY_ID');
  if (!process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY) console.log('Missing: NEXT_PUBLIC_S3_SECRET_ACCESS_KEY');
  
  return !!(
    process.env.NEXT_PUBLIC_S3_BUCKET_NAME &&
    process.env.NEXT_PUBLIC_S3_REGION &&
    process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID &&
    process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY
  );
};

// This should be configured from environment variables
export const getS3Config = (): S3Config => {
  if (!isConfigured()) {
    console.warn('AWS S3 is not properly configured. Please set environment variables.');
  }
  
  return {
    bucketName: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'vercelvendure',
    region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || '',
    publicUrlPrefix: process.env.NEXT_PUBLIC_S3_URL_PREFIX || 'https://vercelvendure.s3.amazonaws.com',
  };
};

// Create S3 client instance
export const getS3Client = (): S3Client => {
  const config = getS3Config();
  
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error('AWS credentials are not properly configured');
  }
  
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    }
  });
};

/**
 * Generates a unique file name for S3 upload
 */
export const generateS3FileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `uploads/${timestamp}-${randomString}.${extension}`;
};

/**
 * Creates a full S3 URL from the key
 */
export const getS3PublicUrl = (key: string): string => {
  const { publicUrlPrefix } = getS3Config();
  return `${publicUrlPrefix}/${key}`;
};

/**
 * Get dimensions of an image
 */
export const getImageDimensions = async (file: File): Promise<string | undefined> => {
  if (!file.type.startsWith('image/')) {
    return undefined;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src); // Clean up
      resolve(`${img.width}x${img.height}`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up
      resolve(undefined);
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Prepares media item for display after upload
 */
export const createMediaItemFromUpload = async (
  file: File, 
  uploadedUrl: string,
  s3Key: string
): Promise<MediaItem> => {
  const dimensions = await getImageDimensions(file);
  
  return {
    id: `s3-${Date.now()}`,
    title: file.name.split('.')[0],
    fileUrl: uploadedUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedAt: new Date().toISOString().split('T')[0],
    dimensions,
    s3Key // Store the S3 key to use when deleting the object
  };
};

/**
 * Uploads a file to S3
 */
export const uploadToS3 = async (
  file: File, 
  progressCallback: (progress: number) => void
): Promise<{ url: string; key: string }> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  const s3Key = generateS3FileName(file.name);
  
  try {
    progressCallback(10); // Started upload

    // Create upload command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: file,
      ContentType: file.type,
      ContentDisposition: `inline; filename="${file.name}"`,
    });

    // Execute upload
    progressCallback(30);
    await s3Client.send(command);
    progressCallback(90);

    // Get the public URL
    const publicUrl = getS3PublicUrl(s3Key);
    progressCallback(100);
    
    return { url: publicUrl, key: s3Key };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

/**
 * Fetches a list of media items from S3
 */
export const fetchMediaItemsFromS3 = async (): Promise<MediaItem[]> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  try {
    // List objects in the bucket with prefix
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/',
      MaxKeys: 100, // Adjust as needed
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }
    
    // Convert S3 objects to MediaItems
    return response.Contents.map(item => {
      const key = item.Key as string;
      const fileName = key.split('/').pop() || key;
      const fileNameParts = fileName.split('-');
      // Get everything after the first dash and timestamp
      const originalFileName = fileNameParts.slice(2).join('-');
      const title = originalFileName.split('.')[0];
      const fileExt = originalFileName.split('.').pop() || '';
      let fileType = 'application/octet-stream';
      
      // Infer file type from extension
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt.toLowerCase())) {
        fileType = `image/${fileExt.toLowerCase() === 'jpg' ? 'jpeg' : fileExt.toLowerCase()}`;
      } else if (['pdf'].includes(fileExt.toLowerCase())) {
        fileType = 'application/pdf';
      } else if (['doc', 'docx'].includes(fileExt.toLowerCase())) {
        fileType = 'application/msword';
      } else if (['mp4', 'webm', 'ogg'].includes(fileExt.toLowerCase())) {
        fileType = `video/${fileExt.toLowerCase()}`;
      }
      
      return {
        id: `s3-${key}`,
        title: title || fileName,
        fileUrl: getS3PublicUrl(key),
        fileName: originalFileName || fileName,
        fileSize: item.Size || 0,
        fileType,
        uploadedAt: item.LastModified ? item.LastModified.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        s3Key: key,
      };
    });
  } catch (error) {
    console.error('Error fetching from S3:', error);
    throw error;
  }
};

/**
 * Deletes a file from S3
 */
export const deleteFileFromS3 = async (key: string): Promise<boolean> => {
  if (!isConfigured()) {
    throw new Error('AWS S3 is not properly configured. Please set environment variables.');
  }

  const s3Client = getS3Client();
  const { bucketName } = getS3Config();
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
}; 