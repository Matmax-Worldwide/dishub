import { getDictionary, Locale, locales, Dictionary } from '../../i18n';
import Navbar from '../../../components/Navigation/Navbar';
import Footer from '../../../components/Footer';
import { 
  BeakerIcon, 
  ScaleIcon, 
  BriefcaseIcon, 
  ShieldExclamationIcon,
  ChatBubbleBottomCenterTextIcon,
  AcademicCapIcon,
  BuildingStorefrontIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface ServicesContentProps {
  locale: string;
  dictionary: Dictionary;
}

export default async function ServicesPage(props: PageProps) {
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
  
  return <ServicesContent locale={safeLocale} dictionary={dictionary} />;
}

// Separate component to avoid direct rendering with params
function ServicesContent({ locale, dictionary }: ServicesContentProps) {
  // Service categories
  const serviceCategories = [
    {
      id: "medical",
      icon: <BeakerIcon className="h-12 w-12 text-primary-600" />,
      title: dictionary.services.medical.title,
      description: dictionary.services.medical.description,
      features: [
        "Immediate access to medical interpreters",
        "HIPAA-compliant interpretation services",
        "Specialized medical terminology knowledge",
        "24/7 availability for emergency situations"
      ],
      color: "bg-gradient-to-r from-primary-50 to-indigo-50",
      iconColor: "text-primary-600",
      image: (
        <div className="h-64 bg-gradient-to-r from-primary-200 to-primary-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <BeakerIcon className="w-32 h-32 text-primary-400 opacity-50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-500 to-transparent h-16"></div>
          <div className="absolute bottom-2 left-4 text-white font-medium">Medical Interpretation</div>
        </div>
      )
    },
    {
      id: "legal",
      icon: <ScaleIcon className="h-12 w-12 text-indigo-600" />,
      title: dictionary.services.legal.title,
      description: dictionary.services.legal.description,
      features: [
        "Court-certified interpreters",
        "Deposition and witness interview support",
        "Legal document translation capabilities",
        "Confidentiality agreements for sensitive cases"
      ],
      color: "bg-gradient-to-r from-indigo-50 to-purple-50",
      iconColor: "text-indigo-600",
      image: (
        <div className="h-64 bg-gradient-to-r from-indigo-200 to-indigo-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <ScaleIcon className="w-32 h-32 text-indigo-400 opacity-50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-transparent h-16"></div>
          <div className="absolute bottom-2 left-4 text-white font-medium">Legal Interpretation</div>
        </div>
      )
    },
    {
      id: "business",
      icon: <BriefcaseIcon className="h-12 w-12 text-purple-600" />,
      title: dictionary.services.business.title,
      description: dictionary.services.business.description,
      features: [
        "International business meeting facilitation",
        "Sales and negotiation interpretation",
        "Technical terminology expertise",
        "Multi-party conference call support"
      ],
      color: "bg-gradient-to-r from-purple-50 to-pink-50",
      iconColor: "text-purple-600",
      image: (
        <div className="h-64 bg-gradient-to-r from-purple-200 to-purple-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <BriefcaseIcon className="w-32 h-32 text-purple-400 opacity-50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-transparent h-16"></div>
          <div className="absolute bottom-2 left-4 text-white font-medium">Business Interpretation</div>
        </div>
      )
    },
    {
      id: "emergency",
      icon: <ShieldExclamationIcon className="h-12 w-12 text-red-600" />,
      title: dictionary.services.emergency.title,
      description: dictionary.services.emergency.description,
      features: [
        "Immediate connection to interpreters",
        "Disaster response support",
        "Crisis management interpretation",
        "Priority handling for emergency situations"
      ],
      color: "bg-gradient-to-r from-red-50 to-orange-50",
      iconColor: "text-red-600",
      image: (
        <div className="h-64 bg-gradient-to-r from-red-200 to-red-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldExclamationIcon className="w-32 h-32 text-red-400 opacity-50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-500 to-transparent h-16"></div>
          <div className="absolute bottom-2 left-4 text-white font-medium">Emergency Services</div>
        </div>
      )
    },
  ];

  // Additional service options
  const additionalServices = [
    {
      icon: <ChatBubbleBottomCenterTextIcon className="h-10 w-10 text-primary-600" />,
      title: "Consecutive Interpretation",
      description: "Our interpreters work with speakers who pause to allow interpretation, ideal for meetings and interviews."
    },
    {
      icon: <PhoneIcon className="h-10 w-10 text-primary-600" />,
      title: "Over-the-Phone Interpretation",
      description: "Connect instantly with interpreters via phone for immediate language support whenever you need it."
    },
    {
      icon: <AcademicCapIcon className="h-10 w-10 text-primary-600" />,
      title: "Educational Interpretation",
      description: "Support for parent-teacher conferences, IEP meetings, and classroom settings in educational environments."
    },
    {
      icon: <BuildingStorefrontIcon className="h-10 w-10 text-primary-600" />,
      title: "Retail & Customer Service",
      description: "Interpretation services to enhance customer experience for non-native speaking customers."
    }
  ];

  return (
    <>
      <Navbar dictionary={dictionary} locale={locale} />
      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Interpretation Services</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional interpretation services to break down language barriers and facilitate clear communication.
            </p>
          </div>
          
          {/* Services overview image placeholder */}
          <div className="relative w-full h-80 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl overflow-hidden mb-20">
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full flex items-center justify-center">
                <div className="grid grid-cols-6 grid-rows-3 gap-4 w-full h-full p-10">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
                      <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-white" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Breaking Language Barriers</h2>
              <p className="text-xl max-w-3xl">
                Our professional interpreters facilitate seamless communication in over 100 languages
              </p>
            </div>
          </div>
          
          {/* Main services section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Our Core Services</h2>
            
            <div className="space-y-16">
              {serviceCategories.map((service, index) => (
                <div key={service.id} className={`p-8 rounded-xl ${service.color}`}>
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    <div className="flex flex-col justify-center">
                      <div className={`p-3 rounded-full ${service.iconColor} bg-white inline-flex mb-4 w-min`}>
                        {service.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                      <p className="text-lg text-gray-700 mb-6">{service.description}</p>
                      <ul className="space-y-2">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-primary-600 mr-2">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button className="mt-8 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors w-min">
                        Learn More
                      </button>
                    </div>
                    <div className="lg:order-first">
                      {service.image}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* How It Works Section */}
          <div className="mb-20 bg-gray-50 p-10 rounded-xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Request an Interpreter</h3>
                <p className="text-gray-600">Call our hotline or use our app to request an interpreter in your desired language.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Instantly</h3>
                <p className="text-gray-600">We&apos;ll connect you with a professional interpreter in seconds, no appointment needed.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Begin Communicating</h3>
                <p className="text-gray-600">Start your conversation with the interpreter facilitating clear communication between parties.</p>
              </div>
            </div>
          </div>
          
          {/* Additional Services */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Additional Services</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {additionalServices.map((service, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-primary-50 p-3 rounded-full mr-4">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Industries Served */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Industries We Serve</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 h-32 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                <BeakerIcon className="h-10 w-10 text-primary-600 mb-2" />
                <span className="font-medium">Healthcare</span>
              </div>
              <div className="bg-gray-50 h-32 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                <ScaleIcon className="h-10 w-10 text-primary-600 mb-2" />
                <span className="font-medium">Legal</span>
              </div>
              <div className="bg-gray-50 h-32 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                <BriefcaseIcon className="h-10 w-10 text-primary-600 mb-2" />
                <span className="font-medium">Business</span>
              </div>
              <div className="bg-gray-50 h-32 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                <AcademicCapIcon className="h-10 w-10 text-primary-600 mb-2" />
                <span className="font-medium">Education</span>
              </div>
              <div className="bg-gray-50 h-32 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                <ShieldExclamationIcon className="h-10 w-10 text-primary-600 mb-2" />
                <span className="font-medium">Emergency Services</span>
              </div>
              <div className="bg-gray-50 h-32 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                <BuildingStorefrontIcon className="h-10 w-10 text-primary-600 mb-2" />
                <span className="font-medium">Retail</span>
              </div>
              <div className="bg-gray-50 h-32 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                <PhoneIcon className="h-10 w-10 text-primary-600 mb-2" />
                <span className="font-medium">Customer Service</span>
              </div>
              <div className="bg-gray-50 h-32 rounded-lg flex flex-col items-center justify-center p-4 text-center">
                <ChatBubbleBottomCenterTextIcon className="h-10 w-10 text-primary-600 mb-2" />
                <span className="font-medium">Government</span>
              </div>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="bg-primary-600 text-white p-10 rounded-xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Break Language Barriers?</h2>
            <p className="text-xl mb-8">
              Get started with our professional interpretation services today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-6 rounded-md transition-colors">
                Contact Us
              </button>
              <button className="bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 px-6 rounded-md transition-colors">
                Get a Quote
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer dictionary={dictionary} locale={locale} />
    </>
  );
} 