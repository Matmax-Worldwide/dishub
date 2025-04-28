'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

// Consultas GraphQL
const GET_APPOINTMENTS = gql`
  query GetAppointments {
    appointments {
      id
      title
      description
      startTime
      endTime
      location
      isVirtual
      meetingUrl
    }
  }
`;

const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      title
      startTime
      endTime
    }
  }
`;

const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: ID!) {
    deleteAppointment(id: $id) {
      id
    }
  }
`;

// Tipos
interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isVirtual: boolean;
  meetingUrl?: string;
}

interface ScheduleProps {}

export default function SchedulePage({}: ScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    location: '',
    isVirtual: false,
    meetingUrl: '',
  });

  // Cargar citas
  const { loading, error, data, refetch } = useQuery(GET_APPOINTMENTS, {
    client,
  });

  // Mutaciones
  const [createAppointment] = useMutation(CREATE_APPOINTMENT, {
    client,
    onCompleted: () => {
      setIsModalOpen(false);
      refetch();
    },
  });

  const [deleteAppointment] = useMutation(DELETE_APPOINTMENT, {
    client,
    onCompleted: () => {
      setSelectedAppointment(null);
      refetch();
    },
  });

  // Generar días de la semana
  const generateWeekDays = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  };

  const weekDays = generateWeekDays();

  // Manejadores
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAppointment({
      variables: {
        input: formData,
      },
    });
  };

  const handleDelete = () => {
    if (selectedAppointment) {
      deleteAppointment({
        variables: {
          id: selectedAppointment.id,
        },
      });
    }
  };

  const getAppointmentsForDay = (date: Date) => {
    if (!data?.appointments) return [];
    
    return data.appointments.filter((appointment: Appointment) => {
      const appointmentDate = parseISO(appointment.startTime);
      return isSameDay(appointmentDate, date);
    });
  };

  // Limpiar formulario al abrir modal
  useEffect(() => {
    if (isModalOpen) {
      setFormData({
        title: '',
        description: '',
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        location: '',
        isVirtual: false,
        meetingUrl: '',
      });
    }
  }, [isModalOpen]);

  if (loading) return <div className="flex justify-center p-6">Loading schedule...</div>;
  if (error) return <div className="text-red-500 p-6">Error loading schedule: {error.message}</div>;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-indigo-700 px-4 py-5 sm:px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Schedule</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 bg-indigo-800 rounded text-white text-sm hover:bg-indigo-900"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="px-3 py-1 bg-indigo-800 rounded text-white text-sm hover:bg-indigo-900"
          >
            Previous Week
          </button>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="px-3 py-1 bg-indigo-800 rounded text-white text-sm hover:bg-indigo-900"
          >
            Next Week
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1 bg-green-600 rounded text-white text-sm hover:bg-green-700"
          >
            Add Appointment
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => (
            <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
              <div
                className={`p-2 text-center font-semibold text-sm ${
                  isSameDay(day, new Date()) ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-50'
                }`}
              >
                <div>{format(day, 'EEE')}</div>
                <div className="text-lg">{format(day, 'd')}</div>
              </div>

              <div className="p-1 max-h-56 overflow-y-auto">
                {getAppointmentsForDay(day).map((appointment: Appointment) => (
                  <div
                    key={appointment.id}
                    onClick={() => setSelectedAppointment(appointment)}
                    className="text-xs p-1 mt-1 bg-indigo-50 border border-indigo-100 rounded cursor-pointer hover:bg-indigo-100"
                  >
                    <div className="font-medium">{appointment.title}</div>
                    <div>{format(parseISO(appointment.startTime), 'h:mm a')}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para añadir cita */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Add New Appointment</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVirtual"
                    name="isVirtual"
                    checked={formData.isVirtual}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isVirtual" className="ml-2 block text-sm text-gray-700">
                    Virtual Meeting
                  </label>
                </div>

                {formData.isVirtual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting URL</label>
                    <input
                      type="url"
                      name="meetingUrl"
                      value={formData.meetingUrl}
                      onChange={handleInputChange}
                      placeholder="https://zoom.us/j/example"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detalle de cita seleccionada */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Appointment Details</h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedAppointment.title}</h3>
                <p className="text-gray-500">
                  {format(parseISO(selectedAppointment.startTime), 'MMMM d, yyyy')} •{' '}
                  {format(parseISO(selectedAppointment.startTime), 'h:mm a')} -{' '}
                  {format(parseISO(selectedAppointment.endTime), 'h:mm a')}
                </p>
              </div>

              {selectedAppointment.description && (
                <div className="mt-2">
                  <p className="text-gray-700 whitespace-pre-line">{selectedAppointment.description}</p>
                </div>
              )}

              {selectedAppointment.location && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-gray-900">{selectedAppointment.location}</p>
                </div>
              )}

              {selectedAppointment.isVirtual && selectedAppointment.meetingUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Virtual Meeting</p>
                  <a
                    href={selectedAppointment.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Join Meeting
                  </a>
                </div>
              )}

              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 