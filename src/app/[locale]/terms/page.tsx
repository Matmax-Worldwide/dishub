import { getDictionary, Locale, locales } from '../../i18n';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Terms(props: PageProps) {
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

  return (
    <>
      <Navbar dictionary={dictionary} locale={safeLocale} />
      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg prose-blue max-w-none">
            <p>
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the E-Voque website and services, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not use our services.
            </p>
            
            <h2>2. Description of Services</h2>
            <p>
              E-Voque provides over-the-phone interpretation services in multiple languages. Our services are subject to availability and may change without notice.
            </p>
            
            <h2>3. User Responsibilities</h2>
            <p>
              Users are responsible for:
            </p>
            <ul>
              <li>Providing accurate information when using our services</li>
              <li>Maintaining the confidentiality of their account information</li>
              <li>Using our services in compliance with applicable laws and regulations</li>
              <li>Not using our services for any illegal or unauthorized purpose</li>
            </ul>
            
            <h2>4. Payment and Billing</h2>
            <p>
              Users agree to pay all fees associated with the services they use. Payment terms are specified in the service agreements.
            </p>
            
            <h2>5. Limitation of Liability</h2>
            <p>
              E-Voque shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from the use of or inability to use our services.
            </p>
            
            <h2>6. Contact Information</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p>
              E-Voque<br />
              123 Interpretation St<br />
              San Francisco, CA 94105<br />
              Email: legal@e-voque.com<br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>
      <Footer dictionary={dictionary} locale={safeLocale} />
    </>
  );
} 