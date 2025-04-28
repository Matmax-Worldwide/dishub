'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { format, differenceInSeconds, parseISO, formatDuration, intervalToDuration } from 'date-fns';

// Consultas GraphQL
const GET_TIME_ENTRIES = gql`
  query GetTimeEntries {
    timeEntries {
      id
      description
      date
      hours
      projectId
      project {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      status
    }
  }
`;

const CREATE_TIME_ENTRY = gql`
  mutation CreateTimeEntry($input: CreateTimeEntryInput!) {
    createTimeEntry(input: $input) {
      id
      description
      date
      hours
      projectId
      project {
        id
        name
      }
    }
  }
`;

const UPDATE_TIME_ENTRY = gql`
  mutation UpdateTimeEntry($id: ID!, $input: UpdateTimeEntryInput!) {
    updateTimeEntry(id: $id, input: $input) {
      id
      hours
      updatedAt
    }
  }
`;

const DELETE_TIME_ENTRY = gql`
  mutation DeleteTimeEntry($id: ID!) {
    deleteTimeEntry(id: $id)
  }
`;

interface Project {
  id: string;
  name: string;
  status: string;
}

interface TimeEntry {
  id: string;
  description: string;
  date: string; // ISO date string
  hours: number;
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TimePage() {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    projectId: '', // This will hold the actual project ID
    projectName: '', // Display name for UI
  });
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Cargar entradas de tiempo
  const { loading, error, data, refetch } = useQuery(GET_TIME_ENTRIES, {
    client,
    onCompleted: (data) => {
      // Check for existing time entry created today that we can continue
      const today = new Date().toISOString().split('T')[0];
      const activeEntry = data?.timeEntries?.find((entry: TimeEntry) => 
        entry.date === today && entry.hours < 24
      );
      
      if (activeEntry) {
        // For demonstration, consider the most recent entry from today as active
        setActiveTimer(activeEntry);
        
        // Simulate a start time based on hours already logged
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - activeEntry.hours);
        setTimerStartTime(startTime);
      }
    },
  });

  // Load available projects
  useQuery(GET_PROJECTS, {
    client,
    onCompleted: (data) => {
      if (data?.projects) {
        setProjects(data.projects);
      }
    }
  });

  // Mutaciones
  const [createTimeEntry] = useMutation(CREATE_TIME_ENTRY, {
    client,
    onCompleted: (data) => {
      setActiveTimer(data.createTimeEntry);
      setTimerStartTime(new Date());
      refetch();
    },
    onError: (error) => {
      console.error('Error creating time entry:', error);
      // Show an alert or toast with the error message
      alert(`Failed to create time entry: ${error.message}`);
    }
  });

  const [updateTimeEntry] = useMutation(UPDATE_TIME_ENTRY, {
    client,
    onCompleted: () => {
      setActiveTimer(null);
      setTimerStartTime(null);
      refetch();
    },
    onError: (error) => {
      console.error('Error updating time entry:', error);
      alert(`Failed to update time entry: ${error.message}`);
    }
  });

  const [deleteTimeEntry] = useMutation(DELETE_TIME_ENTRY, {
    client,
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error deleting time entry:', error);
      alert(`Failed to delete time entry: ${error.message}`);
    }
  });

  // Actualizar temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeTimer && timerStartTime) {
      interval = setInterval(() => {
        const seconds = differenceInSeconds(new Date(), timerStartTime);
        const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
        
        const formatted = formatDuration(duration, {
          format: ['hours', 'minutes', 'seconds'],
          zero: true,
          delimiter: ':'
        }).replace(/(\d+) hours?/, '$1').replace(/(\d+) minutes?/, '$1').replace(/(\d+) seconds?/, '$1');
        
        setElapsedTime(formatted);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer, timerStartTime]);

  // Manejadores
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'projectName') {
      // If user is typing the project name, find the matching project ID
      const selectedProject = projects.find(p => p.name.toLowerCase() === value.toLowerCase());
      setFormData(prev => ({ 
        ...prev, 
        projectName: value,
        projectId: selectedProject?.id || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    if (projectId) {
      const selectedProject = projects.find(p => p.id === projectId);
      setFormData(prev => ({ 
        ...prev, 
        projectId: projectId,
        projectName: selectedProject?.name || ''
      }));
    } else {
      // No project selected
      setFormData(prev => ({ 
        ...prev, 
        projectId: '',
        projectName: ''
      }));
    }
  };

  const handleStartTimer = () => {
    if (!formData.description.trim()) {
      alert('Please enter a description for your time entry');
      return;
    }
    
    const today = new Date();
    createTimeEntry({
      variables: {
        input: {
          description: formData.description,
          date: today.toISOString().split('T')[0], // YYYY-MM-DD format
          hours: 0, // Start with 0 hours
          projectId: formData.projectId || undefined,
        },
      },
    });
  };

  const handleStopTimer = () => {
    if (activeTimer && timerStartTime) {
      // Calculate hours spent
      const now = new Date();
      const hoursSpent = (now.getTime() - timerStartTime.getTime()) / (1000 * 60 * 60);
      
      // Add to existing hours
      const totalHours = activeTimer.hours + hoursSpent;
      
      updateTimeEntry({
        variables: {
          id: activeTimer.id,
          input: {
            hours: parseFloat(totalHours.toFixed(2)), // Round to 2 decimal places
          },
        },
      });
    }
  };

  const handleDeleteEntry = (id: string) => {
    deleteTimeEntry({
      variables: {
        id,
      },
    });
  };

  const formatTimeSpent = (hours: number) => {    
    if (hours === 0) return 'Just started';
    
    const totalSeconds = hours * 3600;
    const duration = intervalToDuration({ start: 0, end: totalSeconds * 1000 });
    
    const h = duration.hours ? `${duration.hours}h ` : '';
    const m = duration.minutes ? `${duration.minutes}m ` : '';
    const s = duration.seconds ? `${duration.seconds}s` : '';
    
    return `${h}${m}${s}`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 bg-white shadow rounded-lg">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg text-gray-700">Loading your time entries...</p>
    </div>
  );
  
  if (error) return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="p-4 text-red-600">
        <h2 className="text-xl font-bold mb-4">Error loading time entries</h2>
        <p className="mb-2">{error.message}</p>
        
        <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-left">
          <h3 className="text-lg mb-2">Debug Information:</h3>
          <pre className="overflow-auto max-h-60 text-xs">
            {JSON.stringify(
              {
                message: error.message,
                graphQLErrors: error.graphQLErrors?.map(e => e.message),
                networkError: error.networkError?.message,
              }, 
              null, 
              2
            )}
          </pre>
        </div>
        
        <button 
          onClick={() => refetch({ fetchPolicy: 'network-only' })}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    </div>
  );

  // Fallback for when data comes back empty
  if (!data || !data.timeEntries) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-indigo-700 px-4 py-5 sm:px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Time Tracker</h1>
        </div>

        <div className="p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 mb-2">No time entries found</h2>
          <p className="text-gray-500 mb-6">Start tracking your time to see entries here.</p>
          <button
            onClick={() => setActiveTimer(null)}
            className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700"
          >
            Start Tracking
          </button>
        </div>
      </div>
    );
  }

  const timeEntries = data.timeEntries || [];

  return (
    <div className="space-y-8">
      {/* Active Timer */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Time Tracker</h2>
        
        {activeTimer ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="text-3xl font-mono text-indigo-600">{elapsedTime}</div>
                <div className="text-gray-600">{activeTimer.description || 'No description'}</div>
                {activeTimer.project && <div className="text-sm text-gray-500">Project: {activeTimer.project.name}</div>}
              </div>
              <button
                onClick={handleStopTimer}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What are you working on?"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleProjectSelect}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="">Select a project (optional)</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleStartTimer}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Start Timer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Time Entries History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Time Entries</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {timeEntries.length === 0 ? (
            <div className="px-6 py-4 text-gray-500 text-center">No time entries recorded yet.</div>
          ) : (
            timeEntries.map((entry: TimeEntry) => (
              <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{entry.description || 'No description'}</div>
                  <div className="text-sm text-gray-500">
                    {format(parseISO(entry.date), 'MMM d, yyyy')}
                  </div>
                  {entry.project && <div className="text-xs text-gray-500 mt-1">Project: {entry.project.name}</div>}
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-sm font-medium ${activeTimer && activeTimer.id === entry.id ? 'text-green-600' : 'text-gray-700'}`}>
                    {formatTimeSpent(entry.hours)}
                  </div>
                  {(!activeTimer || activeTimer.id !== entry.id) && (
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-700 font-medium">Today</div>
            <div className="text-2xl font-semibold text-indigo-900">
              {/* Calculate today's hours */}
              {formatTimeSpent(
                timeEntries
                  .filter((entry: TimeEntry) => entry.date === new Date().toISOString().split('T')[0])
                  .reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0)
              )}
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-700 font-medium">This Week</div>
            <div className="text-2xl font-semibold text-indigo-900">
              {/* Calculate this week's hours */}
              {formatTimeSpent(
                timeEntries
                  .filter((entry: TimeEntry) => {
                    const entryDate = new Date(entry.date);
                    const now = new Date();
                    const daysSinceMonday = (now.getDay() + 6) % 7; // Days since last Monday
                    const monday = new Date(now);
                    monday.setDate(now.getDate() - daysSinceMonday);
                    monday.setHours(0, 0, 0, 0);
                    return entryDate >= monday;
                  })
                  .reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0)
              )}
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-700 font-medium">This Month</div>
            <div className="text-2xl font-semibold text-indigo-900">
              {/* Calculate this month's hours */}
              {formatTimeSpent(
                timeEntries
                  .filter((entry: TimeEntry) => {
                    const entryDate = new Date(entry.date);
                    const now = new Date();
                    return entryDate.getMonth() === now.getMonth() && 
                           entryDate.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 