'use client';

import { useState, useEffect } from 'react';
import { Blog } from '@/types/blog';
import { useRouter } from 'next/navigation';
import { gqlRequest } from '@/lib/graphql-client';

import { BlogPageHeader } from './BlogPageHeader';
import { BlogToolbar } from './BlogToolbar';
import { BlogsGridView } from './BlogsGridView';
import { BlogsListView } from './BlogsListView';
import { BlogEmptyState } from './BlogEmptyState';
import { BlogLoading } from './BlogLoading';

export interface BlogPageContentProps {
  locale?: string;
  tenantSlug?: string;
}

export function BlogPageContent({ locale = 'en', tenantSlug = 'admin' }: BlogPageContentProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<'title' | 'createdAt' | 'updatedAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load blogs on component mount
  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    setLoading(true);
    try {
      const query = `
        query GetBlogs {
          blogs {
            id
            title
            description
            slug
            isActive
            createdAt
            updatedAt
            posts {
              id
            }
          }
        }
      `;
      
      const response = await gqlRequest<{ blogs: Blog[] }>(query);
      setBlogs(response.blogs || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  }

  // Navigate to create blog page
  const handleCreateBlog = () => {
    router.push(`/${locale}/${tenantSlug}/cms/blog/new`);
  };

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };
  
  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle editing a blog
  const handleEditBlog = (id: string) => {
    router.push(`/${locale}/${tenantSlug}/cms/blog/edit/${id}`);
  };

  // Handle viewing blog posts
  const handleViewPosts = (id: string) => {
    router.push(`/${locale}/${tenantSlug}/cms/blog/posts/${id}`);
  };

  // Handle blog deletion
  const handleDeleteBlog = async (id: string) => {
    const blog = blogs.find(b => b.id === id);
    if (!blog) return;

    if (!window.confirm(`Are you sure you want to delete the blog "${blog.title}"?`)) {
      return;
    }

    try {
      const mutation = `
        mutation DeleteBlog($id: ID!) {
          deleteBlog(id: $id) {
            success
            message
          }
        }
      `;
      
      const result = await gqlRequest<{ 
        deleteBlog: { success: boolean; message: string } 
      }>(mutation, { id });
      
      if (result.deleteBlog.success) {
        setBlogs(blogs.filter(blog => blog.id !== id));
      } else {
        alert(`Failed to delete blog: ${result.deleteBlog.message}`);
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('An error occurred while deleting the blog. Please try again.');
    }
  };

  // Handle sort change
  const handleSort = (field: 'title' | 'createdAt' | 'updatedAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter blogs based on search query
  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (blog.description && blog.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort filtered blogs
  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    if (sortField === 'title') {
      return sortDirection === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortField === 'updatedAt') {
      const dateA = new Date(a.updatedAt || '').getTime();
      const dateB = new Date(b.updatedAt || '').getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      // Sort by createdAt
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <BlogPageHeader 
        title="Blogs" 
        onCreateClick={handleCreateBlog} 
        createButtonLabel="Create Blog" 
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <BlogToolbar 
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={handleSearchChange}
          onViewModeChange={handleViewModeChange}
        />

        {/* Content */}
        {loading ? (
          <BlogLoading />
        ) : sortedBlogs.length > 0 ? (
          viewMode === 'grid' ? (
            <BlogsGridView 
              blogs={sortedBlogs} 
              onEdit={handleEditBlog}
              onDelete={handleDeleteBlog}
              onViewPosts={handleViewPosts}
            />
          ) : (
            <BlogsListView 
              blogs={sortedBlogs} 
              onEdit={handleEditBlog}
              onDelete={handleDeleteBlog}
              onViewPosts={handleViewPosts}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
            />
          )
        ) : (
          <BlogEmptyState 
            searchQuery={searchQuery} 
            onClearSearch={handleClearSearch}
            onCreateBlog={handleCreateBlog}
          />
        )}
      </div>
    </div>
  );
} 