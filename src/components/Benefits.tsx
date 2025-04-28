'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  GlobeAltIcon, 
  ShieldCheckIcon,
  ServerIcon,
  BoltIcon 
} from '@heroicons/react/24/outline';

interface BenefitsProps {
  dictionary: {
    benefits: {
      title: string;
      quality: string;
      speed: string;
      availability: string;
      languages: string;
      security: string;
      technology: string;
    };
  };
}

export default function Benefits({ dictionary }: BenefitsProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const benefits = [
    {
      icon: <CheckCircleIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.benefits.quality,
    },
    {
      icon: <BoltIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.benefits.speed,
    },
    {
      icon: <ClockIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.benefits.availability,
    },
    {
      icon: <GlobeAltIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.benefits.languages,
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.benefits.security,
    },
    {
      icon: <ServerIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.benefits.technology,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {dictionary.benefits.title}
          </h2>
          <div className="mt-6 h-1 w-20 bg-primary-600 mx-auto rounded-full"></div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={item}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {benefit.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-primary-600 text-white py-3 px-6 rounded-md inline-block font-medium">
            Get started with our services today
          </div>
        </motion.div>
      </div>
    </section>
  );
} 