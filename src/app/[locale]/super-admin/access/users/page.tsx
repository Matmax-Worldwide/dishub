'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { UsersIcon, ArrowLeftIcon, ShieldIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MCPUsersPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              👥 MCP Users
            </h1>
            <p className="text-gray-600 mt-1">
              Manage Master Control Panel user access
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldIcon className="h-5 w-5 mr-2" />
            Access Control Management
          </CardTitle>
          <CardDescription>
            This feature is coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <UsersIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">MCP User Management</h3>
          <p className="text-gray-500 mb-6">
            The MCP user management interface will be available in a future update.
          </p>
          <Button onClick={() => router.push('/super-admin')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 