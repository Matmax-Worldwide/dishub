import React from 'react';
import { Store, Globe, CreditCard, Package, Users, Settings, Eye, Edit } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  defaultCurrency: {
    code: string;
    symbol: string;
  };
  acceptedCurrencies?: Array<{
    code: string;
    symbol: string;
  }>;
  adminUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  stats?: {
    totalProducts: number;
    totalOrders: number;
    revenue: string;
    customers: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
}

interface ShopCardProps {
  shop: Shop;
  onView?: (shopId: string) => void;
  onEdit?: (shopId: string) => void;
  onSettings?: (shopId: string) => void;
  compact?: boolean;
}

const statusConfig = {
  active: {
    color: 'bg-green-100 text-green-800',
    label: 'Active'
  },
  inactive: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Inactive'
  },
  maintenance: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Maintenance'
  }
};

export default function ShopCard({
  shop,
  onView,
  onEdit,
  onSettings,
  compact = false
}: ShopCardProps) {
  const statusInfo = statusConfig[shop.status];

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Store className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">{shop.name}</h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Globe className="h-3 w-3" />
            <span>{shop.defaultCurrency.code}</span>
          </div>
          {shop.stats && (
            <>
              <p className="text-lg font-bold text-gray-900">{shop.stats.revenue}</p>
              <p className="text-xs text-gray-500">{shop.stats.totalOrders} orders</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
            <p className="text-sm text-gray-500">
              Created {new Date(shop.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <div className="flex space-x-1">
            {onView && (
              <button
                onClick={() => onView(shop.id)}
                className="text-blue-600 hover:text-blue-700 p-1"
                title="View shop"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(shop.id)}
                className="text-gray-600 hover:text-gray-700 p-1"
                title="Edit shop"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {onSettings && (
              <button
                onClick={() => onSettings(shop.id)}
                className="text-gray-600 hover:text-gray-700 p-1"
                title="Shop settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Currency Information */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Globe className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Default Currency:</span>
          <span className="text-sm text-gray-900">
            {shop.defaultCurrency.symbol} {shop.defaultCurrency.code}
          </span>
        </div>
        {shop.acceptedCurrencies && shop.acceptedCurrencies.length > 0 && (
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Accepted:</span>
            <div className="flex space-x-1">
              {shop.acceptedCurrencies.slice(0, 3).map((currency, index) => (
                <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {currency.code}
                </span>
              ))}
              {shop.acceptedCurrencies.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{shop.acceptedCurrencies.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Information */}
      {shop.adminUser && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Admin:</span>
          </div>
          <p className="text-sm text-gray-900 mt-1">
            {shop.adminUser.firstName} {shop.adminUser.lastName}
          </p>
          <p className="text-xs text-gray-500">{shop.adminUser.email}</p>
        </div>
      )}

      {/* Statistics */}
      {shop.stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Products</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{shop.stats.totalProducts}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Customers</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{shop.stats.customers}</p>
          </div>
          <div className="text-center col-span-2">
            <p className="text-2xl font-bold text-green-600">{shop.stats.revenue}</p>
            <p className="text-sm text-gray-500">{shop.stats.totalOrders} orders</p>
          </div>
        </div>
      )}
    </div>
  );
} 