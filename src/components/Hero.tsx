'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeroProps {
  dictionary: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
    };
  };
  locale: string;
}

export default function Hero({ dictionary, locale }: HeroProps) {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {dictionary.hero.title}
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              {dictionary.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/signup`}
                className="btn-primary text-lg px-6 py-3"
              >
                {dictionary.hero.cta}
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-w-4 aspect-h-3 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-20 flex items-center justify-center flex-col">
                <div className="text-white mb-4">
                  {/* Interpreter Icon */}
                  <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white">E-Voque</div>
                <div className="text-sm text-white mt-2">Professional Interpretation Services</div>
              </div>
            </div>
            
            {/* Floating elements for decoration */}
            <motion.div
              className="absolute -top-8 -right-8 w-16 h-16 bg-primary-200 rounded-full"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-8 -left-8 w-12 h-12 bg-indigo-300 rounded-full"
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Additional decorative element */}
            <motion.div
              className="absolute -bottom-4 right-12 w-8 h-8 bg-primary-300 rounded-md rotate-12"
              animate={{
                rotate: [12, 45, 12],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
} 