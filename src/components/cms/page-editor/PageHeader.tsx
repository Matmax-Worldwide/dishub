'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  EyeIcon, 
  MoreHorizontalIcon, 
  ArrowLeftIcon, 
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  isPublished: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onPublishChange: (checked: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  slug?: string;
  children?: React.ReactNode;
  lastModified?: Date;
  author?: string;
  pageType?: string;
  onBack?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export default function PageHeader({
  title,
  isPublished,
  hasUnsavedChanges,
  isSaving,
  onPublishChange,
  onCancel,
  onSave,
  slug,
  children,
  lastModified,
  author,
  pageType = 'Page',
  onBack,
  onDuplicate,
  onDelete
}: PageHeaderProps) {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || 'en';
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  // Function to handle previewing the page with error handling and loading state
  const handlePreviewPage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Use the provided slug or extract from the URL params
    const pageSlug = slug || (params.slug as string);
    
    if (!pageSlug) {
      console.error('No slug available for preview');
      return;
    }
    
    try {
      setIsPreviewLoading(true);
      
      // Open the page in a new tab
      window.open(`/${locale}/${pageSlug}`, '_blank');
      
      // Reset loading state after a brief delay to show feedback
      setTimeout(() => {
        setIsPreviewLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error opening preview:', error);
      setIsPreviewLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };
    
  return (
    <motion.div 
      className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0 shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center">
          {onBack && (
            <Button
              size="icon"
              variant="ghost"
              className="mr-3 h-8 w-8"
              onClick={handleBack}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          )}
          
          <div>
            <div className="flex items-center">
              <h1 className="text-xl font-bold tracking-tight mr-4 max-w-md truncate">{title}</h1>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        isPublished 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {isPublished ? 'Published' : 'Draft'}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isPublished 
                      ? 'This page is visible to all users' 
                      : 'This page is only visible to administrators'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {hasUnsavedChanges && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full flex items-center">
                  <AlertCircleIcon className="h-3 w-3 mr-1" />
                  Unsaved
                </span>
              )}
            </div>
            
            <div className="flex mt-1 text-xs text-gray-500 items-center">
              <span className="flex items-center mr-4">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {pageType}
              </span>
              
              {lastModified && (
                <span className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Last modified: {lastModified.toLocaleDateString()}
                </span>
              )}
              
              {author && (
                <span className="ml-4">by {author}</span>
              )}
            </div>
          </div>
          
          {children}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 rounded-full"
                    onClick={handlePreviewPage}
                    disabled={!slug || isPreviewLoading}
                  >
                    {isPreviewLoading ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isPublished ? 'View live page' : 'Preview draft page'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div 
              className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg"
              onMouseEnter={() => setShowStatusTooltip(true)}
              onMouseLeave={() => setShowStatusTooltip(false)}
            >
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={onPublishChange}
                className="data-[state=checked]:bg-green-500"
              />
              <Label htmlFor="published" className="text-sm font-medium cursor-pointer select-none">
                {isPublished ? 'Published' : 'Draft'}
              </Label>
              
              {showStatusTooltip && (
                <motion.div 
                  className="absolute -top-10 bg-gray-800 text-white text-xs py-1 px-2 rounded"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {isPublished ? 'Set to draft mode' : 'Publish page'}
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={isSaving}
                className="hidden sm:flex"
              >
                Cancel
              </Button>
              
              <Button 
                onClick={onSave}
                disabled={isSaving}
                className={cn(
                  "min-w-[90px]",
                  isSaving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                    Save
                  </span>
                )}
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePreviewPage}>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {isPublished ? 'View Live Page' : 'Preview Draft'}
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 