'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { 
  PieChart, 
  Users, 
  Building2, 
  DollarSign,
  Target,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from 'lucide-react';

// Analytics data
const kpiMetrics = {
  totalRevenue: {
    value: 112000,
    change: 15.8,
    trend: 'up',
    period: 'vs last month'
  },
  activeClients: {
    value: 5,
    change: 25.0,
    trend: 'up',
    period: 'vs last quarter'
  },
  completionRate: {
    value: 87.5,
    change: -2.3,
    trend: 'down',
    period: 'vs last month'
  },
  averageDuration: {
    value: 28,
    change: -12.5,
    trend: 'up',
    period: 'vs last quarter'
  }
};

const officePerformance = [
  {
    office: 'Peru Office',
    flag: '🇵🇪',
    incorporations: 4,
    revenue: 65000,
    completion: 92.3,
    avgDays: 25,
    trend: 'up',
    change: 8.2
  },
  {
    office: 'Mexico Office',
    flag: '🇲🇽',
    incorporations: 1,
    revenue: 32000,
    completion: 75.0,
    avgDays: 35,
    trend: 'down',
    change: -15.4
  },
  {
    office: 'Colombia Office',
    flag: '🇨🇴',
    incorporations: 1,
    revenue: 22000,
    completion: 95.0,
    avgDays: 22,
    trend: 'up',
    change: 12.8
  }
];

const incorporationsByType = [
  { type: 'S.A.C.', count: 2, percentage: 33.3, color: 'bg-blue-500' },
  { type: 'E.I.R.L.', count: 1, percentage: 16.7, color: 'bg-green-500' },
  { type: 'S.A.', count: 1, percentage: 16.7, color: 'bg-purple-500' },
  { type: 'S.A. de C.V.', count: 1, percentage: 16.7, color: 'bg-orange-500' },
  { type: 'S.A.S.', count: 1, percentage: 16.7, color: 'bg-indigo-500' }
];

const monthlyTrends = [
  { month: 'Aug 2023', incorporations: 8, revenue: 85000, completions: 7 },
  { month: 'Sep 2023', incorporations: 12, revenue: 102000, completions: 10 },
  { month: 'Oct 2023', incorporations: 15, revenue: 128000, completions: 13 },
  { month: 'Nov 2023', incorporations: 10, revenue: 89000, completions: 9 },
  { month: 'Dec 2023', incorporations: 18, revenue: 156000, completions: 16 },
  { month: 'Jan 2024', incorporations: 6, revenue: 112000, completions: 1 }
];

const teamPerformance = [
  {
    name: 'Carlos Mendoza',
    role: 'Senior Attorney',
    activeProjects: 1,
    completedProjects: 12,
    avgDays: 24,
    revenue: 156000,
    efficiency: 95.2
  },
  {
    name: 'Ana Torres',
    role: 'Legal Specialist',
    activeProjects: 1,
    completedProjects: 8,
    avgDays: 28,
    revenue: 98000,
    efficiency: 88.7
  },
  {
    name: 'Carmen Flores',
    role: 'Corporate Attorney',
    activeProjects: 0,
    completedProjects: 15,
    avgDays: 22,
    revenue: 187000,
    efficiency: 96.8
  },
  {
    name: 'Luis Rodriguez',
    role: 'Legal Counsel',
    activeProjects: 1,
    completedProjects: 9,
    avgDays: 26,
    revenue: 118000,
    efficiency: 91.3
  },
  {
    name: 'Miguel Santos',
    role: 'International Attorney',
    activeProjects: 1,
    completedProjects: 5,
    avgDays: 32,
    revenue: 87000,
    efficiency: 82.5
  },
  {
    name: 'Diana Castro',
    role: 'Regional Counsel',
    activeProjects: 1,
    completedProjects: 7,
    avgDays: 25,
    revenue: 112000,
    efficiency: 89.4
  }
];

