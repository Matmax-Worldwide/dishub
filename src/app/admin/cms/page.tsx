'use client';

import React from 'react';
import ManageableSection from '@/components/cms/ManageableSection';

// Define the correct section ID
const VALID_SECTION_ID = 'cms-managed-sections';

export default function CMSAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">CMS Content Manager</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Section: {VALID_SECTION_ID}</h2>
        <p className="text-gray-600 mb-6">
          This section contains content that can be edited and managed through the CMS.
        </p>
        
        <ManageableSection 
          sectionId={VALID_SECTION_ID}
          isEditing={true}
        />
      </div>
    </div>
  );
} 