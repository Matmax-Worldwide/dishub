import { getDictionary, Locale, locales } from '../(tools)/i18n';
import { notFound } from 'next/navigation';
import ClientPage from '@/components/client-page';


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface ServerPageProps {
  params: Promise<{ locale: string }>;
}

export default async function Page(props: ServerPageProps) {
  // Next.js doesn't want us to directly access props.params.locale
  // So let's pass it through server-side rendering
  
  // Await the params object to get locale safely
  const { locale: localeParam } = await props.params;
  
  // This is needed since we can't use localeParam directly
  const safeLocale = typeof localeParam === 'string' ? localeParam : 'en';
  
  // Validate locale
  if (!locales.includes(safeLocale as Locale)) {
    notFound();
  }
  
  // Get dictionary
  const dictionary = await getDictionary(safeLocale as Locale);
  
  // Return the ClientPage component that will fetch and render the default page
  return <ClientPage locale={safeLocale} dictionary={dictionary} />;
} 