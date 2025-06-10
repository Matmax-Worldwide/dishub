'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Users, 
  Building2, 
  DollarSign,
  Clock,
  Target,
  Activity,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
  Share
} from 'lucide-react';

// Report templates and data
const reportTemplates = [
  {
    id: 'incorporation-summary',
    name: 'Incorporation Summary Report',
    description: 'Comprehensive overview of all incorporation activities',
    category: 'Operations',
    frequency: 'Monthly',
    lastGenerated: '2024-01-20',
    icon: Building2,
    color: 'bg-blue-500'
  },
  {
    id: 'client-portfolio',
    name: 'Client Portfolio Analysis',
    description: 'Detailed analysis of client relationships and project distribution',
    category: 'Business Development',
    frequency: 'Quarterly',
    lastGenerated: '2024-01-15',
    icon: Users,
    color: 'bg-green-500'
  },
  {
    id: 'financial-performance',
    name: 'Financial Performance Report',
    description: 'Revenue analysis, fee tracking, and financial metrics',
    category: 'Finance',
    frequency: 'Monthly',
    lastGenerated: '2024-01-18',
    icon: DollarSign,
    color: 'bg-purple-500'
  },
  {
    id: 'team-productivity',
    name: 'Team Productivity Report',
    description: 'Team performance metrics and workload analysis',
    category: 'Human Resources',
    frequency: 'Bi-weekly',
    lastGenerated: '2024-01-19',
    icon: Activity,
    color: 'bg-orange-500'
  },
  {
    id: 'compliance-status',
    name: 'Compliance & Risk Report',
    description: 'Compliance tracking and risk assessment across all jurisdictions',
    category: 'Legal',
    frequency: 'Weekly',
    lastGenerated: '2024-01-21',
    icon: AlertTriangle,
    color: 'bg-red-500'
  },
  {
    id: 'office-comparison',
    name: 'Multi-Office Performance',
    description: 'Comparative analysis across Peru, Mexico, and Colombia offices',
    category: 'Operations',
    frequency: 'Monthly',
    lastGenerated: '2024-01-17',
    icon: Target,
    color: 'bg-indigo-500'
  }
];

const recentReports = [
  {
    id: 'RPT-2024-001',
    name: 'January Incorporation Summary',
    type: 'incorporation-summary',
    generatedBy: 'Carlos Mendoza',
    generatedAt: '2024-01-20T10:30:00Z',
    status: 'completed',
    size: '2.4 MB',
    pages: 24,
    downloads: 12
  },
  {
    id: 'RPT-2024-002',
    name: 'Q1 2024 Client Portfolio Analysis',
    type: 'client-portfolio',
    generatedBy: 'Ana Torres',
    generatedAt: '2024-01-19T14:15:00Z',
    status: 'completed',
    size: '3.7 MB',
    pages: 38,
    downloads: 8
  },
  {
    id: 'RPT-2024-003',
    name: 'Weekly Compliance Report - Week 3',
    type: 'compliance-status',
    generatedBy: 'Carmen Flores',
    generatedAt: '2024-01-21T09:00:00Z',
    status: 'completed',
    size: '1.8 MB',
    pages: 15,
    downloads: 5
  },
  {
    id: 'RPT-2024-004',
    name: 'Team Productivity - Bi-weekly Review',
    type: 'team-productivity',
    generatedBy: 'Luis Rodriguez',
    generatedAt: '2024-01-18T16:45:00Z',
    status: 'completed',
    size: '2.1 MB',
    pages: 19,
    downloads: 15
  },
  {
    id: 'RPT-2024-005',
    name: 'January Financial Performance',
    type: 'financial-performance',
    generatedBy: 'Miguel Santos',
    generatedAt: '2024-01-17T11:20:00Z',
    status: 'processing',
    size: '3.2 MB',
    pages: 28,
    downloads: 0
  }
];

const reportMetrics = {
  totalReports: 47,
  reportsThisMonth: 12,
  averageGenerationTime: '4.2 min',
  totalDownloads: 324,
  popularReport: 'Incorporation Summary',
  complianceScore: 98.5
};

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedReport, setSelectedReport] = useState<typeof reportTemplates[0] | null>(null);
  const [dateRange, setDateRange] = useState('last-30-days');

  const filteredTemplates = reportTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Operations', 'Business Development', 'Finance', 'Human Resources', 'Legal'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and manage comprehensive business reports"
        onMenuClick={() => {}}
      />

      {/* Report Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reportMetrics.totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{reportMetrics.reportsThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Gen Time</p>
              <p className="text-2xl font-bold text-gray-900">{reportMetrics.averageGenerationTime}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Download className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{reportMetrics.totalDownloads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-indigo-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Popular Report</p>
              <p className="text-xl font-bold text-gray-900">{reportMetrics.popularReport}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-emerald-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Compliance</p>
              <p className="text-2xl font-bold text-gray-900">{reportMetrics.complianceScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Building2 className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-blue-700">Generate Incorporation Report</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-700">Financial Summary</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Users className="h-5 w-5 text-purple-500" />
            <span className="font-medium text-purple-700">Client Analysis</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <Activity className="h-5 w-5 text-orange-500" />
            <span className="font-medium text-orange-700">Team Performance</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Report Templates</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const IconComponent = template.icon;
            return (
              <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${template.color} rounded-lg`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setSelectedReport(template)}
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium">{template.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span className="font-medium">{template.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Generated:</span>
                    <span className="font-medium">{new Date(template.lastGenerated).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Recent Reports</h2>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="last-90-days">Last 90 days</option>
            </select>
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 border border-gray-300 rounded-lg">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{report.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Generated by:</span> {report.generatedBy}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(report.generatedAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {report.size}
                      </div>
                      <div>
                        <span className="font-medium">Downloads:</span> {report.downloads}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(report.status)}
                  {report.status === 'completed' && (
                    <>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        <Share className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 ${selectedReport.color} rounded-lg`}>
                  <selectedReport.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{selectedReport.name}</h4>
                  <p className="text-gray-600">{selectedReport.category}</p>
                </div>
              </div>
              
              <p className="text-gray-700">{selectedReport.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Frequency:</span>
                  <p className="text-gray-900">{selectedReport.frequency}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Last Generated:</span>
                  <p className="text-gray-900">{new Date(selectedReport.lastGenerated).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-900 mb-2">Report Contents:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Executive Summary</li>
                  <li>• Key Performance Indicators</li>
                  <li>• Detailed Analysis</li>
                  <li>• Recommendations</li>
                  <li>• Appendices and Data Tables</li>
                </ul>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Now
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                  Schedule Generation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 