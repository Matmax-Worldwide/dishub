'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileTextIcon,
  ImageIcon,
  MenuIcon,
  SettingsIcon,
  ArrowRightIcon
} from 'lucide-react';

export default function CMSDashboard() {
  const { locale } = useParams();
  const [pageCount, setPageCount] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch these counts from the API
    // For now, we'll just simulate a loading state and then set dummy data
    const timer = setTimeout(() => {
      setPageCount(8);
      setMediaCount(24);
      setMenuCount(3);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const cmsModules = [
    {
      title: 'Pages',
      description: 'Create and manage website pages and content',
      icon: FileTextIcon,
      href: `/${locale}/admin/cms/pages`,
      count: pageCount,
      color: 'bg-blue-500'
    },
    {
      title: 'Media Library',
      description: 'Upload and manage images, videos, and documents',
      icon: ImageIcon,
      href: `/${locale}/admin/cms/media`,
      count: mediaCount,
      color: 'bg-purple-500'
    },
    {
      title: 'Menus',
      description: 'Configure navigation menus throughout the site',
      icon: MenuIcon,
      href: `/${locale}/admin/cms/menus`,
      count: menuCount,
      color: 'bg-green-500'
    },
    {
      title: 'Site Settings',
      description: 'Configure global website settings and appearance',
      icon: SettingsIcon,
      href: `/${locale}/admin/cms/settings`,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Content Management System</h1>
      </div>
      
      <p className="text-gray-500">
        Manage all aspects of your website content through this centralized CMS dashboard.
      </p>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {cmsModules.map((module) => (
          <Link
            key={module.title}
            href={module.href}
            className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  {module.icon && <module.icon className="h-6 w-6 text-white" />}
                </div>
                {module.count !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {isLoading ? '...' : module.count}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold">{module.title}</h2>
              <p className="mt-2 text-sm text-gray-500 flex-grow">{module.description}</p>
              <div className="mt-4 flex items-center text-blue-600 text-sm">
                Manage
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Home page updated</span>
              <span className="text-gray-400">2 hours ago</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">New image uploaded to Media Library</span>
              <span className="text-gray-400">Yesterday</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Main menu updated</span>
              <span className="text-gray-400">2 days ago</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">About page created</span>
              <span className="text-gray-400">3 days ago</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
} 