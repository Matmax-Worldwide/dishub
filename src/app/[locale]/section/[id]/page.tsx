'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ManageableSection from '@/components/cms/ManageableSection';

// Our known valid section ID
const VALID_SECTION_ID = 'cms-managed-sections';

export default function SectionPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params?.id as string;
  
  // Check for common typos in the section ID
  useEffect(() => {
    // If the section ID is slightly wrong (missing the last character or has a typo)
    // This handles cases like 'cmabj51ke0000brep4j5e3cv' (missing 'q' at the end)
    if (sectionId && sectionId !== VALID_SECTION_ID && 
        (sectionId.startsWith('cmabj51ke0000brep4j5e3c') || 
         sectionId.length === VALID_SECTION_ID.length - 1)) {
      console.log(`Redirecting from invalid section ID: ${sectionId} to ${VALID_SECTION_ID}`);
      router.replace(`/section/${VALID_SECTION_ID}`);
    }
  }, [sectionId, router]);
  
  // Always use the valid section ID to ensure data is loaded correctly
  const effectiveSectionId = sectionId === VALID_SECTION_ID ? sectionId : VALID_SECTION_ID;
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Section Content</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Section ID: {effectiveSectionId}</h2>
        
        <ManageableSection 
          sectionId={effectiveSectionId}
          isEditing={false}
        />
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <a 
            href={`/admin/section/${effectiveSectionId}`} 
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit this section
          </a>
        </div>
      </div>
    </div>
  );
} 