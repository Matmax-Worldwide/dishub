'use client';

import { useState } from 'react';
// import PageHeader from '../components/PageHeader';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  Target,
  Award,
  BarChart3,
  Calendar,
  User
} from 'lucide-react';

// Mock data
const performanceMetrics = {
  overall: {
    incorporationsCompleted: 18,
    averageCompletionTime: '12.5 days',
    clientSatisfaction: 4.8,
    teamEfficiency: 87,
    thisMonth: {
      incorporations: 8,
      change: '+15%'
    }
  }
};

const teamPerformance = [
  {
    id: 1,
    name: 'María González',
    role: 'Senior Associate',
    avatar: 'MG',
    metrics: {
      completedTasks: 24,
      averageTime: '10.2 days',
      accuracy: 98,
      clientRating: 4.9,
      productivity: 92
    },
    trend: 'up'
  },
  {
    id: 2,
    name: 'Carlos Mendez',
    role: 'Legal Associate',
    avatar: 'CM',
    metrics: {
      completedTasks: 18,
      averageTime: '14.1 days',
      accuracy: 95,
      clientRating: 4.7,
      productivity: 85
    },
    trend: 'up'
  },
  {
    id: 3,
    name: 'Ana Vargas',
    role: 'Junior Associate',
    avatar: 'AV',
    metrics: {
      completedTasks: 12,
      averageTime: '16.8 days',
      accuracy: 92,
      clientRating: 4.5,
      productivity: 78
    },
    trend: 'stable'
  },
  {
    id: 4,
    name: 'José Rodriguez',
    role: 'Legal Assistant',
    avatar: 'JR',
    metrics: {
      completedTasks: 15,
      averageTime: '11.5 days',
      accuracy: 96,
      clientRating: 4.6,
      productivity: 82
    },
    trend: 'up'
  }
];

const monthlyData = [
  { month: 'Jul', incorporations: 12, efficiency: 82 },
  { month: 'Aug', incorporations: 15, efficiency: 85 },
  { month: 'Sep', incorporations: 18, efficiency: 88 },
  { month: 'Oct', incorporations: 16, efficiency: 86 },
  { month: 'Nov', incorporations: 22, efficiency: 90 },
  { month: 'Dec', incorporations: 18, efficiency: 87 }
];

const topPerformers = [
  { name: 'María González', metric: 'Highest Accuracy', value: '98%', icon: Target },
  { name: 'José Rodriguez', metric: 'Fastest Completion', value: '11.5 days', icon: Clock },
  { name: 'Carlos Mendez', metric: 'Most Productive', value: '18 cases', icon: TrendingUp },
];

export default function PerformancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMetric, setSelectedMetric] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Performance Analytics</h1>
          <p className="text-sm text-gray-500">Track team performance, efficiency metrics, and productivity insights</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <span>Generate Report</span>
        </button>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed This Month</p>
              <p className="text-2xl font-bold text-gray-900">{performanceMetrics.overall.thisMonth.incorporations}</p>
              <p className="text-sm text-green-600 font-medium">{performanceMetrics.overall.thisMonth.change} vs last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Completion Time</p>
              <p className="text-2xl font-bold text-gray-900">{performanceMetrics.overall.averageCompletionTime}</p>
              <p className="text-sm text-blue-600 font-medium">2.3 days faster</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Client Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{performanceMetrics.overall.clientSatisfaction}/5.0</p>
              <p className="text-sm text-purple-600 font-medium">+0.2 this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Team Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{performanceMetrics.overall.teamEfficiency}%</p>
              <p className="text-sm text-orange-600 font-medium">+5% this quarter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Performers This Month</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((performer, index) => (
            <div key={index} className="border rounded-lg p-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full">
                  <performer.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{performer.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{performer.metric}</p>
              <p className="text-2xl font-bold text-gray-900">{performer.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Performance Trends</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
        
        {/* Simple Chart Visualization */}
        <div className="h-64 flex items-end space-x-4 px-4">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center space-y-2">
                <div className="w-full bg-gray-200 rounded-t flex flex-col" style={{ height: '200px' }}>
                  <div 
                    className="w-full bg-blue-500 rounded-t flex items-end justify-center text-white text-xs font-medium pb-1"
                    style={{ height: `${(data.incorporations / 25) * 100}%` }}
                  >
                    {data.incorporations}
                  </div>
                </div>
                <span className="text-xs text-gray-600">{data.month}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Incorporations Completed</span>
          </div>
        </div>
      </div>

      {/* Team Performance Details */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Individual Performance</h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Metrics</option>
              <option value="productivity">Productivity</option>
              <option value="accuracy">Accuracy</option>
              <option value="speed">Completion Speed</option>
            </select>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {teamPerformance.map((member) => (
            <div key={member.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{member.avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {member.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : member.trend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Activity className="h-5 w-5 text-gray-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    member.trend === 'up' ? 'text-green-600' : 
                    member.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {member.trend === 'up' ? 'Improving' : 
                     member.trend === 'down' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{member.metrics.completedTasks}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{member.metrics.averageTime}</p>
                  <p className="text-sm text-gray-500">Avg. Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{member.metrics.accuracy}%</p>
                  <p className="text-sm text-gray-500">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{member.metrics.clientRating}</p>
                  <p className="text-sm text-gray-500">Client Rating</p>
                </div>
                <div className="text-center">
                  <div className="relative">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{member.metrics.productivity}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${member.metrics.productivity}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Productivity</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 