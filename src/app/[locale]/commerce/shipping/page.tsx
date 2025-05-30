'use client';

import { useState, useEffect } from 'react';
import { 
  TruckIcon, 
  MapPinIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  GlobeAltIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { ecommerce } from '@/lib/graphql-client';

interface ShippingProvider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  trackingUrl?: string;
  shippingMethods: Array<{
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
    trackingEnabled: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  providerId: string;
  isActive: boolean;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  trackingEnabled: boolean;
  provider: {
    id: string;
    name: string;
    type: string;
  };
  shippingRates: Array<{
    id: string;
    baseRate: number;
    minWeight?: number;
    maxWeight?: number;
    shippingZone: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  countries: string[];
  states: string[];
  postalCodes: string[];
  isActive: boolean;
  shippingRates: Array<{
    id: string;
    baseRate: number;
    shippingMethod: {
      id: string;
      name: string;
      provider: {
        id: string;
        name: string;
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Shipment {
  id: string;
  orderId: string;
  trackingNumber?: string;
  status: string;
  shippingCost: number;
  weight?: number;
  dimensions?: string;
  fromAddress: string;
  toAddress: string;
  shippedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  order: {
    id: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    currency: {
      id: string;
      code: string;
      symbol: string;
    };
    shop: {
      id: string;
      name: string;
    };
  };
  shippingMethod: {
    id: string;
    name: string;
    provider: {
      id: string;
      name: string;
      type: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor, change, trend, description }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${bgColor} rounded-md p-3`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {change}
                </div>
              )}
            </dd>
            {description && (
              <dd className="text-sm text-gray-600 mt-1">{description}</dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'failed':
    case 'cancelled':
    case 'returned':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case 'pending':
    case 'processing':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'shipped':
    case 'in_transit':
    case 'out_for_delivery':
      return <TruckIcon className="h-5 w-5 text-blue-500" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'failed':
    case 'cancelled':
    case 'returned':
      return 'bg-red-100 text-red-800';
    case 'pending':
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'shipped':
    case 'in_transit':
    case 'out_for_delivery':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ShippingPage() {
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'providers' | 'methods' | 'zones' | 'shipments'>('providers');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [providersData, methodsData, zonesData, shipmentsData] = await Promise.all([
          ecommerce.getShippingProviders(),
          ecommerce.getShippingMethods(),
          ecommerce.getShippingZones(),
          ecommerce.getShipments()
        ]);

        setProviders(providersData);
        setMethods(methodsData);
        setZones(zonesData);
        setShipments(shipmentsData);
      } catch (err) {
        console.error('Error fetching shipping data:', err);
        setError('Failed to load shipping data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter shipments
  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch = !searchTerm || 
      shipment.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shipment.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesProvider = providerFilter === 'all' || shipment.shippingMethod.provider.id === providerFilter;
    
    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Calculate statistics
  const totalProviders = providers.length;
  const activeProviders = providers.filter((p) => p.isActive).length;
  const totalMethods = methods.length;
  const activeMethods = methods.filter((m) => m.isActive).length;
  const totalZones = zones.length;
  const activeZones = zones.filter((z) => z.isActive).length;
  const totalShipments = shipments.length;
  const deliveredShipments = shipments.filter((s) => s.status.toLowerCase() === 'delivered').length;
  const pendingShipments = shipments.filter((s) => ['pending', 'processing'].includes(s.status.toLowerCase())).length;
  const inTransitShipments = shipments.filter((s) => ['shipped', 'in_transit', 'out_for_delivery'].includes(s.status.toLowerCase())).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipping data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Shipping Management</h1>
          <p className="text-gray-600">Manage shipping providers, methods, zones, and shipments</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Shipping Providers"
            value={`${activeProviders}/${totalProviders}`}
            icon={BuildingOfficeIcon}
            color="text-blue-600"
            bgColor="bg-blue-100"
            description="active providers"
          />
          <StatCard
            title="Shipping Methods"
            value={`${activeMethods}/${totalMethods}`}
            icon={TruckIcon}
            color="text-green-600"
            bgColor="bg-green-100"
            description="active methods"
          />
          <StatCard
            title="Shipping Zones"
            value={`${activeZones}/${totalZones}`}
            icon={GlobeAltIcon}
            color="text-purple-600"
            bgColor="bg-purple-100"
            description="active zones"
          />
          <StatCard
            title="Total Shipments"
            value={totalShipments.toString()}
            icon={MapPinIcon}
            color="text-orange-600"
            bgColor="bg-orange-100"
            description="all shipments"
          />
        </div>

        {/* Shipment Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Delivered"
            value={deliveredShipments.toString()}
            icon={CheckCircleIcon}
            color="text-green-600"
            bgColor="bg-green-100"
            description="completed deliveries"
          />
          <StatCard
            title="In Transit"
            value={inTransitShipments.toString()}
            icon={TruckIcon}
            color="text-blue-600"
            bgColor="bg-blue-100"
            description="on the way"
          />
          <StatCard
            title="Pending"
            value={pendingShipments.toString()}
            icon={ClockIcon}
            color="text-yellow-600"
            bgColor="bg-yellow-100"
            description="awaiting shipment"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('providers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'providers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Providers ({totalProviders})
              </button>
              <button
                onClick={() => setActiveTab('methods')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'methods'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Methods ({totalMethods})
              </button>
              <button
                onClick={() => setActiveTab('zones')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'zones'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Zones ({totalZones})
              </button>
              <button
                onClick={() => setActiveTab('shipments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'shipments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shipments ({totalShipments})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'providers' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Shipping Providers</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Provider
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providers.map((provider) => (
                    <div key={provider.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">{provider.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          provider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Type:</span> {provider.type}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Methods:</span> {provider.shippingMethods.length}
                        </div>
                        {provider.trackingUrl && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Tracking:</span> Available
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">
                          Configure
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'methods' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Shipping Methods</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Method
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delivery Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {methods.map((method) => (
                        <tr key={method.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{method.name}</div>
                              {method.description && (
                                <div className="text-sm text-gray-500">{method.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{method.provider.name}</div>
                            <div className="text-sm text-gray-500">{method.provider.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {method.estimatedDaysMin && method.estimatedDaysMax
                                ? `${method.estimatedDaysMin}-${method.estimatedDaysMax} days`
                                : method.estimatedDaysMin
                                ? `${method.estimatedDaysMin}+ days`
                                : method.estimatedDaysMax
                                ? `Up to ${method.estimatedDaysMax} days`
                                : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {method.shippingRates.length} rate{method.shippingRates.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              method.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {method.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <EllipsisVerticalIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'zones' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Shipping Zones</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Zone
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {zones.map((zone) => (
                    <div key={zone.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">{zone.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          zone.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {zone.description && (
                        <p className="text-sm text-gray-600 mb-4">{zone.description}</p>
                      )}
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Countries:</span> {zone.countries.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">States:</span> {zone.states.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Rates:</span> {zone.shippingRates.length}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">
                          Configure
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'shipments' && (
              <>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search shipments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                    <option value="returned">Returned</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Providers</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shipments Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tracking
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredShipments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments found</h3>
                            <p className="text-gray-500">
                              {searchTerm || statusFilter !== 'all' || providerFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Shipments will appear here once orders are shipped'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredShipments.map((shipment) => (
                          <tr key={shipment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {shipment.trackingNumber || shipment.id.slice(0, 8)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {shipment.trackingNumber ? 'Tracking #' : 'Shipment ID'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {shipment.order.customerName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {shipment.order.customerEmail}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {shipment.order.id.slice(0, 8)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {shipment.order.currency.symbol}{shipment.order.totalAmount.toLocaleString()}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getStatusIcon(shipment.status)}
                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                                  {shipment.status.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {shipment.shippingMethod.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {shipment.shippingMethod.provider.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {shipment.order.currency.symbol}{shipment.shippingCost.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(shipment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button className="text-gray-600 hover:text-gray-900">
                                  <EllipsisVerticalIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 