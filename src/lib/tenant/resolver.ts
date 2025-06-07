import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma'; // Using the default prisma instance for Tenant model queries
import { verifyToken } from '@/lib/auth'; // Assuming verifyToken can extract tenantId from JWT

interface DecodedJwtPayload {
  userId?: string;
  tenantId?: string; // Assuming tenantId might be in the JWT
  // other properties...
}

export class TenantResolver {
  private req: NextRequest;

  constructor(req: NextRequest) {
    this.req = req;
  }

  public async resolveTenantId(): Promise<string | null> {
    let tenantId: string | null = null;
    
    console.log('TenantResolver: Starting tenant resolution...');
    console.log('TenantResolver: Request hostname:', this.getHostname());
    console.log('TenantResolver: APP_DOMAIN:', process.env.APP_DOMAIN);

    // 1. First try to resolve from user association (most reliable for authenticated users)
    tenantId = await this.resolveFromUserAssociation();
    if (tenantId) {
      console.log(`Tenant resolved from user association: ${tenantId}`);
      return tenantId;
    }

    // 2. Resolve from subdomain (e.g., myhotel.dishub.com)
    tenantId = this.resolveFromSubdomain();
    if (tenantId) {
      console.log(`Tenant resolved from subdomain (slug): ${tenantId}`);
      // Validate if this tenant slug exists and get its actual ID
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantId } });
      if (tenant) {
        console.log(`Validated tenant ID from slug ${tenantId}: ${tenant.id}`);
        return tenant.id;
      } else {
        console.log(`Tenant slug ${tenantId} not found.`);
        return null; // Slug does not correspond to a valid tenant
      }
    }

    // 3. Resolve from custom domain (e.g., www.myhotel.com)
    // This requires querying the Tenant table by the domain.
    tenantId = await this.resolveFromCustomDomain();
    if (tenantId) {
      console.log(`Tenant resolved from custom domain: ${tenantId}`);
      return tenantId; // This already returns the tenant.id
    }

    // 4. Resolve from JWT (if user is logged in and token contains tenantId)
    // This is more relevant for authenticated user sessions.
    tenantId = await this.resolveFromJwt();
    if (tenantId) {
      console.log(`Tenant resolved from JWT: ${tenantId}`);
      // Optionally, validate if this tenantId exists, though JWT should be trusted if valid
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      return tenant ? tenant.id : null;
    }

    // 5. Resolve from specific HTTP header (e.g., X-Tenant-ID)
    // Useful for internal services or testing.
    tenantId = this.resolveFromHeader();
    if (tenantId) {
      console.log(`Tenant resolved from header: ${tenantId}`);
      // Optionally, validate if this tenantId exists
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      return tenant ? tenant.id : null;
    }

    console.log('TenantResolver: Tenant ID could not be resolved from any source.');
    return null;
  }

  private getHostname(): string | null {
    // Ensure req.headers is available and get 'host'. Fallback to req.nextUrl.hostname.
    // In some edge cases (like middleware during build time or specific test environments), headers might be undefined.
    const hostHeader = this.req.headers && typeof this.req.headers.get === 'function' ? this.req.headers.get('host') : null;
    return hostHeader || (this.req.nextUrl ? this.req.nextUrl.hostname : null);
  }

  private resolveFromSubdomain(): string | null {
    console.log('TenantResolver: Attempting to resolve from subdomain...');
    const hostname = this.getHostname();
    if (!hostname) {
      console.log('TenantResolver: No hostname available');
      return null;
    }

    // You'll need to configure this APP_DOMAIN environment variable.
    const appDomain = process.env.APP_DOMAIN || 'localhost'; // Fallback to 'localhost' for dev

    // Handle localhost differently: tenant.localhost:3000 -> tenant.localhost
    const effectiveHostname = hostname.startsWith('localhost:') ? 'localhost' : hostname;
    
    console.log('TenantResolver: Hostname:', hostname);
    console.log('TenantResolver: Effective hostname:', effectiveHostname);
    console.log('TenantResolver: App domain:', appDomain);

    // Example: myhotel.dishub.com -> parts = ['myhotel', 'dishub', 'com']
    // Example: myhotel.localhost -> parts = ['myhotel', 'localhost'] (if port is handled separately)
    // Example: localhost -> parts = ['localhost']

    if (effectiveHostname.endsWith(`.${appDomain}`) && effectiveHostname.length > appDomain.length) {
        const potentialSubdomain = effectiveHostname.substring(0, effectiveHostname.indexOf('.'));
        console.log('TenantResolver: Potential subdomain from app domain:', potentialSubdomain);
        if (potentialSubdomain && !['www', 'app', 'admin', 'api', '_next', 'static'].includes(potentialSubdomain)) {
            console.log('TenantResolver: Valid subdomain found:', potentialSubdomain);
            return potentialSubdomain; // This is the tenant slug
        }
    } else if (appDomain === 'localhost' && effectiveHostname.length > 1 && effectiveHostname.endsWith('localhost')) {
        // Specific handling for tenant.localhost structure
        const potentialSubdomain = effectiveHostname.substring(0, effectiveHostname.indexOf('.'));
        console.log('TenantResolver: Potential subdomain from localhost:', potentialSubdomain);
         if (potentialSubdomain && !['www', 'app', 'admin', 'api', '_next', 'static'].includes(potentialSubdomain)) {
            console.log('TenantResolver: Valid localhost subdomain found:', potentialSubdomain);
            return potentialSubdomain; // This is the tenant slug
        }
    }
    
    console.log('TenantResolver: No valid subdomain found');
    return null;
  }

  private async resolveFromCustomDomain(): Promise<string | null> {
    const hostname = this.getHostname();
    if (!hostname) return null;

    const appDomain = process.env.APP_DOMAIN || 'localhost';
    // Make sure it's not the appDomain itself or a subdomain of appDomain (which should be handled by resolveFromSubdomain)
    if (hostname === appDomain || hostname.endsWith(`.${appDomain}`)) {
        return null;
    }

    try {
      // Query by the 'domain' field in the Tenant model
      const tenant = await prisma.tenant.findUnique({
        where: { domain: hostname },
      });
      return tenant ? tenant.id : null; // Return the actual tenant ID
    } catch (error) {
      console.error('Error resolving tenant from custom domain:', error);
      return null;
    }
  }

  private async resolveFromJwt(): Promise<string | null> {
    console.log('TenantResolver: Attempting to resolve from JWT...');
    
    // Try to get token from Authorization header first
    const authHeader = this.req.headers && typeof this.req.headers.get === 'function' ? this.req.headers.get('authorization') : null;
    let token: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('TenantResolver: Found token in Authorization header');
    } else {
      // Try to get token from cookies
      const cookieHeader = this.req.headers && typeof this.req.headers.get === 'function' ? this.req.headers.get('cookie') : null;
      if (cookieHeader) {
        console.log('TenantResolver: Checking cookies for token...');
        // Look for auth-token or session-token in cookies
        const authTokenMatch = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]+)/);
        const sessionTokenMatch = cookieHeader.match(/(?:^|;\s*)session-token=([^;]+)/);
        
        if (authTokenMatch) {
          token = authTokenMatch[1];
          console.log('TenantResolver: Found token in auth-token cookie');
        } else if (sessionTokenMatch) {
          token = sessionTokenMatch[1];
          console.log('TenantResolver: Found token in session-token cookie');
        }
      }
    }
    
    if (!token) {
      console.log('TenantResolver: No token found in headers or cookies');
      return null;
    }
    
    try {
      // verifyToken should return a well-typed payload or throw an error
      const decodedPayload = await verifyToken(token) as DecodedJwtPayload | null;
      console.log('TenantResolver: Decoded JWT payload:', decodedPayload);

      if (decodedPayload?.tenantId) {
        console.log('TenantResolver: Found tenantId in JWT:', decodedPayload.tenantId);
        return decodedPayload.tenantId; // This should be the tenant's actual ID
      } else {
        console.log('TenantResolver: No tenantId found in JWT payload');
        return null;
      }
    } catch (error) {
      // Log specific verifyToken errors if needed, but avoid verbose logging for common invalid token errors
      if ((error as Error).name !== 'JsonWebTokenError' && (error as Error).name !== 'TokenExpiredError') {
        console.error('TenantResolver: Error verifying token for tenant resolution:', error);
      } else {
        console.log('TenantResolver: Invalid or expired token');
      }
      return null;
    }
  }

  private resolveFromHeader(): string | null {
    // Ensure req.headers is available before calling get
    if (this.req.headers && typeof this.req.headers.get === 'function') {
      return this.req.headers.get('X-Tenant-ID'); // This should be the tenant's actual ID
    }
    return null;
  }

  private async resolveFromUserAssociation(): Promise<string | null> {
    console.log('TenantResolver: Attempting to resolve from user association...');
    
    // Try to get token from Authorization header first
    const authHeader = this.req.headers && typeof this.req.headers.get === 'function' ? this.req.headers.get('authorization') : null;
    let token: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('TenantResolver: Found token in Authorization header');
    } else {
      // Try to get token from cookies
      const cookieHeader = this.req.headers && typeof this.req.headers.get === 'function' ? this.req.headers.get('cookie') : null;
      if (cookieHeader) {
        console.log('TenantResolver: Checking cookies for token...');
        // Look for auth-token or session-token in cookies
        const authTokenMatch = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]+)/);
        const sessionTokenMatch = cookieHeader.match(/(?:^|;\s*)session-token=([^;]+)/);
        
        if (authTokenMatch) {
          token = authTokenMatch[1];
          console.log('TenantResolver: Found token in auth-token cookie');
        } else if (sessionTokenMatch) {
          token = sessionTokenMatch[1];
          console.log('TenantResolver: Found token in session-token cookie');
        }
      }
    }
    
    if (!token) {
      console.log('TenantResolver: No token found, cannot resolve user association');
      return null;
    }
    
    try {
      // Verify token and get user ID
      const decodedPayload = await verifyToken(token) as DecodedJwtPayload | null;
      
      if (!decodedPayload?.userId) {
        console.log('TenantResolver: No userId found in token');
        return null;
      }
      
      console.log('TenantResolver: Found userId in token:', decodedPayload.userId);
      
      // Query user from database to get their tenant relationships
      const user = await prisma.user.findUnique({
        where: { id: decodedPayload.userId },
        select: { 
          id: true, 
          email: true,
          userTenants: {
            where: { isActive: true },
            select: {
              tenantId: true,
              role: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            },
            orderBy: { joinedAt: 'desc' }
          }
        }
      });
      
      if (!user) {
        console.log('TenantResolver: User not found in database');
        return null;
      }
      
      if (!user.userTenants || user.userTenants.length === 0) {
        console.log('TenantResolver: User has no active tenant associations');
        return null;
      }
      
      // Use the first (most recent) tenant relationship
      const firstTenantRelation = user.userTenants[0];
      console.log(`TenantResolver: Found tenantId from user association: ${firstTenantRelation.tenantId} for user: ${user.email}`);
      console.log(`TenantResolver: Validated tenant: ${firstTenantRelation.tenant.name} (${firstTenantRelation.tenant.id})`);
      
      return firstTenantRelation.tenantId;
      
    } catch (error) {
      console.error('TenantResolver: Error resolving tenant from user association:', error);
      return null;
    }
  }
}