const industryBreakdown = [
  { industry: 'Technology', count: 2, revenue: 40500, percentage: 33.3 },
  { industry: 'Import/Export', count: 1, revenue: 18000, percentage: 16.7 },
  { industry: 'Research & Development', count: 1, revenue: 15000, percentage: 16.7 },
  { industry: 'Software Development', count: 1, revenue: 32000, percentage: 16.7 },
  { industry: 'Agriculture Export', count: 1, revenue: 22000, percentage: 16.7 }
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('last-6-months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [viewMode, setViewMode] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Business intelligence and performance insights"
        onMenuClick={() => {}}
      />

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="team">Team Performance</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Period:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last-30-days">Last 30 days</option>
                <option value="last-3-months">Last 3 months</option>
                <option value="last-6-months">Last 6 months</option>
                <option value="last-12-months">Last 12 months</option>
                <option value="ytd">Year to date</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 border border-gray-300 rounded-lg">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 border border-gray-300 rounded-lg">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-300 rounded-lg">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpiMetrics.totalRevenue.value)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {getTrendIcon(kpiMetrics.totalRevenue.trend)}
            <span className={`text-sm font-medium ${getTrendColor(kpiMetrics.totalRevenue.trend)}`}>
              {formatPercentage(Math.abs(kpiMetrics.totalRevenue.change))} {kpiMetrics.totalRevenue.period}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{kpiMetrics.activeClients.value}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {getTrendIcon(kpiMetrics.activeClients.trend)}
            <span className={`text-sm font-medium ${getTrendColor(kpiMetrics.activeClients.trend)}`}>
              {formatPercentage(Math.abs(kpiMetrics.activeClients.change))} {kpiMetrics.activeClients.period}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(kpiMetrics.completionRate.value)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {getTrendIcon(kpiMetrics.completionRate.trend)}
            <span className={`text-sm font-medium ${getTrendColor(kpiMetrics.completionRate.trend)}`}>
              {formatPercentage(Math.abs(kpiMetrics.completionRate.change))} {kpiMetrics.completionRate.period}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Duration</p>
              <p className="text-2xl font-bold text-gray-900">{kpiMetrics.averageDuration.value} days</p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {getTrendIcon(kpiMetrics.averageDuration.trend)}
            <span className={`text-sm font-medium ${getTrendColor(kpiMetrics.averageDuration.trend)}`}>
              {formatPercentage(Math.abs(kpiMetrics.averageDuration.change))} {kpiMetrics.averageDuration.period}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Monthly Trends</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="revenue">Revenue</option>
                <option value="incorporations">Incorporations</option>
                <option value="completions">Completions</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            {monthlyTrends.map((month, index) => {
              const value = selectedMetric === 'revenue' ? month.revenue : 
                          selectedMetric === 'incorporations' ? month.incorporations : 
                          month.completions;
              const maxValue = Math.max(...monthlyTrends.map(m => 
                selectedMetric === 'revenue' ? m.revenue : 
                selectedMetric === 'incorporations' ? m.incorporations : 
                m.completions
              ));
              const percentage = (value / maxValue) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">{month.month}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedMetric === 'revenue' ? formatCurrency(value) : value}
                      </span>
                      <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incorporation Types */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Incorporation Types</h3>
          <div className="space-y-4">
            {incorporationsByType.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 ${type.color} rounded`}></div>
                  <span className="text-sm font-medium text-gray-700">{type.type}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{type.count}</span>
                  <span className="text-sm font-medium text-gray-900">{formatPercentage(type.percentage)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <PieChart className="h-4 w-4" />
              <span>Total: {incorporationsByType.reduce((sum, type) => sum + type.count, 0)} incorporations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Office Performance */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Office Performance</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {officePerformance.map((office, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{office.flag}</span>
                    <h3 className="font-semibold text-gray-900">{office.office}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(office.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(office.trend)}`}>
                      {formatPercentage(Math.abs(office.change))}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Incorporations</p>
                    <p className="font-semibold text-gray-900">{office.incorporations}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(office.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completion</p>
                    <p className="font-semibold text-gray-900">{formatPercentage(office.completion)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg. Days</p>
                    <p className="font-semibold text-gray-900">{office.avgDays}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Team Performance</h2>
          <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700">
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamPerformance.map((member, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.activeProjects}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.completedProjects}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.avgDays} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(member.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            member.efficiency >= 95 ? 'bg-green-500' :
                            member.efficiency >= 90 ? 'bg-blue-500' :
                            member.efficiency >= 85 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${member.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPercentage(member.efficiency)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Industry Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Industry Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {industryBreakdown.map((industry, index) => (
            <div key={index} className="text-center">
              <div className="bg-gray-100 rounded-lg p-6 mb-4">
                <Building2 className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{industry.count}</div>
                <div className="text-sm text-gray-500">Projects</div>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{industry.industry}</h3>
              <p className="text-sm text-gray-600">{formatCurrency(industry.revenue)}</p>
              <p className="text-xs text-gray-500">{formatPercentage(industry.percentage)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 