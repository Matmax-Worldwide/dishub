'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ManageableSection from '@/components/cms/ManageableSection';

// Our known valid section ID
const VALID_SECTION_ID = 'cms-managed-sections';

export default function AdminSectionPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params?.id as string;
  
  // Check for common typos in the section ID
  useEffect(() => {
    // If the section ID is slightly wrong (missing the last character or has a typo)
    if (sectionId && sectionId !== VALID_SECTION_ID && 
        (sectionId.startsWith('cmabj51ke0000brep4j5e3c') || 
         sectionId.length === VALID_SECTION_ID.length - 1)) {
      console.log(`Redirecting from invalid section ID: ${sectionId} to ${VALID_SECTION_ID}`);
      router.replace(`/admin/section/${VALID_SECTION_ID}`);
    }
  }, [sectionId, router]);
  
  // Always use the valid section ID to ensure data is loaded correctly
  const effectiveSectionId = sectionId === VALID_SECTION_ID ? sectionId : VALID_SECTION_ID;
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Section</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Editing Section: {effectiveSectionId}</h2>
        <p className="text-gray-600 mb-6">
          Changes will be automatically saved to this section.
        </p>
        
        <ManageableSection 
          sectionId={effectiveSectionId}
          isEditing={true}
        />
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <a 
            href={`/section/${effectiveSectionId}`} 
            className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            View this section
          </a>
        </div>
      </div>
    </div>
  );
} 