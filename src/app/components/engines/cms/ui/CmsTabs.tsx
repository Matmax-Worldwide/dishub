'use client';

import React, { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
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
        "grid w-full  to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner",
        fullWidth ? `grid-cols-${tabs.length}` : "inline-flex"
      )}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]",
              "flex items-center gap-2",
              fullWidth ? "flex-1 justify-center" : ""
            )}
          >
            {tab.icon && <span className="text-current opacity-80">{tab.icon}</span>}
            <span>{tab.label}</span>
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