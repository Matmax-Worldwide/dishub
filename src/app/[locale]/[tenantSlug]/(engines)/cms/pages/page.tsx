'use client';

import React from 'react';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PagesPage() {
  const router = useRouter();
  const { locale, tenantSlug } = useParams();

  const handleQuickCreate = () => {
    // Simulate Ctrl+N / quick create functionality
    router.push(`/${locale}/${tenantSlug}/cms/pages/create`);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center h-full min-h-[80vh] text-center space-y-6">
        <div className="bg-blue-50 rounded-full p-6">
          <FileTextIcon className="h-16 w-16 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Administración de Páginas</h1>
        <p className="text-gray-600 max-w-lg">
          Selecciona una página del panel lateral para editarla o utiliza el botón 
          &quot;Quick Create&quot; o &quot;Advanced Create&quot; para crear una nueva página.
        </p>
        
        <div className="flex space-x-4 mt-4">
          <Button 
            variant="default" 
            onClick={handleQuickCreate}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Quick Create</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 