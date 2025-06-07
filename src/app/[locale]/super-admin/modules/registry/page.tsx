'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  SearchIcon,
  FilterIcon,
  PackageIcon,
  SettingsIcon,
  UsersIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  PlusIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED' | 'BETA';
  category: string;
  tenantsUsing: number;
  totalInstalls: number;
  lastUpdated: string;
  dependencies: string[];
  features: string[];
}

export default function ModuleRegistryPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const loadModules = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockModules: Module[] = [
        {
          id: '1',
          name: 'CMS Engine',
          description: 'Core content management system with page and post management',
          version: '2.1.0',
          status: 'ACTIVE',
          category: 'Core',
          tenantsUsing: 45,
          totalInstalls: 120,
          lastUpdated: new Date().toISOString(),
          dependencies: [],
          features: ['page_management', 'post_management', 'media_library']
        },
        {
          id: '2',
          name: 'Blog Module',
          description: 'Advanced blogging capabilities with categories and tags',
          version: '1.5.2',
          status: 'ACTIVE',
          category: 'Content',
          tenantsUsing: 32,
          totalInstalls: 85,
          lastUpdated: new Date(Date.now() - 86400000).toISOString(),
          dependencies: ['CMS Engine'],
          features: ['blog_posts', 'categories', 'tags', 'comments']
        },
        {
          id: '3',
          name: 'E-commerce Engine',
          description: 'Complete e-commerce solution with payments and inventory',
          version: '3.0.0-beta',
          status: 'BETA',
          category: 'Business',
          tenantsUsing: 8,
          totalInstalls: 15,
          lastUpdated: new Date(Date.now() - 172800000).toISOString(),
          dependencies: ['CMS Engine'],
          features: ['product_catalog', 'shopping_cart', 'payments', 'inventory']
        },
        {
          id: '4',
          name: 'Forms Module',
          description: 'Form builder with submissions and analytics',
          version: '1.2.1',
          status: 'ACTIVE',
          category: 'Utility',
          tenantsUsing: 28,
          totalInstalls: 67,
          lastUpdated: new Date(Date.now() - 259200000).toISOString(),
          dependencies: ['CMS Engine'],
          features: ['form_builder', 'submissions', 'analytics']
        }
      ];
      
      setModules(mockModules);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadModules();
    setRefreshing(false);
    toast.success('Module registry refreshed');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800"><CheckCircleIcon className="h-3 w-3 mr-1" />Active</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800"><XCircleIcon className="h-3 w-3 mr-1" />Inactive</Badge>;
      case 'DEPRECATED':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangleIcon className="h-3 w-3 mr-1" />Deprecated</Badge>;
      case 'BETA':
        return <Badge className="bg-blue-100 text-blue-800"><TrendingUpIcon className="h-3 w-3 mr-1" />Beta</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Core':
        return 'bg-purple-100 text-purple-800';
      case 'Content':
        return 'bg-blue-100 text-blue-800';
      case 'Business':
        return 'bg-green-100 text-green-800';
      case 'Utility':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = !searchTerm || 
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || module.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || module.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(modules.map(m => m.category)));

  useEffect(() => {
    loadModules();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading module registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📦 Module Registry
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all available modules and their configurations • {filteredModules.length} modules
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FilterIcon className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search modules by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="BETA">Beta</SelectItem>
                <SelectItem value="DEPRECATED">Deprecated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => {}} className="w-full">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <Card key={module.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center">
                    <PackageIcon className="h-5 w-5 mr-2" />
                    {module.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    v{module.version}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(module.status)}
                  <Badge className={getCategoryColor(module.category)}>
                    {module.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{module.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <UsersIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-lg font-semibold">{module.tenantsUsing}</div>
                  <div className="text-xs text-gray-500">Active Tenants</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUpIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-lg font-semibold">{module.totalInstalls}</div>
                  <div className="text-xs text-gray-500">Total Installs</div>
                </div>
              </div>

              {module.dependencies.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Dependencies:</div>
                  <div className="flex flex-wrap gap-1">
                    {module.dependencies.map((dep) => (
                      <Badge key={dep} variant="outline" className="text-xs">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Features:</div>
                <div className="flex flex-wrap gap-1">
                  {module.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature.replace('_', ' ')}
                    </Badge>
                  ))}
                  {module.features.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{module.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(module.lastUpdated).toLocaleDateString()}
                  </div>
                  <Button variant="outline" size="sm">
                    <SettingsIcon className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <PackageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or add a new module to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 