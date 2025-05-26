import { Blog } from '@/types/blog';
import { Edit, Trash2, BookOpen, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

interface BlogsListViewProps {
  blogs: Blog[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewPosts: (id: string) => void;
  onSort: (field: 'title' | 'createdAt' | 'updatedAt') => void;
  sortField: 'title' | 'createdAt' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
}

export function BlogsListView({ 
  blogs, 
  onEdit, 
  onDelete, 
  onViewPosts, 
  onSort, 
  sortField, 
  sortDirection 
}: BlogsListViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const SortButton = ({ field, children }: { field: 'title' | 'createdAt' | 'updatedAt'; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-left font-medium text-gray-900 hover:text-gray-700"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      )}
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="title">Blog</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Posts
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="updatedAt">Last Updated</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortButton field="createdAt">Created</SortButton>
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {blogs.map((blog) => (
            <tr key={blog.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                  {blog.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {blog.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">/{blog.slug}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {blog.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded-full">
                        Active
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        Inactive
                      </span>
                    </>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                  {blog.posts?.length || 0} post{(blog.posts?.length || 0) !== 1 ? 's' : ''}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(blog.updatedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(blog.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewPosts(blog.id)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="View Posts"
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(blog.id)}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                    title="Edit Blog"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(blog.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Delete Blog"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 