import { getDictionary, Locale, locales, Dictionary } from '../../i18n';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { 
  HeartIcon,
  UserGroupIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface WellnessContentProps {
  locale: string;
  dictionary: Dictionary;
}

export default async function WellnessPage(props: PageProps) {
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
  
  return <WellnessContent locale={safeLocale} dictionary={dictionary} />;
}

// Separate component to avoid direct rendering with params
function WellnessContent({ locale, dictionary }: WellnessContentProps) {
  // Wellness programs
  const wellnessPrograms = [
    {
      id: "yoga",
      icon: <SunIcon className="h-12 w-12 text-amber-500" />,
      title: "Morning Yoga",
      description: "Start your day with energizing yoga flows designed to awaken your body and mind.",
      benefits: [
        "Improved flexibility and balance",
        "Reduced stress and anxiety",
        "Enhanced energy and focus",
        "Better posture and body awareness"
      ],
      duration: "15-30 min",
      level: "All levels",
      color: "bg-gradient-to-r from-amber-50 to-amber-100",
      iconColor: "text-amber-500",
      image: (
        <div className="h-64 bg-gradient-to-r from-amber-200 to-amber-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <SunIcon className="w-32 h-32 text-amber-400 opacity-50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-transparent h-16"></div>
          <div className="absolute bottom-2 left-4 text-white font-medium">Morning Yoga Session</div>
        </div>
      )
    },
    {
      id: "flexibility",
      icon: <FireIcon className="h-12 w-12 text-red-500" />,
      title: "Flexibility Training",
      description: "Increase your range of motion and prevent injuries with targeted stretching routines.",
      benefits: [
        "Improved joint mobility",
        "Reduced muscle tension",
        "Injury prevention",
        "Enhanced physical performance"
      ],
      duration: "20-40 min",
      level: "Beginner to advanced",
      color: "bg-gradient-to-r from-red-50 to-orange-50",
      iconColor: "text-red-500",
      image: (
        <div className="h-64 bg-gradient-to-r from-red-200 to-red-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <FireIcon className="w-32 h-32 text-red-400 opacity-50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-500 to-transparent h-16"></div>
          <div className="absolute bottom-2 left-4 text-white font-medium">Flexibility Session</div>
        </div>
      )
    },
    {
      id: "meditation",
      icon: <MoonIcon className="h-12 w-12 text-indigo-500" />,
      title: "Guided Meditation",
      description: "Reduce stress and improve focus with guided mindfulness sessions for mental clarity.",
      benefits: [
        "Reduced stress and anxiety",
        "Improved concentration",
        "Better emotional regulation",
        "Enhanced self-awareness"
      ],
      duration: "10-20 min",
      level: "All levels",
      color: "bg-gradient-to-r from-indigo-50 to-purple-50",
      iconColor: "text-indigo-500",
      image: (
        <div className="h-64 bg-gradient-to-r from-indigo-200 to-indigo-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <MoonIcon className="w-32 h-32 text-indigo-400 opacity-50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-transparent h-16"></div>
          <div className="absolute bottom-2 left-4 text-white font-medium">Meditation Session</div>
        </div>
      )
    },
    {
      id: "recovery",
      icon: <ArrowPathIcon className="h-12 w-12 text-green-500" />,
      title: "Recovery Techniques",
      description: "Learn proper recovery methods to enhance performance and prevent burnout.",
      benefits: [
        "Faster muscle recovery",
        "Reduced soreness",
        "Improved sleep quality",
        "Prevention of overtraining"
      ],
      duration: "15-25 min",
      level: "All levels",
      color: "bg-gradient-to-r from-green-50 to-emerald-50",
      iconColor: "text-green-500",
      image: (
        <div className="h-64 bg-gradient-to-r from-green-200 to-green-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <ArrowPathIcon className="w-32 h-32 text-green-400 opacity-50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-transparent h-16"></div>
          <div className="absolute bottom-2 left-4 text-white font-medium">Recovery Session</div>
        </div>
      )
    },
  ];

  // Wellness benefits


  return (
    <>
      <Navbar dictionary={dictionary} locale={locale} />
      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero section */}
          <div className="text-center mb-16">
            <div className="inline-flex mb-6">
              <HeartIcon className="h-16 w-16 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">At-Home Wellness Programs</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enhance your well-being with our curated wellness programs designed for home practice.
            </p>
            <div className="mt-6 flex items-center justify-center space-x-2">
              <span className="text-lg text-gray-500">Powered by</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">MatMax</span>
            </div>
          </div>
          
          {/* Wellness overview image placeholder */}
          <div className="relative w-full h-96 bg-gradient-to-r from-primary-100 to-indigo-100 rounded-xl overflow-hidden mb-20">
            <div className="absolute inset-0 opacity-30">
              <div className="grid grid-cols-4 grid-rows-2 gap-4 w-full h-full p-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
                    {i % 4 === 0 && <SunIcon className="w-20 h-20 text-amber-300" />}
                    {i % 4 === 1 && <FireIcon className="w-20 h-20 text-red-300" />}
                    {i % 4 === 2 && <MoonIcon className="w-20 h-20 text-indigo-300" />}
                    {i % 4 === 3 && <ArrowPathIcon className="w-20 h-20 text-green-300" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-2xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Transform Your Daily Routine</h2>
                <p className="text-lg text-gray-700 mb-6">
                  Our wellness programs are designed to seamlessly integrate into your daily life, bringing balance and vitality to your routine from the comfort of your home.
                </p>
                <button className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-md transition-colors">
                  Start Your Wellness Journey
                </button>
              </div>
            </div>
          </div>
          
          {/* About MatMax */}
          <div className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex mb-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">MatMax</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">The Science of Wellness at Home</h2>
                <p className="text-lg text-gray-700 mb-6">
                  MatMax was founded by fitness and wellness experts with over 20 years of experience in helping people achieve their health goals. Our mission is to make expert-guided wellness accessible to everyone, regardless of schedule or location.
                </p>
                <p className="text-lg text-gray-700 mb-6">
                  Our programs are developed based on the latest research in exercise physiology, stress management, and mindfulness practice, designed to deliver maximum benefits in minimum time.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium">25,000+</div>
                    <div className="text-sm text-gray-500">Happy practitioners</div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium">100+ Hours</div>
                    <div className="text-sm text-gray-500">Of guided content</div>
                  </div>
                </div>
              </div>
              <div className="relative h-96 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full opacity-20 animate-pulse"></div>
                      <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <HeartIcon className="h-16 w-16 text-primary-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">MatMax Technology</h3>
                    <p className="mt-2 text-gray-600">Advanced wellness guidance in your pocket</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Programs Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Our Wellness Programs</h2>
            
            <div className="space-y-16">
              {wellnessPrograms.map((program, index) => (
                <div key={program.id} className={`p-8 rounded-xl ${program.color}`}>
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    <div className="flex flex-col justify-center">
                      <div className={`p-3 rounded-full ${program.iconColor} bg-white inline-flex mb-4 w-min`}>
                        {program.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{program.title}</h3>
                      <p className="text-lg text-gray-700 mb-6">{program.description}</p>
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                        <ul className="space-y-2">
                          {program.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-primary-600 mr-2">•</span>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center space-x-6 mb-6">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-500">{program.duration}</span>
                        </div>
                        <div className="flex items-center">
                          <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-500">{program.level}</span>
                        </div>
                      </div>
                      <button className="mt-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors w-max">
                        Try this Program
                      </button>
                    </div>
                    <div className={index % 2 === 1 ? "lg:order-first" : ""}>
                      {program.image}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Benefits Section */}
          <div className="mb-20 bg-gray-50 p-10 rounded-xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Benefits of Regular Practice</h2>
            
   
          </div>
          
          {/* Testimonials */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">What Our Members Say</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mr-4"></div>
                    <div>
                      <h3 className="font-bold text-gray-900">Sarah J.</h3>
                      <p className="text-sm text-gray-500">Morning Yoga Practitioner</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    &quot;The morning yoga sessions have completely transformed my daily routine. I feel more energized and focused throughout the day.&quot;
                  </p>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mr-4"></div>
                    <div>
                      <h3 className="font-bold text-gray-900">Michael T.</h3>
                      <p className="text-sm text-gray-500">Meditation Program Member</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    &quot;As a busy executive, the guided meditation has been a lifesaver. I can manage stress better and stay focused during intense workdays.&quot;
                  </p>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mr-4"></div>
                    <div>
                      <h3 className="font-bold text-gray-900">Elena R.</h3>
                      <p className="text-sm text-gray-500">Flexibility & Recovery User</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    &quot;The flexibility training has significantly reduced my back pain. The instructors are knowledgeable and the sessions are easy to follow.&quot;
                  </p>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5" fill={i < 4 ? "currentColor" : "none"} stroke={i < 4 ? "none" : "currentColor"} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-10 rounded-xl text-center">
            <h2 className="text-3xl font-bold mb-4">Start Your Wellness Journey Today</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Access all these programs and more with our subscription. No equipment needed, just your commitment to well-being.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-8 rounded-md transition-colors">
                Try Free for 7 Days
              </button>
              <button className="bg-primary-700 border border-white hover:bg-primary-800 text-white font-medium py-3 px-8 rounded-md transition-colors">
                Learn More
              </button>
            </div>
            <p className="text-sm mt-6 text-primary-100">
              Powered by MatMax Technology • No credit card required for trial
            </p>
          </div>
        </div>
      </div>
      <Footer dictionary={dictionary} locale={locale} />
    </>
  );
} 