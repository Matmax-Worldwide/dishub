import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/app/lib/auth';
import { locales } from './src/app/i18n';

interface DecodedToken {
  userId: string;
  role: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log detallado para depuración
  console.log('⭐️ Middleware processing path:', pathname);
  
  // PASO 1: Verificar si es un archivo estático - DETENER PROCESAMIENTO SI LO ES
  // Esta verificación es crucial para evitar que los assets estáticos sean procesados
  if (isStaticAsset(pathname)) {
    console.log('🔵 Skipping static asset:', pathname);
    return NextResponse.next();
  }
  
  // Obtener token para rutas autenticadas
  const token = request.cookies.get('session-token')?.value;
  
  // PASO 2: Verificar si la ruta ya tiene un locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // PASO 3: Si no tiene locale, redirigir al locale por defecto
  if (!pathnameHasLocale) {
    console.log('⚠️ No locale found, redirecting to default locale');
    const url = new URL(`/en${pathname === '/' ? '' : pathname}`, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // A partir de aquí procesamos rutas con locale
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  console.log('📍 Current path without locale:', pathWithoutLocale);

  // PASO 4: Permitir acceso a rutas públicas
  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(pathWithoutLocale)) {
    console.log('🔓 Public route, allowing access');
    return NextResponse.next();
  }

  // PASO 5: Verificar autenticación para rutas protegidas
  if (!token) {
    console.log('🔒 No token found, redirecting to login');
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  const decoded = await verifyToken(token) as DecodedToken | null;
  if (!decoded) {
    console.log('🚫 Invalid token, redirecting to login');
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // PASO 6: Para rutas API, añadir información de usuario a los headers
  if (pathWithoutLocale.startsWith('/api')) {
    console.log('🔑 Valid token for API route');
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  console.log('✅ Valid token, allowing access to:', pathWithoutLocale);
  return NextResponse.next();
}

// Función auxiliar para verificar si una ruta es un archivo estático
function isStaticAsset(pathname: string): boolean {
  // Verificar patrones directos
  if (pathname === '/logo.png' || 
      pathname === '/favicon.ico' ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/')) {
    return true;
  }
  
  // Verificar extensiones de archivos estáticos
  const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Configuración de matcher - CRÍTICO para el correcto funcionamiento
export const config = {
  matcher: [
    /*
     * Match solo rutas que requieren procesamiento. 
     * Excluye explícitamente:
     * 1. Archivos estáticos directos (logo.png, favicon.ico)
     * 2. Rutas de Next.js (_next)
     * 3. Rutas de API
     * 4. Cualquier archivo con extensión conocida (.png, .jpg, etc.)
     */
    '/((?!logo\\.png|favicon\\.ico|_next/|api/).*)',
    '/((?!.*\\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|map)).*)',
  ],
}; 