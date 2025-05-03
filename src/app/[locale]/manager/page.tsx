'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  UsersIcon, 
  LineChartIcon, 
  ClipboardListIcon, 
  CalendarIcon,
  ArrowRightIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ManagerDashboard() {
  const { locale } = useParams();
  
  const managementSections = [
    {
      title: "Staff Management",
      description: "Gestión de personal, roles, documentos y beneficios",
      icon: UsersIcon,
      href: `/${locale}/manager/staff`,
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: "Team Reports",
      description: "Reportes de rendimiento, asistencia y productividad",
      icon: LineChartIcon,
      href: `/${locale}/manager/reports`,
      color: "bg-green-50 text-green-700"
    },
    {
      title: "Approve Requests",
      description: "Gestión de solicitudes de vacaciones, beneficios y permisos",
      icon: ClipboardListIcon,
      href: `/${locale}/manager/approvals`,
      color: "bg-purple-50 text-purple-700"
    },
    {
      title: "Book Now",
      description: "Gestión de reservas y calendario",
      icon: CalendarIcon,
      href: `/${locale}/dashboard/bookings`,
      color: "bg-amber-50 text-amber-700",
      disabled: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Área de Gestión</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido al panel de gestión. Selecciona una de las siguientes opciones.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {managementSections.map((section) => (
          <Card key={section.title} className={section.disabled ? "opacity-60" : ""}>
            <CardHeader className={section.color + " rounded-t-lg"}>
              <div className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CardDescription className="text-sm text-gray-600">
                {section.description}
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full justify-between" 
                asChild={!section.disabled}
                disabled={section.disabled}
              >
                {section.disabled ? (
                  <span>Próximamente</span>
                ) : (
                  <Link href={section.href}>
                    <span>Acceder</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
        <div className="bg-white rounded-lg p-6 border">
          <p className="text-muted-foreground">No hay actividad reciente para mostrar.</p>
        </div>
      </div>
    </div>
  );
} 