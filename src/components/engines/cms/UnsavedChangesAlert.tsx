import React from 'react';
import { AlertTriangle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedChangesAlertProps {
  isVisible: boolean;
  onSave: () => Promise<boolean> | boolean;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function UnsavedChangesAlert({
  isVisible,
  onSave,
  onDiscard,
  onCancel,
  isSaving = false
}: UnsavedChangesAlertProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unsaved Changes
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              You have unsaved changes that will be lost if you leave this page. 
              Would you like to save your changes before continuing?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Continue
                  </>
                )}
              </Button>
              
              <Button
                onClick={onDiscard}
                variant="destructive"
                disabled={isSaving}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Discard Changes
              </Button>
              
              <Button
                onClick={onCancel}
                variant="outline"
                disabled={isSaving}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 