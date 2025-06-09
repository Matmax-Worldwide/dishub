'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import InterstellarTechSVG from '@/components/animations/InterstellarTechSVG';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

export default function CTASection() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();


  const handleAuthAction = () => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user role and tenant
      if (user.role.name === 'SuperAdmin') {
        router.push(`/${params.locale}/super-admin/dashboard`);
      } else if (user.tenantSlug) {
        router.push(`/${params.locale}/${user.tenantSlug}/dashboard`);
      } else {
        router.push(`/${params.locale}/${user.tenantSlug}/dashboard`);
      }
    }
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 xl:py-32 px-3 sm:px-4 lg:px-6 overflow-hidden">
      {/* Interstellar Tech Background */}
      <div className="svg-background absolute inset-0">
        <InterstellarTechSVG />
      </div>
      
      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]"></div>
      
      {/* Content overlay - iPhone optimized */}
      <div className="relative max-w-4xl mx-auto text-center z-20 px-2 sm:px-4">
        <ScrollReveal direction="left" duration={800} delay={200}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 lg:mb-6">
            {t('dishub.cta.readyTo')}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent ml-2 sm:ml-3">
              {t('dishub.cta.disrupt')}
            </span>
          </h2>
        </ScrollReveal>
        
        <ScrollReveal direction="right" duration={800} delay={400}>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-300 mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-4 leading-relaxed">
            {t('dishub.cta.subtitle')}
          </p>
        </ScrollReveal>
        
        <ScrollReveal direction="scale" duration={800} delay={600}>
          {isAuthenticated && user ? (
            <button 
              onClick={handleAuthAction} 
              className="interactive-element group w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-sm sm:text-base lg:text-lg xl:text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center mx-auto cursor-pointer max-w-sm sm:max-w-none"
            >
              {t('dishub.cta.accessDashboard')}
              <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          ) : (
            <div className="flex justify-center">
              <Link href={`/${params.locale}/login`} className="interactive-element w-full sm:w-auto">
                <button className="group w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-sm sm:text-base lg:text-lg xl:text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer max-w-sm sm:max-w-none">
                  {t('dishub.cta.launchFuture')}
                  <ArrowRight className="ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              </Link>
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
} 