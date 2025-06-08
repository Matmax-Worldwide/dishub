'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Plus,
  Eye,
  Edit,
  Download,
  Settings,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Types for breadcrumb items
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

// Types for action buttons
export interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
}

// Types for dropdown menu items
export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

// Status badge configuration
export interface StatusBadge {
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
}

// Main component props
export interface PageHeaderProps {
  // Basic content
  title: string;
  subtitle?: string;
  description?: string;
  
  // Navigation
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  onBack?: () => void;
  
  // Status and metadata
  status?: StatusBadge;
  metadata?: Array<{
    label: string;
    value: string;
    icon?: React.ReactNode;
  }>;
  
  // Actions
  primaryAction?: ActionButton;
  secondaryActions?: ActionButton[];
  dropdownActions?: DropdownMenuItem[];
  
  // Layout and styling
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  children?: React.ReactNode;
  
  // Animation
  animated?: boolean;
}

// Quick action presets for common use cases
export const createQuickActions = {
  // Common CRUD actions
  crud: (handlers: {
    onCreate?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
  }): ActionButton[] => {
    const actions: ActionButton[] = [];
    
    if (handlers.onCreate) {
      actions.push({
        label: 'Create',
        icon: <Plus className="h-4 w-4" />,
        onClick: handlers.onCreate,
        variant: 'default'
      });
    }
    
    if (handlers.onEdit) {
      actions.push({
        label: 'Edit',
        icon: <Edit className="h-4 w-4" />,
        onClick: handlers.onEdit,
        variant: 'outline'
      });
    }
    
    if (handlers.onView) {
      actions.push({
        label: 'View',
        icon: <Eye className="h-4 w-4" />,
        onClick: handlers.onView,
        variant: 'outline'
      });
    }
    
    return actions;
  },
  
  // Content management actions
  content: (handlers: {
    onPreview?: () => void;
    onPublish?: () => void;
    onDuplicate?: () => void;
    onExport?: () => void;
  }): ActionButton[] => {
    const actions: ActionButton[] = [];
    
    if (handlers.onPreview) {
      actions.push({
        label: 'Preview',
        icon: <Eye className="h-4 w-4" />,
        onClick: handlers.onPreview,
        variant: 'outline'
      });
    }
    
    if (handlers.onPublish) {
      actions.push({
        label: 'Publish',
        onClick: handlers.onPublish,
        variant: 'default'
      });
    }
    
    return actions;
  },
  
  // Data management actions
  data: (handlers: {
    onRefresh?: () => void;
    onExport?: () => void;
    onImport?: () => void;
    onSettings?: () => void;
  }): ActionButton[] => {
    const actions: ActionButton[] = [];
    
    if (handlers.onRefresh) {
      actions.push({
        label: 'Refresh',
        icon: <RefreshCw className="h-4 w-4" />,
        onClick: handlers.onRefresh,
        variant: 'outline'
      });
    }
    
    if (handlers.onExport) {
      actions.push({
        label: 'Export',
        icon: <Download className="h-4 w-4" />,
        onClick: handlers.onExport,
        variant: 'outline'
      });
    }
    
    if (handlers.onSettings) {
      actions.push({
        label: 'Settings',
        icon: <Settings className="h-4 w-4" />,
        onClick: handlers.onSettings,
        variant: 'ghost'
      });
    }
    
    return actions;
  }
};

// Status badge presets
export const statusPresets = {
  published: { label: 'Published', color: 'green' as const },
  draft: { label: 'Draft', color: 'gray' as const },
  pending: { label: 'Pending', color: 'yellow' as const },
  archived: { label: 'Archived', color: 'gray' as const },
  active: { label: 'Active', color: 'green' as const },
  inactive: { label: 'Inactive', color: 'red' as const },
  processing: { label: 'Processing', color: 'blue' as const },
  error: { label: 'Error', color: 'red' as const },
  success: { label: 'Success', color: 'green' as const },
  warning: { label: 'Warning', color: 'yellow' as const },
};

export default function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs,
  showBackButton = false,
  onBack,
  status,
  metadata,
  primaryAction,
  secondaryActions = [],
  dropdownActions = [],
  variant = 'default',
  className,
  children,
  animated = true,
}: PageHeaderProps) {
  
  const getStatusBadgeClasses = (color?: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'gray':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const headerContent = (
    <div className={cn(
      'bg-white border-b border-gray-200 px-4 sm:px-6 py-4',
      variant === 'compact' && 'py-3',
      variant === 'detailed' && 'py-6',
      className
    )}>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : item.href ? (
                        <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      ) : (
                        <button
                          onClick={item.onClick}
                          className="hover:text-foreground transition-colors"
                        >
                          {item.label}
                        </button>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {/* Main header content */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left side - Title and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <h1 className={cn(
                  'font-bold text-gray-900 truncate',
                  variant === 'compact' ? 'text-lg' : 'text-xl sm:text-2xl'
                )}>
                  {title}
                </h1>
                
                {status && (
                  <Badge 
                    variant="outline"
                    className={cn(
                      'flex-shrink-0 text-xs font-medium border',
                      getStatusBadgeClasses(status.color)
                    )}
                  >
                    {status.label}
                  </Badge>
                )}
              </div>
            </div>

            {subtitle && (
              <p className="text-sm text-gray-600 mb-1">{subtitle}</p>
            )}

            {description && variant !== 'compact' && (
              <p className="text-sm text-gray-500 mb-3 max-w-2xl">{description}</p>
            )}

            {/* Metadata */}
            {metadata && metadata.length > 0 && variant === 'detailed' && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                {metadata.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {item.icon}
                    <span className="font-medium">{item.label}:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Secondary actions */}
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size={action.size || 'default'}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="hidden sm:flex"
              >
                {action.loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  action.icon && <span className="mr-2">{action.icon}</span>
                )}
                {action.label}
              </Button>
            ))}

            {/* Primary action */}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || 'default'}
                size={primaryAction.size || 'default'}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
              >
                {primaryAction.loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>
                )}
                {primaryAction.label}
              </Button>
            )}

            {/* Dropdown menu for additional actions */}
            {dropdownActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {dropdownActions.map((action, index) => (
                    <React.Fragment key={index}>
                      {action.separator && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                          action.destructive && 'text-red-600 focus:text-red-600'
                        )}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Custom children content */}
        {children && (
          <>
            <Separator className="my-4" />
            {children}
          </>
        )}
      </div>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {headerContent}
      </motion.div>
    );
  }

  return headerContent;
} 