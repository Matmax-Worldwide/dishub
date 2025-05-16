import { NextResponse } from 'next/server';
import { 
  S3Client, 
  ListBucketsCommand,
  ListObjectsV2Command,
  HeadBucketCommand
} from '@aws-sdk/client-s3';

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

type S3DebugResults = {
  s3Config: {
    region: string;
    bucketName: string;
    hasAccessKey: boolean;
    hasSecretKey: boolean;
    hasUrlPrefix: boolean;
  };
  tests: {
    listBuckets?: {
      success: boolean;
      buckets?: string[];
      error?: string;
    };
    bucketAccess?: {
      success: boolean;
      message?: string;
      error?: string;
    };
    listObjects?: {
      success: boolean;
      count?: number;
      objects?: Array<{
        key?: string;
        size?: number;
        lastModified?: Date;
      }>;
      error?: string;
    };
  };
};

export async function GET() {
  const results: S3DebugResults = {
    s3Config: {
      region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
      bucketName,
      hasAccessKey: Boolean(process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID),
      hasSecretKey: Boolean(process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY),
      hasUrlPrefix: Boolean(process.env.NEXT_PUBLIC_S3_URL_PREFIX),
    },
    tests: {}
  };

  try {
    // Test 1: List all buckets (tests general authentication)
    try {
      const listBucketsCommand = new ListBucketsCommand({});
      const listBucketsResponse = await s3Client.send(listBucketsCommand);
      results.tests.listBuckets = {
        success: true,
        buckets: listBucketsResponse.Buckets?.map(b => b.Name || '').filter(Boolean) || []
      };
    } catch (error) {
      results.tests.listBuckets = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 2: Check if bucket exists and is accessible
    try {
      const headBucketCommand = new HeadBucketCommand({
        Bucket: bucketName
      });
      await s3Client.send(headBucketCommand);
      results.tests.bucketAccess = {
        success: true,
        message: `Bucket ${bucketName} exists and is accessible`
      };
    } catch (error) {
      results.tests.bucketAccess = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 3: List objects in bucket
    try {
      const listObjectsCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 5,
        Prefix: 'uploads/'
      });
      const listObjectsResponse = await s3Client.send(listObjectsCommand);
      results.tests.listObjects = {
        success: true,
        count: listObjectsResponse.Contents?.length || 0,
        objects: listObjectsResponse.Contents?.map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified
        })) || []
      };
    } catch (error) {
      results.tests.listObjects = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error running S3 debug tests:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run S3 debug tests',
        details: error instanceof Error ? error.message : String(error),
        results
      },
      { status: 500 }
    );
  }
} 