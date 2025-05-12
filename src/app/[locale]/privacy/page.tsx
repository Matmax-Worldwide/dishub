import { getDictionary, Locale, locales } from '../../i18n';
import Navbar from '../../../components/Navigation/Navbar';
import Footer from '../../../components/Footer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Privacy(props: PageProps) {
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg prose-blue max-w-none">
            <p>
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2>1. Introduction</h2>
            <p>
              E-Voque (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our interpretation services.
            </p>
            
            <h2>2. Information We Collect</h2>
            <p>
              We may collect information about you in various ways, including:
            </p>
            <ul>
              <li>Personal Information: Name, email address, phone number, and other contact details you provide.</li>
              <li>Service Usage Information: Details about your use of our interpretation services.</li>
              <li>Technical Data: IP address, browser type, device information, and cookies.</li>
            </ul>
            
            <h2>3. How We Use Your Information</h2>
            <p>
              We may use the information we collect for various purposes, including:
            </p>
            <ul>
              <li>Providing and maintaining our services</li>
              <li>Responding to your inquiries and requests</li>
              <li>Improving our website and services</li>
              <li>Sending you marketing and promotional communications</li>
              <li>Protecting our rights and interests</li>
            </ul>
            
            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
            </p>
            
            <h2>5. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <p>
              E-Voque<br />
              123 Interpretation St<br />
              San Francisco, CA 94105<br />
              Email: privacy@e-voque.com<br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>
      <Footer dictionary={dictionary} locale={safeLocale} />
    </>
  );
} 