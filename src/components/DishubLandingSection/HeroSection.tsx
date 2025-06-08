'use client';

import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import WebsiteBuilderSVG from '@/components/animations/WebsiteBuilderSVG';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

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
    // Try to find the next section after the hero
    const nextSection = document.querySelector('section:nth-of-type(2)') || 
                       document.querySelector('[data-section="features"]') ||
                       document.querySelector('[data-section="privacy"]') ||
                       document.querySelector('main > section:not(:first-child)');
    
    if (nextSection) {
      nextSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback to viewport height if no next section found
      const scrollAmount = window.innerHeight;
      window.scrollTo({
        top: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center px-6 overflow-hidden z-0">
      {/* Website Builder Background */}
      <div className="svg-background absolute inset-0">
        <WebsiteBuilderSVG />
      </div>
      
      {/* Content overlay */}
      <div className="relative max-w-5xl mx-auto text-center z-1">
        <ScrollReveal direction="scale" duration={1000} delay={200}>
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
        </ScrollReveal>
        
        <ScrollReveal direction="up" duration={800} delay={600}>
          <p 
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            style={{ transform: `translateY(${scrollY * -0.15}px)` }}
          >
            {t('dishub.hero.subtitle')}
          </p>
        </ScrollReveal>
        
        <ScrollReveal direction="up" duration={800} delay={1000}>
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          >
            {isAuthenticated && user ? (
              <button 
                onClick={handleAuthAction} 
                className="relative z-1 group px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer pointer-events-auto"
              >
                {t('dishub.hero.goToDashboard')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <Link href={`/${params.locale}/get-started`} className="relative z-1 pointer-events-auto">
                <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer pointer-events-auto">
                  {t('dishub.hero.startDisrupting')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            )}
            <button 
              onClick={handleLearnMore}
              className="relative z-1 px-8 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:bg-white/10 backdrop-blur-xl transition-all duration-300 cursor-pointer pointer-events-auto"
            >
              {t('dishub.hero.learnMore')}
            </button>
          </div>
        </ScrollReveal>
      </div>
      <ChevronDown 
        onClick={handleLearnMore}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-8 h-8 animate-bounce cursor-pointer hover:text-cyan-400 transition-colors duration-300 z-1 pointer-events-auto" 
      />
      </section>
  );
} 