'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  CheckIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertCircleIcon
} from 'lucide-react';
import { cmsOperations } from '@/lib/graphql-client';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  isPublished: boolean;
  updatedAt: string;
  sections: number;
}

export default function PagesManagement() {
  const { locale } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch real page data from API
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
          updatedAt: new Date(page.updatedAt).toISOString().split('T')[0], // Format date as YYYY-MM-DD
          sections: page.sections?.length || 0
        }));
        
        setPages(formattedPages);
      } catch (error) {
        console.error('Error fetching pages:', error);
        setError('Failed to load pages. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, []);

  const filteredPages = pages
    .filter(page => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!page.title.toLowerCase().includes(query) && 
            !page.slug.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Apply type filter
      if (filterType !== 'all' && page.pageType !== filterType) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortOrder === 'newest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortOrder === 'title-asc') {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const paginatedPages = filteredPages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreatePage = () => {
    router.push(`/${locale}/cms/pages/create`);
  };

  const handleEditPage = (id: string, slug: string) => {
    // En lugar de navegar a una página de edición separada,
    // abrimos la página en el frontend con un parámetro que activa el modo de edición
    window.open(`/${locale}/${slug}?edit=true`, '_blank');
  };

  const handleViewPage = (slug: string) => {
    // Open the page in a new tab
    window.open(`/${locale}/${slug}`, '_blank');
  };

  const handleDeletePage = (id: string) => {
    // In a real app, you would call an API to delete the page
    if (confirm('Are you sure you want to delete this page?')) {
      setPages(pages.filter(page => page.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
        <button
          onClick={handleCreatePage}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Page
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b">
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 border rounded-md bg-white"
              >
                <option value="all">All Types</option>
                <option value="HOME">Home</option>
                <option value="CONTENT">Content</option>
                <option value="BLOG">Blog</option>
                <option value="LANDING">Landing</option>
                <option value="CONTACT">Contact</option>
                <option value="SERVICES">Services</option>
                <option value="ABOUT">About</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <FilterIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 border rounded-md bg-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
              <ArrowUpDownIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-4 border-b last:border-0">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : paginatedPages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPages.map((page) => (
                  <tr key={page.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="font-medium">{page.title}</span>
                      </div>
                      <div className="text-sm text-gray-500">{`/${page.slug}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{page.pageType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {page.isPublished ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XIcon className="h-3 w-3 mr-1" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.updatedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.sections}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewPage(page.slug)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View page"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditPage(page.id, page.slug)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit page"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete page"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No pages found matching your criteria
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredPages.length)} of {filteredPages.length} pages
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded ${currentPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded ${
                  currentPage === totalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 