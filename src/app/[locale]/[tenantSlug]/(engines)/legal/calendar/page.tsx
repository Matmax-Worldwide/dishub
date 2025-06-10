'use client';

import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendar View</h1>
          <p className="text-sm text-gray-500">Schedule and track important dates and deadlines</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">January 2024</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => {
            const date = i - 6; // Start from previous month
            const isCurrentMonth = date > 0 && date <= 31;
            const isToday = date === 15;
            
            return (
              <div key={i} className={`
                p-3 h-24 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50
                ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                ${isToday ? 'bg-blue-50 border-blue-200' : ''}
              `}>
                <div className="text-sm font-medium">
                  {isCurrentMonth ? date : date <= 0 ? 31 + date : date - 31}
                </div>
                {isCurrentMonth && date === 10 && (
                  <div className="mt-1 p-1 bg-red-100 text-red-700 text-xs rounded">
                    SUNARP Deadline
                  </div>
                )}
                {isCurrentMonth && date === 18 && (
                  <div className="mt-1 p-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Client Meeting
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Events</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Clock className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-gray-900">SUNARP Documentation Deadline</p>
              <p className="text-sm text-gray-500">TechVentures Peru S.A.C. - January 10, 2024</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">Client Signature Meeting</p>
              <p className="text-sm text-gray-500">Global Commerce E.I.R.L. - January 18, 2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 