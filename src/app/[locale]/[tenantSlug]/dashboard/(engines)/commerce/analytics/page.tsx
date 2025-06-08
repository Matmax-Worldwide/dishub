'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, Download } from 'lucide-react';
import StatCard from '@/components/engines/commerce/StatCard';
import { ecommerce } from '@/lib/graphql-client';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  productsGrowth: number;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from multiple sources
        const [orders, products] = await Promise.all([
          ecommerce.getOrders(),
          ecommerce.getProducts()
        ]);

        // Calculate analytics
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const totalProducts = products.length;
        
        // Extract unique customers from orders
        const uniqueCustomers = new Set(orders.map(order => order.customerEmail));
        const totalCustomers = uniqueCustomers.size;

        // Calculate product performance
        const productPerformance = new Map<string, { revenue: number; orders: number; name: string }>();
        
        orders.forEach(order => {
          order.items.forEach(item => {
            const existing = productPerformance.get(item.product.id);
            if (existing) {
              existing.revenue += item.totalPrice;
              existing.orders += 1;
            } else {
              productPerformance.set(item.product.id, {
                revenue: item.totalPrice,
                orders: 1,
                name: item.product.name
              });
            }
          });
        });

        const topProducts = Array.from(productPerformance.entries())
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Get recent orders
        const recentOrders = orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
          .map(order => ({
            id: order.id,
            customerName: order.customerName,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
          }));

        // Mock growth percentages (in a real app, you'd calculate these from historical data)
        const analytics: AnalyticsData = {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
          revenueGrowth: 12.5,
          ordersGrowth: 8.3,
          customersGrowth: 15.2,
          productsGrowth: 5.7,
          topProducts,
          recentOrders
        };

        setAnalyticsData(analytics);
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
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

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your e-commerce performance and insights</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analyticsData.totalRevenue)}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-50"
          change={`+${analyticsData.revenueGrowth}%`}
          trend="up"
        />
        <StatCard
          title="Total Orders"
          value={analyticsData.totalOrders.toString()}
          icon={ShoppingCart}
          color="text-blue-600"
          bgColor="bg-blue-50"
          change={`+${analyticsData.ordersGrowth}%`}
          trend="up"
        />
        <StatCard
          title="Total Customers"
          value={analyticsData.totalCustomers.toString()}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-50"
          change={`+${analyticsData.customersGrowth}%`}
          trend="up"
        />
        <StatCard
          title="Total Products"
          value={analyticsData.totalProducts.toString()}
          icon={Package}
          color="text-orange-600"
          bgColor="bg-orange-50"
          change={`+${analyticsData.productsGrowth}%`}
          trend="up"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {analyticsData.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {analyticsData.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg">
              Revenue
            </button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Orders
            </button>
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Revenue chart would be displayed here</p>
            <p className="text-sm text-gray-400 mt-2">
              Integration with charting library (Chart.js, Recharts, etc.) needed
            </p>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.totalRevenue / analyticsData.totalOrders || 0)}
            </div>
            <div className="text-sm text-gray-500">Average Order Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {((analyticsData.totalOrders / analyticsData.totalCustomers) || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Orders per Customer</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.totalRevenue / analyticsData.totalCustomers || 0)}
            </div>
            <div className="text-sm text-gray-500">Customer Lifetime Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {((analyticsData.totalOrders / analyticsData.totalProducts) || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Orders per Product</div>
          </div>
        </div>
      </div>
    </div>
  );
} 