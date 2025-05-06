'use client';

import React from 'react';
import ManageableSection from '@/components/cms/ManageableSection';

export default function ViewSectionPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Section Content</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Section: cms-managed-sections</h2>
        
        <ManageableSection 
          sectionId="cms-managed-sections"
          isEditing={false}
        />
      </div>
    </div>
  );
} 