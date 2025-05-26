'use client';

import React, { useEffect, useState } from 'react';
import { FormBase } from '@/types/forms';
import graphqlClient from '@/lib/graphql-client';
import FormRenderer from '@/components/cms/forms/FormRenderer';
import MultiStepFormRenderer from '@/components/cms/forms/MultiStepFormRenderer';
import { motion } from 'framer-motion';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import * as LucideIcons from 'lucide-react';
import { toast } from 'sonner';

interface FormPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Loading component
const FormPageSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 shadow-2xl animate-pulse">
        <div className="mb-6 p-5 bg-white/10 rounded-full w-20 h-20 mx-auto"></div>
        <div className="h-8 bg-white/20 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-1/2 mx-auto mb-8"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded"></div>
          ))}
        </div>
        <div className="h-12 bg-white/20 rounded mt-6"></div>
      </div>
    </div>
  </div>
);

// Error component
const FormPageError = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
    <div className="w-full max-w-md mx-auto text-center">
      <div className="bg-red-500/10 backdrop-blur-md p-8 rounded-xl border border-red-500/20 shadow-2xl">
        <div className="mb-4 p-4 bg-red-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Form Not Found</h1>
        <p className="text-white/80 mb-6">{message}</p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors border border-white/20"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

export default function FormPage({ params }: FormPageProps) {
  const [form, setForm] = useState<FormBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [resolvedParams, setResolvedParams] = useState<{ locale: string; slug: string } | null>(null);

  // Resolve params first
  useEffect(() => {
    async function resolveParams() {
      try {
        const resolved = await params;
        setResolvedParams(resolved);
      } catch (err) {
        console.error('Error resolving params:', err);
        setError('Invalid page parameters');
        setLoading(false);
      }
    }
    
    resolveParams();
  }, [params]);

  // Load form data
  useEffect(() => {
    async function loadForm() {
      if (!resolvedParams?.slug) return;
      
      try {
        setLoading(true);
        setError(null);

        const formData = await graphqlClient.getFormBySlug(resolvedParams.slug);
        
        if (!formData) {
          setError('Form not found or is not active');
          return;
        }

        if (!formData.isActive) {
          setError('This form is currently not available');
          return;
        }

        setForm(formData);
      } catch (err) {
        console.error('Error loading form:', err);
        setError('Failed to load form. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [resolvedParams]);

  // Handle form submission
  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    if (!form || !resolvedParams) return;

    try {
      setSubmitStatus('submitting');

      const result = await graphqlClient.submitForm({
        formId: form.id,
        data: formData,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          locale: resolvedParams.locale,
        },
      });

      if (result.success) {
        setSubmitStatus('success');
        toast.success(result.message || 'Form submitted successfully!');
        
        // Handle redirect if specified
        if (form.redirectUrl) {
          setTimeout(() => {
            window.location.href = form.redirectUrl!;
          }, 2000);
        }
      } else {
        setSubmitStatus('error');
        toast.error(result.message || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      toast.error('An error occurred while submitting the form');
    }
  };

  // Get icon component
  const getIconComponent = () => {
    const IconComponent = LucideIcons.Send as React.ElementType;
    return IconComponent ? (
      <IconComponent className="h-14 w-14 text-white" />
    ) : (
      <PaperAirplaneIcon className="h-14 w-14 text-white" />
    );
  };

  // Show loading state
  if (loading || !resolvedParams) {
    return <FormPageSkeleton />;
  }

  // Show error state
  if (error || !form) {
    return <FormPageError message={error || 'Form not found'} />;
  }

  // Show success state
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-green-500/10 backdrop-blur-md p-8 rounded-xl border border-green-500/20 shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mb-6 p-5 bg-green-500/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-4">Thank You!</h1>
            <p className="text-white/80 mb-6">
              {form.successMessage || 'Your form has been submitted successfully.'}
            </p>
            
            {form.redirectUrl && (
              <p className="text-sm text-white/60">
                Redirecting you in a moment...
              </p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Render the form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const width = 1 + ((i * 7) % 3);
          const height = 1 + ((i * 13) % 3);
          const left = ((i * 17) % 100);
          const top = ((i * 23) % 100);
          const duration = 2 + ((i * 11) % 3);
          const delay = (i * 19) % 2;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.2, 1] }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay,
              }}
            />
          );
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="mb-6 p-5 bg-white/10 backdrop-blur-sm rounded-full w-min mx-auto border border-white/30 shadow-lg shadow-blue-500/20"
            >
              {getIconComponent()}
            </motion.div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-md">
              {form.title}
            </h1>
            
            {form.description && (
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
                {form.description}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 shadow-2xl shadow-blue-500/10">
              {form.isMultiStep ? (
                <MultiStepFormRenderer
                  form={form}
                  buttonClassName="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-md font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300"
                  inputClassName="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                  labelClassName="block text-sm font-medium text-white mb-1"
                  onSubmit={handleFormSubmit}
                  submitStatus={submitStatus}
                />
              ) : (
                <FormRenderer
                  form={form}
                  buttonClassName="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-md font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300"
                  inputClassName="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                  labelClassName="block text-sm font-medium text-white mb-1"
                  onSubmit={handleFormSubmit}
                  submitStatus={submitStatus}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

