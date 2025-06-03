// src/lib/tenant/resolver.ts
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

    // 1. Resolve from subdomain (e.g., myhotel.dishub.com)
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

    // 2. Resolve from custom domain (e.g., www.myhotel.com)
    // This requires querying the Tenant table by the domain.
    tenantId = await this.resolveFromCustomDomain();
    if (tenantId) {
      console.log(`Tenant resolved from custom domain: ${tenantId}`);
      return tenantId; // This already returns the tenant.id
    }

    // 3. Resolve from JWT (if user is logged in and token contains tenantId)
    // This is more relevant for authenticated user sessions.
    tenantId = await this.resolveFromJwt();
    if (tenantId) {
      console.log(`Tenant resolved from JWT: ${tenantId}`);
      // Optionally, validate if this tenantId exists, though JWT should be trusted if valid
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      return tenant ? tenant.id : null;
    }

    // 4. Resolve from specific HTTP header (e.g., X-Tenant-ID)
    // Useful for internal services or testing.
    tenantId = this.resolveFromHeader();
    if (tenantId) {
      console.log(`Tenant resolved from header: ${tenantId}`);
      // Optionally, validate if this tenantId exists
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      return tenant ? tenant.id : null;
    }

    console.log('Tenant ID could not be resolved.');
    return null;
  }

  private getHostname(): string | null {
    // Ensure req.headers is available and get 'host'. Fallback to req.nextUrl.hostname.
    // In some edge cases (like middleware during build time or specific test environments), headers might be undefined.
    const hostHeader = this.req.headers && typeof this.req.headers.get === 'function' ? this.req.headers.get('host') : null;
    return hostHeader || (this.req.nextUrl ? this.req.nextUrl.hostname : null);
  }

  private resolveFromSubdomain(): string | null {
    const hostname = this.getHostname();
    if (!hostname) return null;

    // Assuming your main platform domain is something like 'dishub.com' or 'localhost' for dev
    // You'll need to configure this APP_DOMAIN environment variable.
    const appDomain = process.env.APP_DOMAIN || 'localhost'; // Fallback to 'localhost' for dev
    const parts = hostname.split('.');

    // Handle localhost differently: tenant.localhost:3000 -> tenant.localhost
    const effectiveHostname = hostname.startsWith('localhost:') ? 'localhost' : hostname;
    const effectiveAppDomainParts = appDomain.split('.');
    const effectiveHostnameParts = effectiveHostname.split('.');


    // Example: myhotel.dishub.com -> parts = ['myhotel', 'dishub', 'com']
    // Example: myhotel.localhost -> parts = ['myhotel', 'localhost'] (if port is handled separately)
    // Example: localhost -> parts = ['localhost']

    if (effectiveHostname.endsWith(`.${appDomain}`) && effectiveHostnameParts.length > effectiveAppDomainParts.length) {
        const potentialSubdomain = effectiveHostnameParts[0];
        if (potentialSubdomain && !['www', 'app', 'admin', 'api', '_next', 'static'].includes(potentialSubdomain)) {
            return potentialSubdomain; // This is the tenant slug
        }
    } else if (appDomain === 'localhost' && effectiveHostnameParts.length > 1 && effectiveHostnameParts[effectiveHostnameParts.length -1] === 'localhost') {
        // Specific handling for tenant.localhost structure
        const potentialSubdomain = effectiveHostnameParts[0];
         if (potentialSubdomain && !['www', 'app', 'admin', 'api', '_next', 'static'].includes(potentialSubdomain)) {
            return potentialSubdomain; // This is the tenant slug
        }
    }
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
    const authHeader = this.req.headers && typeof this.req.headers.get === 'function' ? this.req.headers.get('authorization') : null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // verifyToken should return a well-typed payload or throw an error
        const decodedPayload = await verifyToken(token) as DecodedJwtPayload | null;

        if (decodedPayload?.tenantId) {
          return decodedPayload.tenantId; // This should be the tenant's actual ID
        }
      } catch (error) {
        // Log specific verifyToken errors if needed, but avoid verbose logging for common invalid token errors
        if ((error as Error).name !== 'JsonWebTokenError' && (error as Error).name !== 'TokenExpiredError') {
          console.error('Error verifying token for tenant resolution:', error);
        }
        return null;
      }
    }
    return null;
  }

  private resolveFromHeader(): string | null {
    // Ensure req.headers is available before calling get
    if (this.req.headers && typeof this.req.headers.get === 'function') {
      return this.req.headers.get('X-Tenant-ID'); // This should be the tenant's actual ID
    }
    return null;
  }
}
