import { NextRequest, NextResponse } from 'next/server';
import { complianceDashboard } from '@/lib/gdpr/complianceDashboard';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Verify JWT token
    const token = authorization.replace('Bearer ', '');
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get tenant ID from query params or user
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || decoded.tenantId || 'default';

    // Generate compliance dashboard data
    const dashboardData = await complianceDashboard.generateDashboard(tenantId);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      tenantId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GDPR Compliance API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate compliance dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authorization.replace('Bearer ', '');
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, action } = body;

    const finalTenantId = tenantId || decoded.tenantId || 'default';

    switch (action) {
      case 'refresh':
        const refreshedData = await complianceDashboard.generateDashboard(finalTenantId);
        return NextResponse.json({
          success: true,
          data: refreshedData,
          action: 'refresh',
          timestamp: new Date().toISOString()
        });

      case 'export':
        // Export compliance report
        const exportData = await complianceDashboard.generateDashboard(finalTenantId);
        return NextResponse.json({
          success: true,
          exportData,
          format: 'json',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('GDPR Compliance POST API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process compliance action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 