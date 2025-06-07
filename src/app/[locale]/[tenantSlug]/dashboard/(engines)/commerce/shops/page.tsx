'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Store } from 'lucide-react';
import ShopCard from '@/app/components/engines/commerce/ShopCard';
import StatCard from '@/app/components/engines/commerce/StatCard';
import { ecommerce } from '@/lib/graphql-client';

interface Shop {
  id: string;
  name: string;
  defaultCurrency: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
  acceptedCurrencies: Array<{
    id: string;
    code: string;
    name: string;
    symbol: string;
  }>;
  adminUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  products: Array<{
    id: string;
    name: string;
    sku?: string;
    stockQuantity?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ShopsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const filter = searchTerm ? { search: searchTerm } : undefined;
        const shopsData = await ecommerce.getShops(filter);
        setShops(shopsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching shops:', err);
        setError('Failed to load shops');
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [searchTerm]);

  const filteredShops = shops.filter(() => {
    if (filterStatus === 'all') return true;
    // For now, we'll consider all shops as active since we don't have status field
    return filterStatus === 'active';
  });

  const totalProducts = shops.reduce((sum, shop) => sum + shop.products.length, 0);
  const totalCurrencies = new Set(shops.flatMap(shop => 
    [shop.defaultCurrency.code, ...shop.acceptedCurrencies.map(c => c.code)]
  )).size;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
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
        <h1 className="text-2xl font-bold text-gray-900">Shops Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Shop
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Shops"
          value={shops.length.toString()}
          icon={Store}
          color="text-blue-600"
          bgColor="bg-blue-100"
          change="+12%"
          trend="up"
          description="this month"
        />
        <StatCard
          title="Total Products"
          value={totalProducts.toString()}
          icon={Store}
          color="text-green-600"
          bgColor="bg-green-100"
          change="+8%"
          trend="up"
          description="across all shops"
        />
        <StatCard
          title="Currencies"
          value={totalCurrencies.toString()}
          icon={Store}
          color="text-purple-600"
          bgColor="bg-purple-100"
          change="+2"
          trend="up"
          description="supported currencies"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'maintenance')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Shops Grid */}
      {filteredShops.length === 0 ? (
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first shop'}
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Create Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shopData) => (
            <ShopCard
              key={shopData.id}
              shop={{
                id: shopData.id,
                name: shopData.name,
                defaultCurrency: {
                  code: shopData.defaultCurrency.code,
                  symbol: shopData.defaultCurrency.symbol
                },
                acceptedCurrencies: shopData.acceptedCurrencies.map(c => ({
                  code: c.code,
                  symbol: c.symbol
                })),
                adminUser: shopData.adminUser ? {
                  firstName: shopData.adminUser.firstName || '',
                  lastName: shopData.adminUser.lastName || '',
                  email: shopData.adminUser.email
                } : undefined,
                stats: {
                  totalProducts: shopData.products.length,
                  totalOrders: 0,
                  revenue: '$0.00',
                  customers: 0
                },
                status: 'active' as const,
                createdAt: shopData.createdAt
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
} 