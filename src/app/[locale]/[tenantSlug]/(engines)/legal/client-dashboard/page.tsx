'use client';

import React, { useState } from 'react';
import { 
  Building2,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Globe,
  UserCheck,
  CreditCard,
  BarChart3,
  PieChart,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  Download,
  Share,
  Settings,
  Star,
  Target,
  Paperclip
} from 'lucide-react';
import LegalClientSidebar from '@/components/sidebar/LegalClientSidebar';
import PageHeader from '@/components/PageHeader';

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock client data
  const clientData = {
    profile: {
      id: 'CLI-2024-001',
      name: 'TechVenture Solutions S.A.C.',
      industry: 'Technology & Software',
      type: 'Corporate',
      registrationDate: '2024-01-15',
      status: 'Active',
      tier: 'Premium',
      primaryContact: {
        name: 'Maria Rodriguez',
        title: 'CEO',
        email: 'maria.rodriguez@techventure.pe',
        phone: '+51 999 123 456',
        whatsapp: '+51 999 123 456'
      },
      address: {
        street: 'Av. Larco 1301, Oficina 1205',
        district: 'Miraflores',
        city: 'Lima',
        country: 'Peru',
        postalCode: '15074'
      },
      website: 'www.techventure.pe',
      taxId: '20123456789',
      employees: '25-50',
      revenue: 'S/ 2M - 5M'
    },
    metrics: {
      totalIncorporations: 3,
      activeProjects: 1,
      completedProjects: 2,
      totalSpent: 32600,
      avgProjectTime: 32,
      satisfactionScore: 4.8,
      lastActivity: '2024-01-20'
    },
    incorporations: [
      {
        id: 'INC-2024-015',
        companyName: 'TechVenture Solutions S.A.C.',
        status: 'completed',
        startDate: '2024-01-15',
        completionDate: '2024-02-18',
        type: 'S.A.C.',
        amount: 12500,
        assignedTo: 'Carlos Mendoza',
        office: 'Peru',
        country: 'Peru',
        flag: '🇵🇪'
      },
      {
        id: 'INC-2024-032',
        companyName: 'TechVenture Mexico S.A. de C.V.',
        status: 'completed',
        startDate: '2024-01-10',
        completionDate: '2024-02-15',
        type: 'S.A. de C.V.',
        amount: 15200,
        assignedTo: 'Miguel Santos',
        office: 'Mexico',
        country: 'Mexico',
        flag: '🇲🇽'
      },
      {
        id: 'INC-2024-048',
        companyName: 'TechVenture Colombia S.A.S.',
        status: 'in-progress',
        startDate: '2024-02-01',
        type: 'S.A.S.',
        amount: 4900,
        assignedTo: 'Diana Castro',
        office: 'Colombia',
        country: 'Colombia',
        flag: '🇨🇴',
        progress: 65
      }
    ],
    communications: [
      {
        id: 1,
        type: 'email',
        subject: 'Colombia S.A.S. - Final documents ready for signature',
        date: '2024-02-22 14:30',
        from: 'Diana Castro',
        fromRole: 'Legal Analyst - Colombia Office',
        to: 'Maria Rodriguez',
        status: 'unread',
        priority: 'high',
        content: 'Great news! All Colombia incorporation documents are finalized and ready for your digital signature. Please review and sign by February 25th to maintain our timeline.',
        attachments: ['Colombia_Final_Articles.pdf', 'Signature_Instructions.pdf'],
        relatedProject: 'INC-2024-048',
        actionRequired: true,
        dueDate: '2024-02-25',
        tags: ['urgent', 'signature-required', 'colombia']
      },
      {
        id: 2,
        type: 'whatsapp',
        subject: 'Banking update: Mexico account activated! 🎉',
        date: '2024-02-21 16:45',
        from: 'Miguel Santos',
        fromRole: 'Legal Analyst - Mexico Office',
        to: 'Maria Rodriguez',
        status: 'read',
        priority: 'medium',
        content: 'Excellent news! Your TechVenture Mexico corporate account is now active. Account details sent via secure email. You can start operations immediately.',
        attachments: [],
        relatedProject: 'INC-2024-032',
        actionRequired: false,
        tags: ['good-news', 'banking', 'mexico']
      },
      {
        id: 3,
        type: 'call',
        subject: 'Weekly strategy call - Multi-country expansion',
        date: '2024-02-20 10:00',
        duration: '35 min',
        from: 'Carlos Mendoza',
        fromRole: 'Senior Legal Advisor - Peru Office',
        participants: ['Maria Rodriguez', 'Carlos Mendoza', 'Diana Castro'],
        status: 'completed',
        priority: 'medium',
        content: 'Discussed Colombia progress (65% complete), reviewed expansion to Brazil/Chile options, addressed compliance questions for Peru operations.',
        notes: 'Client interested in Brazil next. Scheduled follow-up for March. Peru annual meeting prep needed.',
        relatedProject: 'multiple',
        tags: ['strategy', 'expansion', 'weekly-review']
      },
      {
        id: 4,
        type: 'email',
        subject: 'Action Required: Colombia shareholder documents',
        date: '2024-02-19 09:15',
        from: 'Diana Castro',
        fromRole: 'Legal Analyst - Colombia Office',
        to: 'Maria Rodriguez',
        status: 'read',
        priority: 'high',
        content: 'To complete your Colombia incorporation, please upload: 1) Updated shareholder certificates, 2) Proof of capital investment, 3) Board resolutions.',
        attachments: ['Colombia_Document_Checklist.pdf', 'Upload_Portal_Link.txt'],
        relatedProject: 'INC-2024-048',
        actionRequired: true,
        dueDate: '2024-02-23',
        tags: ['action-required', 'documents', 'colombia']
      },
      {
        id: 5,
        type: 'email',
        subject: 'Peru compliance reminder - Annual filings due',
        date: '2024-02-18 11:30',
        from: 'Carlos Mendoza',
        fromRole: 'Senior Legal Advisor - Peru Office',
        to: 'Maria Rodriguez',
        status: 'read',
        priority: 'medium',
        content: 'Annual reminder: Peru S.A.C. requires annual shareholders meeting by March 31st. We can handle all preparations and filings for you.',
        attachments: ['Peru_Annual_Compliance_Guide.pdf', 'Meeting_Template.docx'],
        relatedProject: 'INC-2024-015',
        actionRequired: true,
        dueDate: '2024-03-31',
        tags: ['compliance', 'annual', 'peru']
      },
      {
        id: 6,
        type: 'email',
        subject: 'Payment confirmation - Colombia incorporation',
        date: '2024-02-17 14:20',
        from: 'Billing Department',
        fromRole: 'Finance Team',
        to: 'Maria Rodriguez',
        status: 'read',
        priority: 'low',
        content: 'Payment received for Colombia incorporation services ($4,900). Work will commence immediately. Thank you for your business!',
        attachments: ['Payment_Receipt_INC048.pdf'],
        relatedProject: 'INC-2024-048',
        actionRequired: false,
        tags: ['payment', 'confirmation', 'colombia']
      }
    ],
    documents: [
      // Peru Documents (Completed)
      {
        id: 1,
        name: 'Articles of Incorporation - TechVenture Peru S.A.C.',
        type: 'Legal Document',
        size: '2.4 MB',
        uploadDate: '2024-02-18',
        status: 'signed',
        category: 'incorporation',
        country: 'Peru',
        projectId: 'INC-2024-015',
        lastModified: '2024-02-18',
        signedBy: ['Maria Rodriguez', 'Carlos Mendoza'],
        validUntil: '2025-02-18',
        isPublic: false,
        tags: ['final', 'signed', 'peru']
      },
      {
        id: 2,
        name: 'Peru Tax Registration Certificate (RUC)',
        type: 'Government Document',
        size: '1.8 MB',
        uploadDate: '2024-02-17',
        status: 'approved',
        category: 'tax',
        country: 'Peru',
        projectId: 'INC-2024-015',
        lastModified: '2024-02-17',
        issuedBy: 'SUNAT Peru',
        registrationNumber: 'RUC-20123456789',
        validUntil: 'Permanent',
        isPublic: false,
        tags: ['government', 'tax', 'peru']
      },
      {
        id: 3,
        name: 'Peru Banking Authorization - Banco de Crédito',
        type: 'Financial Document',
        size: '956 KB',
        uploadDate: '2024-02-15',
        status: 'approved',
        category: 'banking',
        country: 'Peru',
        projectId: 'INC-2024-015',
        lastModified: '2024-02-15',
        accountNumber: 'BCP-194-****-7890',
        validUntil: 'Active',
        isPublic: false,
        tags: ['banking', 'peru', 'active']
      },
      // Mexico Documents (Completed)
      {
        id: 4,
        name: 'Mexico Constitution Document - S.A. de C.V.',
        type: 'Legal Document',
        size: '3.2 MB',
        uploadDate: '2024-02-14',
        status: 'signed',
        category: 'incorporation',
        country: 'Mexico',
        projectId: 'INC-2024-032',
        lastModified: '2024-02-14',
        signedBy: ['Maria Rodriguez', 'Miguel Santos'],
        registrationNumber: 'MEX-SAT-987654321',
        validUntil: '2025-02-14',
        isPublic: false,
        tags: ['final', 'signed', 'mexico']
      },
      {
        id: 5,
        name: 'Mexico RFC Certificate',
        type: 'Government Document',
        size: '1.5 MB',
        uploadDate: '2024-02-13',
        status: 'approved',
        category: 'tax',
        country: 'Mexico',
        projectId: 'INC-2024-032',
        lastModified: '2024-02-13',
        issuedBy: 'SAT Mexico',
        registrationNumber: 'RFC-TVM240213ABC',
        validUntil: 'Permanent',
        isPublic: false,
        tags: ['government', 'tax', 'mexico']
      },
      {
        id: 6,
        name: 'Mexico Corporate Bank Account - Santander',
        type: 'Financial Document',
        size: '1.1 MB',
        uploadDate: '2024-02-21',
        status: 'active',
        category: 'banking',
        country: 'Mexico',
        projectId: 'INC-2024-032',
        lastModified: '2024-02-21',
        accountNumber: 'SANT-MX-****-5678',
        validUntil: 'Active',
        isPublic: false,
        tags: ['banking', 'mexico', 'active', 'new']
      },
      // Colombia Documents (In Progress)
      {
        id: 7,
        name: 'Colombia S.A.S. Draft Articles',
        type: 'Legal Document',
        size: '2.8 MB',
        uploadDate: '2024-02-22',
        status: 'pending-signature',
        category: 'incorporation',
        country: 'Colombia',
        projectId: 'INC-2024-048',
        lastModified: '2024-02-22',
        dueDate: '2024-02-25',
        actionRequired: 'Digital signature required',
        validUntil: '2025-02-22',
        isPublic: false,
        tags: ['draft', 'signature-pending', 'colombia', 'urgent']
      },
      {
        id: 8,
        name: 'Colombia Shareholder Certificates',
        type: 'Legal Document',
        size: '845 KB',
        uploadDate: '2024-02-20',
        status: 'under-review',
        category: 'incorporation',
        country: 'Colombia',
        projectId: 'INC-2024-048',
        lastModified: '2024-02-20',
        reviewedBy: 'Diana Castro',
        expectedCompletion: '2024-02-24',
        isPublic: false,
        tags: ['certificates', 'review', 'colombia']
      },
      {
        id: 9,
        name: 'Colombia Capital Investment Proof',
        type: 'Financial Document',
        size: '567 KB',
        uploadDate: '2024-02-19',
        status: 'submitted',
        category: 'incorporation',
        country: 'Colombia',
        projectId: 'INC-2024-048',
        lastModified: '2024-02-19',
        submittedTo: 'Colombian Chamber of Commerce',
        trackingNumber: 'COL-CCI-2024-789',
        isPublic: false,
        tags: ['capital', 'submitted', 'colombia']
      }
    ],
    billing: [
      {
        id: 'INV-2024-158',
        description: 'TechVenture Solutions - Incorporation Services',
        amount: 12500,
        date: '2024-02-18',
        dueDate: '2024-03-20',
        status: 'paid',
        paymentMethod: 'Bank Transfer'
      },
      {
        id: 'INV-2024-189',
        description: 'InnovatePe Logistics - Incorporation in Progress',
        amount: 8900,
        date: '2024-02-01',
        dueDate: '2024-03-03',
        status: 'pending',
        paymentMethod: 'Credit Card'
      }
    ]
  };

  const sidebarItems = [
    { id: 'overview', label: 'Client Overview', icon: Building2 },
    { id: 'incorporations', label: 'Incorporations', icon: FileText },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Client Settings', icon: Settings }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'bg-green-100 text-green-700', label: 'Active' },
      'completed': { color: 'bg-green-100 text-green-700', label: 'Completed' },
      'in-progress': { color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
      'pending-documents': { color: 'bg-yellow-100 text-yellow-700', label: 'Pending Docs' },
      'pending': { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      'paid': { color: 'bg-green-100 text-green-700', label: 'Paid' },
      'signed': { color: 'bg-green-100 text-green-700', label: 'Signed' },
      'approved': { color: 'bg-blue-100 text-blue-700', label: 'Approved' },
      'sent': { color: 'bg-blue-100 text-blue-700', label: 'Sent' },
      'delivered': { color: 'bg-green-100 text-green-700', label: 'Delivered' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{clientData.profile.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">{clientData.profile.industry}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">{clientData.profile.type} Client</span>
                <span className="text-sm text-gray-400">•</span>
                {getStatusBadge(clientData.profile.status.toLowerCase())}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
              <Star className="h-4 w-4 mr-1" />
              {clientData.profile.tier}
            </span>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <Edit className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{clientData.metrics.totalIncorporations}</div>
            <div className="text-sm text-gray-500">Total Incorporations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">S/ {clientData.metrics.totalSpent.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{clientData.metrics.avgProjectTime}</div>
            <div className="text-sm text-gray-500">Avg. Days/Project</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{clientData.metrics.satisfactionScore}/5</div>
            <div className="text-sm text-gray-500">Satisfaction Score</div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">{clientData.profile.primaryContact.name}</div>
                <div className="text-sm text-gray-500">{clientData.profile.primaryContact.title}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">{clientData.profile.primaryContact.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">{clientData.profile.primaryContact.phone}</span>
            </div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">{clientData.profile.primaryContact.whatsapp}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-gray-700">{clientData.profile.address.street}</div>
                <div className="text-sm text-gray-500">
                  {clientData.profile.address.district}, {clientData.profile.address.city}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">{clientData.profile.website}</span>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">RUC: {clientData.profile.taxId}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">{clientData.profile.employees} employees</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Multi-Country Presence</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View Details</button>
        </div>
        <div className="space-y-4">
          {clientData.incorporations.map((inc) => (
            <div key={inc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{inc.flag}</span>
                <div>
                  <div className="font-medium text-gray-900">{inc.country} - {inc.companyName}</div>
                  <div className="text-sm text-gray-500">{inc.type} • {inc.office} Office</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(inc.status)}
                <span className="text-sm font-medium text-gray-900">$ {inc.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Expansion Opportunities */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-700">
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">Expansion Opportunity</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            Consider expanding to Brazil or Chile for complete Latin American market coverage.
          </p>
        </div>
      </div>
    </div>
  );

  const renderIncorporations = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Multi-Country Incorporations</h2>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span>New Country</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          One incorporation per country for streamlined international business operations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientData.incorporations.map((inc) => (
            <div key={inc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{inc.flag}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{inc.country}</h3>
                    <span className="text-sm text-gray-500">{inc.type}</span>
                  </div>
                </div>
                {getStatusBadge(inc.status)}
              </div>
              
              <div className="mb-3">
                <h4 className="font-medium text-gray-800 text-sm mb-1">{inc.companyName}</h4>
                <p className="text-xs text-gray-500">ID: {inc.id}</p>
              </div>

              {inc.progress && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{inc.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${inc.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-xs text-gray-500 mb-4">
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span>{inc.startDate}</span>
                </div>
                {inc.completionDate && (
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span>{inc.completionDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Assigned to:</span>
                  <span>{inc.assignedTo}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Amount:</span>
                  <span>$ {inc.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center space-x-1">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs font-medium text-gray-600">{inc.office} Office</span>
              </div>
            </div>
          ))}
        </div>

        {/* Available Countries */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Available for Expansion</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>🇧🇷</span>
              <span>Brazil</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🇨🇱</span>
              <span>Chile</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🇪🇨</span>
              <span>Ecuador</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🇺🇾</span>
              <span>Uruguay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommunications = () => {
    const actionRequiredComms = clientData.communications.filter((comm: any) => comm.actionRequired);
    const recentComms = clientData.communications;

    return (
      <div className="space-y-6">
        {/* Action Required Section */}
        {actionRequiredComms.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Action Required</h3>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {actionRequiredComms.length} item{actionRequiredComms.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {actionRequiredComms.map((comm: any) => (
                <div key={comm.id} className="bg-white rounded-lg p-4 border border-red-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{comm.subject}</h4>
                      <p className="text-sm text-gray-600 mt-1">{comm.content}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>From: {comm.from} ({comm.fromRole})</span>
                        <span>Due: {comm.dueDate}</span>
                        <span>Project: {comm.relatedProject}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">URGENT</span>
                      <button className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                        Take Action
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communication History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Communication History</h2>
            <div className="flex space-x-3">
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Types</option>
                <option>Emails</option>
                <option>Calls</option>
                <option>WhatsApp</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Projects</option>
                <option>Peru (INC-2024-015)</option>
                <option>Mexico (INC-2024-032)</option>
                <option>Colombia (INC-2024-048)</option>
              </select>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                New Message
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {recentComms.map((comm: any) => (
              <div key={comm.id} className={`border rounded-lg p-4 ${comm.status === 'unread' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${comm.status === 'unread' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {comm.type === 'email' && <Mail className={`h-4 w-4 ${comm.status === 'unread' ? 'text-blue-600' : 'text-gray-600'}`} />}
                      {comm.type === 'call' && <Phone className={`h-4 w-4 ${comm.status === 'unread' ? 'text-blue-600' : 'text-gray-600'}`} />}
                      {comm.type === 'whatsapp' && <MessageSquare className={`h-4 w-4 ${comm.status === 'unread' ? 'text-blue-600' : 'text-gray-600'}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`font-medium ${comm.status === 'unread' ? 'text-blue-900' : 'text-gray-900'}`}>
                          {comm.subject}
                        </h3>
                        {comm.status === 'unread' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            NEW
                          </span>
                        )}
                        {comm.actionRequired && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            ACTION REQUIRED
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{comm.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>From: {comm.from} ({comm.fromRole})</span>
                          <span>{comm.date}</span>
                          {comm.duration && <span>Duration: {comm.duration}</span>}
                          {comm.relatedProject && <span>Project: {comm.relatedProject}</span>}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {comm.attachments && comm.attachments.length > 0 && (
                            <span className="flex items-center space-x-1 text-xs text-gray-500">
                              <Paperclip className="h-3 w-3" />
                              <span>{comm.attachments.length}</span>
                            </span>
                          )}
                          {getStatusBadge(comm.status)}
                        </div>
                      </div>

                      {/* Tags */}
                      {comm.tags && comm.tags.length > 0 && (
                        <div className="flex items-center space-x-2 mt-3">
                          {comm.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Attachments List */}
                      {comm.attachments && comm.attachments.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Attachments:</h4>
                          <div className="space-y-1">
                            {comm.attachments.map((attachment: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2 text-xs">
                                <FileText className="h-3 w-3 text-gray-500" />
                                <span className="text-blue-600 hover:text-blue-800 cursor-pointer">{attachment}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => {
    const pendingDocs = clientData.documents.filter((doc: any) => 
      doc.status === 'pending-signature' || doc.actionRequired
    );
    const docsByCountry = clientData.documents.reduce((acc: any, doc: any) => {
      if (!acc[doc.country]) acc[doc.country] = [];
      acc[doc.country].push(doc);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {/* Action Required Documents */}
        {pendingDocs.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-900">Documents Requiring Attention</h3>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                {pendingDocs.length} item{pendingDocs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDocs.map((doc: any) => (
                <div key={doc.id} className="bg-white rounded-lg p-4 border border-yellow-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-yellow-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                        <p className="text-sm text-gray-600">{doc.country} • {doc.type}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                      {doc.actionRequired || 'ACTION NEEDED'}
                    </span>
                  </div>
                  {doc.dueDate && (
                    <p className="text-sm text-red-600 mb-3">Due: {doc.dueDate}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                      {doc.status === 'pending-signature' ? 'Sign Now' : 'Take Action'}
                    </button>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Library by Country */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Document Library</h2>
            <div className="flex space-x-3">
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Categories</option>
                <option>Incorporation</option>
                <option>Tax</option>
                <option>Banking</option>
                <option>Compliance</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Countries</option>
                <option>Peru</option>
                <option>Mexico</option>
                <option>Colombia</option>
              </select>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Upload Document
              </button>
            </div>
          </div>

          {/* Country Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {Object.keys(docsByCountry).map((country) => (
                <button
                  key={country}
                  className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
                >
                  {country === 'Peru' ? '🇵🇪' : country === 'Mexico' ? '🇲🇽' : '🇨🇴'} {country} ({docsByCountry[country].length})
                </button>
              ))}
            </nav>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {clientData.documents.map((doc: any) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className={`h-8 w-8 ${
                      doc.status === 'signed' || doc.status === 'approved' || doc.status === 'active' 
                        ? 'text-green-500' 
                        : doc.status === 'pending-signature' 
                        ? 'text-yellow-500'
                        : 'text-blue-500'
                    }`} />
                    <span className="text-lg">{doc.country === 'Peru' ? '🇵🇪' : doc.country === 'Mexico' ? '🇲🇽' : '🇨🇴'}</span>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                <h3 className="font-medium text-gray-900 mb-2 text-sm leading-tight">{doc.name}</h3>
                
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{doc.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="capitalize">{doc.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modified:</span>
                    <span>{doc.lastModified}</span>
                  </div>
                  {doc.validUntil && doc.validUntil !== 'Permanent' && doc.validUntil !== 'Active' && (
                    <div className="flex justify-between">
                      <span>Valid Until:</span>
                      <span>{doc.validUntil}</span>
                    </div>
                  )}
                  {doc.registrationNumber && (
                    <div className="flex justify-between">
                      <span>Reg. Number:</span>
                      <span className="font-mono text-xs">{doc.registrationNumber}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.map((tag: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress for documents under review */}
                {doc.status === 'under-review' && doc.expectedCompletion && (
                  <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
                    <div className="flex justify-between text-blue-700">
                      <span>Under Review</span>
                      <span>Expected: {doc.expectedCompletion}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded">
                      <Share className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{doc.projectId}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Document Statistics */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {clientData.documents.filter((d: any) => d.status === 'signed' || d.status === 'approved' || d.status === 'active').length}
              </div>
              <div className="text-sm text-green-600">Completed Documents</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">
                {clientData.documents.filter((d: any) => d.status === 'pending-signature' || d.actionRequired).length}
              </div>
              <div className="text-sm text-yellow-600">Pending Action</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {clientData.documents.filter((d: any) => d.status === 'under-review' || d.status === 'submitted').length}
              </div>
              <div className="text-sm text-blue-600">Under Review</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">{clientData.documents.length}</div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBilling = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Billing & Payments</h2>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </button>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-700">S/ 12,500</div>
                <div className="text-sm text-green-600">Paid This Month</div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-700">S/ 8,900</div>
                <div className="text-sm text-yellow-600">Outstanding</div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-700">S/ 85,400</div>
                <div className="text-sm text-blue-600">Total Lifetime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-4">
          {clientData.billing.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{invoice.id}</h3>
                  <p className="text-gray-600 mt-1">{invoice.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                    <span>Issued: {invoice.date}</span>
                    <span>•</span>
                    <span>Due: {invoice.dueDate}</span>
                    <span>•</span>
                    <span>{invoice.paymentMethod}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">S/ {invoice.amount.toLocaleString()}</div>
                  <div className="mt-2">
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Client Analytics</h2>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-blue-500" />
              <div>
                <div className="text-lg font-bold text-blue-700">94%</div>
                <div className="text-sm text-blue-600">Success Rate</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-green-500" />
              <div>
                <div className="text-lg font-bold text-green-700">32 days</div>
                <div className="text-sm text-green-600">Avg. Completion</div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Star className="h-6 w-6 text-purple-500" />
              <div>
                <div className="text-lg font-bold text-purple-700">4.8/5</div>
                <div className="text-sm text-purple-600">Satisfaction</div>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-6 w-6 text-orange-500" />
              <div>
                <div className="text-lg font-bold text-orange-700">12 hrs</div>
                <div className="text-sm text-orange-600">Response Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Timeline Chart</p>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service Distribution</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Distribution Chart</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Client Settings</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Email Notifications</div>
                  <div className="text-sm text-gray-500">Receive updates via email</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">SMS Notifications</div>
                  <div className="text-sm text-gray-500">Receive urgent updates via SMS</div>
                </div>
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">WhatsApp Updates</div>
                  <div className="text-sm text-gray-500">Receive updates via WhatsApp</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Auto-renewal</div>
                  <div className="text-sm text-gray-500">Automatically renew services</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">Premium Support</div>
                  <div className="text-sm text-gray-500">Access to priority support</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'incorporations': return renderIncorporations();
      case 'communications': return renderCommunications();
      case 'documents': return renderDocuments();
      case 'billing': return renderBilling();
      case 'analytics': return renderAnalytics();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <LegalClientSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader
          title="Client Dashboard"
          description={`Managing ${clientData.profile.name}`}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Client Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Client Menu
              </h3>
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
} 