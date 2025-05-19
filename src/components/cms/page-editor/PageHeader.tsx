import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EyeIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

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
  children
}: PageHeaderProps) {
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  const handlePreviewPage = () => {
    // Use the provided slug or extract from the URL if not provided
    const pageSlug = slug || (params.slug as string);
    if (pageSlug) {
      window.open(`/${locale}/${pageSlug}`, '_blank');
    }
  };
    
  return (
    <div className="top-0 bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
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
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title="Preview page"
            onClick={handlePreviewPage}
          >
            <EyeIcon className="h-4 w-4 text-gray-500 hover:text-blue-500" />
          </Button>
          
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