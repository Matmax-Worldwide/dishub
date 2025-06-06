import { Locale, locales } from '@/app/i18n';
import { notFound } from 'next/navigation';
import DishubLanding from '@/components/pages/DishubLanding';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface ServerPageProps {
  params: Promise<{ locale: string }>;
}

export default async function Page(props: ServerPageProps) {
  const { locale: localeParam } = await props.params;
  
  const safeLocale = typeof localeParam === 'string' ? localeParam : 'en';
  
  if (!locales.includes(safeLocale as Locale)) {
    notFound();
  }
  
  return <DishubLanding />;
} 