import { getDictionary, Locale, locales, Dictionary } from '../../i18n';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { UserGroupIcon, BuildingOffice2Icon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface AboutUsContentProps {
  locale: string;
  dictionary: Dictionary;
}

export default async function AboutUsPage(props: PageProps) {
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
  
  return <AboutUsContent locale={safeLocale} dictionary={dictionary} />;
}

// Separate component to avoid direct rendering with params
function AboutUsContent({ locale, dictionary }: AboutUsContentProps) {
  return (
    <>
      <Navbar dictionary={dictionary} locale={locale} />
      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About E-Voque</h1>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl">
            A leading provider of over-the-phone interpretation services connecting businesses and individuals with professional interpreters.
          </p>
          
          {/* Company image placeholder */}
          <div className="relative w-full h-96 bg-gradient-to-r from-primary-100 to-indigo-100 rounded-xl overflow-hidden mb-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <BuildingOffice2Icon className="w-32 h-32 text-primary-300" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-30 p-6">
              <div className="text-white text-xl font-bold">E-Voque Headquarters</div>
              <div className="text-white text-sm">San Francisco, California</div>
            </div>
          </div>
          
          {/* Our Story Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-lg text-gray-700 mb-6">
                  E-Voque was founded in 2015 with a simple mission: to break down language barriers and connect people through professional interpretation services. What began as a small operation with a handful of interpreters has grown into a global network of language professionals serving clients across industries.
                </p>
                <p className="text-lg text-gray-700 mb-6">
                  Our founder, Maria Rodriguez, experienced firsthand the challenges of language barriers when her grandmother needed medical care but couldn&apos;t communicate effectively with her doctors. This personal experience inspired Maria to build a company dedicated to providing accessible, high-quality interpretation services.
                </p>
                <p className="text-lg text-gray-700">
                  Today, E-Voque connects thousands of clients with interpreters in over 100 languages, facilitating clear communication in healthcare settings, legal environments, business meetings, and more.
                </p>
              </div>
              <div className="relative h-full bg-gradient-to-br from-primary-50 to-indigo-50 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="inline-block p-4 rounded-full bg-white shadow-md mb-4">
                      <UserGroupIcon className="h-16 w-16 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Our Journey</h3>
                    <p className="mt-2 text-gray-600">From startup to industry leader</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Our Mission Section */}
          <div className="bg-primary-600 text-white p-10 rounded-xl mb-20">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl mb-6">
              To facilitate seamless communication regardless of language differences, providing accurate and culturally sensitive interpretation services that empower individuals and organizations to connect across borders.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Accuracy</h3>
                <p>Precise interpretation that preserves meaning and context</p>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Accessibility</h3>
                <p>Available 24/7 to support communication needs anytime</p>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Cultural Sensitivity</h3>
                <p>Interpretation that respects cultural nuances and contexts</p>
              </div>
            </div>
          </div>
          
          {/* Team Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Team</h2>
            <p className="text-lg text-gray-700 mb-10 max-w-3xl">
              Our diverse team of interpreters and staff bring expertise from various backgrounds and cultures, ensuring that we provide nuanced interpretation services.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Team Member 1 */}
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <UserGroupIcon className="h-20 w-20 text-gray-400" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Maria Rodriguez</h3>
                  <p className="text-primary-600 mb-4">Founder & CEO</p>
                  <p className="text-gray-600">
                    With over 15 years of experience in language services, Maria leads our company with passion and vision.
                  </p>
                </div>
              </div>
              
              {/* Team Member 2 */}
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <UserGroupIcon className="h-20 w-20 text-gray-400" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">David Chen</h3>
                  <p className="text-primary-600 mb-4">Chief Technology Officer</p>
                  <p className="text-gray-600">
                    David oversees our technological infrastructure, ensuring seamless connectivity for all interpretation sessions.
                  </p>
                </div>
              </div>
              
              {/* Team Member 3 */}
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <UserGroupIcon className="h-20 w-20 text-gray-400" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Sofia Patel</h3>
                  <p className="text-primary-600 mb-4">Head of Interpreter Relations</p>
                  <p className="text-gray-600">
                    Sofia manages our network of interpreters, ensuring quality standards are maintained across all languages.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Global Reach Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Global Reach</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-lg text-gray-700 mb-6">
                  E-Voque provides interpretation services across the globe, with interpreters covering more than 100 languages and dialects. Our technology platform enables instant connection to interpreters, regardless of geographic location.
                </p>
                <ul className="list-disc list-inside text-lg text-gray-700 space-y-2 mb-6">
                  <li>24/7 availability in all major time zones</li>
                  <li>Coverage for rare and indigenous languages</li>
                  <li>Regional dialect expertise</li>
                  <li>Industry-specific terminology knowledge</li>
                </ul>
                <p className="text-lg text-gray-700">
                  No matter where your business operates or what languages your stakeholders speak, E-Voque connects you with the interpretation services you need.
                </p>
              </div>
              <div className="relative h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <GlobeAltIcon className="h-32 w-32 text-blue-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-transparent h-24"></div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-white font-bold text-xl">Worldwide Coverage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer dictionary={dictionary} locale={locale} />
    </>
  );
} 