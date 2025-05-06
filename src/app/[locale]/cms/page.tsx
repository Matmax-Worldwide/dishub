'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileTextIcon,
  ImageIcon,
  MenuIcon,
  SettingsIcon,
  ArrowRightIcon,
  LayoutIcon,
  PackageIcon,
  AlertCircleIcon
} from 'lucide-react';
import { cmsOperations } from '@/lib/graphql-client';

type CMSModule = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  count?: number;
  color: string;
  disabled: boolean;
};

export default function CMSDashboard() {
  const { locale } = useParams();
  const [pageCount, setPageCount] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [menuCount, setMenuCount] = useState(0);
  const [sectionsCount, setSectionsCount] = useState(0);
  const [componentsCount, setComponentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener el número real de secciones desde la API GraphQL
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener secciones desde GraphQL
        const sectionsData = await cmsOperations.getAllCMSSections();
        console.log('Secciones obtenidas:', sectionsData);
        setSectionsCount(Array.isArray(sectionsData) ? sectionsData.length : 0);
        
        // Obtener componentes desde GraphQL
        const componentsData = await cmsOperations.getAllComponents();
        console.log('Componentes obtenidos:', componentsData);
        setComponentsCount(Array.isArray(componentsData) ? componentsData.length : 0);
        
        // Obtener páginas desde GraphQL
        const pagesData = await cmsOperations.getAllPages();
        console.log('Páginas obtenidas:', pagesData);
        setPageCount(Array.isArray(pagesData) ? pagesData.length : 0);
        
        // Mock data para otros conteos (hasta que implementemos esas APIs)
        setMediaCount(0);
        setMenuCount(0);
      } catch (error) {
        console.error('Error fetching CMS data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const cmsModules: CMSModule[] = [
    {
      title: 'Páginas',
      description: 'Crear y gestionar páginas del sitio web con contenido dinámico',
      icon: FileTextIcon,
      href: `/${locale}/cms/pages`,
      count: pageCount,
      color: 'bg-blue-500',
      disabled: false
    },
    {
      title: 'Secciones',
      description: 'Crear y gestionar secciones modulares reutilizables para las páginas',
      icon: LayoutIcon,
      href: `/${locale}/cms/sections`,
      count: sectionsCount,
      color: 'bg-indigo-500',
      disabled: false
    },
    {
      title: 'Componentes',
      description: 'Gestionar componentes reusables para las secciones de contenido',
      icon: PackageIcon,
      href: `/${locale}/cms/components`,
      count: componentsCount,
      color: 'bg-cyan-500',
      disabled: false
    },
    {
      title: 'Biblioteca de Medios',
      description: 'Subir y gestionar imágenes, videos y documentos',
      icon: ImageIcon,
      href: `/${locale}/cms/media`,
      count: mediaCount,
      color: 'bg-purple-500',
      disabled: true
    },
    {
      title: 'Menús',
      description: 'Configurar menús de navegación en todo el sitio',
      icon: MenuIcon,
      href: `/${locale}/cms/menus`,
      count: menuCount,
      color: 'bg-green-500',
      disabled: false
    },
    {
      title: 'Configuración',
      description: 'Configurar ajustes globales del sitio web y apariencia',
      icon: SettingsIcon,
      href: `/${locale}/cms/settings`,
      color: 'bg-orange-500',
      disabled: false
    }
  ];

  const ModuleCard = ({ module }: { module: CMSModule }) => {
    const CardWrapper = ({ children }: { children: ReactNode }) => {
      if (module.disabled) {
        return (
          <div className="group block p-6 bg-white rounded-lg border border-gray-200 shadow-sm opacity-80 cursor-not-allowed">
            {children}
          </div>
        );
      }
      
      return (
        <Link
          href={module.href}
          className="group block p-6 bg-white rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-blue-300"
        >
          {children}
        </Link>
      );
    };

    return (
      <CardWrapper>
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${module.color} ${module.disabled ? '' : 'transition-transform group-hover:scale-110'}`}>
              {module.icon && <module.icon className="h-6 w-6 text-white" />}
            </div>
            {module.count !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {isLoading ? '...' : module.count}
              </span>
            )}
          </div>
          <h2 className={`text-lg font-semibold ${module.disabled ? 'text-gray-700' : 'group-hover:text-blue-600'}`}>{module.title}</h2>
          <p className="mt-2 text-sm text-gray-500 flex-grow">{module.description}</p>
          
          {module.disabled ? (
            <div className="mt-4 flex items-center text-amber-600 text-sm">
              <AlertCircleIcon className="mr-1 h-4 w-4" />
              Trabajo en progreso
            </div>
          ) : (
            <div className="mt-4 flex items-center text-blue-600 text-sm group-hover:translate-x-1 transition-transform">
              Gestionar
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </div>
          )}
        </div>
      </CardWrapper>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Sistema de Gestión de Contenido</h1>
      </div>
      
      <p className="text-gray-500">
        Gestiona todos los aspectos del contenido de tu sitio web a través de este panel de control centralizado.
      </p>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cmsModules.map((module) => (
          <ModuleCard key={module.title} module={module} />
        ))}
      </div>
      
      <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Actividad Reciente</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Componente &apos;Feature Card&apos; actualizado</span>
              <span className="text-gray-400">Hace 1 hora</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Página de inicio actualizada</span>
              <span className="text-gray-400">2 horas atrás</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Nueva sección &quot;Hero&quot; creada</span>
              <span className="text-gray-400">Ayer</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Nueva imagen subida a la Biblioteca</span>
              <span className="text-gray-400">Ayer</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Menú principal actualizado</span>
              <span className="text-gray-400">2 días atrás</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
} 