'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Upload, AlertTriangle, Package, TrendingDown, Warehouse } from 'lucide-react';
import StatCard from '@/app/components/engines/commerce/StatCard';
import { ecommerce } from '@/lib/graphql-client';

interface InventoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    shop: {
      name: string;
    };
  };
  stockQuantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastRestocked?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [filterShop, setFilterShop] = useState<string>('all');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products and shops
        const [productsData, shopsData] = await Promise.all([
          ecommerce.getProducts(),
          ecommerce.getShops()
        ]);

        // Transform products into inventory items
        const inventoryData: InventoryItem[] = productsData.map((product) => {
          const stockQuantity = product.stockQuantity || 0;
          const lowStockThreshold = 10; // Default threshold
          const reservedQuantity = Math.floor(stockQuantity * 0.1); // 10% reserved
          const availableQuantity = stockQuantity - reservedQuantity;
          
          let status: 'in_stock' | 'low_stock' | 'out_of_stock';
          if (stockQuantity === 0) {
            status = 'out_of_stock';
          } else if (stockQuantity <= lowStockThreshold) {
            status = 'low_stock';
          } else {
            status = 'in_stock';
          }

          return {
            id: product.id,
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku || '',
              shop: {
                name: product.shop?.name || 'Unknown Shop'
              }
            },
            stockQuantity,
            lowStockThreshold,
            reservedQuantity,
            availableQuantity,
            lastRestocked: product.updatedAt,
            status
          };
        });

        setInventoryItems(inventoryData);
        setShops(shopsData.map((shop) => ({ id: shop.id, name: shop.name })));
        setError(null);
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter inventory items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.shop.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || item.status === filterStatus;

    const matchesShop = 
      filterShop === 'all' || item.product.shop.name === filterShop;

    return matchesSearch && matchesStatus && matchesShop;
  });

  // Calculate statistics
  const totalItems = inventoryItems.length;
  const inStockItems = inventoryItems.filter(item => item.status === 'in_stock').length;
  const lowStockItems = inventoryItems.filter(item => item.status === 'low_stock').length;
  const outOfStockItems = inventoryItems.filter(item => item.status === 'out_of_stock').length;

  const handleExportInventory = () => {
    console.log('Export inventory');
    // TODO: Implement CSV export
  };

  const handleImportInventory = () => {
    console.log('Import inventory');
    // TODO: Implement CSV import
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Package className="h-4 w-4" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4" />;
      case 'out_of_stock':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your product inventory</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleImportInventory}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button 
            onClick={handleExportInventory}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={totalItems.toString()}
          icon={Warehouse}
          color="text-blue-600"
          bgColor="bg-blue-50"
          change="+5"
          trend="up"
        />
        <StatCard
          title="In Stock"
          value={inStockItems.toString()}
          icon={Package}
          color="text-green-600"
          bgColor="bg-green-50"
          change="+3"
          trend="up"
        />
        <StatCard
          title="Low Stock"
          value={lowStockItems.toString()}
          icon={AlertTriangle}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
          change="+2"
          trend="up"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockItems.toString()}
          icon={TrendingDown}
          color="text-red-600"
          bgColor="bg-red-50"
          change="-1"
          trend="down"
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
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

      {/* Inventory Table */}
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
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Restocked
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
                    <div className="text-sm font-medium text-gray-900">{item.stockQuantity}</div>
                    <div className="text-xs text-gray-500">Threshold: {item.lowStockThreshold}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.availableQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.reservedQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1 capitalize">{item.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.lastRestocked)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Warehouse className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterShop !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No products available in inventory.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 