'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RadioIcon,
  PauseIcon,
  VolumeXIcon,
  StopCircleIcon,
  PlayIcon,
  UsersIcon,
  ClockIcon,
  MicIcon,
  LanguagesIcon,
  HeadphonesIcon
} from 'lucide-react';

interface LiveSession {
  id: string;
  sessionCode: string;
  clientName: string;
  interpreterName: string;
  sourceLanguage: string;
  targetLanguage: string;
  sessionType: 'Medical' | 'Legal' | 'Business' | 'Educational';
  status: 'Active' | 'Paused' | 'Waiting';
  duration: string;
  participants: number;
  startTime: string;
}

const mockLiveSessions: LiveSession[] = [
  {
    id: '1',
    sessionCode: 'INT-4829',
    clientName: 'Hospital General',
    interpreterName: 'Sarah Johnson',
    sourceLanguage: 'Spanish',
    targetLanguage: 'English',
    sessionType: 'Medical',
    status: 'Active',
    duration: '00:12:45',
    participants: 3,
    startTime: '14:30'
  },
  {
    id: '2',
    sessionCode: 'INT-4830',
    clientName: 'Legal Firm LLC',
    interpreterName: 'Mike Chen',
    sourceLanguage: 'English',
    targetLanguage: 'Mandarin',
    sessionType: 'Legal',
    status: 'Active',
    duration: '00:08:12',
    participants: 4,
    startTime: '15:15'
  },
  {
    id: '3',
    sessionCode: 'INT-4831',
    clientName: 'Tech Corp',
    interpreterName: 'Maria Rodriguez',
    sourceLanguage: 'French',
    targetLanguage: 'English',
    sessionType: 'Business',
    status: 'Paused',
    duration: '00:25:30',
    participants: 2,
    startTime: '13:45'
  }
];

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>(mockLiveSessions);

  const handleSessionControl = (sessionId: string, action: 'pause' | 'resume' | 'stop' | 'mute') => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        switch (action) {
          case 'pause':
            return { ...session, status: 'Paused' as const };
          case 'resume':
            return { ...session, status: 'Active' as const };
          case 'stop':
            return { ...session, status: 'Waiting' as const };
          default:
            return session;
        }
      }
      return session;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'Waiting':
        return 'bg-gray-100 text-gray-800';
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

  const activeSessions = sessions.filter(s => s.status === 'Active').length;
  const totalParticipants = sessions.reduce((sum, s) => sum + s.participants, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Interpretation Sessions</h1>
          <p className="text-gray-600 mt-1">Monitor and manage active interpretation sessions</p>
        </div>
        <Button className="flex items-center gap-2">
          <RadioIcon className="h-4 w-4" />
          Start New Session
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <RadioIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{activeSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HeadphonesIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Interpreters</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <LanguagesIcon className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Language Pairs</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadioIcon className="h-5 w-5 text-red-500" />
            Live Sessions
          </CardTitle>
          <CardDescription>
            Real-time monitoring of active interpretation sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <RadioIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
                <p className="text-gray-600">Start a new interpretation session to monitor it here.</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MicIcon className="h-5 w-5 text-blue-600" />
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

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Interpreter</p>
                      <p className="font-medium">{session.interpreterName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Languages</p>
                      <p className="font-medium">{session.sourceLanguage} → {session.targetLanguage}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {session.duration}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Participants</p>
                      <p className="font-medium flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {session.participants}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Started at {session.startTime}
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === 'Active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSessionControl(session.id, 'pause')}
                          className="flex items-center gap-1"
                        >
                          <PauseIcon className="h-3 w-3" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSessionControl(session.id, 'resume')}
                          className="flex items-center gap-1"
                        >
                          <PlayIcon className="h-3 w-3" />
                          Resume
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSessionControl(session.id, 'mute')}
                        className="flex items-center gap-1"
                      >
                        <VolumeXIcon className="h-3 w-3" />
                        Mute
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSessionControl(session.id, 'stop')}
                        className="flex items-center gap-1"
                      >
                        <StopCircleIcon className="h-3 w-3" />
                        Stop
                      </Button>
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