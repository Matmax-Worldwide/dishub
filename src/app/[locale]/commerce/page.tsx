'use client';

import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Star,
  AlertCircle
} from 'lucide-react';

export default function CommerceDashboard() {
  // Mock data for the dashboard
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Orders',
      value: '2,350',
      change: '+180.1%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Products',
      value: '1,234',
      change: '+19%',
      trend: 'up',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Customers',
      value: '573',
      change: '+201',
      trend: 'up',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const recentOrders = [
    {
      id: '#3210',
      customer: 'Olivia Martin',
      email: 'olivia.martin@email.com',
      status: 'Fulfilled',
      date: '2024-01-15',
      amount: '$1,999.00'
    },
    {
      id: '#3209',
      customer: 'Jackson Lee',
      email: 'jackson.lee@email.com',
      status: 'Fulfilled',
      date: '2024-01-14',
      amount: '$39.00'
    },
    {
      id: '#3208',
      customer: 'Isabella Nguyen',
      email: 'isabella.nguyen@email.com',
      status: 'Unfulfilled',
      date: '2024-01-13',
      amount: '$299.00'
    },
    {
      id: '#3207',
      customer: 'William Kim',
      email: 'will@email.com',
      status: 'Fulfilled',
      date: '2024-01-12',
      amount: '$99.00'
    },
    {
      id: '#3206',
      customer: 'Sofia Davis',
      email: 'sofia.davis@email.com',
      status: 'Fulfilled',
      date: '2024-01-11',
      amount: '$39.00'
    }
  ];

  const topProducts = [
    {
      name: 'Wireless Headphones',
      sku: 'WH-001',
      price: '$299.00',
      stock: 45,
      sold: 123,
      rating: 4.8,
      image: '/api/placeholder/60/60'
    },
    {
      name: 'Smart Watch',
      sku: 'SW-002',
      price: '$199.00',
      stock: 23,
      sold: 89,
      rating: 4.6,
      image: '/api/placeholder/60/60'
    },
    {
      name: 'Bluetooth Speaker',
      sku: 'BS-003',
      price: '$79.00',
      stock: 67,
      sold: 156,
      rating: 4.9,
      image: '/api/placeholder/60/60'
    },
    {
      name: 'USB-C Cable',
      sku: 'UC-004',
      price: '$19.00',
      stock: 234,
      sold: 445,
      rating: 4.7,
      image: '/api/placeholder/60/60'
    }
  ];

  const lowStockAlerts = [
    { name: 'Smart Watch', stock: 5, sku: 'SW-002' },
    { name: 'Wireless Mouse', stock: 3, sku: 'WM-005' },
    { name: 'Phone Case', stock: 8, sku: 'PC-006' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">E-Commerce Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
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
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                        <div className="text-sm text-gray-500">{order.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'Fulfilled' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="p-6 space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500">{product.sku}</span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500 ml-1">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{product.price}</p>
                    <p className="text-xs text-gray-500">{product.sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {lowStockAlerts.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-orange-600">{item.stock} left</span>
                  </div>
                </div>
              ))}
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-3">
                View all alerts
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Order
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Users className="h-4 w-4 mr-2" />
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md">7 days</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">30 days</button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">90 days</button>
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Sales chart would be displayed here</p>
            <p className="text-sm text-gray-400 mt-1">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
} 