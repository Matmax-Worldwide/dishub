'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, MoreHorizontal, DollarSign, Package, TrendingUp, Globe } from 'lucide-react';
import StatCard from '@/components/engines/commerce/StatCard';
import { ecommerce } from '@/lib/graphql-client';

interface PriceItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    shop: {
      name: string;
    };
  };
  amount: number;
  currency: {
    id: string;
    code: string;
    symbol: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PricingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterShop, setFilterShop] = useState<string>('all');
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [currencies, setCurrencies] = useState<{ id: string; code: string; symbol: string }[]>([]);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products, currencies, and shops
        const [productsData, currenciesData, shopsData] = await Promise.all([
          ecommerce.getProducts(),
          ecommerce.getCurrencies(),
          ecommerce.getShops()
        ]);

        // Transform products into price items
        const priceData: PriceItem[] = [];
        productsData.forEach(product => {
          if (product.prices && product.prices.length > 0) {
            product.prices.forEach(price => {
              priceData.push({
                id: price.id,
                product: {
                  id: product.id,
                  name: product.name,
                  sku: product.sku || '',
                  shop: {
                    name: product.shop?.name || 'Unknown Shop'
                  }
                },
                amount: price.amount,
                currency: price.currency,
                isActive: true, // Assuming all prices are active
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
              });
            });
          }
        });

        setPriceItems(priceData);
        setCurrencies(currenciesData);
        setShops(shopsData.map(shop => ({ id: shop.id, name: shop.name })));
        setError(null);
      } catch (err) {
        console.error('Error fetching pricing data:', err);
        setError('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter price items
  const filteredItems = priceItems.filter(item => {
    const matchesSearch = 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.shop.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCurrency = 
      filterCurrency === 'all' || item.currency.code === filterCurrency;

    const matchesShop = 
      filterShop === 'all' || item.product.shop.name === filterShop;

    return matchesSearch && matchesCurrency && matchesShop;
  });

  // Calculate statistics
  const totalPrices = priceItems.length;
  const uniqueProducts = new Set(priceItems.map(item => item.product.id)).size;
  const uniqueCurrencies = new Set(priceItems.map(item => item.currency.code)).size;
  const avgPrice = priceItems.length > 0 
    ? priceItems.reduce((sum, item) => sum + item.amount, 0) / priceItems.length 
    : 0;

  const handleViewPrice = (priceId: string) => {
    console.log('View price:', priceId);
    // TODO: Navigate to price detail page
  };

  const handleEditPrice = (priceId: string) => {
    console.log('Edit price:', priceId);
    // TODO: Navigate to price edit page
  };

  const handleMorePrice = (priceId: string) => {
    console.log('More options for price:', priceId);
    // TODO: Show dropdown menu with more options
  };

  const handleCreatePrice = () => {
    console.log('Create new price');
    // TODO: Navigate to price creation page
  };

  const formatPrice = (amount: number, currency: { code: string; symbol: string }) => {
    return `${currency.symbol}${amount.toFixed(2)} ${currency.code}`;
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
          <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600">Manage product prices across different currencies</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleCreatePrice}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Price
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Prices"
          value={totalPrices.toString()}
          icon={DollarSign}
          color="text-blue-600"
          bgColor="bg-blue-50"
          change="+12"
          trend="up"
        />
        <StatCard
          title="Products with Prices"
          value={uniqueProducts.toString()}
          icon={Package}
          color="text-green-600"
          bgColor="bg-green-50"
          change="+5"
          trend="up"
        />
        <StatCard
          title="Currencies Used"
          value={uniqueCurrencies.toString()}
          icon={Globe}
          color="text-purple-600"
          bgColor="bg-purple-50"
          change="+1"
          trend="up"
        />
        <StatCard
          title="Average Price"
          value={`$${avgPrice.toFixed(2)}`}
          icon={TrendingUp}
          color="text-orange-600"
          bgColor="bg-orange-50"
          change="+8%"
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
                placeholder="Search by product name, SKU, or shop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Currencies</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.code} ({currency.symbol})
                </option>
              ))}
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

      {/* Pricing Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.product.shop.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(item.amount, item.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{item.currency.code}</span>
                      <span className="ml-2 text-sm text-gray-500">({item.currency.symbol})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewPrice(item.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View price"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditPrice(item.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit price"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMorePrice(item.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="More options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No prices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterCurrency !== 'all' || filterShop !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding prices to your products.'}
            </p>
            {!searchTerm && filterCurrency === 'all' && filterShop === 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleCreatePrice}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Price
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 