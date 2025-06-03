'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormComponent } from '@/components/cms/forms/hooks/useFormComponent';
import { FormInput } from '@/types/forms';
import { ArrowLeft, Save, FileText, Settings, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function NewFormPage() {
  const router = useRouter();
  const { createForm } = useFormComponent();
  const [formData, setFormData] = useState<FormInput>({
    title: '',
    description: '',
    slug: '',
    isMultiStep: false,
    isActive: true,
    submitButtonText: 'Submit',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Auto-generate slug from title if slug is empty
    if (name === 'title' && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await createForm(formData);
      
      if (result.success && result.form) {
        router.push('/cms/forms');
      } else {
        setError(result.error || 'Failed to create form');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error creating form:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-6">
          <Link 
            href="/cms/forms" 
              className="mr-4 p-3 rounded-xl bg-white shadow-md hover:shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
          >
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
          </Link>
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mr-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Form</h1>
              <p className="text-gray-600 text-lg">Build engaging forms to collect data from your users</p>
        </div>
      </div>
      
          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Smart Forms</p>
                  <p className="text-sm text-gray-600">Dynamic field types</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center">
                <div className="p-3 bg-green-100 rounded-lg mr-3">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Customizable</p>
                  <p className="text-sm text-gray-600">Full control over styling</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-3">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">Track submissions</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm"
            >
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Error</h3>
                  <p className="text-sm">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
        >
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-lg mr-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Form Configuration</h2>
                <p className="text-blue-100 text-sm">Configure your form settings and options</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-6"
                >
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Basic Information</h3>
                    <p className="text-sm text-gray-600">Essential details about your form</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Form Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter a descriptive title for your form"
                />
              </div>
              
              <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Form Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="form-slug"
                />
                      <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                        🔗 Used in the URL to identify your form. Auto-generated from title if left empty.
                </p>
              </div>
              
              <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Describe what this form is for and how it will be used..."
                />
              </div>
            </div>
                </motion.div>
                
                {/* Configuration */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-6"
                >
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Configuration</h3>
                    <p className="text-sm text-gray-600">Customize form behavior and appearance</p>
                  </div>

                  <div className="space-y-4">
              <div>
                      <label htmlFor="submitButtonText" className="block text-sm font-medium text-gray-700 mb-2">
                  Submit Button Text
                </label>
                <input
                  type="text"
                  id="submitButtonText"
                  name="submitButtonText"
                  value={formData.submitButtonText || 'Submit'}
                  onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Submit"
                />
              </div>
              
              <div>
                      <label htmlFor="successMessage" className="block text-sm font-medium text-gray-700 mb-2">
                  Success Message
                </label>
                <textarea
                  id="successMessage"
                  name="successMessage"
                  value={formData.successMessage || ''}
                  onChange={handleChange}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Thank you for your submission! We'll get back to you soon."
                />
              </div>
              
                    {/* Form Options */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-gray-900">Form Options</h4>
                      
                      <div className="space-y-3">
                        <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    id="isMultiStep"
                    name="isMultiStep"
                    checked={formData.isMultiStep || false}
                    onChange={e => setFormData({ ...formData, isMultiStep: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-900">Multi-step Form</span>
                            <p className="text-xs text-gray-600">Break long forms into multiple steps</p>
                          </div>
                  </label>
                
                        <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive !== false}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-900">Active</span>
                            <p className="text-xs text-gray-600">Form is available to receive submissions</p>
                          </div>
                  </label>
                </div>
              </div>
            </div>
                </motion.div>
          </div>
          
              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100"
              >
                <Button
              type="button"
                  variant="outline"
              onClick={() => router.push('/cms/forms')}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
                </Button>
                <Button
              type="submit"
              disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                  Create Form
                    </div>
              )}
                </Button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
} 