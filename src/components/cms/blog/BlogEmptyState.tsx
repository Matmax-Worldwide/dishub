import { PlusCircle, Search } from 'lucide-react';

interface BlogEmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
  onCreateBlog: () => void;
}

export function BlogEmptyState({ searchQuery, onClearSearch, onCreateBlog }: BlogEmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No blogs found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No blogs match your search for &quot;{searchQuery}&quot;.
        </p>
        <div className="mt-6">
          <button
            onClick={onClearSearch}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No blogs</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first blog.
      </p>
      <div className="mt-6">
        <button
          onClick={onCreateBlog}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Blog
        </button>
      </div>
    </div>
  );
} 