'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Lock, Database, Rocket } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import Header from '@/components/layout/Header';
import HeroSection from '@/components/DishubLandingSection/HeroSection';
import CTASection from '@/components/DishubLandingSection/CTASection';
import FeaturesSection from '@/components/DishubLandingSection/FeaturesSection';
import PrivacySection from '@/components/DishubLandingSection/PrivacySection';
import TechArchitectureSVG from '@/components/animations/TechArchitectureSVG';
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

  // Calculate parallax values for different layers
  const techParallax = scrollY * 0.15;

  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white overflow-x-hidden relative scrollbar-hide">
    
        {/* Header Navigation - Fixed */}
        <Header />

        {/* Hero Section with Enhanced Parallax */}
        <HeroSection scrollY={scrollY} />

        {/* Features Section with Parallax */}
        <FeaturesSection scrollY={scrollY} />

        {/* Privacy Section with Enhanced Parallax */}
        <PrivacySection scrollY={scrollY} />

        {/* Technology Section with Parallax Layers */}
        <div className="relative py-20 px-6 pointer-events-auto overflow-hidden">
          {/* Multi-layer parallax backgrounds */}
          <div 
            className="absolute inset-0 z-0"
            style={{ 
              transform: `translateY(${techParallax}px)`,
              willChange: 'transform'
            }}
          >
            {/* Deep space background layer */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-black/30"></div>
            
            {/* Animated tech grid */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                transform: `translateY(${scrollY * 0.1}px)`
              }}
            />
          </div>

          {/* Floating tech elements with different parallax speeds */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  transform: `translateY(${scrollY * (0.05 + Math.random() * 0.1)}px)`,
                  willChange: 'transform'
                }}
              >
                {i % 4 === 0 ? (
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                ) : i % 4 === 1 ? (
                  <div className="w-3 h-3 border border-purple-400/50 rotate-45 animate-spin" style={{animationDuration: '10s'}}></div>
                ) : i % 4 === 2 ? (
                  <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse"></div>
                ) : (
                  <div className="w-4 h-1 bg-gradient-to-r from-purple-400 to-transparent animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="relative max-w-7xl mx-auto z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div 
                style={{ 
                  transform: `translateY(${scrollY * 0.05}px)`,
                  willChange: 'transform'
                }}
              >
                <h2 className="text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {t('dishub.technology.title')}
                  </span>
                  <br />
                  {t('dishub.technology.subtitle')}
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  {t('dishub.technology.description')}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <Lock className="w-6 h-6 text-purple-400" />
                    <span>{t('dishub.technology.endToEnd')}</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <Database className="w-6 h-6 text-cyan-400" />
                    <span>{t('dishub.technology.decentralized')}</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <Rocket className="w-6 h-6 text-pink-400" />
                    <span>{t('dishub.technology.aiInsights')}</span>
                  </div>
                </div>
              </div>
              <div 
                className="relative"
                style={{ 
                  transform: `translateY(${scrollY * -0.03}px)`,
                  willChange: 'transform'
                }}
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl filter blur-3xl opacity-30 animate-pulse"
                  style={{ 
                    transform: `translateY(${scrollY * 0.02}px)`,
                    willChange: 'transform'
                  }}
                />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500">
                  <TechArchitectureSVG />
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* CTA Section with Parallax */}
        <div 
          style={{ 
            transform: `translateY(${scrollY * 0.1}px)`,
            willChange: 'transform'
          }}
        >
          <CTASection />
        </div>

        {/* Footer with Parallax */}
        <footer 
          className="relative py-8 px-6 border-t border-white/10 pointer-events-auto"
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
              backgroundSize: '60px 60px',
              transform: `translateY(${scrollY * 0.02}px)`
            }}
          />
          
          <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center z-10">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">{t('dishub.nav.brand')}</span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('dishub.footer.copyright')}
            </p>
          </div>
        </footer>

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
          
          /* Smooth scrolling for better parallax */
          html {
            scroll-behavior: smooth;
          }
          
          /* Hardware acceleration for parallax elements */
          [style*="translateY"] {
            transform: translateZ(0);
          }
        `}</style>
      </div>
    </AuthProvider>
  );
} 