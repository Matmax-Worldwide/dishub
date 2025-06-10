'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { 
  Search, 
  Briefcase, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Building2,
  MapPin,
  Eye,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  DollarSign,
  Target,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Enhanced clients data that matches incorporation structure
const clients = [
  {
    id: 1,
    name: 'TechVentures Peru S.A.C.',
    contact: 'María Elena Rodriguez',
    email: 'maria@techventures.pe',
    phone: '+51 999 123 456',
    address: 'Av. Larco 1301, Miraflores, Lima 15074, Peru',
    status: 'active',
    clientSince: '2023-06-15',
    type: 'S.A.C.',
    location: 'Lima, Peru',
    industry: 'Technology',
    totalProjects: 1,
    activeProjects: 0,
    totalRevenue: 12500,
    incorporations: [
      {
        id: 'INC-2024-001',
        companyName: 'TechVentures Peru S.A.C.',
        status: 'completed',
        priority: 'high',
        startDate: '2024-01-10',
        estimatedCompletion: '2024-02-15',
        progress: 100,
        assignedTo: 'Carlos Mendoza',
        office: '🇵🇪 Peru Office',
        lastUpdate: '2024-02-15',
        country: 'Peru'
      }
    ]
  },
  {
    id: 2,
    name: 'Global Commerce E.I.R.L.',
    contact: 'Carlos Alberto Silva',
    email: 'carlos@globalcommerce.pe',
    phone: '+51 999 789 012',
    address: 'Jr. de la Unión 500, Cercado de Lima, Lima 15001, Peru',
    status: 'active',
    clientSince: '2023-09-20',
    type: 'E.I.R.L.',
    location: 'Arequipa, Peru',
    industry: 'Import/Export',
    totalProjects: 2,
    activeProjects: 1,
    totalRevenue: 18000,
    incorporations: [
      {
        id: 'INC-2024-008',
        companyName: 'Global Commerce E.I.R.L.',
        status: 'on-track',
        priority: 'medium',
        startDate: '2024-01-12',
        estimatedCompletion: '2024-02-10',
        progress: 85,
        assignedTo: 'Luis Rodriguez',
        office: '🇵🇪 Peru Office',
        lastUpdate: '2024-01-19'
      }
    ]
  },
  {
    id: 3,
    name: 'Innovation Labs S.A.',
    contact: 'Ana Patricia Vargas',
    email: 'ana@innovationlabs.pe',
    phone: '+51 999 345 678',
    address: 'Av. El Sol 315, San Blas, Cusco 08003, Peru',
    status: 'completed',
    clientSince: '2023-08-10',
    type: 'S.A.',
    location: 'Cusco, Peru',
    industry: 'Research & Development',
    totalProjects: 1,
    activeProjects: 0,
    totalRevenue: 15000,
    incorporations: [
      {
        id: 'INC-2023-045',
        companyName: 'Innovation Labs S.A.',
        status: 'completed',
        priority: 'high',
        startDate: '2023-12-15',
        estimatedCompletion: '2024-01-15',
        progress: 100,
        assignedTo: 'Carmen Flores',
        office: '🇵🇪 Peru Office',
        lastUpdate: '2024-01-15'
      }
    ]
  },
  {
    id: 4,
    name: 'Digital Solutions Mexico S.A. de C.V.',
    contact: 'Roberto Martinez',
    email: 'roberto@digitalsolutions.mx',
    phone: '+52 55 1234 5678',
    address: 'Paseo de la Reforma 250, Cuauhtémoc, 06500 Ciudad de México, CDMX',
    status: 'active',
    clientSince: '2023-11-05',
    type: 'S.A. de C.V.',
    location: 'Mexico City, Mexico',
    industry: 'Software Development',
    totalProjects: 2,
    activeProjects: 1,
    totalRevenue: 32000,
    incorporations: [
      {
        id: 'INC-2024-012',
        companyName: 'Digital Solutions Mexico S.A. de C.V.',
        status: 'at-risk',
        priority: 'critical',
        startDate: '2024-01-08',
        estimatedCompletion: '2024-02-05',
        progress: 30,
        assignedTo: 'Miguel Santos',
        office: '🇲🇽 Mexico Office',
        lastUpdate: '2024-01-17'
      }
    ]
  },
  {
    id: 5,
    name: 'Exportadora Andina S.A.S.',
    contact: 'Gabriela Moreno',
    email: 'gabriela@exportadoraandina.co',
    phone: '+57 1 345 6789',
    address: 'Carrera 7 # 71-21, Chapinero, Bogotá, Colombia',
    status: 'active',
    clientSince: '2023-10-12',
    type: 'S.A.S.',
    location: 'Bogotá, Colombia',
    industry: 'Agriculture Export',
    totalProjects: 1,
    activeProjects: 1,
    totalRevenue: 22000,
    incorporations: [
      {
        id: 'INC-2024-003',
        companyName: 'Exportadora Andina S.A.S.',
        status: 'in-progress',
        priority: 'medium',
        startDate: '2024-01-05',
        estimatedCompletion: '2024-02-12',
        progress: 60,
        assignedTo: 'Diana Castro',
        office: '🇨🇴 Colombia Office',
        lastUpdate: '2024-01-19'
      }
    ]
  }
];

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const {locale, tenantSlug} = useParams();
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      case 'pending-documents': return 'bg-yellow-100 text-yellow-700';
      case 'at-risk': return 'bg-red-100 text-red-700';
      case 'on-track': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getIncorporationStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending-documents': return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'at-risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'on-track': return <Target className="h-4 w-4 text-emerald-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const completedProjects = clients.reduce((sum, c) => sum + (c.totalProjects - c.activeProjects), 0);
  const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Overview"
        description="Manage client relationships and track incorporation projects"
        onMenuClick={() => {}}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{activeClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Projects</p>
              <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Client Directory</h2>
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients List */}
        <div className={`${selectedClient ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white rounded-xl shadow-sm`}>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              {filteredClients.length} Client{filteredClients.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredClients.map((client) => (
              <div 
                key={client.id} 
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedClient?.id === client.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{client.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                          {client.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{client.contact}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>{client.industry}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{client.incorporations?.length || 0} countries</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Detail Panel */}
        {selectedClient && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Client Details</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Client Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">{selectedClient.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Contact Person:</span>
                        <p className="font-medium text-gray-900">{selectedClient.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium text-gray-900">{selectedClient.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium text-gray-900">{selectedClient.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Address:</span>
                        <p className="font-medium text-gray-900">{selectedClient.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <p className="font-medium text-gray-900">{selectedClient.industry}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500">Client Since:</span>
                        <p className="font-medium text-gray-900">{new Date(selectedClient.clientSince).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedClient.incorporations.length}</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedClient.incorporations.filter(inc => inc.status === 'completed').length}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">${selectedClient.totalRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
              </div>

              {/* Client Dashboard Button */}
              <div className="flex justify-center">
                <Link
                  href={`/${locale}/${tenantSlug}/legal/client-dashboard`}
                  className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">View Client Dashboard</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Incorporation Projects */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Incorporation Projects</h4>
                <div className="space-y-4">
                  {selectedClient.incorporations.map((incorporation) => (
                    <div key={incorporation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h5 className="font-medium text-gray-900">{incorporation.companyName}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incorporation.status)}`}>
                              {incorporation.status.replace('-', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              incorporation.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              incorporation.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              incorporation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {incorporation.priority} priority
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">ID: {incorporation.id}</p>
                        </div>
                        {getIncorporationStatusIcon(incorporation.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Start Date:</span> {new Date(incorporation.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Est. Completion:</span> {new Date(incorporation.estimatedCompletion).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Assigned To:</span> {incorporation.assignedTo}
                        </div>
                        <div>
                          <span className="font-medium">Office:</span> {incorporation.office}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">Progress</span>
                          <span className="text-gray-600">{incorporation.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              incorporation.status === 'completed' ? 'bg-green-500' :
                              incorporation.status === 'at-risk' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${incorporation.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(incorporation.lastUpdate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 