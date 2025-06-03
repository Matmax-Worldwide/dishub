'use client';

import { useQuery, gql } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Consultas GraphQL
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalDocuments
      documentsThisMonth
      totalAppointments
      appointmentsThisWeek
      completedTasks
      pendingTasks
      totalHoursLogged
      hoursLoggedThisWeek
    }
  }
`;

const GET_DOCUMENTS_BY_STATUS = gql`
  query GetDocumentsByStatus {
    documentsByStatus {
      status
      count
    }
  }
`;

const GET_TIME_ENTRIES_BY_DAY = gql`
  query GetTimeEntriesByDay {
    timeEntriesByDay {
      day
      hours
    }
  }
`;


// Tipos
interface DashboardStats {
  totalDocuments: number;
  documentsThisMonth: number;
  totalAppointments: number;
  appointmentsThisWeek: number;
  completedTasks: number;
  pendingTasks: number;
  totalHoursLogged: number;
  hoursLoggedThisWeek: number;
}

interface DocumentStatus {
  status: string;
  count: number;
  }


export default function DashboardPage() {
  const { loading: statsLoading, error: statsError, data: statsData } = useQuery(GET_DASHBOARD_STATS, {
    client,
    errorPolicy: 'all',
  });

  const { loading: docStatusLoading, error: docStatusError, data: docStatusData } = useQuery(GET_DOCUMENTS_BY_STATUS, {
    client,
    errorPolicy: 'all',
  });

  const { loading: timeLoading, error: timeError, data: timeData } = useQuery(GET_TIME_ENTRIES_BY_DAY, {
    client,
    errorPolicy: 'all',
  });

  const loading = statsLoading || docStatusLoading || timeLoading;
  
  // Only show error message if it's not an authentication-related error
  let errorMessage = null;
  if (statsError || docStatusError || timeError) {
    const error = statsError || docStatusError || timeError;
    if (error) {
      console.error('Dashboard error:', error);
      
      // If it's not an authentication error, show it to the user
      if (!error.message.includes('Not authenticated') && 
          !error.message.includes('non-nullable field') &&
          !error.message.includes('null for non-nullable')) {
        errorMessage = error.message;
      }
    }
  }

  // Datos de ejemplo para cuando no hay datos disponibles
  const mockDocumentData = [
    { status: 'DRAFT', count: 5 },
    { status: 'PENDING_REVIEW', count: 3 },
    { status: 'APPROVED', count: 8 },
    { status: 'REJECTED', count: 1 },
  ];

  const mockTimeData = [
    { day: 'Monday', hours: 6.5 },
    { day: 'Tuesday', hours: 7.2 },
    { day: 'Wednesday', hours: 8.0 },
    { day: 'Thursday', hours: 5.5 },
    { day: 'Friday', hours: 7.8 },
    { day: 'Saturday', hours: 3.0 },
    { day: 'Sunday', hours: 0 },
  ];

  // Datos para gráficos
  const documentData = docStatusData?.documentsByStatus || mockDocumentData;
  const timeEntryData = timeData?.timeEntriesByDay || mockTimeData;

  // Stats
  const stats: DashboardStats = statsData?.dashboardStats || {
    totalDocuments: 17,
    documentsThisMonth: 5,
    totalAppointments: 8,
    appointmentsThisWeek: 3,
    completedTasks: 12,
    pendingTasks: 11,
    totalHoursLogged: 152.5,
    hoursLoggedThisWeek: 38.0,
  };

  // Colores para estados de documentos
  const documentColors: { [key: string]: string } = {
    DRAFT: '#9CA3AF',
    PENDING_REVIEW: '#FBBF24',
    APPROVED: '#34D399',
    REJECTED: '#F87171',
  };



  if (loading) return <div className="flex justify-center p-6">Loading dashboard...</div>;
  if (errorMessage) return <div className="text-red-500 p-6">Error loading dashboard: {errorMessage}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Documents</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalDocuments}</div>
                    <div className="text-sm text-gray-500">{stats.documentsThisMonth} new this month</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Appointments</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalAppointments}</div>
                    <div className="text-sm text-gray-500">{stats.appointmentsThisWeek} scheduled this week</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tasks</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.completedTasks + stats.pendingTasks}</div>
                    <div className="text-sm text-gray-500">{stats.pendingTasks} pending</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Time Logged</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalHoursLogged.toFixed(1)} hrs</div>
                    <div className="text-sm text-gray-500">{stats.hoursLoggedThisWeek.toFixed(1)} hrs this week</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Gráfico de documentos por estado */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Documents by Status</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={documentData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Number of Documents" fill="#6366F1">
                    {documentData.map((entry: DocumentStatus, index: number) => (
                      <Cell key={`cell-${index}`} fill={documentColors[entry.status] || '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Gráfico de tiempo registrado por día */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Time Logged This Week</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeEntryData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    name="Hours"
                    stroke="#6366F1"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>


        {/* Actividad reciente */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="flow-root max-h-80 overflow-y-auto">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            New Document Uploaded
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            You uploaded a new document: &quot;Q2 Financial Report&quot;
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Just now</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>

                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Task Completed
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            You marked &quot;Review client proposal&quot; as completed
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>

                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            New Appointment
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            You scheduled a meeting with &quot;Client ABC&quot; for tomorrow at 10:00 AM
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Yesterday</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>

                <li>
                  <div className="relative pb-8">
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Time Entry
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            You logged 6.5 hours for &quot;Project XYZ Development&quot;
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 