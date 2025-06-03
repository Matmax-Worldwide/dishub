'use client';

import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Store,
  Globe,
  Receipt
} from 'lucide-react';

// Import our reusable components
import StatCard from '@/components/commerce/StatCard';
import ProductCard from '@/components/commerce/ProductCard';
import OrderTable from '@/components/commerce/OrderTable';
import AlertCard from '@/components/commerce/AlertCard';
import QuickActions from '@/components/commerce/QuickActions';

export default function CommerceDashboard() {
  // Mock data for the dashboard based on the Prisma schema
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'from last month'
    },
    {
      title: 'Orders',
      value: '2,350',
      change: '+180.1%',
      trend: 'up' as const,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'from last month'
    },
    {
      title: 'Products',
      value: '1,234',
      change: '+19%',
      trend: 'up' as const,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'active products'
    },
    {
      title: 'Active Shops',
      value: '8',
      change: '+2',
      trend: 'up' as const,
      icon: Store,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'this month'
    }
  ];

  const recentOrders = [
    {
      id: '3210',
      customerName: 'Olivia Martin',
      customerEmail: 'olivia.martin@email.com',
      status: 'delivered' as const,
      date: '2024-01-15',
      amount: '1999.00',
      currency: '$',
      items: 3
    },
    {
      id: '3209',
      customerName: 'Jackson Lee',
      customerEmail: 'jackson.lee@email.com',
      status: 'shipped' as const,
      date: '2024-01-14',
      amount: '39.00',
      currency: '$',
      items: 1
    },
    {
      id: '3208',
      customerName: 'Isabella Nguyen',
      customerEmail: 'isabella.nguyen@email.com',
      status: 'processing' as const,
      date: '2024-01-13',
      amount: '299.00',
      currency: '$',
      items: 2
    },
    {
      id: '3207',
      customerName: 'William Kim',
      customerEmail: 'will@email.com',
      status: 'delivered' as const,
      date: '2024-01-12',
      amount: '99.00',
      currency: '$',
      items: 1
    },
    {
      id: '3206',
      customerName: 'Sofia Davis',
      customerEmail: 'sofia.davis@email.com',
      status: 'pending' as const,
      date: '2024-01-11',
      amount: '39.00',
      currency: '$',
      items: 1
    }
  ];

  const topProducts = [
    {
      id: '1',
      name: 'Wireless Headphones',
      sku: 'WH-001',
      price: '299.00',
      currency: '$',
      stock: 45,
      sold: 123,
      rating: 4.8
    },
    {
      id: '2',
      name: 'Smart Watch',
      sku: 'SW-002',
      price: '199.00',
      currency: '$',
      stock: 23,
      sold: 89,
      rating: 4.6
    },
    {
      id: '3',
      name: 'Bluetooth Speaker',
      sku: 'BS-003',
      price: '79.00',
      currency: '$',
      stock: 67,
      sold: 156,
      rating: 4.9
    },
    {
      id: '4',
      name: 'USB-C Cable',
      sku: 'UC-004',
      price: '19.00',
      currency: '$',
      stock: 234,
      sold: 445,
      rating: 4.7
    }
  ];

  const alerts = [
    {
      id: '1',
      title: 'Smart Watch',
      description: 'SKU: SW-002',
      type: 'warning' as const,
      value: '5 left'
    },
    {
      id: '2',
      title: 'Wireless Mouse',
      description: 'SKU: WM-005',
      type: 'error' as const,
      value: '3 left'
    },
    {
      id: '3',
      title: 'Phone Case',
      description: 'SKU: PC-006',
      type: 'warning' as const,
      value: '8 left'
    },
    {
      id: '4',
      title: 'Currency Rate Update',
      description: 'EUR exchange rate changed',
      type: 'info' as const,
      action: {
        label: 'Update Prices',
        onClick: () => console.log('Update prices')
      }
    }
  ];

  const quickActions = [
    {
      id: '1',
      label: 'Add New Product',
      icon: Package,
      color: 'bg-blue-600 text-white',
      onClick: () => console.log('Add product')
    },
    {
      id: '2',
      label: 'Create Shop',
      icon: Store,
      color: 'bg-green-600 text-white',
      onClick: () => console.log('Create shop')
    },
    {
      id: '3',
      label: 'Manage Currencies',
      icon: Globe,
      color: 'bg-purple-600 text-white',
      onClick: () => console.log('Manage currencies')
    },
    {
      id: '4',
      label: 'Tax Settings',
      icon: Receipt,
      color: 'bg-orange-600 text-white',
      onClick: () => console.log('Tax settings')
    }
  ];

  const handleViewOrder = (orderId: string) => {
    console.log('View order:', orderId);
  };

  const handleEditOrder = (orderId: string) => {
    console.log('Edit order:', orderId);
  };

  const handleMoreOrder = (orderId: string) => {
    console.log('More options for order:', orderId);
  };

  const handleViewProduct = (productId: string) => {
    console.log('View product:', productId);
  };

  const handleEditProduct = (productId: string) => {
    console.log('Edit product:', productId);
  };

  const handleMoreProduct = (productId: string) => {
    console.log('More options for product:', productId);
  };

  const handleDismissAlert = (alertId: string) => {
    console.log('Dismiss alert:', alertId);
  };

  const handleViewAllAlerts = () => {
    console.log('View all alerts');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">E-Commerce Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your multi-shop e-commerce platform with comprehensive tools.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Export Data
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
            description={stat.description}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all
              </button>
            </div>
          </div>
          <OrderTable
            orders={recentOrders}
            onView={handleViewOrder}
            onEdit={handleEditOrder}
            onMore={handleMoreOrder}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="p-6 space-y-4">
              {topProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  sku={product.sku}
                  price={product.price}
                  currency={product.currency}
                  stock={product.stock}
                  sold={product.sold}
                  rating={product.rating}
                  onView={handleViewProduct}
                  onEdit={handleEditProduct}
                  onMore={handleMoreProduct}
                  compact
                />
              ))}
            </div>
          </div>

          {/* Alerts */}
          <AlertCard
            title="System Alerts"
            alerts={alerts}
            onDismiss={handleDismissAlert}
            onViewAll={handleViewAllAlerts}
          />

          {/* Quick Actions */}
          <QuickActions
            title="Quick Actions"
            actions={quickActions}
            layout="vertical"
          />
        </div>
      </div>

      {/* Sales Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Multi-Shop Revenue Overview</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md">7 days</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">30 days</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">90 days</button>
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Revenue analytics across all shops</p>
            <p className="text-sm text-gray-400 mt-1">Integration with charting library needed</p>
          </div>
        </div>
      </div>

      {/* Shop Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Shop Performance</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Manage Shops
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Main Store', revenue: '$15,234', orders: 456, status: 'active' },
            { name: 'Electronics Hub', revenue: '$12,890', orders: 234, status: 'active' },
            { name: 'Fashion Outlet', revenue: '$8,567', orders: 189, status: 'active' },
            { name: 'Home & Garden', revenue: '$6,234', orders: 123, status: 'maintenance' }
          ].map((shop, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{shop.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  shop.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {shop.status}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">{shop.revenue}</p>
              <p className="text-sm text-gray-500">{shop.orders} orders</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 