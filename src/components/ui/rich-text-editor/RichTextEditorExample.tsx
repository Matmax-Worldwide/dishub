'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RichTextEditor from './RichTextEditor';
import { RichTextEditorProps } from './types';

interface ExampleProps {
  title?: string;
  description?: string;
  config?: Partial<RichTextEditorProps>;
}

const ExampleCard: React.FC<ExampleProps> = ({ title, description, config }) => {
  const [value, setValue] = useState(config?.value || '<p>Escribe algo aquí...</p>');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      
      <RichTextEditor
        value={value}
        onChange={setValue}
        {...config}
      />
      
      {/* Vista previa del HTML generado */}
      <details className="mt-4">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
          Ver HTML generado
        </summary>
        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
          <code>{value}</code>
        </pre>
      </details>
    </motion.div>
  );
};

export const RichTextEditorExample: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Rich Text Editor
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Un editor de texto enriquecido completo con todas las funcionalidades necesarias 
          para crear contenido formateado de manera profesional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor completo */}
        <ExampleCard
          title="Editor Completo"
          description="Todas las funcionalidades habilitadas: formato, encabezados, colores, alineación, listas, enlaces y funciones avanzadas."
          config={{
            toolbar: 'full',
            height: '400px',
            showWordCount: true,
            placeholder: 'Escribe tu contenido aquí...',
            value: `
              <h1>Título Principal</h1>
              <p>Este es un párrafo con <strong>texto en negrita</strong> y <em>texto en cursiva</em>.</p>
              <ul>
                <li>Elemento de lista 1</li>
                <li>Elemento de lista 2</li>
              </ul>
              <p>También puedes agregar <a href="https://ejemplo.com" target="_blank">enlaces</a>.</p>
            `.trim()
          }}
        />

        {/* Editor básico */}
        <ExampleCard
          title="Editor Básico"
          description="Funcionalidades esenciales: formato básico, encabezados, alineación y listas."
          config={{
            toolbar: 'basic',
            height: '300px',
            placeholder: 'Editor con funcionalidades básicas...',
            value: '<p>Editor con funcionalidades básicas para uso simple.</p>'
          }}
        />

        {/* Editor mínimo */}
        <ExampleCard
          title="Editor Mínimo"
          description="Solo formato básico: negrita, cursiva, subrayado y tachado."
          config={{
            toolbar: 'minimal',
            height: '200px',
            placeholder: 'Editor minimalista...',
            value: '<p>Editor minimalista con solo formato básico.</p>'
          }}
        />

        {/* Editor con límite de caracteres */}
        <ExampleCard
          title="Con Límite de Caracteres"
          description="Editor con límite de 500 caracteres y contador de palabras."
          config={{
            toolbar: 'basic',
            height: '250px',
            maxLength: 500,
            showWordCount: true,
            placeholder: 'Máximo 500 caracteres...',
            value: '<p>Este editor tiene un límite de 500 caracteres.</p>'
          }}
        />
      </div>

      {/* Documentación de uso */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50 rounded-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Cómo usar el Rich Text Editor
        </h2>
        
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Instalación básica:</h3>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`import RichTextEditor from '@/components/ui/rich-text-editor';

function MyComponent() {
  const [content, setContent] = useState('<p>Contenido inicial</p>');
  
  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Escribe aquí..."
    />
  );
`}}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Props disponibles:</h3>
            <ul className="space-y-1 text-xs">
              <li><code className="bg-white px-1 rounded">value: string</code> - Contenido HTML del editor</li>
              <li><code className="bg-white px-1 rounded">onChange: (html: string) => void</code> - Callback cuando cambia el contenido</li>
              <li><code className="bg-white px-1 rounded">placeholder?: string</code> - Texto de placeholder</li>
              <li><code className="bg-white px-1 rounded">toolbar?: 'full' | 'basic' | 'minimal'</code> - Configuración de la barra de herramientas</li>
              <li><code className="bg-white px-1 rounded">height?: string</code> - Altura del editor (ej: '300px')</li>
              <li><code className="bg-white px-1 rounded">maxLength?: number</code> - Límite máximo de caracteres</li>
              <li><code className="bg-white px-1 rounded">showWordCount?: boolean</code> - Mostrar contador de palabras</li>
              <li><code className="bg-white px-1 rounded">disabled?: boolean</code> - Deshabilitar el editor</li>
              <li><code className="bg-white px-1 rounded">autoFocus?: boolean</code> - Enfocar automáticamente</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Atajos de teclado:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><code className="bg-white px-1 rounded">Ctrl+B</code> - Negrita</div>
              <div><code className="bg-white px-1 rounded">Ctrl+I</code> - Cursiva</div>
              <div><code className="bg-white px-1 rounded">Ctrl+U</code> - Subrayado</div>
              <div><code className="bg-white px-1 rounded">Ctrl+Z</code> - Deshacer</div>
              <div><code className="bg-white px-1 rounded">Ctrl+Y</code> - Rehacer</div>
              <div><code className="bg-white px-1 rounded">Ctrl+L</code> - Alinear izquierda</div>
              <div><code className="bg-white px-1 rounded">Ctrl+E</code> - Centrar</div>
              <div><code className="bg-white px-1 rounded">Ctrl+R</code> - Alinear derecha</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RichTextEditorExample; 