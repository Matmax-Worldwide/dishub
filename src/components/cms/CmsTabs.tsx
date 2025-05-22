'use client';

import React, { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface CmsTabProps {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface CmsTabsProps {
  tabs: CmsTabProps[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  fullWidth?: boolean;
  className?: string;
  contentClassName?: string;
}

export function CmsTabs({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  fullWidth = true,
  className,
  contentClassName
}: CmsTabsProps) {
  // Use the first tab as default if not specified
  const initialTab = defaultTab || (tabs.length > 0 ? tabs[0].id : '');
  
  return (
    <Tabs
      defaultValue={initialTab}
      value={activeTab}
      onValueChange={onTabChange}
      className={cn("w-full", className)}
    >
      <TabsList className={cn(
        "flex mb-4 bg-muted/60 p-1 rounded-lg",
        fullWidth ? "w-full" : "inline-flex"
      )}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "flex items-center gap-1.5 rounded-md text-sm font-medium",
              fullWidth ? "flex-1" : ""
            )}
          >
            {tab.icon && <span className="text-muted-foreground">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className={cn("outline-none border-none", contentClassName)}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

// Helper components for direct tab creation
export function CmsTab({ id, label, icon, content }: CmsTabProps) {
  return (
    <div id={id} data-tab-id={id} data-tab-label={label} data-tab-has-icon={!!icon}>
      {content}
    </div>
  );
}

// Icon with label component
export function TabIconLabel({ 
  icon, 
  label 
}: { 
  icon: ReactNode; 
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </div>
  );
} 