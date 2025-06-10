'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Building2,
  Users,
  Send,
  Activity,
  Briefcase,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';

export default function LegalClientSidebar() {
  const [selectedOffice, setSelectedOffice] = useState('peru');
  const pathname = usePathname();

  const navigationItems = [
    {
      section: 'main',
      items: [
        { id: 'dashboard', label: 'Management Dashboard', icon: LayoutDashboard, href: '/', badge: null },
        { id: 'incorporations', label: 'All Incorporations', icon: Building2, href: '/incorporations', badge: '24' },
        { id: 'team', label: 'Team Management', icon: Users, href: '/team', badge: '4' },
        { id: 'delegation', label: 'Task Delegation', icon: Send, href: '/delegation', badge: null },
        { id: 'performance', label: 'Performance', icon: Activity, href: '/performance', badge: null },
        { id: 'clients', label: 'Client Overview', icon: Briefcase, href: '/clients', badge: null }
      ]
    },
    {
      section: 'monitoring',
      title: 'Monitoring & Analytics',
      items: [
        { id: 'alerts', label: 'Alerts & Blockers', icon: AlertTriangle, href: '/alerts', badge: '3', badgeColor: 'red' },
        { id: 'reports', label: 'Reports', icon: BarChart3, href: '/reports', badge: null },
        { id: 'analytics', label: 'Analytics', icon: PieChart, href: '/analytics', badge: null },
        { id: 'calendar', label: 'Calendar View', icon: Calendar, href: '/calendar', badge: null }
      ]
    },
    {
      section: 'administration',
      title: 'Administration',
      items: [
        { id: 'billing', label: 'Billing & Revenue', icon: DollarSign, href: '/billing', badge: null },
        { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', badge: null }
      ]
    }
  ];

  const offices = [
    { id: 'peru', label: 'Peru Office', flag: '🇵🇪' },
    { id: 'mexico', label: 'Mexico Office', flag: '🇲🇽' },
    { id: 'colombia', label: 'Colombia Office', flag: '🇨🇴' }
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-50 w-72`}>

      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12">
              <Image
                width={48}
                height={48}
                src="/nuo_logo_light.webp" 
                alt="Legal Dashboard" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-800">Legal Dashboard</h2>
              <p className="text-xs text-gray-500">Management Console</p>
            </div>
          </div>
        </div>

        {/* Office Selector */}
        <select 
          value={selectedOffice}
          onChange={(e) => setSelectedOffice(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
        >
          {offices.map(office => (
            <option key={office.id} value={office.id}>
              {office.flag} {office.label}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navigationItems.map((section) => (
          <div key={section.section} className="mb-6">
            {section.title && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          (item as { badgeColor?: string }).badgeColor === 'red' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">AP</span>
            </div>
            <div>
                          <p className="text-sm font-medium text-gray-700">Antonella Puntriano</p>
            <p className="text-xs text-gray-500">Founder & CEO</p>
            </div>
          </div>
        </div>
        <button className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg">
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
} 