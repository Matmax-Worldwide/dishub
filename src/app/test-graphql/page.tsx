'use client';

import { useState } from 'react';
import { cmsOperations } from '@/lib/graphql-client';

interface ComponentResult {
  components: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>;
  lastUpdated: string | null;
}

interface SaveResult {
  success: boolean;
  message: string | null;
  lastUpdated: string | null;
}

export default function TestGraphQLPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ComponentResult | null>(null);
  const [saveResults, setSaveResults] = useState<SaveResult | null>(null);
  
  // Función para probar getSectionComponents
  const testGetComponents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Probando getSectionComponents...');
      const result = await cmsOperations.getSectionComponents('cms-managed-sections');
      console.log('Resultado:', result);
      setResults(result);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para probar saveSectionComponents
  const testSaveComponents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Probando saveSectionComponents...');
      
      const testComponents = [
        {
          id: `test-component-${Date.now()}`,
          type: 'Header',
          data: {
            title: 'Título de prueba',
            subtitle: 'Subtítulo de prueba',
          }
        }
      ];
      
      const result = await cmsOperations.saveSectionComponents('cms-managed-sections', testComponents);
      console.log('Resultado de guardado:', result);
      setSaveResults(result);
      
      // Si el guardado fue exitoso, cargar los componentes actualizados
      if (result.success) {
        testGetComponents();
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al guardar');
    } finally {
      setLoading(false);
    }
  };
  
  // Probar llamada directa fetch a GraphQL
  const testDirectCall = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query = `
        query GetSectionComponents($sectionId: ID!) {
          getSectionComponents(sectionId: $sectionId) {
            components {
              id
              type
              data
            }
            lastUpdated
          }
        }
      `;
      
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { sectionId: 'cms-managed-sections' },
        }),
      });
      
      const rawText = await response.text();
      console.log('Respuesta cruda:', rawText);
      
      try {
        const data = JSON.parse(rawText);
        console.log('Respuesta parseada:', data);
        setResults(data.data?.getSectionComponents || null);
      } catch (parseError) {
        setError(`Error al parsear JSON: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error en llamada directa:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido en llamada directa');
    } finally {
      setLoading(false);
    }
  };
  
  // Agregar una función para probar el schema introspection
  const testIntrospection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Consultando schema GraphQL...');
      
      const query = `
        query IntrospectionQuery {
          __schema {
            queryType {
              name
              fields {
                name
              }
            }
            mutationType {
              name
              fields {
                name
              }
            }
          }
        }
      `;
      
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
        }),
      });
      
      const rawText = await response.text();
      console.log('Respuesta cruda de introspección:', rawText);
      
      try {
        const data = JSON.parse(rawText);
        console.log('Schema GraphQL:', data);
        setResults(data);
      } catch (parseError) {
        setError(`Error al parsear schema: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error en introspección:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido en introspección');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Prueba de API GraphQL</h1>
      
      <div className="space-x-4 mb-8">
        <button 
          onClick={testGetComponents}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Probar getSectionComponents
        </button>
        
        <button 
          onClick={testSaveComponents}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Probar saveSectionComponents
        </button>
        
        <button 
          onClick={testDirectCall}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Llamada directa a GraphQL
        </button>
        
        <button 
          onClick={testIntrospection}
          disabled={loading}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
        >
          Probar introspección
        </button>
      </div>
      
      {loading && <p className="text-gray-500">Cargando...</p>}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-500 rounded">
          <h2 className="font-bold">Error:</h2>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      
      {saveResults && (
        <div className="mb-4">
          <h2 className="font-bold">Resultado de guardado:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
            {JSON.stringify(saveResults, null, 2)}
          </pre>
        </div>
      )}
      
      {results && (
        <div>
          <h2 className="font-bold">Resultados:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 