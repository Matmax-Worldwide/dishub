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
      startTime
      endTime
      project
    }
  }
`;

const START_TIME_ENTRY = gql`
  mutation StartTimeEntry($input: StartTimeEntryInput!) {
    startTimeEntry(input: $input) {
      id
      description
      startTime
      project
    }
  }
`;

const STOP_TIME_ENTRY = gql`
  mutation StopTimeEntry($id: ID!) {
    stopTimeEntry(id: $id) {
      id
      endTime
    }
  }
`;

const DELETE_TIME_ENTRY = gql`
  mutation DeleteTimeEntry($id: ID!) {
    deleteTimeEntry(id: $id) {
      id
    }
  }
`;

interface TimeEntry {
  id: string;
  description?: string;
  startTime: string;
  endTime?: string;
  project?: string;
}

export default function TimePage() {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    project: '',
  });

  // Cargar entradas de tiempo
  const { loading, error, data, refetch } = useQuery(GET_TIME_ENTRIES, {
    client,
    onCompleted: (data) => {
      // Verificar si hay una entrada activa (sin endTime)
      const active = data?.timeEntries?.find((entry: TimeEntry) => !entry.endTime);
      if (active) {
        setActiveTimer(active);
      }
    },
  });

  // Mutaciones
  const [startTimeEntry] = useMutation(START_TIME_ENTRY, {
    client,
    onCompleted: (data) => {
      setActiveTimer(data.startTimeEntry);
      refetch();
    },
  });

  const [stopTimeEntry] = useMutation(STOP_TIME_ENTRY, {
    client,
    onCompleted: () => {
      setActiveTimer(null);
      refetch();
    },
  });

  const [deleteTimeEntry] = useMutation(DELETE_TIME_ENTRY, {
    client,
    onCompleted: () => {
      refetch();
    },
  });

  // Actualizar temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeTimer) {
      interval = setInterval(() => {
        const seconds = differenceInSeconds(new Date(), parseISO(activeTimer.startTime));
        const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
        
        const formatted = formatDuration(duration, {
          format: ['hours', 'minutes', 'seconds'],
          zero: true,
          delimiter: ':',
          padding: true
        }).replace(/(\d+) hours?/, '$1').replace(/(\d+) minutes?/, '$1').replace(/(\d+) seconds?/, '$1');
        
        setElapsedTime(formatted);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  // Manejadores
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartTimer = () => {
    startTimeEntry({
      variables: {
        input: formData,
      },
    });
  };

  const handleStopTimer = () => {
    if (activeTimer) {
      stopTimeEntry({
        variables: {
          id: activeTimer.id,
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

  const formatTimeSpent = (startTime: string, endTime?: string) => {
    if (!endTime) return 'Running...';
    
    const seconds = differenceInSeconds(parseISO(endTime), parseISO(startTime));
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    
    const hours = duration.hours ? `${duration.hours}h ` : '';
    const minutes = duration.minutes ? `${duration.minutes}m ` : '';
    const secs = duration.seconds ? `${duration.seconds}s` : '';
    
    return `${hours}${minutes}${secs}`;
  };

  if (loading) return <div className="flex justify-center p-6">Loading time entries...</div>;
  if (error) return <div className="text-red-500 p-6">Error loading time entries: {error.message}</div>;

  const timeEntries = data?.timeEntries || [];

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
                {activeTimer.project && <div className="text-sm text-gray-500">Project: {activeTimer.project}</div>}
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
                <input
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  placeholder="Project name (optional)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
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
                    {format(parseISO(entry.startTime), 'MMM d, yyyy • h:mm a')}
                    {entry.endTime && ` - ${format(parseISO(entry.endTime), 'h:mm a')}`}
                  </div>
                  {entry.project && <div className="text-xs text-gray-500 mt-1">Project: {entry.project}</div>}
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-sm font-medium ${entry.endTime ? 'text-gray-700' : 'text-green-600'}`}>
                    {formatTimeSpent(entry.startTime, entry.endTime)}
                  </div>
                  {entry.endTime && (
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
              {/* Calcular horas del día */}
              {formatTimeSpent(new Date().toISOString(), new Date().toISOString())}
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-700 font-medium">This Week</div>
            <div className="text-2xl font-semibold text-indigo-900">
              {/* Calcular horas de la semana */}
              {formatTimeSpent(new Date().toISOString(), new Date().toISOString())}
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-700 font-medium">This Month</div>
            <div className="text-2xl font-semibold text-indigo-900">
              {/* Calcular horas del mes */}
              {formatTimeSpent(new Date().toISOString(), new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 