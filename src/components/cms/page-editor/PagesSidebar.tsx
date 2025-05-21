import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SearchIcon, PlusIcon, FileTextIcon, FileIcon, HomeIcon, ExternalLinkIcon, CheckIcon, LoaderIcon, AlertCircleIcon, Settings, LayoutIcon, EyeIcon } from 'lucide-react';
import { cmsOperations } from '@/lib/graphql-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from "@/components/ui/label";
import { useTabContext } from '@/app/[locale]/cms/pages/layout';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  isPublished: boolean;
  updatedAt?: string;
}

// Simplified props - no currentPageId required
interface PagesSidebarProps {
  onPageSelect?: (slug: string) => void;
}

// Mejorar los tipos para el bus de eventos definiendo interfaces específicas
interface PagePublishChangeEvent {
  id: string;
  isPublished: boolean;
}

interface PageCreatedEvent {
  id: string;
}

interface PageUpdatedEvent {
  id: string;
  shouldRefresh?: boolean;
  isPublished?: boolean;
}

type PageEventData = PagePublishChangeEvent | PageCreatedEvent | PageUpdatedEvent;

// Crear un pequeño bus de eventos para comunicar actualizaciones entre componentes
export const PageEvents = {
  listeners: new Map<string, Array<(data: PageEventData) => void>>(),
  
  subscribe: (event: string, callback: (data: PageEventData) => void) => {
    if (!PageEvents.listeners.has(event)) {
      PageEvents.listeners.set(event, []);
    }
    PageEvents.listeners.get(event)?.push(callback);
    
    // Devolver función para eliminar la suscripción
    return () => {
      const callbacks = PageEvents.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  },
  
  emit: (event: string, data: PageEventData) => {
    (PageEvents.listeners.get(event) || []).forEach(callback => {
      callback(data);
    });
  },

  on: (event: string, callback: (data: PageEventData) => void) => {
    PageEvents.subscribe(event, callback);
  },

  off: (event: string, callback: (data: PageEventData) => void) => {
    const unsubscribe = PageEvents.subscribe(event, callback);
    return () => {
      unsubscribe();
    };
  }
};

export function PagesSidebar({ onPageSelect }: PagesSidebarProps) {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [filteredPages, setFilteredPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  const [quickCreateError, setQuickCreateError] = useState<string | null>(null);
  
  // Obtener el contexto directamente en cada renderizado
  const { activeTab, setActiveTab } = useTabContext();
  
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';
  // Get current slug from URL params
  const currentSlug = params.slug as string;

  // Handle dialog open state changes
  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    setShowQuickCreate(open);
    
    // Reset form state when dialog closes
    if (!open) {
      setQuickTitle('');
      setQuickCreateError(null);
    }
  }, []);

  // Keyboard shortcut for quick create
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+N or Command+N (macOS)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault(); // Prevent browser's default action
        handleDialogOpenChange(true);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDialogOpenChange]);

  // Función para actualizar la lista de páginas desde el servidor
  const fetchPages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const pagesData = await cmsOperations.getAllPages();
      
      if (!pagesData || pagesData.length === 0) {
        setError('No se encontraron páginas');
        setPages([]);
        setFilteredPages([]);
        setIsLoading(false);
        return;
      }
      
      // Transform the data to match our PageItem interface
      const formattedPages: PageItem[] = pagesData.map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        pageType: page.pageType,
        isPublished: page.isPublished,
        updatedAt: page.updatedAt ? new Date(page.updatedAt).toISOString().split('T')[0] : undefined
      }));
      
      setPages(formattedPages);
      setFilteredPages(searchQuery 
        ? formattedPages.filter(page => 
            page.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            page.slug.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : formattedPages
      );
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError('Error al cargar las páginas. Por favor, intenta recargar.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Suscribirse al evento de publicación/despublicación para actualizar la UI optimistamente
  useEffect(() => {
    const unsubscribe = PageEvents.subscribe('page:publish-state-change', (data: PageEventData) => {
      if ('isPublished' in data) {

        // Actualización optimista de la UI
        setPages(prevPages => 
          prevPages.map(page => 
            page.id === data.id 
              ? { ...page, isPublished: data.isPublished }
              : page
          )
        );
        
        // Actualizar también las páginas filtradas
        setFilteredPages(prevPages => 
          prevPages.map(page => 
            page.id === data.id 
              ? { ...page, isPublished: data.isPublished }
              : page
          )
        );
        
        // No hacemos fetch para evitar llamadas innecesarias al servidor
        // Confiar en la actualización optimista es suficiente aquí
      }
    });
    
    // Limpiar la suscripción al desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  // Suscribirse al evento de creación de página
  useEffect(() => {
    const unsubscribe = PageEvents.subscribe('page:created', () => {
      // Refrescar la lista de páginas cuando se crea una nueva
      fetchPages();
    });
    
    return () => {
      unsubscribe();
    };
  }, [fetchPages]);

  // Suscribirse al evento de actualización de página
  useEffect(() => {
    const unsubscribe = PageEvents.subscribe('page:updated', (data: PageEventData) => {
      if ('shouldRefresh' in data && data.shouldRefresh) {
        console.log('Refreshing pages in sidebar because shouldRefresh flag is true');
        // Solo hacemos fetch cuando es realmente necesario (cambios importantes)
        fetchPages();
      } else if ('isPublished' in data) {
        // Update for publish status changes
        console.log('Updating publish status in pages sidebar');
        setPages(prevPages => 
          prevPages.map(page => 
            page.id === data.id 
              ? { ...page, isPublished: data.isPublished }
              : page
          )
        );
        
        setFilteredPages(prevPages => 
          prevPages.map(page => 
            page.id === data.id 
              ? { ...page, isPublished: data.isPublished }
              : page
          )
        );
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [fetchPages]);

  // Add page deletion event handler
  useEffect(() => {
    const handlePageDeleted = ({ id }: { id: string }) => {
      setPages(prevPages => prevPages.filter(page => page.id !== id));
    };

    PageEvents.on('page:deleted', handlePageDeleted);

    return () => {
      PageEvents.off('page:deleted', handlePageDeleted);
    };
  }, []);

  // Fetch pages when component mounts with timeout
  useEffect(() => {
    fetchPages();
  }, []); // Empty array means this effect runs once on mount

  // Filter pages when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPages(pages);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pages.filter(page => 
      page.title.toLowerCase().includes(query) || 
      page.slug.toLowerCase().includes(query)
    );
    setFilteredPages(filtered);
  }, [searchQuery, pages]);

  // Handle page selection - always navigate to edit page
  const handlePageClick = (slug: string) => {
    if (onPageSelect) {
      onPageSelect(slug);
    } else {
      router.push(`/${locale}/cms/pages/edit/${slug}`);
    }
  };

  // Handle creating a new page
  const handleCreatePage = () => {
    setIsCreating(true);
    // Navigate to create page route
    router.push(`/${locale}/cms/pages/create`);
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Quick create a page
  const handleQuickCreate = async () => {
    if (!quickTitle.trim()) {
      setQuickCreateError("Title is required");
      return;
    }

    setQuickCreateLoading(true);
    setQuickCreateError(null);

    try {
      const slug = generateSlug(quickTitle);
      
      const result = await cmsOperations.createPage({
        title: quickTitle,
        slug: slug,
        description: '',
        template: 'default',
        isPublished: false,
        metaTitle: quickTitle,
        metaDescription: '',
        pageType: 'LANDING',
        locale: locale
      });
      
      if (result && result.success && result.page && result.page.id) {
        // Emitir evento para actualizar la lista de páginas
        PageEvents.emit('page:created', { id: result.page.id });
        console.log('Emitting page:created event:', { id: result.page.id });
        
        // Reset form
        setQuickTitle('');
        setShowQuickCreate(false);
        
        // Navigate to the edit page
        router.push(`/${locale}/cms/pages/edit/${slug}`);
      } else {
        throw new Error(result?.message || 'Error creating page');
      }
    } catch (error) {
      console.error('Error creating page:', error);
      setQuickCreateError(error instanceof Error ? error.message : 'Error creating page');
    } finally {
      setQuickCreateLoading(false);
    }
  };

  // Handle quick create with Enter key
  const handleQuickCreateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickTitle.trim()) {
      e.preventDefault();
      handleQuickCreate();
    }
  };

  // Get icon based on page type
  const getPageIcon = (pageType: string) => {
    switch (pageType) {
      case 'HOME':
        return <HomeIcon className="h-4 w-4 text-blue-500" />;
      case 'LANDING':
        return <ExternalLinkIcon className="h-4 w-4 text-purple-500" />;
      case 'BLOG':
        return <FileTextIcon className="h-4 w-4 text-green-500" />;
      default:
        return <FileIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Reload data 
  const handleReload = () => {
    setIsLoading(true);
    setError(null);
    
    // Simulate effect trigger by remounting
    setTimeout(() => {
      // Triggers the useEffect for fetching pages
      const fetchPages = async () => {
        try {
          const pagesData = await cmsOperations.getAllPages();
          
          if (!pagesData || pagesData.length === 0) {
            setError('No se encontraron páginas');
            setPages([]);
            setFilteredPages([]);
            return;
          }
          
          const formattedPages: PageItem[] = pagesData.map(page => ({
            id: page.id,
            title: page.title,
            slug: page.slug,
            pageType: page.pageType,
            isPublished: page.isPublished,
            updatedAt: page.updatedAt ? new Date(page.updatedAt).toISOString().split('T')[0] : undefined
          }));
          
          setPages(formattedPages);
          setFilteredPages(formattedPages);
        } catch (error) {
          console.error('Error fetching pages:', error);
          setError('Error al cargar las páginas. Por favor, intenta recargar.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPages();
    }, 500);
  };

  // Function to navigate to the published page
  const handlePreviewPage = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    // Navigate to the actual page (not the CMS edit page)
    window.open(`/${locale}/${slug}`, '_blank');
  };

  return (
    <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden h-full">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        {/* Titulo y contador de páginas */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Pages</h3>
          <span className="text-xs text-gray-500">{filteredPages.length} {filteredPages.length === 1 ? 'page' : 'pages'}</span>
        </div>
        
        {/* Buscador */}
        <div className="relative mb-3">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 py-1 h-9 text-sm"
          />
        </div>
        
        {/* Tabs de navegación */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-1 w-full">
            <Button 
              variant={activeTab === 'details' ? "secondary" : "ghost"}
              size="sm" 
              className="h-7 px-2 flex-1 flex items-center justify-center gap-1" 
              title="Detalles"
              onClick={() => {
                console.log('Sidebar: Clicking details tab, current:', activeTab);
                setActiveTab('details');
              }}
            >
              <span className="text-xs">Detalles</span>
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant={activeTab === 'sections' ? "secondary" : "ghost"}
              size="sm" 
              className="h-7 px-2 flex-1 flex items-center justify-center gap-1" 
              title="Secciones"
              onClick={() => {
                console.log('Sidebar: Clicking sections tab, current:', activeTab);
                setActiveTab('sections');
              }}
            >
              <span className="text-xs">Secciones</span>
              <LayoutIcon className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant={activeTab === 'seo' ? "secondary" : "ghost"}
              size="sm" 
              className="h-7 px-2 flex-1 flex items-center justify-center gap-1" 
              title="SEO"
              onClick={() => {
                console.log('Sidebar: Clicking SEO tab, current:', activeTab);
                setActiveTab('seo');
              }}
            >
              <span className="text-xs">SEO</span>
              <SearchIcon className="h-3.5 w-3.5" />
            </Button>
            
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2 px-2">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <div className="text-red-500 text-sm mb-3 flex flex-col items-center">
                <AlertCircleIcon className="h-8 w-8 mb-2" />
                <span>{error}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReload}
                className="mt-2"
              >
                Intentar de nuevo
              </Button>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-4 text-gray-500 text-center text-sm">
              {searchQuery ? 'No pages found' : 'No pages available'}
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredPages.map(page => (
                <li 
                  key={page.id}
                  className={`rounded-md transition-colors cursor-pointer hover:bg-gray-100 ${page.slug === currentSlug ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  onClick={() => handlePageClick(page.slug)}
                >
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center min-w-0">
                      {getPageIcon(page.pageType)}
                      <span className={`ml-2 text-sm font-medium truncate ${page.slug === currentSlug ? 'text-blue-800' : 'text-gray-700'}`}>{page.title}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        title="Preview page"
                        onClick={(e) => handlePreviewPage(e, page.slug)}
                      >
                        <EyeIcon className="h-3.5 w-3.5 text-gray-500 hover:text-blue-500" />
                      </Button>
                      {page.isPublished && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-200">
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Live
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button 
          onClick={() => handleDialogOpenChange(true)}
          className="w-full flex items-center justify-center gap-2"
          size="sm"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          Quick Create <span className="ml-1 text-xs opacity-70">Ctrl+N</span>
        </Button>
        
        <Button 
          onClick={handleCreatePage}
          className="w-full flex items-center justify-center gap-2"
          size="sm"
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <LoaderIcon className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Advanced Create
            </>
          )}
        </Button>
      </div>
      
      {/* Quick Create Form */}
      {showQuickCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-lg sm:max-w-[425px] w-full mx-4">
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Create New Page</h2>
                <p className="text-muted-foreground text-sm">
                  Enter a title for your new page. Other details can be edited later.
                </p>
              </div>
              
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="page-title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="page-title"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={handleQuickCreateKeyDown}
                    className="col-span-3"
                    placeholder="My New Page"
                    autoFocus
                  />
                </div>
                {quickCreateError && (
                  <div className="col-span-4 text-sm text-red-500 mt-1">
                    {quickCreateError}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={quickCreateLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleQuickCreate}
                  disabled={quickCreateLoading || !quickTitle.trim()}
                >
                  {quickCreateLoading ? (
                    <>
                      <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create & Edit'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 