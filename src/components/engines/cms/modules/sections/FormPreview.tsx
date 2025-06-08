
'use client';

import React from 'react';
import { FormBase } from '@/types/forms';
import { ArrowRight, FileText } from 'lucide-react';

interface FormPreviewProps {
  form: FormBase | null;
  compact?: boolean;
  className?: string;
}

export const FormPreview: React.FC<FormPreviewProps> = ({ 
  form, 
  compact = false,
  className = ''
}) => {
  if (!form) {
    return (
      <div className={`flex items-center justify-center p-6 bg-muted/20 rounded-md border border-dashed border-muted-foreground/30 ${className}`}>
        <div className="text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No form selected</p>
        </div>
      </div>
    );
  }

  // Compact view just shows basic info
  if (compact) {
    return (
      <div className={`p-3 bg-card rounded-md border shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-sm">{form.title}</h4>
            {form.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{form.description}</p>
            )}
          </div>
          {form.isActive ? (
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">Active</span>
          ) : (
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">Inactive</span>
          )}
        </div>
      </div>
    );
  }

  // Form type icon based on properties
  const FormTypeIcon = () => {
    if (form.isMultiStep) {
      return (
        <div className="flex items-center">
          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs mr-1">1</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs ml-1">2</span>
        </div>
      );
    }
    return (
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">1</span>
    );
  };

  // Calculate field counts for different types
  const fieldCount = form.fields?.length || 0;
  const stepCount = form.steps?.length || 0;

  return (
    <div className={`p-4 bg-white rounded-md border shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-base">{form.title}</h3>
          {form.description && (
            <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
          )}
        </div>
        <FormTypeIcon />
      </div>
      
      <div className="flex items-center text-sm space-x-4 mt-4">
        <div className="flex items-center">
          <span className="text-xs font-medium mr-1">Fields:</span>
          <span className="text-xs">{fieldCount}</span>
        </div>
        {form.isMultiStep && (
          <div className="flex items-center">
            <span className="text-xs font-medium mr-1">Steps:</span>
            <span className="text-xs">{stepCount}</span>
          </div>
        )}
        <div className="flex-1 text-right">
          {form.isActive ? (
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">Active</span>
          ) : (
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">Inactive</span>
          )}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-muted/30">
        <div className="text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Submit button:</span>
            <span className="font-medium">{form.submitButtonText || "Submit"}</span>
          </div>
          {form.successMessage && (
            <div className="flex justify-between mt-1">
              <span>Success message:</span>
              <span className="font-medium truncate max-w-[150px]">{form.successMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 