import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './src/lib/auth'
import { cookies } from 'next/headers'
import { RoleName } from './src/hooks/usePermission'

// Definir los locales soportados
const locales = ['en', 'es', 'de']
const defaultLocale = 'es'

// Definir rutas protegidas con requisitos de roles
const routePermissions: Record<string, { roles: RoleName[] }> = {
  'admin': { roles: ['ADMIN'] },
  'admin/users': { roles: ['ADMIN'] },
  'admin/roles': { roles: ['ADMIN'] },
  'dashboard/reports': { roles: ['ADMIN', 'MANAGER'] },
  'evoque/evoque/dashboard/tasks': { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  'dashboard/staff': { roles: ['ADMIN', 'MANAGER'] },
  'dashboard/cms': { roles: ['ADMIN'] },
}

export async function middleware(request: NextRequest) {
  // Log the current path
  console.log('Middleware running on path:', request.nextUrl.pathname);
  const pathname = request.nextUrl.pathname

  // Skip middleware for API routes and GraphQL
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    console.log('Skipping middleware for API/next path');
    return NextResponse.next()
  }
  
  // Redirect root path (/) to default locale
  if (pathname === '/') {
    console.log('Root path detected, redirecting to default locale');
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
  }

  // Check if pathname already includes a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Redirect to default locale if no locale is present
  if (!pathnameHasLocale) {
    console.log('No locale in path, redirecting to default locale');
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url))
  }

  // Extract current locale and path without locale
  const locale = pathname.split('/')[1]
  const pathWithoutLocale = pathname.split('/').slice(2).join('/')
  console.log('Locale:', locale, 'Path without locale:', pathWithoutLocale);

  // Allow access to public routes without authentication
  const publicRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'access-denied']
  if (publicRoutes.includes(pathWithoutLocale)) {
    console.log('Public route detected, allowing access without auth');
    return NextResponse.next()
  }

  // Get token from cookies
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  // If no token is present, redirect to login
  if (!token) {
    console.log('No token found, redirecting to login');
    return NextResponse.redirect(new URL(`/${locale}/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url))
  }

  try {
    // Verify token
    console.log('Verifying token in middleware...');
    const decodedResult = await verifyToken(token);
    
    if (!decodedResult) {
      console.log('Token verification failed, redirecting to login');
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
    
    // Extract role from payload
    // Según el analizador de token, role puede ser un string o un objeto con name
    let userRole = 'USER'; // Default role
    if (decodedResult.role) {
      if (typeof decodedResult.role === 'string') {
        userRole = decodedResult.role;
      } else if (typeof decodedResult.role === 'object' && 'name' in decodedResult.role) {
        userRole = decodedResult.role.name as string;
      }
    }
    
    // Convert payload to expected type
    const decoded = {
      userId: decodedResult.userId as string,
      role: userRole
    }
    
    console.log('Token verified successfully for user:', decoded.userId, 'with role:', decoded.role);

    // Verificar permisos para rutas protegidas
    const isProtectedRoute = Object.keys(routePermissions).some(route => 
      pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
    );

    if (isProtectedRoute) {
      console.log('Protected route detected, checking permissions');
      
      // Encontrar la configuración de permisos más específica para la ruta
      let matchedRoute = '';
      let matchedConfig = null;
      
      for (const route in routePermissions) {
        if (pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)) {
          // Si esta ruta es más específica (más larga) que la anterior coincidencia, úsala
          if (route.length > matchedRoute.length) {
            matchedRoute = route;
            matchedConfig = routePermissions[route];
          }
        }
      }
      
      if (matchedConfig && !matchedConfig.roles.includes(decoded.role as RoleName)) {
        console.log(`Access denied to ${pathWithoutLocale} for role ${decoded.role}`);
        return NextResponse.redirect(new URL(`/${locale}/access-denied?from=${encodeURIComponent(pathname)}`, request.url));
      }
    }

    // Add user info to request headers for API routes
    if (pathWithoutLocale.startsWith('api/')) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decoded.userId)
      requestHeaders.set('x-user-role', decoded.role)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    return NextResponse.next()
  } catch (error) {
    // If token is invalid, log and redirect to login
    console.error('Middleware token verification error:', error);
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
} 