'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  Activity,
  CreditCard,
  Globe,
  Server,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Home,
  Package,
  Layers
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarItem {
  id: string;
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SidebarItem[];
  badge?: string;
  description?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Platform overview and analytics'
  },
  {
    id: 'tenants',
    title: 'Tenant Management',
    icon: Building2,
    description: 'Manage all tenants',
    children: [
      {
        id: 'tenants-list',
        title: 'All Tenants',
        href: '/admin/tenants',
        icon: Building2
      },
      {
        id: 'tenants-create',
        title: 'Create Tenant',
        href: '/admin/tenants/create',
        icon: Building2
      },
      {
        id: 'tenants-features',
        title: 'Feature Management',
        href: '/admin/tenants/features',
        icon: Layers
      }
    ]
  },
  {
    id: 'users',
    title: 'User Management',
    icon: Users,
    description: 'Platform-wide user management',
    children: [
      {
        id: 'users-list',
        title: 'All Users',
        href: '/admin/users',
        icon: Users
      },
      {
        id: 'users-roles',
        title: 'Roles & Permissions',
        href: '/admin/users/roles',
        icon: Shield
      },
      {
        id: 'users-activity',
        title: 'User Activity',
        href: '/admin/users/activity',
        icon: Activity
      }
    ]
  },
  {
    id: 'platform',
    title: 'Platform Management',
    icon: Server,
    description: 'Core platform settings',
    children: [
      {
        id: 'platform-features',
        title: 'Feature Definitions',
        href: '/admin/platform/features',
        icon: Package
      },
      {
        id: 'platform-templates',
        title: 'Tenant Templates',
        href: '/admin/platform/templates',
        icon: Layers
      },
      {
        id: 'platform-domains',
        title: 'Domain Management',
        href: '/admin/platform/domains',
        icon: Globe
      }
    ]
  },
  {
    id: 'billing',
    title: 'Billing & Subscriptions',
    icon: CreditCard,
    description: 'Revenue and subscription management',
    children: [
      {
        id: 'billing-overview',
        title: 'Billing Overview',
        href: '/admin/billing',
        icon: CreditCard
      },
      {
        id: 'billing-plans',
        title: 'Subscription Plans',
        href: '/admin/billing/plans',
        icon: Package
      },
      {
        id: 'billing-invoices',
        title: 'Invoices',
        href: '/admin/billing/invoices',
        icon: CreditCard
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Platform Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Platform-wide metrics and insights'
  },
  {
    id: 'system',
    title: 'System Management',
    icon: Database,
    description: 'System health and maintenance',
    children: [
      {
        id: 'system-health',
        title: 'System Health',
        href: '/admin/system/health',
        icon: Activity
      },
      {
        id: 'system-logs',
        title: 'System Logs',
        href: '/admin/system/logs',
        icon: Database
      },
      {
        id: 'system-backup',
        title: 'Backup & Recovery',
        href: '/admin/system/backup',
        icon: Database
      }
    ]
  },
  {
    id: 'support',
    title: 'Support Center',
    icon: HelpCircle,
    description: 'Support tickets and documentation',
    children: [
      {
        id: 'support-tickets',
        title: 'Support Tickets',
        href: '/admin/support/tickets',
        icon: HelpCircle,
        badge: '3'
      },
      {
        id: 'support-docs',
        title: 'Documentation',
        href: '/admin/support/docs',
        icon: HelpCircle
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    badge: '5',
    description: 'Platform-wide notifications'
  },
  {
    id: 'settings',
    title: 'Platform Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Global platform configuration'
  }
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['tenants', 'users']));

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActiveLink = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = item.href ? isActiveLink(item.href) : false;

    const itemContent = (
      <div 
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
          ${level === 0 ? 'font-medium' : 'font-normal text-sm'}
          ${isActive 
            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }
          ${level > 0 ? 'ml-6' : ''}
        `}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            toggleExpanded(item.id);
          } else if (item.href) {
            router.push(item.href);
          }
        }}
      >
        <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )
        )}
      </div>
    );

    return (
      <div key={item.id}>
        {item.href ? (
          <Link href={item.href} className="block">
            {itemContent}
          </Link>
        ) : (
          itemContent
        )}
        
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 space-y-1"
          >
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white border-r border-gray-200">
      <div className="flex flex-col w-80">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
            <p className="text-sm text-gray-500">Platform Management</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {sidebarItems.map(item => renderSidebarItem(item))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
} 