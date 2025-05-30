'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, MoreHorizontal, Tags, Package, TrendingUp, Folder } from 'lucide-react';
import StatCard from '@/components/commerce/StatCard';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  isActive: boolean;
  productCount: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Mock data for now - replace with real GraphQL query when implemented
        const mockCategories: Category[] = [
          {
            id: '1',
            name: 'Electronics',
            description: 'Electronic devices and accessories',
            slug: 'electronics',
            isActive: true,
            productCount: 45,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            name: 'Clothing',
            description: 'Fashion and apparel',
            slug: 'clothing',
            isActive: true,
            productCount: 32,
            createdAt: '2024-01-16T10:00:00Z',
            updatedAt: '2024-01-16T10:00:00Z'
          },
          {
            id: '3',
            name: 'Home & Garden',
            description: 'Home improvement and garden supplies',
            slug: 'home-garden',
            isActive: true,
            productCount: 28,
            createdAt: '2024-01-17T10:00:00Z',
            updatedAt: '2024-01-17T10:00:00Z'
          },
          {
            id: '4',
            name: 'Sports',
            description: 'Sports equipment and accessories',
            slug: 'sports',
            isActive: false,
            productCount: 15,
            createdAt: '2024-01-18T10:00:00Z',
            updatedAt: '2024-01-18T10:00:00Z'
          }
        ];

        setCategories(mockCategories);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on search term and status
  const filteredCategories = categories.filter(category => {
    const matchesSearch = 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && category.isActive) ||
      (filterStatus === 'inactive' && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalCategories = categories.length;
  const activeCategories = categories.filter(category => category.isActive).length;
  const totalProducts = categories.reduce((sum, category) => sum + category.productCount, 0);
  const avgProductsPerCategory = totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0;

  const handleViewCategory = (categoryId: string) => {
    console.log('View category:', categoryId);
    // TODO: Navigate to category detail page
  };

  const handleEditCategory = (categoryId: string) => {
    console.log('Edit category:', categoryId);
    // TODO: Navigate to category edit page
  };

  const handleMoreCategory = (categoryId: string) => {
    console.log('More options for category:', categoryId);
    // TODO: Show dropdown menu with more options
  };

  const handleCreateCategory = () => {
    console.log('Create new category');
    // TODO: Navigate to category creation page
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your products with categories</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleCreateCategory}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Categories"
          value={totalCategories.toString()}
          icon={Tags}
          color="text-blue-600"
          bgColor="bg-blue-50"
          change="+3"
          trend="up"
        />
        <StatCard
          title="Active Categories"
          value={activeCategories.toString()}
          icon={Folder}
          color="text-green-600"
          bgColor="bg-green-50"
          change="+2"
          trend="up"
        />
        <StatCard
          title="Total Products"
          value={totalProducts.toString()}
          icon={Package}
          color="text-purple-600"
          bgColor="bg-purple-50"
          change="+15"
          trend="up"
        />
        <StatCard
          title="Avg Products/Category"
          value={avgProductsPerCategory.toString()}
          icon={TrendingUp}
          color="text-orange-600"
          bgColor="bg-orange-50"
          change="+5%"
          trend="up"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search categories by name, description, or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-full">
                  <Tags className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">/{category.slug}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleViewCategory(category.id)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                  title="View category"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditCategory(category.id)}
                  className="text-gray-600 hover:text-gray-900 p-1 rounded"
                  title="Edit category"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMoreCategory(category.id)}
                  className="text-gray-600 hover:text-gray-900 p-1 rounded"
                  title="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {category.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Products</span>
                <span className="font-medium text-gray-900">{category.productCount}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  category.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Created</span>
                <span>{formatDate(category.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Tags className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first category.'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <div className="mt-6">
              <button
                onClick={handleCreateCategory}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 