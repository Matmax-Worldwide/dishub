'use client';

import React, { useState } from 'react';
import { 
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  DollarSign,
  UserPlus,
  Eye,
  MessageSquare,
  MoreVertical,
  AlertCircle,
  Download,
} from 'lucide-react';
import NewIncorporationModal from '@/components/NewIncorporationModal';
import PageHeader from '@/components/PageHeader';

// TypeScript interfaces
interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
  activeIncorporations: number;
  completedThisMonth: number;
  efficiency: number;
  status: 'available' | 'busy';
  workload: number;
}

interface Incorporation {
  id: number;
  companyName: string;
  client: string;
  type: string;
  status: string;
  progress: number;
  startDate: string;
  expectedDate: string;
  assignedTeam: string[];
  leadAnalyst: string;
  currentStep: string;
  location: string;
  capital: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastUpdate: string;
  blockers: string[];
  clientSatisfaction: number;
}

// Badge Components
function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors] || colors.medium}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    'in-progress': 'bg-blue-100 text-blue-700',
    'pending-documents': 'bg-yellow-100 text-yellow-700',
    'at-risk': 'bg-red-100 text-red-700',
    'on-track': 'bg-green-100 text-green-700',
    'completed': 'bg-green-100 text-green-700'
  };
  
  const labels = {
    'in-progress': 'In Progress',
    'pending-documents': 'Pending Docs',
    'at-risk': 'At Risk',
    'on-track': 'On Track',
    'completed': 'Completed'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors['in-progress']}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

// Mock team members data
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "María González",
    role: "Senior Legal Analyst",
    avatar: "MG",
    activeIncorporations: 5,
    completedThisMonth: 3,
    efficiency: 92,
    status: "available",
    workload: 75
  },
  {
    id: 2,
    name: "Carlos Mendez",
    role: "Legal Analyst",
    avatar: "CM",
    activeIncorporations: 4,
    completedThisMonth: 2,
    efficiency: 88,
    status: "busy",
    workload: 90
  },
  {
    id: 3,
    name: "Ana Vargas",
    role: "Senior Legal Analyst",
    avatar: "AV",
    activeIncorporations: 6,
    completedThisMonth: 4,
    efficiency: 95,
    status: "available",
    workload: 80
  },
  {
    id: 4,
    name: "José Rodriguez",
    role: "Junior Legal Analyst",
    avatar: "JR",
    activeIncorporations: 3,
    completedThisMonth: 1,
    efficiency: 85,
    status: "available",
    workload: 60
  }
];

// Enhanced mock incorporations with team responsibility
const mockIncorporations: Incorporation[] = [
  {
    id: 1,
    companyName: "TechVentures Peru S.A.C.",
    client: "John Smith",
    type: "S.A.C.",
    status: "in-progress",
    progress: 65,
    startDate: "2025-05-15",
    expectedDate: "2025-06-25",
    assignedTeam: ["María González", "José Rodriguez"],
    leadAnalyst: "María González",
    currentStep: "SUNARP Registration",
    location: "Lima",
    capital: "S/ 50,000",
    priority: "high",
    lastUpdate: "2 hours ago",
    blockers: [],
    clientSatisfaction: 4.5
  },
  {
    id: 2,
    companyName: "Global Commerce E.I.R.L.",
    client: "Sarah Johnson",
    type: "E.I.R.L.",
    status: "pending-documents",
    progress: 35,
    startDate: "2025-05-20",
    expectedDate: "2025-06-30",
    assignedTeam: ["Carlos Mendez"],
    leadAnalyst: "Carlos Mendez",
    currentStep: "Document Collection",
    location: "Arequipa",
    capital: "S/ 20,000",
    priority: "medium",
    lastUpdate: "1 day ago",
    blockers: ["Missing power of attorney", "Pending client signature"],
    clientSatisfaction: 4.0
  },
  {
    id: 3,
    companyName: "Innovation Labs S.A.",
    client: "Michael Chen",
    type: "S.A.",
    status: "at-risk",
    progress: 45,
    startDate: "2025-04-25",
    expectedDate: "2025-06-15",
    assignedTeam: ["Ana Vargas", "María González"],
    leadAnalyst: "Ana Vargas",
    currentStep: "Notary Process",
    location: "Lima",
    capital: "S/ 100,000",
    priority: "critical",
    lastUpdate: "5 hours ago",
    blockers: ["Notary availability", "Document revision needed"],
    clientSatisfaction: 3.5
  },
  {
    id: 4,
    companyName: "Digital Solutions S.R.L.",
    client: "Emma Davis",
    type: "S.R.L.",
    status: "on-track",
    progress: 85,
    startDate: "2025-05-10",
    expectedDate: "2025-06-20",
    assignedTeam: ["José Rodriguez", "Ana Vargas"],
    leadAnalyst: "Ana Vargas",
    currentStep: "Municipal License",
    location: "Cusco",
    capital: "S/ 30,000",
    priority: "medium",
    lastUpdate: "30 minutes ago",
    blockers: [],
    clientSatisfaction: 5.0
  }
];

// Team performance metrics
const performanceMetrics = {
  overall: {
    incorporationsCompleted: 24,
    averageTimeToComplete: 28,
    clientSatisfaction: 4.3,
    onTimeDelivery: 87
  },
  byOffice: {
    peru: { active: 15, completed: 12, efficiency: 89 },
    mexico: { active: 8, completed: 6, efficiency: 85 },
    colombia: { active: 10, completed: 6, efficiency: 82 }
  }
};

