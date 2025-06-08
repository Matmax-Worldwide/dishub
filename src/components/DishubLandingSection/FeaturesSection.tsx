'use client';

import React from 'react';
import { Shield, Zap, Globe, Cpu } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

export default function FeaturesSection() {
  const { t } = useI18n();

  const features = [
    {
      icon: Shield,
      title: t('dishub.features.privacyFirst.title'),
      description: t('dishub.features.privacyFirst.desc'),
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Cpu,
      title: t('dishub.features.aiPowered.title'),
      description: t('dishub.features.aiPowered.desc'),
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Zap,
      title: t('dishub.features.blockchainReady.title'),
      description: t('dishub.features.blockchainReady.desc'),
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Globe,
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
              <div className="group relative bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
                
                {/* Icon */}
                <div className={`relative mb-6 w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} p-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                
                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>

                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} p-[1px]`}>
                    <div className="w-full h-full bg-gray-800 rounded-2xl"></div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
} 