'use client';

import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import PrivacyFirstSVG from '@/components/animations/PrivacyFirstSVG';
import AIPoweredSVG from '@/components/animations/AIPoweredSVG';
import BlockchainReadySVG from '@/components/animations/BlockchainReadySVG';
import GlobalScaleIconSVG from '@/components/animations/GlobalScaleIconSVG';

export default function FeaturesSection() {
  const { t } = useI18n();

  const features = [
    {
      icon: PrivacyFirstSVG,
      title: t('dishub.features.privacyFirst.title'),
      description: t('dishub.features.privacyFirst.desc'),
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: AIPoweredSVG,
      title: t('dishub.features.aiPowered.title'),
      description: t('dishub.features.aiPowered.desc'),
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: BlockchainReadySVG,
      title: t('dishub.features.blockchainReady.title'),
      description: t('dishub.features.blockchainReady.desc'),
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: GlobalScaleIconSVG,
      title: t('dishub.features.globalScale.title'),
      description: t('dishub.features.globalScale.desc'),
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="relative py-32 px-6 bg-gradient-to-b from-gray-900 to-black" data-section="features">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal direction="up" duration={800} delay={200}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {t('dishub.features.nativeByDesign')}
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Construido desde cero con tecnología de vanguardia para el futuro digital
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <ScrollReveal
              key={index}
              direction={index % 2 === 0 ? 'left' : 'right'}
              duration={800}
              delay={400 + index * 200}
            >
              <div className="group relative bg-gray-900/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/30 hover:border-cyan-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/10 overflow-hidden">
                {/* Tech grid pattern background */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-30 rounded-2xl blur-xl transition-opacity duration-500"></div>
                
                {/* SVG Icon - Much larger and without background container */}
                <div className="relative z-10 mb-8 flex justify-center group-hover:scale-110 transition-transform duration-500">
                  <feature.icon className="w-24 h-24 md:w-28 md:h-28 drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-500" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <h3 className="text-xl font-bold text-white mb-4 transition-all duration-300 group-hover:text-cyan-100">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Animated tech border effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 rounded-2xl border border-cyan-500/30 animate-pulse"></div>
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-2xl"></div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Tech floating elements animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
              }}
            >
              {i % 3 === 0 ? (
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
              ) : i % 3 === 1 ? (
                <div className="w-2 h-2 border border-cyan-400/50 rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
              ) : (
                <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 