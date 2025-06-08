'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Database, Rocket } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import Header from '@/components/layout/Header';
import HeroSection from '@/components/DishubLandingSection/HeroSection';
import CTASection from '@/components/DishubLandingSection/CTASection';
import FeaturesSection from '@/components/DishubLandingSection/FeaturesSection';
import PrivacySection from '@/components/DishubLandingSection/PrivacySection';
import TechArchitectureSVG from '@/components/animations/TechArchitectureSVG';
import Footer from '@/components/navigation/footer/Footer';
import { AuthProvider } from '@/hooks/useAuth';


export default function DishubLanding() {
  const { t } = useI18n();
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const privacyFeatures = [
    {
      title: t('dishub.privacy.gdprCompliant.title'),
      desc: t('dishub.privacy.gdprCompliant.desc'),
      gradient: "from-blue-500 to-purple-500"
    },
    {
      title: t('dishub.privacy.zeroKnowledge.title'),
      desc: t('dishub.privacy.zeroKnowledge.desc'),
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: t('dishub.privacy.dataSovereignty.title'),
      desc: t('dishub.privacy.dataSovereignty.desc'),
      gradient: "from-pink-500 to-red-500"
    },
    {
      title: t('dishub.privacy.federatedSystem.title'),
      desc: t('dishub.privacy.federatedSystem.desc'),
      gradient: "from-cyan-500 to-blue-500"
    }
  ];



  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
    
        {/* Header Navigation */}
        <Header />

        {/* Hero Section */}
        <HeroSection scrollY={scrollY} />

        {/* Features Section with Animations */}
        <FeaturesSection />

        {/* Privacy Section with Animations */}
        <PrivacySection />

       
        {/* Technology Section */}
        <section className="relative py-10 px-6 pointer-events-auto overflow-hidden">
          {/* Transition background from global to deep tech */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-black/30"></div>
          
          <div className="relative max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl filter blur-3xl opacity-30 animate-pulse" />
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500">
                  <TechArchitectureSVG />
                </div>
              </div>
            </div>
          </div>
        </section>

 {/* Privacy & Compliance Section */}
 <section className="relative px-6 overflow-hidden pointer-events-auto">
          {/* Deep space transition background */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-purple-900/20 to-black/40"></div>
          
          {/* Floating cosmic particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>
          
          <div className="relative max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('dishub.privacy.title')}
              </span>
            </h2>
            <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto">
              {t('dishub.privacy.subtitle')}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {privacyFeatures.map((feature, i) => (
                <div key={i} className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`} />
                  <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 h-full hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg mb-4 flex items-center justify-center`}>
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            
          </div>
        </section>



        {/* CTA Section */}
        <CTASection />

        {/* Footer */}
        <Footer 
          menu={{
            id: 'footer-menu',
            name: 'Footer Navigation',
            location: 'footer',
            items: []
          }}
          title="DISHUB"
          subtitle={t('footer.brand.description')}
        />

        {/* Custom Styles */}
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
        `}</style>
      </div>
    </AuthProvider>
  );
} 