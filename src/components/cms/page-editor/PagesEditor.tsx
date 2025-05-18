import React, { ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PagesSidebar } from './PagesSidebar';
import { useTabContext } from '@/app/[locale]/cms/pages/layout';

interface PagesEditorProps {
  children: ReactNode;
}

const PagesEditor: React.FC<PagesEditorProps> = ({ children }) => {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';
  const { activeTab } = useTabContext(); // Acceder al contexto directamente

  // Handle page selection from sidebar
  const handlePageSelect = (slug: string) => {
      router.push(`/${locale}/cms/pages/edit/${slug}`);
  };

  // Añadir console.log para debugging
  console.log('PagesEditor rendering, activeTab:', activeTab);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Pages Sidebar - This is the main focus of this component now */}
      <PagesSidebar 
        onPageSelect={handlePageSelect} 
      />
        
      {/* Main content area - now renders children instead of placeholder */}
      <div className="flex-1 overflow-auto">
        {children || (
          <div className="flex items-center justify-center h-full p-6">
            <p className="text-gray-500 text-center">
              Selecciona una página del sidebar para editarla
              <br />
              <span className="text-sm opacity-70 mt-2 block">o utiliza los botones para crear una nueva página</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagesEditor; 