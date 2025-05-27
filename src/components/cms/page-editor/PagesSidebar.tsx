import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/cms/UnsavedChangesAlert';
import dynamic from 'next/dynamic';
import { 
  PlusIcon, 
  SearchIcon, 
  FileTextIcon, 
  EyeIcon,
  ExternalLinkIcon,
  FileIcon,
  HomeIcon,
  CheckIcon,
  LoaderIcon,
  AlertCircleIcon,
  Grid3X3Icon
} from 'lucide-react';
import { cmsOperations } from '@/lib/graphql-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from "@/components/ui/label";

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
  onComponentSelect?: (componentType: ComponentType) => void;
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

// Add ComponentType definition
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' | 'Footer' | 'Form' | 'Article' | 'Blog' | 'CtaButton' | 'Video';

// Dynamic import for ComponentsGrid
const ComponentsGrid = dynamic(() => import('./ComponentsGrid'), {
  loading: () => (
    <div className="space-y-2 p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  )
});

export function PagesSidebar({ onPageSelect, onComponentSelect }: PagesSidebarProps) {
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
  
  // Add component search state
  const [componentSearchQuery, setComponentSearchQuery] = useState('');
  
  // Add state for toggling between pages and components
  const [showComponents, setShowComponents] = useState(false);
  
  // Unsaved changes context
  const {
    hasUnsavedChanges,
    onSave,
    isSaving,
    setIsSaving,
    pendingNavigation,
    setPendingNavigation,
    showUnsavedAlert,
    setShowUnsavedAlert,
  } = useUnsavedChanges();
  
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';
  // Get current slug from URL params
  const currentSlug = params.slug as string;
  
  // Check if we're editing a specific page (has slug) or just on the general edit route
  const isEditingSpecificPage = Boolean(currentSlug && currentSlug.trim() !== '');

  // Handle dialog open state changes
  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    setShowQuickCreate(open);
    
    // Reset form state when dialog closes
    if (!open) {
      setQuickTitle('');
      setQuickCreateError(null);
    }
  }, []);

  // Reset components view when not editing a specific page
  useEffect(() => {
    if (!isEditingSpecificPage && showComponents) {
      setShowComponents(false);
    }
  }, [isEditingSpecificPage, showComponents]);

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
            page.id === data.id && typeof data.isPublished === 'boolean'
              ? { ...page, isPublished: data.isPublished }
              : page
          )
        );
        
        // Actualizar también las páginas filtradas
        setFilteredPages(prevPages => 
          prevPages.map(page => 
            page.id === data.id && typeof data.isPublished === 'boolean'
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
      // Reset creating state
      setIsCreating(false);
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
            page.id === data.id && typeof data.isPublished === 'boolean'
              ? { ...page, isPublished: data.isPublished }
              : page
          )
        );
        
        setFilteredPages(prevPages => 
          prevPages.map(page => 
            page.id === data.id && typeof data.isPublished === 'boolean'
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
    // Reset loading states
    setIsCreating(false);
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
    const targetPath = `/${locale}/cms/pages/edit/${slug}`;
    
    // Check if we have unsaved changes
    if (hasUnsavedChanges && currentSlug !== slug) {
      setPendingNavigation(targetPath);
      setShowUnsavedAlert(true);
      return;
    }
    
    // Navigate normally if no unsaved changes
    if (onPageSelect) {
      onPageSelect(slug);
    } else {
      router.push(targetPath);
    }
  };

  // Handle creating a new page
  const handleCreatePage = () => {
    setIsCreating(true);
    // Navigate to create page route
    router.push(`/${locale}/cms/pages/create`);
  };
  
  // Reset isCreating state when component unmounts or when coming back to the page
  useEffect(() => {
    return () => {
      setIsCreating(false);
    };
  }, []);

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

  // Handle unsaved changes alert actions
  const handleSaveAndContinue = async (): Promise<boolean> => {
    if (!onSave) return false;
    
    setIsSaving(true);
    try {
      const success = await onSave();
      if (success && pendingNavigation) {
        setShowUnsavedAlert(false);
        router.push(pendingNavigation);
        setPendingNavigation(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (pendingNavigation) {
      setShowUnsavedAlert(false);
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedAlert(false);
    setPendingNavigation(null);
  };

  return (
    <>
      <UnsavedChangesAlert
        isVisible={showUnsavedAlert}
        onSave={handleSaveAndContinue}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelNavigation}
        isSaving={isSaving}
      />
    <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden h-full">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        {/* Titulo y contador */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">
            {showComponents ? 'Components' : 'Pages'}
          </h3>
          <span className="text-xs text-gray-500">
            {showComponents 
              ? 'Add to page' 
              : `${filteredPages.length} ${filteredPages.length === 1 ? 'page' : 'pages'}`
            }
          </span>
        </div>
        
        {/* Buscador */}
        <div className="relative mb-3">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={showComponents ? "Search components..." : "Search pages..."}
            value={showComponents ? componentSearchQuery : searchQuery}
            onChange={(e) => showComponents ? setComponentSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
            className="pl-8 py-1 h-9 text-sm"
          />
        </div>
        
        {/* Toggle Button - Only show when editing a specific page */}
        {isEditingSpecificPage && (
          <div className="flex justify-center mb-3">
            <Button 
              variant={showComponents ? "default" : "outline"}
              size="sm" 
              className="w-full flex items-center justify-center gap-2" 
              onClick={() => setShowComponents(!showComponents)}
            >
              <Grid3X3Icon className="h-4 w-4" />
              <span className="text-sm">
                {showComponents ? 'Back to Pages' : 'Browse Components'}
              </span>
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2 px-2">
          {showComponents && isEditingSpecificPage ? (
            <ComponentsGrid 
              searchQuery={componentSearchQuery}
              onSearchChange={setComponentSearchQuery}
              onComponentSelect={onComponentSelect}
            />
          ) : (
            <>
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
            </>
          )}
        </div>
      </ScrollArea>

      {!showComponents && (
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
      )}
      
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
    </>
  );
} 