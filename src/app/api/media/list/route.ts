import { NextResponse } from 'next/server';
import { 
  S3Client, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3';
import { MediaItem } from '@/components/cms/media/types';

// Create S3 client (server-side only)
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || '',
  }
});

// S3 bucket name
const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'vercelvendure';

// Public URL prefix
const publicUrlPrefix = process.env.NEXT_PUBLIC_S3_URL_PREFIX || 'https://vercelvendure.s3.amazonaws.com';

// Create S3 URL from key
const getS3PublicUrl = (key: string): string => {
  return `${publicUrlPrefix}/${key}`;
};

export async function GET() {
  try {
    console.log('GET /api/media/list - Processing request');
    
    // List objects in the bucket with prefix
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'uploads/',
      MaxKeys: 100,
    });
    
    console.log(`Sending ListObjectsV2Command to bucket: ${bucketName}`);
    const response = await s3Client.send(command);
    console.log('Response received from S3');
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('No items found in S3 bucket');
      return NextResponse.json({ items: [] });
    }
    
    console.log(`Found ${response.Contents.length} items in S3 bucket`);
    
    // Convert S3 objects to MediaItems
    const mediaItems: MediaItem[] = response.Contents.map(item => {
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
    
    console.log(`Returning ${mediaItems.length} media items`);
    return NextResponse.json({ items: mediaItems });
  } catch (error) {
    console.error('Error fetching from S3:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    );
  }
} 