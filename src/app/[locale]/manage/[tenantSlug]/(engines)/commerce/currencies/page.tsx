'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, MoreHorizontal, Globe, DollarSign, TrendingUp, Users } from 'lucide-react';
import StatCard from '@/components/engines/commerce/StatCard';
import { ecommerce } from '@/lib/graphql-client';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  createdAt: string;
  updatedAt: string;
}

export default function CurrenciesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        const currenciesData = await ecommerce.getCurrencies();
        setCurrencies(currenciesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching currencies:', err);
        setError('Failed to load currencies');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Filter currencies based on search term
  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalCurrencies = currencies.length;
  const activeCurrencies = currencies.length; // All currencies are considered active for now
  const majorCurrencies = currencies.filter(currency => 
    ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].includes(currency.code)
  ).length;

  const handleViewCurrency = (currencyId: string) => {
    console.log('View currency:', currencyId);
    // TODO: Navigate to currency detail page
  };

  const handleEditCurrency = (currencyId: string) => {
    console.log('Edit currency:', currencyId);
    // TODO: Navigate to currency edit page
  };

  const handleMoreCurrency = (currencyId: string) => {
    console.log('More options for currency:', currencyId);
    // TODO: Show dropdown menu with more options
  };

  const handleCreateCurrency = () => {
    console.log('Create new currency');
    // TODO: Navigate to currency creation page
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
          <h1 className="text-2xl font-bold text-gray-900">Currencies</h1>
          <p className="text-gray-600">Manage supported currencies for your shops</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleCreateCurrency}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Currency
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Currencies"
          value={totalCurrencies.toString()}
          icon={Globe}
          color="text-blue-600"
          bgColor="bg-blue-50"
          change="+2"
          trend="up"
        />
        <StatCard
          title="Active Currencies"
          value={activeCurrencies.toString()}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-50"
          change="100%"
          trend="up"
        />
        <StatCard
          title="Major Currencies"
          value={majorCurrencies.toString()}
          icon={TrendingUp}
          color="text-purple-600"
          bgColor="bg-purple-50"
          change="+1"
          trend="up"
        />
        <StatCard
          title="Shops Using"
          value="12"
          icon={Users}
          color="text-orange-600"
          bgColor="bg-orange-50"
          change="+3"
          trend="up"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search currencies by name, code, or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Currencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCurrencies.map((currency) => (
          <div key={currency.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-full">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{currency.code}</h3>
                  <p className="text-sm text-gray-500">{currency.symbol}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleViewCurrency(currency.id)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                  title="View currency"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditCurrency(currency.id)}
                  className="text-gray-600 hover:text-gray-900 p-1 rounded"
                  title="Edit currency"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMoreCurrency(currency.id)}
                  className="text-gray-600 hover:text-gray-900 p-1 rounded"
                  title="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{currency.name}</p>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Created</span>
                <span>{formatDate(currency.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Updated</span>
                <span>{formatDate(currency.updatedAt)}</span>
              </div>
            </div>

            {/* Currency usage indicator */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Usage</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCurrencies.length === 0 && (
        <div className="text-center py-12">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No currencies found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Get started by adding your first currency.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={handleCreateCurrency}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Currency
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 