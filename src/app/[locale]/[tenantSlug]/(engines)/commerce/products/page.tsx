'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, Grid, List } from 'lucide-react';
import ProductCard from '@/components/engines/commerce/ProductCard';
import StatCard from '@/components/engines/commerce/StatCard';
import { ecommerce } from '@/lib/graphql-client';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  stockQuantity?: number;
  shop: {
    id: string;
    name: string;
  };
  prices: Array<{
    id: string;
    amount: number;
    currency: {
      id: string;
      code: string;
      symbol: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const filter: {
          search?: string;
          inStock?: boolean;
        } = {};
        
        if (searchTerm) {
          filter.search = searchTerm;
        }
        
        if (filterStock !== 'all') {
          if (filterStock === 'in-stock') {
            filter.inStock = true;
          } else if (filterStock === 'out-of-stock') {
            filter.inStock = false;
          }
          // Note: low-stock would need a specific threshold, not implemented yet
        }

        const productsData = await ecommerce.getProducts(filter);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchTerm, filterStock]);

  const filteredProducts = products.filter(() => {
    if (filterCategory === 'all') return true;
    // We don't have categories yet, so return all for now
    return true;
  });

  const inStockProducts = products.filter(p => (p.stockQuantity || 0) > 0);
  const outOfStockProducts = products.filter(p => (p.stockQuantity || 0) === 0);
  const lowStockProducts = products.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= 10);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={products.length.toString()}
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-100"
          change="+12"
          trend="up"
          description="this month"
        />
        <StatCard
          title="In Stock"
          value={inStockProducts.length.toString()}
          icon={Package}
          color="text-green-600"
          bgColor="bg-green-100"
          change="+5"
          trend="up"
          description="available"
        />
        <StatCard
          title="Low Stock"
          value={lowStockProducts.length.toString()}
          icon={Package}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
          change="-2"
          trend="down"
          description="need restock"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockProducts.length.toString()}
          icon={Package}
          color="text-red-600"
          bgColor="bg-red-100"
          change="+1"
          trend="up"
          description="unavailable"
        />
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="home">Home & Garden</option>
            </select>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add Product
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {filteredProducts.map((product) => {
            const primaryPrice = product.prices && product.prices.length > 0 ? product.prices[0] : null;
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={primaryPrice ? primaryPrice.amount.toString() : '0'}
                currency={primaryPrice?.currency.symbol || '$'}
                stock={product.stockQuantity || 0}
                rating={4.5}
                sku={product.sku || 'N/A'}
                compact={viewMode === 'list'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
} 