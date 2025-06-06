'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, FlaskConicalIcon } from 'lucide-react';
import Link from 'next/link';

export default function TestingSandboxPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/super-admin">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Super Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Testing Sandbox</h1>
            <p className="text-gray-600">Safe environment for testing features and configurations</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FlaskConicalIcon className="h-5 w-5 mr-2" />
            Testing Sandbox
          </CardTitle>
          <CardDescription>
            This feature is coming soon. The testing sandbox will provide a safe environment for testing new features and configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Features will include:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>Isolated testing environment</li>
            <li>Feature flag testing</li>
            <li>Configuration validation</li>
            <li>Performance testing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 