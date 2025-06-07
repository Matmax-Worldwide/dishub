'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  PackageIcon,
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  DownloadIcon,
  UploadIcon,
  GitBranchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  CalendarIcon,
  UsersIcon
} from 'lucide-react';
import { SuperAdminClient } from '@/lib/graphql/superAdmin';
import { toast } from 'sonner';

interface ModuleVersion {
  id: string;
  moduleName: string;
  version: string;
  releaseDate: string;
  status: 'STABLE' | 'BETA' | 'ALPHA' | 'DEPRECATED';
  changelog: string;
  downloadCount: number;
  tenantCount: number;
  compatibility: string[];
  size: string;
  author: string;
  isLatest: boolean;
  dependencies: string[];
  features: string[];
}

interface ModuleVersionsData {
  versions: ModuleVersion[];
  totalCount: number;
  modules: string[];
}

export default function SuperAdminModuleVersionsPage() {
  const [data, setData] = useState<ModuleVersionsData>({
    versions: [],
    totalCount: 0,
    modules: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadModuleVersionsData = async () => {
    try {
      setLoading(true);
      
      const filter = {
        ...(searchTerm && { search: searchTerm }),
        ...(moduleFilter && moduleFilter !== 'ALL' && { moduleName: moduleFilter }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter })
      };
      
      const pagination = {
        page: 1,
        pageSize: 50
      };

      // Use GraphQL client
      const moduleVersionsData = await SuperAdminClient.getModuleVersions(filter, pagination);
      
      setData({
        versions: moduleVersionsData.versions,
        totalCount: moduleVersionsData.totalCount,
        modules: moduleVersionsData.modules
      });
    } catch (error) {
      console.error('Error loading module versions:', error);
      toast.error('Failed to load module versions');
      
      // Fallback to mock data
      const mockData: ModuleVersionsData = {
        versions: [
          {
            id: '1',
            moduleName: 'CMS Engine',
            version: '2.1.0',
            releaseDate: '2024-01-15',
            status: 'STABLE',
            changelog: 'Added new page builder features, improved performance, bug fixes',
            downloadCount: 1250,
            tenantCount: 89,
            compatibility: ['2.0.x', '1.9.x'],
            size: '15.2 MB',
            author: 'Core Team',
            isLatest: true,
            dependencies: ['React 18+', 'Node.js 18+'],
            features: ['Page Builder', 'SEO Tools', 'Multi-language']
          },
          {
            id: '2',
            moduleName: 'E-commerce Engine',
            version: '1.5.0',
            releaseDate: '2024-01-10',
            status: 'STABLE',
            changelog: 'New payment gateway integrations, inventory management improvements',
            downloadCount: 890,
            tenantCount: 45,
            compatibility: ['1.4.x'],
            size: '22.1 MB',
            author: 'E-commerce Team',
            isLatest: true,
            dependencies: ['CMS Engine 2.0+', 'Payment SDK'],
            features: ['Shopping Cart', 'Payment Processing', 'Inventory']
          }
        ],
        totalCount: 2,
        modules: ['CMS Engine', 'E-commerce Engine']
      };

      // Apply filters
      let filteredVersions = mockData.versions;
      
      if (searchTerm) {
        filteredVersions = filteredVersions.filter(version =>
          version.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          version.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
          version.changelog.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (moduleFilter && moduleFilter !== 'ALL') {
        filteredVersions = filteredVersions.filter(version => version.moduleName === moduleFilter);
      }
      
      if (statusFilter && statusFilter !== 'ALL') {
        filteredVersions = filteredVersions.filter(version => version.status === statusFilter);
      }

      setData({
        ...mockData,
        versions: filteredVersions,
        totalCount: filteredVersions.length
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadModuleVersionsData();
    setRefreshing(false);
    toast.success('Module versions refreshed');
  };

  const handleSearch = () => {
    loadModuleVersionsData();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'stable':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircleIcon className="h-3 w-3 mr-1" />Stable</Badge>;
      case 'beta':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><GitBranchIcon className="h-3 w-3 mr-1" />Beta</Badge>;
      case 'alpha':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><ClockIcon className="h-3 w-3 mr-1" />Alpha</Badge>;
      case 'deprecated':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircleIcon className="h-3 w-3 mr-1" />Deprecated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    loadModuleVersionsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading module versions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📦 Module Versions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage module versions and releases • {data.totalCount} versions available
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
          <Button size="sm">
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload Version
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FilterIcon className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search modules, versions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Modules</SelectItem>
                  {data.modules.map((module) => (
                    <SelectItem key={module} value={module}>{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="STABLE">Stable</SelectItem>
                  <SelectItem value="BETA">Beta</SelectItem>
                  <SelectItem value="ALPHA">Alpha</SelectItem>
                  <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Versions List */}
      <div className="grid gap-6">
        {data.versions.map((version) => (
          <Card key={version.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PackageIcon className="h-8 w-8 text-indigo-600" />
                  <div>
                    <CardTitle className="text-xl flex items-center space-x-2">
                      <span>{version.moduleName}</span>
                      <TagIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-indigo-600">v{version.version}</span>
                      {version.isLatest && (
                        <Badge className="bg-green-100 text-green-800">Latest</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Released {formatDate(version.releaseDate)}
                      </span>
                      <span className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {version.tenantCount} tenants
                      </span>
                      <span className="flex items-center">
                        <DownloadIcon className="h-4 w-4 mr-1" />
                        {version.downloadCount.toLocaleString()} downloads
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(version.status)}
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="changelog">Changelog</TabsTrigger>
                  <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                  <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{version.size}</div>
                      <div className="text-sm text-gray-600">Package Size</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{version.tenantCount}</div>
                      <div className="text-sm text-gray-600">Active Tenants</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{version.downloadCount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Downloads</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{version.features.length}</div>
                      <div className="text-sm text-gray-600">Features</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {version.features.map((feature, index) => (
                        <Badge key={index} variant="outline">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="changelog" className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">What&apos;s New in v{version.version}</h4>
                    <p className="text-gray-700">{version.changelog}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="dependencies" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Required Dependencies</h4>
                    <div className="space-y-2">
                      {version.dependencies.map((dep, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-mono text-sm">{dep}</span>
                          <Badge variant="outline">Required</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="compatibility" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Compatible Versions</h4>
                    <div className="flex flex-wrap gap-2">
                      {version.compatibility.map((compat, index) => (
                        <Badge key={index} className="bg-green-100 text-green-800">{compat}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {data.versions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No module versions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || moduleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your filters to see more results.'
                : 'No module versions are available at the moment.'}
            </p>
            {(searchTerm || moduleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setModuleFilter('ALL');
                  setStatusFilter('ALL');
                  loadModuleVersionsData();
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 