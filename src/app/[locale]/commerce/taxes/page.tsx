'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, MoreHorizontal, Receipt, Store, Percent, TrendingUp } from 'lucide-react';
import StatCard from '@/components/commerce/StatCard';
import { ecommerce } from '@/lib/graphql-client';

interface Tax {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
  shop: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TaxesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterShop, setFilterShop] = useState<string>('all');
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch taxes and shops
        const [taxesData, shopsData] = await Promise.all([
          ecommerce.getTaxes(),
          ecommerce.getShops()
        ]);

        setTaxes(taxesData);
        setShops(shopsData.map(shop => ({ id: shop.id, name: shop.name })));
        setError(null);
      } catch (err) {
        console.error('Error fetching taxes data:', err);
        setError('Failed to load taxes data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter taxes
  const filteredTaxes = taxes.filter(tax => {
    const matchesSearch = 
      tax.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.shop.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && tax.isActive) ||
      (filterStatus === 'inactive' && !tax.isActive);

    const matchesShop = 
      filterShop === 'all' || tax.shop.name === filterShop;

    return matchesSearch && matchesStatus && matchesShop;
  });

  // Calculate statistics
  const totalTaxes = taxes.length;
  const activeTaxes = taxes.filter(tax => tax.isActive).length;
  const uniqueShops = new Set(taxes.map(tax => tax.shop.id)).size;
  const avgTaxRate = taxes.length > 0 
    ? taxes.reduce((sum, tax) => sum + tax.rate, 0) / taxes.length 
    : 0;

  const handleViewTax = (taxId: string) => {
    console.log('View tax:', taxId);
    // TODO: Navigate to tax detail page
  };

  const handleEditTax = (taxId: string) => {
    console.log('Edit tax:', taxId);
    // TODO: Navigate to tax edit page
  };

  const handleMoreTax = (taxId: string) => {
    console.log('More options for tax:', taxId);
    // TODO: Show dropdown menu with more options
  };

  const handleCreateTax = () => {
    console.log('Create new tax');
    // TODO: Navigate to tax creation page
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
          <h1 className="text-2xl font-bold text-gray-900">Tax Management</h1>
          <p className="text-gray-600">Manage tax rates for your shops and products</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleCreateTax}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tax
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Taxes"
          value={totalTaxes.toString()}
          icon={Receipt}
          color="text-blue-600"
          bgColor="bg-blue-50"
          change="+3"
          trend="up"
        />
        <StatCard
          title="Active Taxes"
          value={activeTaxes.toString()}
          icon={Percent}
          color="text-green-600"
          bgColor="bg-green-50"
          change="+2"
          trend="up"
        />
        <StatCard
          title="Shops with Taxes"
          value={uniqueShops.toString()}
          icon={Store}
          color="text-purple-600"
          bgColor="bg-purple-50"
          change="+1"
          trend="up"
        />
        <StatCard
          title="Average Tax Rate"
          value={`${avgTaxRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="text-orange-600"
          bgColor="bg-orange-50"
          change="+0.5%"
          trend="up"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by tax name or shop..."
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
            <select
              value={filterShop}
              onChange={(e) => setFilterShop(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Shops</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.name}>{shop.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Taxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTaxes.map((tax) => (
          <div key={tax.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-full">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tax.name}</h3>
                  <p className="text-sm text-gray-500">{tax.shop.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleViewTax(tax.id)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                  title="View tax"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditTax(tax.id)}
                  className="text-gray-600 hover:text-gray-900 p-1 rounded"
                  title="Edit tax"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMoreTax(tax.id)}
                  className="text-gray-600 hover:text-gray-900 p-1 rounded"
                  title="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Tax Rate</span>
                <span className="text-2xl font-bold text-gray-900">{tax.rate}%</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tax.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {tax.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Created</span>
                <span>{formatDate(tax.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Updated</span>
                <span>{formatDate(tax.updatedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTaxes.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No taxes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all' || filterShop !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first tax rate.'}
          </p>
          {!searchTerm && filterStatus === 'all' && filterShop === 'all' && (
            <div className="mt-6">
              <button
                onClick={handleCreateTax}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tax
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 