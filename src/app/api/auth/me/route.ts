import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        userTenants: {
          where: { isActive: true },
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Determine the primary tenant for the user
    const primaryTenant = user.userTenants[0];

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role?.name || 'TenantUser',
      tenantId: primaryTenant?.tenantId || session.tenantId || null,
      tenantSlug: primaryTenant?.tenant?.slug || null,
      tenantName: primaryTenant?.tenant?.name || null,
    };

    return NextResponse.json({
      authenticated: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 