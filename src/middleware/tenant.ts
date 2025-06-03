// src/middleware/tenant.ts
import { NextResponse } from 'next/server';
import { TenantResolver } from '@/lib/tenant/resolver'; // Adjust path if necessary
import { MiddlewareFunction } from '@/lib/middleware/factory'; // Adjust path if necessary

export const withTenant: MiddlewareFunction = async (req, res) => {
  // If a response is already provided (e.g., a redirect from previous middleware), pass it through.
  if (res.headers.has('Location')) {
    return res;
  }

  const tenantResolver = new TenantResolver(req);
  const tenantId = await tenantResolver.resolveTenantId();

  if (tenantId) {
    console.log(`Tenant ID resolved in middleware: ${tenantId}`);
    // Add tenantId to the request headers so it can be accessed by API routes, getServerSideProps, etc.
    // Note: Modifying request headers like this in Next.js middleware is standard.
    // The new headers are available on `NextRequest` in subsequent handlers/middleware
    // and on `context.req.headers` in API routes or `getServerSideProps`.

    // Clone the request headers and set the new header
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('X-Tenant-ID', tenantId);

    // For NextResponse.next(), we need to pass the new headers in the options
    // For modifying the request and then passing it to the next middleware in a chain,
    // it's more common to augment the `req` object directly if the middleware framework supports it,
    // or rely on the fact that `NextResponse.next({ request: { headers: requestHeaders }})`
    // makes these headers available to subsequent parts of the Next.js processing chain (like API routes).

    // If you are composing middleware and want to pass the modified request to the *next middleware function in your compose chain*,
    // that's typically done by modifying `req` itself (if mutable) or by returning a modified `req` (if immutable pattern).
    // However, Next.js middleware primarily works by returning a `NextResponse`.
    // Setting headers on `NextResponse.next({ request: { headers: ... }})` makes them available downstream.

    return NextResponse.next({
      request: {
        // New request headers
        headers: requestHeaders,
      },
    });
  }

  // If tenantId could not be resolved, you might want to:
  // 1. Allow the request to proceed (e.g., for public pages or platform admin login)
  // 2. Redirect to a generic "tenant not found" page or the main platform page
  // 3. Return an error response
  // For now, let's allow it to proceed. Authorization checks later can handle if tenantId is required.
  console.log('No tenant ID resolved in middleware, proceeding without X-Tenant-ID header.');
  return undefined; // Let the composer handle returning current res or NextResponse.next()
};
