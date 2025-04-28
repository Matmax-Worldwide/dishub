import { getDictionary, Locale, locales, Dictionary } from '../i18n';
import { notFound } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import AboutUs from '../../components/AboutUs';
import Services from '../../components/Services';
import Benefits from '../../components/Benefits';
import WellnessBenefits from '../../components/WellnessBenefits';
import Contact from '../../components/Contact';
import Footer from '../../components/Footer';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Create an interface for the PageContent component props
interface PageContentProps {
  locale: string;
  dictionary: Dictionary;
}

// Using React Server Components pattern to avoid direct access to params
export default async function Home(props: PageProps) {
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
  
  return <PageContent locale={safeLocale} dictionary={dictionary} />;
}

// Separate component to avoid direct rendering with params
function PageContent({ locale, dictionary }: PageContentProps) {
  return (
    <>
      <Navbar dictionary={dictionary} locale={locale} />
      <Hero dictionary={dictionary} locale={locale} />
      <AboutUs dictionary={dictionary} />
      <Services dictionary={dictionary} />
      <Benefits dictionary={dictionary} />
      <WellnessBenefits dictionary={dictionary} />
      <Contact dictionary={dictionary} />
      <Footer dictionary={dictionary} locale={locale} />
    </>
  );
} 