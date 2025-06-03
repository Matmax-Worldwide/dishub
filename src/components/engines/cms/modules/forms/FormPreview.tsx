'use client';

import React, { useState } from 'react';
import { FormBase } from '@/types/forms';
import MultiStepFormRenderer from './MultiStepFormRenderer';
import FormRenderer from './FormRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { toast } from 'sonner';

interface FormPreviewProps {
  form: FormBase;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export default function FormPreview({ form }: FormPreviewProps) {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePreviewSubmit = async (formData: Record<string, unknown>) => {
    setIsSubmitting(true);
    
    // Simulate form submission for preview
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Preview form submission:', formData);
    toast.success('Form submitted successfully! (This is just a preview)');
    
    setIsSubmitting(false);
  };

  const getViewportClasses = () => {
    switch (viewportSize) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  const getViewportIcon = (size: ViewportSize) => {
    switch (size) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const hasFields = form.fields && form.fields.length > 0;
  const hasStepsWithFields = form.isMultiStep && form.steps && form.steps.some(step => step.fields && step.fields.length > 0);

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Form Preview
              </CardTitle>
              <CardDescription>
                See how your form will appear to users. This is a live preview with simulated submission.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={form.isActive ? 'default' : 'secondary'}>
                {form.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {form.isMultiStep && (
                <Badge variant="outline">Multi-step</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Viewport Size Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Viewport:</span>
              <div className="flex rounded-lg border border-gray-200 p-1">
                {(['desktop', 'tablet', 'mobile'] as ViewportSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setViewportSize(size)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewportSize === size
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {getViewportIcon(size)}
                    <span className="capitalize">{size}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `/forms/${form.slug}`;
                window.open(url, '_blank');
              }}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in New Tab</span>
            </Button>
          </div>

          {/* Form Status Messages */}
          {!form.isActive && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Form is Inactive
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This form is currently inactive and won&apos;t accept submissions. Activate it in General Settings to start collecting responses.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!hasFields && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    No Fields Added
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Add fields in the Fields tab to see your form preview.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {form.isMultiStep && !hasStepsWithFields && hasFields && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Multi-step Form Without Step Assignments
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>You have fields created but they&apos;re not assigned to any steps. Go to the Form Steps tab to create steps and assign fields.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Preview */}
      {hasFields && (
        <div className={`transition-all duration-300 ${getViewportClasses()}`}>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              {/* Form Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
                {form.description && (
                  <p className="text-gray-600">{form.description}</p>
                )}
              </div>

              {/* Form Content */}
              {form.isMultiStep && hasStepsWithFields ? (
                <MultiStepFormRenderer
                  form={form}
                  onSubmit={handlePreviewSubmit}
                  submitStatus={isSubmitting ? 'submitting' : 'idle'}
                  designType="modern"
                />
              ) : (
                <FormRenderer
                  form={form}
                  onSubmit={handlePreviewSubmit}
                  submitStatus={isSubmitting ? 'submitting' : 'idle'}
                  buttonClassName="w-full px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                  inputClassName="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  labelClassName="block text-sm font-medium text-gray-700 mb-1"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-500">
            <p>This is a preview of your form. Submissions made here are simulated and won&apos;t be saved.</p>
            <p className="mt-1">Share your form URL: <code className="bg-gray-100 px-2 py-1 rounded text-xs">/forms/{form.slug}</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 