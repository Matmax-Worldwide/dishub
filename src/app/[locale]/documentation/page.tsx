'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpenIcon, 
  FileTextIcon, 
  SearchIcon,
  ClockIcon,
  TagIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { MarkdownRenderer } from '@/app/components/documentation/MarkdownRenderer';
import { getClientDocuments, DocumentSection } from '@/lib/documentation';

const DocumentationPage = () => {
  const [documents, setDocuments] = useState<DocumentSection[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await getClientDocuments();
        setDocuments(docs);
        setSelectedDoc(docs[0]?.id || null);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(documents.map(doc => doc.category)))];

  const selectedDocument = documents.find(doc => doc.id === selectedDoc);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documentación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpenIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Documentación Técnica</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl">
              Guías completas, referencias técnicas y mejores prácticas para el desarrollo y mantenimiento del sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="p-6">
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar documentación..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Categorías</h3>
                  <div className="space-y-1">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === category
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {category === 'all' ? 'Todas' : category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document List */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Documentos</h3>
                  <div className="space-y-2">
                    {filteredDocuments.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedDoc === doc.id
                            ? 'border-blue-200 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <FileTextIcon className={`h-5 w-5 mt-0.5 ${
                            selectedDoc === doc.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${
                              selectedDoc === doc.id ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {doc.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {doc.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <ClockIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{doc.lastUpdated}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedDocument ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Document Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedDocument.title}
                      </h1>
                      <p className="text-gray-600 mb-4">
                        {selectedDocument.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>Actualizado: {selectedDocument.lastUpdated}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TagIcon className="h-4 w-4" />
                          <span>Categoría: {selectedDocument.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedDocument.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Document Content */}
                <div className="p-6">
                  <MarkdownRenderer content={selectedDocument.content} />
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      ¿Encontraste un error o tienes sugerencias? 
                      <a href="#" className="text-blue-600 hover:text-blue-500 ml-1">
                        Reportar problema
                      </a>
                    </div>
                    <button className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-500">
                      <ExternalLinkIcon className="h-4 w-4" />
                      <span>Ver en GitHub</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona un documento
                </h3>
                <p className="text-gray-600">
                  Elige un documento del panel lateral para comenzar a leer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage; 