import { useState, useEffect } from 'react';
import { FormBase } from '../../../../types/forms';
import graphqlClient from '../../../../lib/graphql-client';

export function useFormComponent(formId?: string) {
  const [form, setForm] = useState<FormBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchForm = async () => {
      if (!formId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const formData = await graphqlClient.getFormById(formId);
        
        if (!isMounted) return;
        
        if (formData) {
          setForm(formData);
        } else {
          // Create a fallback form for display purposes
          setForm({
            id: formId,
            title: 'Form',
            description: 'This form is currently unavailable.',
            slug: 'form',
            isMultiStep: false,
            isActive: true,
            fields: [],
            submitButtonText: 'Submit',
            createdById: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as FormBase);
          
          console.warn('Form data not found, using fallback');
        }
      } catch (err) {
        console.error('Error loading form:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load form'));
          
          // Create a fallback form for error state
          setForm({
            id: formId,
            title: 'Form',
            description: 'There was an error loading this form. Please try again later.',
            slug: 'error-form',
            isMultiStep: false,
            isActive: true,
            fields: [],
            submitButtonText: 'Submit',
            createdById: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as FormBase);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchForm();

    return () => {
      isMounted = false;
    };
  }, [formId]);

  return { form, loading, error };
} 