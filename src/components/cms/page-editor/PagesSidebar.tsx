import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SearchIcon, PlusIcon, FileTextIcon, FileIcon, HomeIcon, ExternalLinkIcon, CheckIcon, LoaderIcon } from 'lucide-react';
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

interface PagesSidebarProps {
  currentPageId?: string;
  onPageSelect?: (slug: string) => void;
}

export function PagesSidebar({ currentPageId, onPageSelect }: PagesSidebarProps) {
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
  
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';

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

  // Fetch pages when component mounts
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const pagesData = await cmsOperations.getAllPages();
        
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
        setFilteredPages(formattedPages);
      } catch (error) {
        console.error('Error fetching pages:', error);
        setError('Failed to load pages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, []);

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

  // Handle page selection
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

  return (
    <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden h-full">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Pages</h3>
          <span className="text-xs text-gray-500">{filteredPages.length} {filteredPages.length === 1 ? 'page' : 'pages'}</span>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 py-1 h-9 text-sm"
          />
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
            <div className="p-4 text-red-500 text-center text-sm">{error}</div>
          ) : filteredPages.length === 0 ? (
            <div className="p-4 text-gray-500 text-center text-sm">
              {searchQuery ? 'No pages found' : 'No pages available'}
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredPages.map(page => (
                <li 
                  key={page.id}
                  className={`
                    rounded-md transition-colors cursor-pointer
                    ${page.id === currentPageId 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'hover:bg-gray-100 text-gray-700'}
                  `}
                  onClick={() => handlePageClick(page.slug)}
                >
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center min-w-0">
                      {getPageIcon(page.pageType)}
                      <span className="ml-2 text-sm font-medium truncate">{page.title}</span>
                    </div>
                    {page.isPublished && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-200">
                        <CheckIcon className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    )}
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