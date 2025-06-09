'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ClockIcon,
  SearchIcon,
  DownloadIcon,
  FilterIcon,
  StarIcon,
  UsersIcon,
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  LanguagesIcon
} from 'lucide-react';

interface SessionRecord {
  id: string;
  sessionCode: string;
  clientName: string;
  interpreterName: string;
  sourceLanguage: string;
  targetLanguage: string;
  sessionType: 'Medical' | 'Legal' | 'Business' | 'Educational';
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  participants: number;
  rating: number;
  status: 'Completed' | 'Cancelled' | 'Interrupted';
  cost: number;
  recordingAvailable: boolean;
  transcriptAvailable: boolean;
}

const mockSessionHistory: SessionRecord[] = [
  {
    id: '1',
    sessionCode: 'INT-4825',
    clientName: 'Hospital General',
    interpreterName: 'Sarah Johnson',
    sourceLanguage: 'Spanish',
    targetLanguage: 'English',
    sessionType: 'Medical',
    date: '2024-01-15',
    startTime: '09:30',
    endTime: '10:15',
    duration: '00:45:00',
    participants: 3,
    rating: 5,
    status: 'Completed',
    cost: 75.00,
    recordingAvailable: true,
    transcriptAvailable: true
  },
  {
    id: '2',
    sessionCode: 'INT-4826',
    clientName: 'Legal Firm LLC',
    interpreterName: 'Mike Chen',
    sourceLanguage: 'English',
    targetLanguage: 'Mandarin',
    sessionType: 'Legal',
    date: '2024-01-15',
    startTime: '14:00',
    endTime: '15:30',
    duration: '01:30:00',
    participants: 4,
    rating: 4,
    status: 'Completed',
    cost: 150.00,
    recordingAvailable: true,
    transcriptAvailable: false
  },
  {
    id: '3',
    sessionCode: 'INT-4827',
    clientName: 'Tech Corp',
    interpreterName: 'Maria Rodriguez',
    sourceLanguage: 'French',
    targetLanguage: 'English',
    sessionType: 'Business',
    date: '2024-01-14',
    startTime: '11:00',
    endTime: '11:25',
    duration: '00:25:00',
    participants: 2,
    rating: 5,
    status: 'Interrupted',
    cost: 41.67,
    recordingAvailable: false,
    transcriptAvailable: false
  },
  {
    id: '4',
    sessionCode: 'INT-4828',
    clientName: 'University XYZ',
    interpreterName: 'David Kim',
    sourceLanguage: 'Korean',
    targetLanguage: 'English',
    sessionType: 'Educational',
    date: '2024-01-14',
    startTime: '16:30',
    endTime: '17:45',
    duration: '01:15:00',
    participants: 6,
    rating: 4,
    status: 'Completed',
    cost: 125.00,
    recordingAvailable: true,
    transcriptAvailable: true
  }
];

export default function SessionHistoryPage() {
  const [sessions] = useState<SessionRecord[]>(mockSessionHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.interpreterName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'All' || session.sessionType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Interrupted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'Medical':
        return 'bg-blue-100 text-blue-800';
      case 'Legal':
        return 'bg-purple-100 text-purple-800';
      case 'Business':
        return 'bg-teal-100 text-teal-800';
      case 'Educational':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'Completed').length;
  const totalRevenue = sessions.reduce((sum, s) => sum + s.cost, 0);
  const averageRating = sessions.reduce((sum, s) => sum + s.rating, 0) / sessions.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session History</h1>
          <p className="text-gray-600 mt-1">View and analyze past interpretation sessions</p>
        </div>
        <Button className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSignIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <StarIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by session code, client, or interpreter..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-gray-400" />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Medical">Medical</option>
                <option value="Legal">Legal</option>
                <option value="Business">Business</option>
                <option value="Educational">Educational</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Session Records
          </CardTitle>
          <CardDescription>
            Detailed history of all interpretation sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <LanguagesIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{session.sessionCode}</h3>
                        <p className="text-sm text-gray-600">{session.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <Badge className={getSessionTypeColor(session.sessionType)}>
                        {session.sessionType}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Interpreter</p>
                      <p className="font-medium">{session.interpreterName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Languages</p>
                      <p className="font-medium">{session.sourceLanguage} → {session.targetLanguage}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date & Time</p>
                      <p className="font-medium">{session.date} {session.startTime}-{session.endTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">{session.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3 text-gray-400" />
                        <span>{session.participants} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSignIcon className="h-3 w-3 text-gray-400" />
                        <span>${session.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(session.rating)}
                        <span className="ml-1">({session.rating})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.recordingAvailable && (
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <DownloadIcon className="h-3 w-3" />
                          Recording
                        </Button>
                      )}
                      {session.transcriptAvailable && (
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <FileTextIcon className="h-3 w-3" />
                          Transcript
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 