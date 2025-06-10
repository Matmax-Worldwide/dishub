'use client';

import React, { useState } from 'react';  
import PageHeader from '@/components/PageHeader';
import { 
  Building2,
  Search,
  Filter,
  Download,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Target,
  User,
  Calendar,
  MapPin,
  ChevronRight,
  X,
  Phone,
  Mail
} from 'lucide-react';
import NewIncorporationModal from '@/components/NewIncorporationModal';

// Enhanced incorporations data that matches client structure
const incorporations = [
  {
    id: 'INC-2024-001',
    companyName: 'TechVentures Peru S.A.C.',
    status: 'in-progress',
    priority: 'high',
    startDate: '2024-01-10',
    estimatedCompletion: '2024-02-15',
    progress: 75,
    assignedTo: 'Carlos Mendoza',
    office: '🇵🇪 Peru Office',
    lastUpdate: '2024-01-20',
    type: 'S.A.C.',
    industry: 'Technology',
    client: {
      id: 1,
      name: 'TechVentures Peru S.A.C.',
      contact: 'María Elena Rodriguez',
      email: 'maria@techventures.pe',
      phone: '+51 999 123 456',
      address: 'Av. Larco 1301, Miraflores, Lima 15074, Peru'
    },
    documents: [
      { name: 'Articles of Incorporation', status: 'completed', uploadDate: '2024-01-12' },
      { name: 'Bylaws', status: 'completed', uploadDate: '2024-01-15' },
      { name: 'Tax Registration', status: 'pending', uploadDate: null },
      { name: 'Operating Agreement', status: 'in-review', uploadDate: '2024-01-18' }
    ],
    timeline: [
      { date: '2024-01-10', event: 'Incorporation process started', type: 'milestone' },
      { date: '2024-01-12', event: 'Articles of Incorporation filed', type: 'document' },
      { date: '2024-01-15', event: 'Bylaws submitted', type: 'document' },
      { date: '2024-01-18', event: 'Operating Agreement under review', type: 'update' },
      { date: '2024-01-20', event: 'Client meeting scheduled', type: 'meeting' }
    ],
    fees: {
      total: 8500,
      paid: 6500,
      pending: 2000,
      currency: 'USD'
    }
  },
  {
    id: 'INC-2024-015',
    companyName: 'TechVentures Subsidiary Ltd.',
    status: 'pending-documents',
    priority: 'medium',
    startDate: '2024-01-15',
    estimatedCompletion: '2024-02-20',
    progress: 40,
    assignedTo: 'Ana Torres',
    office: '🇵🇪 Peru Office',
    lastUpdate: '2024-01-18',
    type: 'Ltd.',
    industry: 'Technology',
    client: {
      id: 1,
      name: 'TechVentures Peru S.A.C.',
      contact: 'María Elena Rodriguez',
      email: 'maria@techventures.pe',
      phone: '+51 999 123 456',
      address: 'Av. Larco 1301, Miraflores, Lima 15074, Peru'
    },
    documents: [
      { name: 'Memorandum of Association', status: 'completed', uploadDate: '2024-01-16' },
      { name: 'Articles of Association', status: 'pending', uploadDate: null },
      { name: 'Directors Consent', status: 'pending', uploadDate: null }
    ],
    timeline: [
      { date: '2024-01-15', event: 'Subsidiary incorporation initiated', type: 'milestone' },
      { date: '2024-01-16', event: 'Memorandum filed', type: 'document' },
      { date: '2024-01-18', event: 'Waiting for additional documents', type: 'update' }
    ],
    fees: {
      total: 5500,
      paid: 2000,
      pending: 3500,
      currency: 'USD'
    }
  },
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
    lastUpdate: '2024-01-19',
    type: 'E.I.R.L.',
    industry: 'Import/Export',
    client: {
      id: 2,
      name: 'Global Commerce E.I.R.L.',
      contact: 'Carlos Alberto Silva',
      email: 'carlos@globalcommerce.pe',
      phone: '+51 999 789 012',
      address: 'Jr. de la Unión 500, Cercado de Lima, Lima 15001, Peru'
    },
    documents: [
      { name: 'Foundation Charter', status: 'completed', uploadDate: '2024-01-13' },
      { name: 'Tax ID Application', status: 'completed', uploadDate: '2024-01-16' },
      { name: 'Municipal License', status: 'in-review', uploadDate: '2024-01-18' }
    ],
    timeline: [
      { date: '2024-01-12', event: 'E.I.R.L. process started', type: 'milestone' },
      { date: '2024-01-13', event: 'Foundation Charter approved', type: 'document' },
      { date: '2024-01-16', event: 'Tax ID obtained', type: 'milestone' },
      { date: '2024-01-18', event: 'Municipal license review', type: 'update' }
    ],
    fees: {
      total: 3200,
      paid: 3200,
      pending: 0,
      currency: 'USD'
    }
  },
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
    lastUpdate: '2024-01-15',
    type: 'S.A.',
    industry: 'Research & Development',
    client: {
      id: 3,
      name: 'Innovation Labs S.A.',
      contact: 'Ana Patricia Vargas',
      email: 'ana@innovationlabs.pe',
      phone: '+51 999 345 678',
      address: 'Av. El Sol 315, San Blas, Cusco 08003, Peru'
    },
    documents: [
      { name: 'Articles of Incorporation', status: 'completed', uploadDate: '2023-12-16' },
      { name: 'Shareholders Agreement', status: 'completed', uploadDate: '2023-12-20' },
      { name: 'Board Resolutions', status: 'completed', uploadDate: '2024-01-05' },
      { name: 'Final Registration', status: 'completed', uploadDate: '2024-01-15' }
    ],
    timeline: [
      { date: '2023-12-15', event: 'S.A. incorporation started', type: 'milestone' },
      { date: '2023-12-16', event: 'Articles filed successfully', type: 'document' },
      { date: '2023-12-20', event: 'Shareholders agreement signed', type: 'document' },
      { date: '2024-01-05', event: 'Board resolutions approved', type: 'milestone' },
      { date: '2024-01-15', event: 'Incorporation completed', type: 'milestone' }
    ],
    fees: {
      total: 7800,
      paid: 7800,
      pending: 0,
      currency: 'USD'
    }
  },
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
    lastUpdate: '2024-01-17',
    type: 'S.A. de C.V.',
    industry: 'Software Development',
    client: {
      id: 4,
      name: 'Digital Solutions Mexico S.A. de C.V.',
      contact: 'Roberto Martinez',
      email: 'roberto@digitalsolutions.mx',
      phone: '+52 55 1234 5678',
      address: 'Paseo de la Reforma 250, Cuauhtémoc, 06500 Ciudad de México, CDMX'
    },
    documents: [
      { name: 'Acta Constitutiva', status: 'pending', uploadDate: null },
      { name: 'RFC Application', status: 'pending', uploadDate: null },
      { name: 'Estatutos Sociales', status: 'in-review', uploadDate: '2024-01-10' }
    ],
    timeline: [
      { date: '2024-01-08', event: 'S.A. de C.V. process initiated', type: 'milestone' },
      { date: '2024-01-10', event: 'Estatutos submitted for review', type: 'document' },
      { date: '2024-01-17', event: 'Delays due to missing documents', type: 'alert' }
    ],
    fees: {
      total: 12000,
      paid: 4000,
      pending: 8000,
      currency: 'USD'
    }
  },
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
    lastUpdate: '2024-01-19',
    type: 'S.A.S.',
    industry: 'Agriculture Export',
    client: {
      id: 5,
      name: 'Exportadora Andina S.A.S.',
      contact: 'Gabriela Moreno',
      email: 'gabriela@exportadoraandina.co',
      phone: '+57 1 345 6789',
      address: 'Carrera 7 # 71-21, Chapinero, Bogotá, Colombia'
    },
    documents: [
      { name: 'Escritura de Constitución', status: 'completed', uploadDate: '2024-01-07' },
      { name: 'Registro Mercantil', status: 'in-review', uploadDate: '2024-01-12' },
      { name: 'RUT Application', status: 'pending', uploadDate: null }
    ],
    timeline: [
      { date: '2024-01-05', event: 'S.A.S. incorporation started', type: 'milestone' },
      { date: '2024-01-07', event: 'Constitutional deed executed', type: 'document' },
      { date: '2024-01-12', event: 'Commercial registry filing', type: 'document' },
      { date: '2024-01-19', event: 'Registry review in progress', type: 'update' }
    ],
    fees: {
      total: 6800,
      paid: 3400,
      pending: 3400,
      currency: 'USD'
    }
  }
];

