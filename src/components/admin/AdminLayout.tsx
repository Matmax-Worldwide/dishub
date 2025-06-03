"use client";

import { ReactNode, useState, useEffect } from 'react';
import { FeatureProvider, FeatureType } from '@/hooks/useFeatureAccess';
import { CustomSidebar } from './CustomSidebar';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, Bell, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: ReactNode;
  tenantFeatures?: FeatureType[];
  tenantId?: string | null;
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
}

export function AdminLayout({ 
  children, 
  tenantFeatures = ['CMS_ENGINE' as FeatureType], // Default features
  tenantId = null,
  user = null 
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    // Clear auth tokens
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Redirect to login
    router.push('/login');
  };

  return (
    <FeatureProvider features={tenantFeatures} tenantId={tenantId}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'relative w-64'}
          transition-transform duration-300 ease-in-out
        `}>
          <CustomSidebar className="h-full" />
        </div>

        {/* Mobile overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top navigation */}
          <header className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Bell className="w-5 h-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                  >
                    3
                  </Badge>
                </Button>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 p-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name || 'User'} 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      {!isMobile && (
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {user?.name || 'Usuario'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user?.email || 'usuario@ejemplo.com'}
                          </p>
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                      Configuración
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/admin/billing')}>
                      Facturación
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/admin/help')}>
                      Ayuda
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </FeatureProvider>
  );
}

// HOC para páginas que requieren features específicas
interface WithFeatureAccessProps {
  requiredFeatures?: string[];
  requireAll?: boolean;
  fallbackPath?: string;
}

export function withFeatureAccess<P extends object>(
  Component: React.ComponentType<P>,
  options: WithFeatureAccessProps = {}
) {
  const {
    requiredFeatures = [],
    requireAll = true,
    fallbackPath = '/admin/billing/upgrade'
  } = options;

  return function FeatureProtectedComponent(props: P) {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
      // Simular verificación de features del tenant
      // En una implementación real, esto vendría del contexto o API
      const checkFeatureAccess = async () => {
        try {
          // Aquí harías la verificación real de features
          const tenantFeatures = ['CMS_ENGINE']; // Ejemplo
          
          if (requiredFeatures.length === 0) {
            setHasAccess(true);
          } else {
            const hasRequiredFeatures = requireAll
              ? requiredFeatures.every(feature => tenantFeatures.includes(feature))
              : requiredFeatures.some(feature => tenantFeatures.includes(feature));
            
            setHasAccess(hasRequiredFeatures);
            
            if (!hasRequiredFeatures) {
              router.push(fallbackPath);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking feature access:', error);
          setHasAccess(false);
          router.push(fallbackPath);
        } finally {
          setIsChecking(false);
        }
      };

      checkFeatureAccess();
    }, [router, fallbackPath, requireAll]);

    if (isChecking) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!hasAccess) {
      return null; // El router.push ya redirigió
    }

    return <Component {...props} />;
  };
}

// Ejemplo de uso del HOC
export const BlogPageWithFeatureAccess = withFeatureAccess(
  ({ children }: { children: ReactNode }) => <div>{children}</div>,
  {
    requiredFeatures: ['BLOG_MODULE'],
    requireAll: true,
    fallbackPath: '/admin/billing/upgrade?feature=BLOG_MODULE'
  }
);

export const EcommercePageWithFeatureAccess = withFeatureAccess(
  ({ children }: { children: ReactNode }) => <div>{children}</div>,
  {
    requiredFeatures: ['ECOMMERCE_ENGINE'],
    requireAll: true,
    fallbackPath: '/admin/billing/upgrade?feature=ECOMMERCE_ENGINE'
  }
);

export const BookingPageWithFeatureAccess = withFeatureAccess(
  ({ children }: { children: ReactNode }) => <div>{children}</div>,
  {
    requiredFeatures: ['BOOKING_ENGINE'],
    requireAll: true,
    fallbackPath: '/admin/billing/upgrade?feature=BOOKING_ENGINE'
  }
); 