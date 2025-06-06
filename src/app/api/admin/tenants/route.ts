import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma, TenantStatus } from '@prisma/client';
import { requireSuperAdmin } from '@/middleware/auth';

const prisma = new PrismaClient();

// GET /api/admin/tenants - List all tenants
export const GET = requireSuperAdmin()(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {};
    
    if (status && Object.values(TenantStatus).includes(status as TenantStatus)) {
      where.status = status as TenantStatus;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          _count: {
            select: {
              users: true,
              pages: true,
              posts: true,
              products: true,
              orders: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tenant.count({ where })
    ]);

    return NextResponse.json({
      tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/admin/tenants - Create new tenant
export const POST = requireSuperAdmin()(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, slug, domain, planId, features } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existingTenant) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Check if domain is unique (if provided)
    if (domain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { domain }
      });

      if (existingDomain) {
        return NextResponse.json({ error: 'Domain already exists' }, { status: 400 });
      }
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        domain,
        planId,
        features: features || [],
        status: 'PENDING',
      }
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}); 