export default function IncorporationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncorporation, setSelectedIncorporation] = useState<typeof incorporations[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterOffice, setFilterOffice] = useState('all');
  const [showNewIncorporationModal, setShowNewIncorporationModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  
  // Multi-step incorporation form state
  const [incorporationData, setIncorporationData] = useState({
    // Step 1: Basic Company Information
    basicInfo: {
      companyName: '',
      entityType: 'S.A.C.',
      businessActivity: '',
      industry: '',
      priority: 'medium'
    },
    // Step 2: Shareholders & Capital
    shareholders: {
      shareholders: [
        { name: '', nationality: 'Peruvian', idType: 'DNI', idNumber: '', percentage: 100, contribution: 0 }
      ],
      shareCapital: 0,
      paidCapital: 0,
      sharesPerSol: 1
    },
    // Step 3: Company Management
    management: {
      hasBoard: false,
      boardMembers: [],
      manager: { name: '', nationality: 'Peruvian', idType: 'DNI', idNumber: '' },
      legalRepresentative: { name: '', nationality: 'Peruvian', idType: 'DNI', idNumber: '' }
    },
    // Step 4: Company Address & Contact
    address: {
      legalAddress: '',
      district: '',
      province: 'Lima',
      department: 'Lima',
      postalCode: '',
      phone: '',
      email: '',
      businessPremises: 'rented' // rented, owned, shared
    },
    // Step 5: Banking & Financial
    banking: {
      bankName: '',
      accountType: 'current', // current, savings
      initialDeposit: 0,
      hasAccountantPlan: false,
      accountant: { name: '', cip: '', phone: '' }
    },
    // Step 6: Legal Requirements
    legal: {
      hasLegalRepresentative: true,
      powerOfAttorney: false,
      notaryOffice: '',
      registryOffice: 'Lima',
      sunatOffice: '',
      municipalLicense: false
    },
    // Step 7: Assignment & Timeline
    assignment: {
      office: 'Peru',
      assignedTo: 'Carlos Mendoza',
      estimatedCompletion: '',
      urgency: 'normal', // normal, express, urgent
      clientContact: {
        name: '',
        email: '',
        phone: '',
        preferredContact: 'email'
      }
    }
  });

  const filteredIncorporations = incorporations.filter(incorporation => {
    const matchesSearch = incorporation.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incorporation.client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incorporation.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incorporation.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || incorporation.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || incorporation.priority === filterPriority;
    const matchesOffice = filterOffice === 'all' || incorporation.office.includes(filterOffice);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesOffice;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'pending-documents': return 'bg-yellow-100 text-yellow-700';
      case 'at-risk': return 'bg-red-100 text-red-700';
      case 'on-track': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending-documents': return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'at-risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'on-track': return <Target className="h-4 w-4 text-emerald-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-review': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Target className="h-4 w-4 text-blue-500" />;
      case 'document': return <FileText className="h-4 w-4 text-green-500" />;
      case 'update': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Helper functions for multi-step form
  const updateIncorporationData = (section: string, data: Record<string, unknown>) => {
    setIncorporationData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], ...data }
    }));
  };

  const addShareholder = () => {
    setIncorporationData(prev => ({
      ...prev,
      shareholders: {
        ...prev.shareholders,
        shareholders: [
          ...prev.shareholders.shareholders,
          { name: '', nationality: 'Peruvian', idType: 'DNI', idNumber: '', percentage: 0, contribution: 0 }
        ]
      }
    }));
  };

  const removeShareholder = (index: number) => {
    setIncorporationData(prev => ({
      ...prev,
      shareholders: {
        ...prev.shareholders,
        shareholders: prev.shareholders.shareholders.filter((_, i) => i !== index)
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setIncorporationData({
      basicInfo: {
        companyName: '',
        entityType: 'S.A.C.',
        businessActivity: '',
        industry: '',
        priority: 'medium'
      },
      shareholders: {
        shareholders: [
          { name: '', nationality: 'Peruvian', idType: 'DNI', idNumber: '', percentage: 100, contribution: 0 }
        ],
        shareCapital: 0,
        paidCapital: 0,
        sharesPerSol: 1
      },
      management: {
        hasBoard: false,
        boardMembers: [],
        manager: { name: '', nationality: 'Peruvian', idType: 'DNI', idNumber: '' },
        legalRepresentative: { name: '', nationality: 'Peruvian', idType: 'DNI', idNumber: '' }
      },
      address: {
        legalAddress: '',
        district: '',
        province: 'Lima',
        department: 'Lima',
        postalCode: '',
        phone: '',
        email: '',
        businessPremises: 'rented'
      },
      banking: {
        bankName: '',
        accountType: 'current',
        initialDeposit: 0,
        hasAccountantPlan: false,
        accountant: { name: '', cip: '', phone: '' }
      },
      legal: {
        hasLegalRepresentative: true,
        powerOfAttorney: false,
        notaryOffice: '',
        registryOffice: 'Lima',
        sunatOffice: '',
        municipalLicense: false
      },
      assignment: {
        office: 'Peru',
        assignedTo: 'Carlos Mendoza',
        estimatedCompletion: '',
        urgency: 'normal',
        clientContact: {
          name: '',
          email: '',
          phone: '',
          preferredContact: 'email'
        }
      }
    });
  };

  const handleIncorporationSubmit = () => {
    // Here you would typically submit the data to your backend
    console.log('Submitting incorporation data:', incorporationData);
    
    // For demo purposes, show success message
    alert(`New incorporation "${incorporationData.basicInfo.companyName}" has been created successfully! Assigned to ${incorporationData.assignment.assignedTo} in ${incorporationData.assignment.office} office.`);
    
    // Reset form and close modal
    resetForm();
    setShowNewIncorporationModal(false);
  };

  // Statistics
  const totalActive = incorporations.filter(inc => inc.status === 'in-progress' || inc.status === 'pending-documents' || inc.status === 'on-track').length;
  const completedMTD = incorporations.filter(inc => inc.status === 'completed').length;
  const atRisk = incorporations.filter(inc => inc.status === 'at-risk').length;
  const avgDays = Math.round(incorporations.reduce((sum, inc) => {
    const start = new Date(inc.startDate);
    const end = inc.status === 'completed' ? new Date(inc.lastUpdate) : new Date();
    return sum + Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  }, 0) / incorporations.length);

  return (
    <>
      <PageHeader
        title="All Incorporations"
        description="Manage all incorporation processes across all offices"
        onMenuClick={() => {}}
        showNewButton={true}
        newButtonText="New Incorporation"
        onNewClick={() => setShowNewIncorporationModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Active</p>
                <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed MTD</p>
                <p className="text-2xl font-bold text-gray-900">{completedMTD}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">At Risk</p>
                <p className="text-2xl font-bold text-gray-900">{atRisk}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Days</p>
                <p className="text-2xl font-bold text-gray-900">{avgDays}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filters & Search</h2>
            <button 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPriority('all');
                setFilterOffice('all');
              }}
            >
              Reset Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Company, client, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="in-progress">In Progress</option>
                <option value="pending-documents">Pending Documents</option>
                <option value="at-risk">At Risk</option>
                <option value="on-track">On Track</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Office</label>
              <select 
                value={filterOffice}
                onChange={(e) => setFilterOffice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Offices</option>
                <option value="Peru">🇵🇪 Peru Office</option>
                <option value="Mexico">🇲🇽 Mexico Office</option>
                <option value="Colombia">🇨🇴 Colombia Office</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="w-full flex items-center justify-center space-x-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incorporations List */}
          <div className={`${selectedIncorporation ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white rounded-xl shadow-sm`}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {filteredIncorporations.length} Incorporation{filteredIncorporations.length !== 1 ? 's' : ''}
              </h2>
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 border border-gray-300 rounded-lg">
                <Filter className="h-4 w-4" />
                <span>Advanced Filters</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredIncorporations.map((incorporation) => (
                <div 
                  key={incorporation.id} 
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedIncorporation?.id === incorporation.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedIncorporation(incorporation)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{incorporation.companyName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incorporation.status)}`}>
                          {incorporation.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center space-x-1">
                          <span className="font-medium">ID:</span>
                          <span>{incorporation.id}</span>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(incorporation.priority)}`}>
                          {incorporation.priority}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{incorporation.client.contact}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(incorporation.estimatedCompletion).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{incorporation.progress}% complete</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                    {getStatusIcon(incorporation.status)}
                  </div>
                  
                  <div className="mb-2">
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
                </div>
              ))}
            </div>
          </div>

          {/* Incorporation Detail Panel */}
          {selectedIncorporation && (
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Incorporation Details</h3>
                <button
                  onClick={() => setSelectedIncorporation(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">{selectedIncorporation.companyName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500">Incorporation ID:</span>
                        <p className="font-medium text-gray-900">{selectedIncorporation.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Entity Type:</span>
                        <p className="font-medium text-gray-900">{selectedIncorporation.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <p className="font-medium text-gray-900">{selectedIncorporation.industry}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Start Date:</span>
                        <p className="font-medium text-gray-900">{new Date(selectedIncorporation.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500">Assigned To:</span>
                        <p className="font-medium text-gray-900">{selectedIncorporation.assignedTo}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Office:</span>
                        <p className="font-medium text-gray-900">{selectedIncorporation.office}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Est. Completion:</span>
                        <p className="font-medium text-gray-900">{new Date(selectedIncorporation.estimatedCompletion).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Update:</span>
                        <p className="font-medium text-gray-900">{new Date(selectedIncorporation.lastUpdate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Progress */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Status & Progress</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedIncorporation.progress}%</div>
                      <div className="text-sm text-gray-600">Progress</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">${selectedIncorporation.fees.paid.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Fees Paid</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Overall Progress</span>
                      <span className="text-gray-600">{selectedIncorporation.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          selectedIncorporation.status === 'completed' ? 'bg-green-500' :
                          selectedIncorporation.status === 'at-risk' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${selectedIncorporation.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Client Information</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{selectedIncorporation.client.contact}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{selectedIncorporation.client.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedIncorporation.client.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-xs">{selectedIncorporation.client.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Financial Overview</h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">${selectedIncorporation.fees.total.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Total Fees</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">${selectedIncorporation.fees.paid.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Paid</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">${selectedIncorporation.fees.pending.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Documents</h5>
                  <div className="space-y-2">
                    {selectedIncorporation.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.uploadDate && (
                            <span className="text-xs text-gray-500">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                          )}
                          <span className={`text-xs font-medium ${getDocumentStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Timeline</h5>
                  <div className="space-y-3">
                    {selectedIncorporation.timeline.map((event, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getTimelineIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{event.event}</div>
                          <div className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Multi-Step New Incorporation Modal */}
      {showNewIncorporationModal && (
        <NewIncorporationModal
          showModal={showNewIncorporationModal}
          onClose={() => {
            setShowNewIncorporationModal(false);
            resetForm();
          }}
          currentStep={currentStep}
          totalSteps={totalSteps}
          incorporationData={incorporationData}
          updateIncorporationData={updateIncorporationData}
          addShareholder={addShareholder}
          removeShareholder={removeShareholder}
          nextStep={nextStep}
          prevStep={prevStep}
          onSubmit={handleIncorporationSubmit}
        />
      )}
    </>
  );
} 