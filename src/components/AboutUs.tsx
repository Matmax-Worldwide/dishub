'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { PhoneIcon, GlobeAltIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface AboutUsProps {
  dictionary: {
    about: {
      title: string;
      description: string;
      mission: string;
    };
  };
}

export default function AboutUs({ dictionary }: AboutUsProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const features = [
    {
      icon: <PhoneIcon className="h-8 w-8 text-primary-600" />,
      title: 'Over-the-Phone Interpretation',
      description: 'Professional interpretation services available instantly over the phone.',
    },
    {
      icon: <GlobeAltIcon className="h-8 w-8 text-primary-600" />,
      title: 'Multiple Languages',
      description: 'Support for over 100 languages with native-speaking interpreters.',
    },
    {
      icon: <UserGroupIcon className="h-8 w-8 text-primary-600" />,
      title: 'Expert Interpreters',
      description: 'Highly trained professionals with subject matter expertise.',
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {dictionary.about.title}
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            {dictionary.about.description}
          </p>
        </motion.div>

        {/* Company/Team Image Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="relative h-64 md:h-96 bg-gradient-to-r from-primary-100 to-indigo-100 rounded-lg shadow-md overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6 bg-white bg-opacity-80 rounded-lg shadow-sm">
                <div className="flex justify-center mb-4">
                  {/* Team icon */}
                  <svg className="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Our Team of Expert Interpreters</h3>
                <p className="mt-2 text-gray-600">Experienced professionals dedicated to breaking language barriers</p>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-primary-400 opacity-20"></div>
            <div className="absolute bottom-6 right-8 w-16 h-16 rounded-full bg-indigo-500 opacity-20"></div>
            <div className="absolute top-1/3 right-1/4 w-12 h-12 rounded-full bg-primary-300 opacity-30"></div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: index * 0.2 + 0.4 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 mb-4 mx-auto">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3 text-center">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-center">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 bg-primary-600 text-white p-8 rounded-lg"
        >
          <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
          <p className="text-lg">
            {dictionary.about.mission}
          </p>
        </motion.div>
      </div>
    </section>
  );
} 