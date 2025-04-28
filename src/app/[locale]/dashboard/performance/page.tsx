'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

// GraphQL Queries
const GET_PERFORMANCES = gql`
  query GetPerformances {
    performances {
      id
      period
      completedTasks
      totalHours
      efficiency
      notes
      createdAt
    }
  }
`;

const GET_CURRENT_PERFORMANCE = gql`
  query GetCurrentPerformance {
    currentPerformance {
      id
      period
      completedTasks
      totalHours
      efficiency
      notes
      createdAt
    }
  }
`;

interface Performance {
  id: string;
  period: string;
  completedTasks: number;
  totalHours: number;
  efficiency: number | null;
  notes: string | null;
  createdAt: string;
}

export default function PerformancePage() {
  const [timeFrame, setTimeFrame] = useState('month'); // 'week', 'month', 'quarter', 'year'
  
  const { loading: perfLoading, error: perfError, data: perfData } = useQuery(GET_PERFORMANCES, {
    client,
  });
  
  const { loading: currentPerfLoading, error: currentPerfError, data: currentPerfData } = useQuery(GET_CURRENT_PERFORMANCE, {
    client,
  });
  
  const loading = perfLoading || currentPerfLoading;
  const error = perfError || currentPerfError;
  
  // Mock data in case real data is not available
  const mockPerformanceData = [
    { period: '2023-01', completedTasks: 15, totalHours: 45, efficiency: 3.0 },
    { period: '2023-02', completedTasks: 18, totalHours: 52, efficiency: 2.89 },
    { period: '2023-03', completedTasks: 22, totalHours: 58, efficiency: 2.64 },
    { period: '2023-04', completedTasks: 17, totalHours: 42, efficiency: 2.47 },
    { period: '2023-05', completedTasks: 25, totalHours: 62, efficiency: 2.48 },
    { period: '2023-06', completedTasks: 28, totalHours: 67, efficiency: 2.39 },
  ];
  
  const mockCurrentPerformance = {
    id: 'current',
    period: '2023-07',
    completedTasks: 24,
    totalHours: 58.5,
    efficiency: 2.44,
    notes: 'Good performance this month, but could improve task efficiency.',
    createdAt: new Date().toISOString(),
  };
  
  // Real data or mock data
  const performanceHistory: Performance[] = perfData?.performances || mockPerformanceData;
  const currentPerformance: Performance = currentPerfData?.currentPerformance || mockCurrentPerformance;
  
  // Format for charts
  const performanceChartData = [...performanceHistory, currentPerformance].map(p => ({
    period: p.period,
    completedTasks: p.completedTasks,
    totalHours: p.totalHours,
    efficiency: p.efficiency || 0,
  }));
  
  // Breakdown of time spent (mock data)
  const timeBreakdownData = [
    { name: 'Documentation', hours: 12.5, fill: '#8884d8' },
    { name: 'Meetings', hours: 10, fill: '#83a6ed' },
    { name: 'Development', hours: 25.5, fill: '#8dd1e1' },
    { name: 'Planning', hours: 6.5, fill: '#82ca9d' },
    { name: 'Testing', hours: 4, fill: '#a4de6c' },
  ];
  
  // KPI scores (mock data)
  const kpiData = [
    { name: 'Task Completion', score: 85, fill: '#0088FE' },
    { name: 'Time Utilization', score: 78, fill: '#00C49F' },
    { name: 'Efficiency', score: 72, fill: '#FFBB28' },
    { name: 'Quality', score: 90, fill: '#FF8042' },
  ];
  
  if (loading) return <div className="flex justify-center p-6">Loading performance data...</div>;
  if (error) return <div className="text-red-500 p-6">Error loading performance data: {error.message}</div>;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Performance Dashboard</h1>
        <div className="flex space-x-2">
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
          >
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
      </div>
      
      {/* Performance overview */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-indigo-700">
                Completed Tasks
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {currentPerformance.completedTasks}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                this {timeFrame}
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-green-700">
                Hours Logged
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {currentPerformance.totalHours.toFixed(1)}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                this {timeFrame}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-blue-700">
                Efficiency Score
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {currentPerformance.efficiency ? currentPerformance.efficiency.toFixed(2) : 'N/A'}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                hours per task
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance trends chart */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="completedTasks"
                  name="Tasks Completed"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalHours"
                  name="Hours Logged"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  name="Efficiency (hrs/task)"
                  stroke="#ffc658"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* KPI Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">KPI Scores</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kpiData}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Legend />
                  <Bar dataKey="score" name="KPI Score">
                    {kpiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Time breakdown */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Time Breakdown</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    dataKey="hours"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {timeBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} hours`, 'Time Spent']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes and recommendations */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Notes</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              {currentPerformance.notes || 'No performance notes available for this period.'}
            </p>
          </div>
          
          <h3 className="text-md font-medium text-gray-900 mt-6 mb-2">Recommendations</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>Consider improving task efficiency by breaking down larger tasks into smaller, manageable parts.</li>
            <li>Your documentation quality is excellent. Continue maintaining high standards.</li>
            <li>Meeting time could be reduced by setting clearer agendas and time limits.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 