// Team Member Card Component
function TeamMemberCard({ member, onAssign }: { member: TeamMember; onAssign: (member: TeamMember) => void }) {
  const statusColor = member.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">{member.avatar}</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-500">{member.role}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {member.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{member.activeIncorporations}</p>
          <p className="text-xs text-gray-500">Active Cases</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{member.completedThisMonth}</p>
          <p className="text-xs text-gray-500">Completed MTD</p>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">Efficiency</span>
          <span className="text-sm font-medium">{member.efficiency}%</span>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">Workload</span>
          <span className="text-sm font-medium">{member.workload}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full ${member.workload > 85 ? 'bg-red-500' : member.workload > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${member.workload}%` }}
          />
        </div>
      </div>
      
      <button 
        onClick={() => onAssign(member)}
        className="w-full flex items-center justify-center space-x-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg"
      >
        <UserPlus className="h-4 w-4" />
        <span>Assign Task</span>
      </button>
    </div>
  );
}

export default function Dashboard() {
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

  // Horizontal metrics organization
  const horizontalMetrics = [
    { label: 'Total Active', value: '24', change: '+3', trend: 'up', icon: Building2 },
    { label: 'At Risk', value: '3', change: '+1', trend: 'up', icon: AlertTriangle, alert: true },
    { label: 'Completed MTD', value: '12', change: '+2', trend: 'up', icon: CheckCircle2 },
    { label: 'Avg. Days', value: '28', change: '-2', trend: 'down', icon: Clock },
    { label: 'Client Satisfaction', value: '4.3/5', change: '+0.2', trend: 'up', icon: Award },
    { label: 'Team Efficiency', value: '89%', change: '+3%', trend: 'up', icon: TrendingUp },
    { label: 'Revenue MTD', value: 'S/145K', change: '+18%', trend: 'up', icon: DollarSign }
  ];

  const handleDelegateClick = (incorporation: Incorporation) => {
    console.log('Delegate clicked for:', incorporation.companyName);
  };

  return (
    <>
      <PageHeader
        title="Management Dashboard"
        description="Monitor and delegate incorporation processes"
        onMenuClick={() => {}} // No-op since sidebar is handled by layout
        showNewButton={true}
        newButtonText="New Incorporation"
        onNewClick={() => setShowNewIncorporationModal(true)}
      >
        {/* Horizontal Metrics Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <div className="grid grid-cols-7 gap-4">
            {horizontalMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className={`flex items-center space-x-3 ${metric.alert ? 'text-red-600' : ''}`}>
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{metric.label}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold">{metric.value}</span>
                      <span className={`text-xs flex items-center ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change}
                        {metric.trend === 'up' ? '↑' : '↓'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageHeader>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Team Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Team Overview</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All Members →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map(member => (
              <TeamMemberCard 
                key={member.id} 
                member={member} 
                onAssign={(member) => console.log('Assign to', member.name)}
              />
            ))}
          </div>
        </div>

        {/* Active Incorporations with Management Actions */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Active Incorporations</h2>
            <div className="flex items-center space-x-3">
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                <option>All Priorities</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                <option>All Status</option>
                <option>At Risk</option>
                <option>On Track</option>
                <option>In Progress</option>
                <option>Pending Documents</option>
              </select>
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company / Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Satisfaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockIncorporations.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={inc.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{inc.companyName}</div>
                        <div className="text-xs text-gray-500">{inc.client} • {inc.type}</div>
                        <div className="text-xs text-gray-400">{inc.location} • {inc.capital}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center -space-x-2">
                        {inc.assignedTeam.map((member, idx) => {
                          const initials = member.split(' ').map(n => n[0]).join('');
                          return (
                            <div 
                              key={idx}
                              className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white"
                              title={member}
                            >
                              <span className="text-xs text-white font-medium">{initials}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Lead: {inc.leadAnalyst}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                inc.progress < 30 ? 'bg-red-500' :
                                inc.progress < 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${inc.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{inc.progress}%</span>
                        </div>
                        <p className="text-xs text-gray-500">{inc.currentStep}</p>
                        <p className="text-xs text-gray-400">{inc.lastUpdate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {inc.blockers.length > 0 ? (
                        <div className="space-y-1">
                          {inc.blockers.map((blocker, idx) => (
                            <div key={idx} className="flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-600">{blocker}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-green-600">No blockers</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(inc.clientSatisfaction) 
                                ? 'text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </div>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({inc.clientSatisfaction})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleDelegateClick(inc)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Delegate"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          title="Send Message"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          title="More Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Office Performance Comparison */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(performanceMetrics.byOffice).map(([office, metrics]) => (
            <div key={office} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 capitalize">{office} Office</h3>
                <span className="text-2xl">
                  {office === 'peru' ? '🇵🇪' : office === 'mexico' ? '🇲🇽' : '🇨🇴'}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Active Cases</span>
                  <span className="font-semibold">{metrics.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Completed</span>
                  <span className="font-semibold">{metrics.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Efficiency</span>
                  <span className="font-semibold text-green-600">{metrics.efficiency}%</span>
                </div>
                <div className="pt-3 border-t">
                  <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
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