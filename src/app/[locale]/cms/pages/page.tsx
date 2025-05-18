'use client';

import React from 'react';
import { FileTextIcon } from 'lucide-react';

export default function PagesPage() {
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
      </div>
    </div>
  );
} 