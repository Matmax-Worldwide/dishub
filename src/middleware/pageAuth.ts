import { NextResponse } from 'next/server';
import { MiddlewareFunction } from '@/lib/middleware/factory'; // Adjust path if necessary
import { RoleName } from '@/hooks/usePermission'; // Assuming RoleName is defined here and accessible. Adjust path if needed.

// This route permissions object should be identical to or replace legacyRoutePermissions.
// It can be defined here or imported from a central config file (e.g., src/config/permissions.ts).
const ROUTE_PERMISSIONS: Record<string, { roles: RoleName[] }> = {
  'admin': { roles: ['SuperAdmin', 'PlatformAdmin', 'TenantAdmin'] },
  'admin/users': { roles: ['SuperAdmin', 'PlatformAdmin', 'TenantAdmin'] },
  'admin/roles': { roles: ['SuperAdmin', 'PlatformAdmin', 'TenantAdmin'] },
  'dashboard/reports': { roles: ['SuperAdmin', 'PlatformAdmin', 'TenantAdmin', 'TenantManager'] },
  'dashboard/tasks': { roles: ['SuperAdmin', 'PlatformAdmin', 'TenantAdmin', 'TenantManager', 'Employee'] },
  'dashboard/staff': { roles: ['SuperAdmin', 'PlatformAdmin', 'TenantAdmin', 'TenantManager', 'HRAdmin', 'HRManager'] },
  'dashboard/cms': { roles: ['SuperAdmin', 'PlatformAdmin', 'TenantAdmin', 'ContentManager'] },
  // Ensure this list is comprehensive for all role-protected page routes.
};

export const withPageAuth: MiddlewareFunction = async (req) => {
  const userRole = req.headers.get('x-user-role') as RoleName | null;
  const activeLocale = req.headers.get('x-active-locale');
  const pathWithoutLocale = req.headers.get('x-path-without-locale');

  // If critical headers are missing, it implies an issue or an unauthenticated user.
  // withAuth should handle unauthenticated users. If userRole is missing here,
  // it means an authenticated user somehow doesn't have a role, or headers weren't set.
  if (!userRole || !activeLocale || !pathWithoutLocale) {
    console.warn(
      'withPageAuth: Missing one or more required headers: x-user-role, x-active-locale, x-path-without-locale. ' +
      'This might indicate an issue with middleware order or an unauthenticated access attempt ' +
      'that was not caught by withAuth. Page authorization will be skipped.'
    );
    // Depending on security posture, you might want to redirect to an error page or login.
    // For now, we'll let it pass, assuming other layers handle missing auth.
    return;
  }

  let isProtectedRoute = false;
  let matchedConfig: { roles: RoleName[] } | null = null;
  let matchedRouteKey = '';

  // Iterate to find the most specific matching protected route.
  // Example: If path is '/admin/users/edit', and routes are '/admin' and '/admin/users',
  // '/admin/users' is more specific.
  for (const routeKey in ROUTE_PERMISSIONS) {
    // Check for exact match or prefix match (ensuring it's a directory match, not partial segment)
    // Ensure routeKey starts with '/' for consistency if pathWithoutLocale does
    const normalizedRouteKey = routeKey.startsWith('/') ? routeKey : '/' + routeKey;

    if (pathWithoutLocale === normalizedRouteKey ||
        (pathWithoutLocale.startsWith(normalizedRouteKey) &&
         normalizedRouteKey !== '/' && // Avoid matching everything if routeKey is just '/'
         pathWithoutLocale.charAt(normalizedRouteKey.length) === '/')) {
      if (normalizedRouteKey.length > matchedRouteKey.length) {
        matchedRouteKey = normalizedRouteKey;
        isProtectedRoute = true;
        matchedConfig = ROUTE_PERMISSIONS[routeKey]; // Use original routeKey for lookup
      }
    } else if (normalizedRouteKey === '/' && pathWithoutLocale === '/') { // Explicit root match
        if (normalizedRouteKey.length > matchedRouteKey.length) {
            matchedRouteKey = normalizedRouteKey;
            isProtectedRoute = true;
            matchedConfig = ROUTE_PERMISSIONS[routeKey];
        }
    }
  }

  if (isProtectedRoute && matchedConfig) {
    console.log(`withPageAuth: Path '${pathWithoutLocale}' is protected by rule '${matchedRouteKey}'. Required roles: ${matchedConfig.roles.join(', ')}. User role: ${userRole}`);
    if (!matchedConfig.roles.includes(userRole)) {
      console.log(`withPageAuth: Access DENIED for role '${userRole}' to path '${pathWithoutLocale}'. Redirecting to access-denied.`);
      const accessDeniedUrl = new URL(`/${activeLocale}/access-denied`, req.nextUrl.origin);

      // Try to get the original full pathname for the 'from' parameter
      // 'x-original-url' is not a standard header, rely on req.nextUrl if it's not set by previous middleware.
      // The pathname from req.nextUrl should be the full, original one.
      accessDeniedUrl.searchParams.set('from', req.nextUrl.pathname);
      return NextResponse.redirect(accessDeniedUrl);
    }
    // console.log(`withPageAuth: Access GRANTED for role '${userRole}' to path '${pathWithoutLocale}'.`);
  } else {
    // console.log(`withPageAuth: Path '${pathWithoutLocale}' is not specifically protected by this page authorization middleware.`);
  }

  // If access is granted or the route is not protected by this specific middleware,
  // return void (do nothing) to allow the request to proceed in the chain.
  return;
};
