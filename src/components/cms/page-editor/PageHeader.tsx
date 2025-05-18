import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PageHeaderProps {
  title: string;
  isPublished: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onPublishChange: (checked: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  isPublished,
  hasUnsavedChanges,
  isSaving,
  onPublishChange,
  onCancel,
  onSave,
  children
}: PageHeaderProps) {
    

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold tracking-tight mr-4 max-w-md truncate">{title}</h1>
          
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-500 font-medium">
              (Unsaved changes)
            </span>
          )}


            
          {children}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={onPublishChange}
            />
            <Label htmlFor="published" className="font-medium">
              Published
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={onSave}
              disabled={isSaving}
              className="min-w-[80px]"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Saving...
                </>
              ) : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 