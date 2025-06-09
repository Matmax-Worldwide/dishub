'use client';

import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import Header from '@/components/layout/Header';
import HeroSection from '@/components/DishubLandingSection/HeroSection';
import CTASection from '@/components/DishubLandingSection/CTASection';
import FeaturesSection from '@/components/DishubLandingSection/FeaturesSection';
import PrivacySection from '@/components/DishubLandingSection/PrivacySection';
import TechnologySection from '@/components/DishubLandingSection/TechnologySection';
import { AuthProvider } from '@/hooks/useAuth';


export default function DishubLanding() {
  const { t } = useI18n();
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);



  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white overflow-x-hidden relative snap-y snap-mandatory" style={{ overflowY: 'auto', height: '100vh' }}>
    
        {/* Header Navigation - Fixed and mobile optimized */}
        <Header />

        {/* Hero Section with Enhanced Parallax - Mobile First */}
        <div className="snap-start h-screen">
          <HeroSection scrollY={scrollY} />
        </div>

        {/* Features Section with Parallax - Mobile First */}
        <div className="snap-start h-screen flex items-center justify-center px-4 sm:px-6">
          <FeaturesSection scrollY={scrollY} />
        </div>

        {/* Privacy Section with Enhanced Parallax - Mobile First */}
        <div className="snap-start h-screen flex items-center justify-center px-4 sm:px-6">
          <PrivacySection scrollY={scrollY} />
        </div>

        {/* Technology Section with Parallax Layers - Mobile First */}
        <div className="snap-start h-screen flex items-center justify-center px-4 sm:px-6">
          <TechnologySection scrollY={scrollY} />
        </div>

        {/* CTA Section with Parallax - Mobile First */}
        <div className="snap-start h-screen flex flex-col justify-center px-4 sm:px-6">
          <div 
            className="flex-grow flex items-center justify-center"
            data-section="cta"
            style={{ 
              transform: `translateY(${scrollY * 0.1}px)`,
              willChange: 'transform'
            }}
          >
            <CTASection />
          </div>
          
          {/* Footer integrated within the last slide - Mobile optimized */}
          <footer 
            className="relative py-4 border-t border-white/10 pointer-events-auto"
            style={{ 
              transform: `translateY(${scrollY * 0.05}px)`,
              willChange: 'transform'
            }}
          >
            {/* Subtle background animation */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                transform: `translateY(${scrollY * 0.02}px)`
              }}
            />
            
            <div className="relative max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center z-10 w-full">
              <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="font-bold text-xs sm:text-sm">{t('dishub.nav.brand')}</span>
              </div>
              <p className="text-gray-400 text-xs">
                {t('dishub.footer.copyright')}
              </p>
            </div>
          </footer>
        </div>

        {/* Enhanced Custom Styles with Parallax Optimizations */}
        <style jsx>{`
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) translateX(0px); 
              opacity: 0.6;
            }
            50% { 
              transform: translateY(-20px) translateX(10px); 
              opacity: 0.9;
            }
          }
          
          /* Parallax performance optimizations */
          .parallax-layer {
            will-change: transform;
            transform-style: preserve-3d;
            backface-visibility: hidden;
          }
          
          /* Hardware acceleration for parallax elements */
          [style*="translateY"] {
            transform: translateZ(0);
          }
          
          /* Scroll snap optimizations */
          .snap-y {
            scroll-snap-type: y mandatory;
          }
          
          .snap-start {
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
          
          /* Smooth scrolling for better user experience */
          html {
            scroll-behavior: smooth;
          }
          
          /* Ensure sections are properly centered */
          .snap-start {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </div>
    </AuthProvider>
  );
} 