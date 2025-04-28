'use client';

import { useState } from 'react'; 
import { Sidebar } from '@/components/ui/sidebar';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  BriefcaseIcon,
  ChartBarIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
  { name: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  { name: 'Time Tracking', href: '/dashboard/time', icon: ClockIcon },
  { name: 'Documents', href: '/dashboard/documents', icon: DocumentTextIcon },
  { name: 'Performance', href: '/dashboard/performance', icon: ChartBarIcon },
  { name: 'Jobs', href: '/dashboard/jobs', icon: BriefcaseIcon },
  { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
  { name: 'Help', href: '/dashboard/help', icon: QuestionMarkCircleIcon },
];

const externalLinks = [
  {
    name: 'E-Voque Benefits',
    href: 'https://pe.e-voquebenefit.com/',
    icon: UserIcon,
  },
  {
    name: 'E-Voque Jobs',
    href: 'https://jobs.e-voque.com/#services-area',
    icon: BriefcaseIcon,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        navigation={navigation}
        externalLinks={externalLinks}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-8">
          <div className="bg-white shadow">
            <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
              <div className="py-6 md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Dashboard
                  </h1>
                </div>
                <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <BellIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                    Notifications
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
