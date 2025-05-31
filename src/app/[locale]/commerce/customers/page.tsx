'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, MoreHorizontal, Users, ShoppingCart, DollarSign } from 'lucide-react';
import StatCard from '@/components/commerce/StatCard';
import { ecommerce } from '@/lib/graphql-client';

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orders?: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        // For now, we'll get customers from orders since we don't have a dedicated customers endpoint
        const ordersData = await ecommerce.getOrders();
        
        // Extract unique customers from orders
        const customerMap = new Map<string, Customer>();
        
        ordersData.forEach(order => {
          if (order.customerEmail) {
            const existingCustomer = customerMap.get(order.customerEmail);
            if (existingCustomer) {
              // Add order to existing customer
              if (!existingCustomer.orders) {
                existingCustomer.orders = [];
              }
              existingCustomer.orders.push({
                id: order.id,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt
              });
            } else {
              // Create new customer from order data
              const nameParts = order.customerName.split(' ');
              customerMap.set(order.customerEmail, {
                id: order.customerEmail, // Using email as ID for now
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: order.customerEmail,
                phoneNumber: undefined,
                isActive: true,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                orders: [{
                  id: order.id,
                  totalAmount: order.totalAmount,
                  status: order.status,
                  createdAt: order.createdAt
                }]
              });
            }
          }
        });

        setCustomers(Array.from(customerMap.values()));
        setError(null);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search term and status
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && customer.isActive) ||
      (filterStatus === 'inactive' && !customer.isActive);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(customer => customer.isActive).length;
  const totalOrders = customers.reduce((sum, customer) => sum + (customer.orders?.length || 0), 0);
  const totalRevenue = customers.reduce((sum, customer) => 
    sum + (customer.orders?.reduce((orderSum, order) => orderSum + order.totalAmount, 0) || 0), 0
  );

  const handleViewCustomer = (customerId: string) => {
    console.log('View customer:', customerId);
    // TODO: Navigate to customer detail page
  };

  const handleEditCustomer = (customerId: string) => {
    console.log('Edit customer:', customerId);
    // TODO: Navigate to customer edit page
  };

  const handleMoreCustomer = (customerId: string) => {
    console.log('More options for customer:', customerId);
    // TODO: Show dropdown menu with more options
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCustomerStats = (customer: Customer) => {
    const orders = customer.orders || [];
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const orderCount = orders.length;
    const lastOrderDate = orders.length > 0 
      ? new Date(Math.max(...orders.map(order => new Date(order.createdAt).getTime())))
      : null;

    return { totalSpent, orderCount, lastOrderDate };
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage and view customer information</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={totalCustomers.toString()}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-50"
          change="+12%"
          trend="up"
        />
        <StatCard
          title="Active Customers"
          value={activeCustomers.toString()}
          icon={Users}
          color="text-green-600"
          bgColor="bg-green-50"
          change="+8%"
          trend="up"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders.toString()}
          icon={ShoppingCart}
          color="text-purple-600"
          bgColor="bg-purple-50"
          change="+15%"
          trend="up"
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-orange-600"
          bgColor="bg-orange-50"
          change="+22%"
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
                placeholder="Search customers by name or email..."
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
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const stats = getCustomerStats(customer);
                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        {customer.phoneNumber && (
                          <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stats.orderCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${stats.totalSpent.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stats.lastOrderDate ? formatDate(stats.lastOrderDate.toISOString()) : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(customer.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewCustomer(customer.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View customer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer.id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Edit customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoreCustomer(customer.id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="More options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Customers will appear here when they place orders.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 