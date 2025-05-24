import { Edit, Trash2, ChevronUp, ChevronDown, BookOpen } from 'lucide-react';
import { Blog } from '@/types/blog';

export interface BlogsListViewProps {
  blogs: Blog[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewPosts: (id: string) => void;
  onSort: (field: 'title' | 'updatedAt' | 'createdAt') => void;
  sortField: 'title' | 'updatedAt' | 'createdAt';
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
  const getSortIcon = (field: 'title' | 'updatedAt' | 'createdAt') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('title')}
            >
              <div className="flex items-center">
                <span>Title</span>
                <span className="ml-1">{getSortIcon('title')}</span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Posts
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center">
                <span>Created</span>
                <span className="ml-1">{getSortIcon('createdAt')}</span>
              </div>
            </th>
            <th 
              scope="col" 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('updatedAt')}
            >
              <div className="flex items-center">
                <span>Updated</span>
                <span className="ml-1">{getSortIcon('updatedAt')}</span>
              </div>
            </th>
            <th scope="col" className="relative px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {blogs.map(blog => {
            const postCount = blog.posts?.length || 0;
              
            return (
              <tr key={blog.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                  {blog.description && (
                    <div className="text-xs text-gray-500 truncate max-w-xs">{blog.description}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {postCount} post{postCount !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                    blog.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {blog.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onViewPosts(blog.id)}
                    className="text-blue-600 hover:text-blue-800 p-1.5 mr-3"
                    title="View Posts"
                  >
                    <BookOpen className="h-4 w-4 inline mr-1" />
                    <span>Posts</span>
                  </button>
                  <button
                    onClick={() => onEdit(blog.id)}
                    className="text-blue-600 hover:text-blue-800 p-1.5 mr-3"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(blog.id)}
                    className="text-red-600 hover:text-red-800 p-1.5"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 