'use client';

import { useEffect, useState } from 'react';
import Todo from '@/components/Todo';

export default function TasksPage() {
  const [isClient, setIsClient] = useState(false);

  // We need to handle client-side rendering for proper Apollo client usage
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Task Management</h1>
      <p className="text-gray-600 mb-8">
        Create, manage, and track your tasks. Stay organized and boost your productivity.
      </p>
      
      {isClient ? (
        <Todo />
      ) : (
        <div className="flex justify-center p-6">Loading task manager...</div>
      )}
    </div>
  );
} 