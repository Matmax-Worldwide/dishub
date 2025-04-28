import { getDictionary, Locale, locales, Dictionary } from '../../i18n';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface ContactContentProps {
  locale: string;
  dictionary: Dictionary;
}

export default async function ContactPage(props: PageProps) {
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
  
  return <ContactContent locale={safeLocale} dictionary={dictionary} />;
}

// Separate component to avoid direct rendering with params
async function ContactContent({ locale, dictionary }: ContactContentProps) {
  // Contact information
  const contactInfo = [
    {
      icon: <PhoneIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.contact.phone,
      info: '+1 (555) 123-4567',
      action: 'Call now',
      href: 'tel:+15551234567',
    },
    {
      icon: <EnvelopeIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.contact.email,
      info: 'info@e-voque.com',
      action: 'Email us',
      href: 'mailto:info@e-voque.com',
    },
    {
      icon: <MapPinIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.contact.address,
      info: '123 Interpretation St, San Francisco, CA 94105',
      action: 'Get directions',
      href: 'https://maps.google.com',
    },
    {
      icon: <ClockIcon className="h-6 w-6 text-primary-600" />,
      title: 'Hours',
      info: 'Monday-Friday: 8AM-8PM, Saturday: 9AM-5PM',
      action: 'See hours',
      href: '#hours',
    },
  ];

  // FAQ items
  const faqItems = [
    {
      question: 'How quickly can I get connected to an interpreter?',
      answer: "Our average connection time is under 30 seconds. Once you call our service line, we'll quickly identify your language needs and connect you with the appropriate interpreter."
    },
    {
      question: 'What languages do you support?',
      answer: 'We currently offer interpretation services in over 100 languages, including Spanish, Mandarin, Arabic, Russian, French, and many more. If you need a specific language, please contact us to check availability.'
    },
    {
      question: 'How do I pay for interpretation services?',
      answer: 'We offer several payment options including per-minute rates, monthly subscriptions, and enterprise billing. All major credit cards are accepted, and we can also accommodate purchase orders for businesses.'
    },
    {
      question: 'Do your interpreters have specialized knowledge for medical or legal terminology?',
      answer: 'Yes, many of our interpreters specialize in specific fields such as healthcare, legal, technical, or business. When you request an interpreter, you can specify your industry to be matched with someone who has relevant expertise.'
    },
  ];

  return (
    <>
      <Navbar dictionary={dictionary} locale={locale} />
      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Contact Us</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about our interpretation services? We&apos;re here to help.
            </p>
          </div>
          
          {/* Contact Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-20">
            {/* Contact Information */}
            <div className="lg:col-span-2 bg-primary-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 bg-white p-3 rounded-full mr-4">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 mb-1">{item.info}</p>
                      <a href={item.href} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        {item.action} →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Social Media Placeholder */}
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  {/* Facebook */}
                  <a href="#" className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                    </svg>
                  </a>
                  {/* Twitter */}
                  <a href="#" className="h-10 w-10 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                  {/* LinkedIn */}
                  <a href="#" className="h-10 w-10 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                    </svg>
                  </a>
                  {/* Instagram */}
                  <a href="#" className="h-10 w-10 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center hover:from-purple-700 hover:to-pink-700">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white p-8 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        {dictionary.contact.form.name}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        {dictionary.contact.form.email}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      {dictionary.contact.form.message}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
                    >
                      {dictionary.contact.form.submit}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          {/* Map Placeholder */}
          <div className="mb-20 relative h-96 bg-gray-100 rounded-xl overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="grid grid-cols-10 grid-rows-6 w-full h-full">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="border border-gray-200"></div>
                ))}
              </div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center z-10">
                <MapPinIcon className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Our Location</h3>
                <p className="text-gray-600">123 Interpretation St, San Francisco, CA 94105</p>
              </div>
            </div>
            
            {/* Map features */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-gray-400 rounded-full"></div>
            
            {/* Roads */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300"></div>
            <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            
            {/* Map marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="h-6 w-6 bg-primary-600 rounded-full flex items-center justify-center animate-pulse">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-t-primary-600 border-l-transparent border-r-transparent"></div>
            </div>
            
            <div className="absolute bottom-2 right-2 bg-white py-1 px-2 rounded text-xs text-gray-600 font-medium shadow-sm z-20">
              Map placeholder - Will be replaced with Google Maps
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqItems.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.question}</h3>
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-lg text-gray-700 mb-4">Still have questions?</p>
              <a href="#" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-md transition-colors">
                Contact our support team
              </a>
            </div>
          </div>
          
          {/* Global Support */}
          <div className="bg-primary-50 p-10 rounded-xl mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Global Support Network</h2>
                <p className="text-lg text-gray-700 mb-6">
                  Our support team is available across multiple time zones to ensure you always have access to interpretation services when you need them.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-6 w-6 text-primary-600 mr-2" />
                    <span className="text-gray-700">24/7 Support Available</span>
                  </div>
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 mr-2" />
                    <span className="text-gray-700">Multilingual Support Team</span>
                  </div>
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-primary-600 mr-2" />
                    <span className="text-gray-700">Offices in 5 Countries</span>
                  </div>
                </div>
              </div>
              <div className="relative h-64 md:h-auto">
                <div className="bg-white rounded-lg shadow-md p-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">100+</div>
                      <div className="text-sm text-gray-500">Languages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">24/7</div>
                      <div className="text-sm text-gray-500">Availability</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">30s</div>
                      <div className="text-sm text-gray-500">Avg. Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">50k+</div>
                      <div className="text-sm text-gray-500">Clients</div>
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200 rounded-full opacity-30 -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full opacity-30 -ml-6 -mb-6"></div>
              </div>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="bg-primary-600 text-white p-10 rounded-xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Contact us today to learn more about our interpretation services and how we can help break down language barriers for your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-8 rounded-md transition-colors">
                Schedule a Demo
              </button>
              <button className="bg-primary-700 border border-white hover:bg-primary-800 text-white font-medium py-3 px-8 rounded-md transition-colors">
                Call Us Now
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer dictionary={dictionary} locale={locale} />
    </>
  );
} 