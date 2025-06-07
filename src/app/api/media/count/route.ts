import { NextResponse } from 'next/server';
import { getMediaItemsCount } from '@/app/components/engines/cms/modules/media/aws-utils';

export async function GET() {
  try {
    // Get media count from S3
    const count = await getMediaItemsCount();
    
    // Return the count as JSON
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting media count:', error);
    return NextResponse.json(
      { error: 'Failed to get media count', count: 0 },
      { status: 500 }
    );
  }
} 