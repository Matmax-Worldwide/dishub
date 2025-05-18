import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PagesSidebar } from './PagesSidebar';

const PagesEditor: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  // Handle page selection from sidebar
  const handlePageSelect = (slug: string) => {
    router.push(`/${locale}/cms/pages/edit/${slug}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Pages Sidebar - This is the main focus of this component now */}
      <PagesSidebar 
        onPageSelect={handlePageSelect} 
      />
      
      {/* Main content area - simplified to a placeholder */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">
            Selecciona una página del sidebar para editarla
            <br />
            <span className="text-sm opacity-70 mt-2 block">o utiliza los botones para crear una nueva página</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PagesEditor; 