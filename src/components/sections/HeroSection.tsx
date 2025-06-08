'use client';

import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import WebsiteBuilderSVG from '@/components/animations/WebsiteBuilderSVG';

interface HeroSectionProps {
  scrollY: number;
}

export default function HeroSection({ scrollY }: HeroSectionProps) {
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
        router.push(`/${params.locale}/dashboard`);
      }
    }
  };

  const handleLearnMore = () => {
    const scrollAmount = window.innerHeight * 0.9;
    window.scrollTo({
      top: scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pointer-events-auto overflow-hidden">
      {/* Website Builder Background */}
      <WebsiteBuilderSVG />
      
      {/* Content overlay */}
      <div className="relative max-w-5xl mx-auto text-center">
        <h1 
          className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
            {t('dishub.hero.disruption')}
          </span>
          <br />
          <span className="text-white">{t('dishub.hero.isInnovation')}</span>
        </h1>
        <p 
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
          style={{ transform: `translateY(${scrollY * -0.15}px)` }}
        >
          {t('dishub.hero.subtitle')}
        </p>
        <div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        >
          {isAuthenticated && user ? (
            <button 
              onClick={handleAuthAction} 
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer pointer-events-auto relative z-50"
            >
              {t('dishub.hero.goToDashboard')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <Link href={`/${params.locale}/get-started`}>
              <button className="group z-50 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer pointer-events-auto relative z-50">
                {t('dishub.hero.startDisrupting')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          )}
          <button 
            onClick={handleLearnMore}
            className="px-8 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:bg-white/10 backdrop-blur-xl transition-all duration-300 cursor-pointer pointer-events-auto relative z-50"
          >
            {t('dishub.hero.learnMore')}
          </button>
        </div>
      </div>
              <ChevronDown className="absolute bottom-10 w-8 h-8 animate-bounce" />
      </section>
  );
} 