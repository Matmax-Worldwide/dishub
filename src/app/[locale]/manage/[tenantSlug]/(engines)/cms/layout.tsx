'use client';

import React from 'react';
import CMSSidebar from '@/components/CMSSidebar';
import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';
import { FeatureProvider, FeatureType } from '@/hooks/useFeatureAccess';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_TENANT_FEATURES = gql`
  query GetTenantFeatures {
    me {
      id
      tenantId
      role {
        name
      }
    }
    # Note: This would need to be implemented to get actual tenant features
    # For now, we'll provide default CMS features
  }
`;

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For now, provide default CMS features
  // In a real implementation, you'd fetch these from the tenant's feature list
  const defaultFeatures: FeatureType[] = ['CMS_ENGINE', 'BLOG_MODULE', 'FORMS_MODULE'];
  
  const { loading } = useQuery(GET_TENANT_FEATURES, {
    errorPolicy: 'ignore' // Ignore errors for now
  });

  return (
    <FeatureProvider features={defaultFeatures} isLoading={loading}>
      <UnsavedChangesProvider>
        <div className="flex h-screen">
          <CMSSidebar />
          <div className="flex-1 overflow-auto">
            {/* This is a nested layout inside the admin layout */}
            {children}
          </div>
        </div>
      </UnsavedChangesProvider>
    </FeatureProvider>
  );
} 