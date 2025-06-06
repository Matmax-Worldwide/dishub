import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentación Técnica | CMS',
  description: 'Guías completas, referencias técnicas y mejores prácticas para el desarrollo y mantenimiento del sistema Dishub City.',
  keywords: ['documentación', 'guías técnicas', 'CMS', 'desarrollo', 'API'],
  openGraph: {
    title: 'Documentación Técnica | CMS',
    description: 'Guías completas, referencias técnicas y mejores prácticas para el desarrollo y mantenimiento del sistema Dishub City.',
    type: 'website',
  },
};

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="documentation-layout">
      {children}
    </div>
  );
} 