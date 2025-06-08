'use client';

import React from 'react';
import { Lock, Eye, Server, Network } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

export default function PrivacySection() {
  const { t } = useI18n();

  const privacyFeatures = [
    {
      icon: Lock,
      title: t('dishub.privacy.gdprCompliant.title'),
      description: t('dishub.privacy.gdprCompliant.desc'),
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20',
    },
    {
      icon: Eye,
      title: t('dishub.privacy.zeroKnowledge.title'),
      description: t('dishub.privacy.zeroKnowledge.desc'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
    },
    {
      icon: Server,
      title: t('dishub.privacy.dataSovereignty.title'),
      description: t('dishub.privacy.dataSovereignty.desc'),
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/20',
    },
    {
      icon: Network,
      title: t('dishub.privacy.federatedSystem.title'),
      description: t('dishub.privacy.federatedSystem.desc'),
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/20',
    },
  ];

  return (
    <div className="relative py-32 px-6 bg-black" data-section="privacy">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal direction="down" duration={1000} delay={200}>
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              {t('dishub.privacy.title')}
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('dishub.privacy.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* Privacy Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {privacyFeatures.map((feature, index) => (
            <ScrollReveal
              key={index}
              direction={index < 2 ? 'left' : 'right'}
              duration={800}
              delay={400 + index * 150}
            >
              <div className={`group relative p-8 rounded-2xl ${feature.bgColor} ${feature.borderColor} border backdrop-blur-xl hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10`}>
                <div className="relative">
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 ${feature.color} group-hover:text-white transition-colors duration-300`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>


      </div>
    </div>
  );
} 