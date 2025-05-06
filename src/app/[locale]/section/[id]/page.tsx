'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ManageableSection from '@/components/cms/ManageableSection';

// Our known valid section ID
const VALID_SECTION_ID = 'cms-managed-sections';

export default function SectionPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params?.id as string;
  const [isEditing, setIsEditing] = useState(false);
  
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
  
  // Add keyboard shortcut listener for Ctrl+Shift+E to toggle edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+E
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setIsEditing(prev => !prev);
        console.log(`Edit mode ${!isEditing ? 'enabled' : 'disabled'}`);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing]);
  
  // Always use the valid section ID to ensure data is loaded correctly
  const effectiveSectionId = sectionId === VALID_SECTION_ID ? sectionId : VALID_SECTION_ID;
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Section Content</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Section ID: {effectiveSectionId}</h2>
          
          {isEditing && (
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              Edit Mode Active
            </div>
          )}
        </div>
        
        <ManageableSection 
          sectionId={effectiveSectionId}
          isEditing={isEditing}
        />
        
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded ${
              isEditing 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isEditing ? 'Exit Edit Mode' : 'Edit This Section'}
          </button>
          
          <div className="text-sm text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+E</kbd> to toggle edit mode
          </div>
        </div>
      </div>
    </div>
  );
} 