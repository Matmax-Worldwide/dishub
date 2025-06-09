'use client';

import React from 'react';
import { Lock, Eye, Server, Network } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

// Privacy-focused background SVG
function PrivacySpaceSVG() {
  return (
    <svg
      viewBox="0 0 1920 1080"
      className="absolute inset-0 w-full h-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Privacy-themed gradients */}
        <radialGradient id="privacyCore" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#059669" stopOpacity="0.2" />
          <stop offset="70%" stopColor="#047857" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
        </radialGradient>
        
        <linearGradient id="secureFlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
          <stop offset="25%" stopColor="#3B82F6" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5" />
          <stop offset="75%" stopColor="#06B6D4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
        </linearGradient>
        
        <radialGradient id="shieldGlow" cx="50%" cy="50%" r="30%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#059669" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Security grid pattern */}
        <pattern id="securityGrid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#10B981" strokeWidth="0.4" opacity="0.2"/>
          <path d="M 40 0 L 40 80" fill="none" stroke="#3B82F6" strokeWidth="0.2" opacity="0.15"/>
          <path d="M 0 40 L 80 40" fill="none" stroke="#3B82F6" strokeWidth="0.2" opacity="0.15"/>
          <circle cx="0" cy="0" r="1.5" fill="#10B981" opacity="0.3" />
          <circle cx="80" cy="0" r="1.5" fill="#10B981" opacity="0.3" />
          <circle cx="40" cy="40" r="1" fill="#8B5CF6" opacity="0.4" />
          <rect x="38" y="38" width="4" height="4" fill="none" stroke="#06B6D4" strokeWidth="0.5" opacity="0.2" />
        </pattern>

        {/* Encryption pattern */}
        <pattern id="encryptionPattern" width="120" height="120" patternUnits="userSpaceOnUse">
          <g opacity="0.1">
            <text x="10" y="20" fontSize="8" fill="#10B981" fontFamily="monospace">256</text>
            <text x="60" y="40" fontSize="6" fill="#3B82F6" fontFamily="monospace">AES</text>
            <text x="20" y="80" fontSize="7" fill="#8B5CF6" fontFamily="monospace">RSA</text>
            <text x="80" y="100" fontSize="8" fill="#06B6D4" fontFamily="monospace">SHA</text>
          </g>
        </pattern>

        {/* Filters for glow effects */}
        <filter id="privacyGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Multi-layer background */}
      <rect width="1920" height="1080" fill="url(#securityGrid)" opacity="0.4" />
      <rect width="1920" height="1080" fill="url(#encryptionPattern)" opacity="0.6" />
      
      {/* Central privacy core */}
      <ellipse cx="960" cy="540" rx="600" ry="400" fill="url(#privacyCore)" />
      
      {/* Security perimeter rings */}
      <g fill="none" strokeWidth="2" opacity="0.3">
        <circle cx="960" cy="540" r="200" stroke="#10B981" strokeDasharray="20,10">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 960 540;360 960 540"
            dur="60s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="960" cy="540" r="300" stroke="#3B82F6" strokeDasharray="15,8">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="360 960 540;0 960 540"
            dur="45s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="960" cy="540" r="400" stroke="#8B5CF6" strokeDasharray="25,12">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 960 540;360 960 540"
            dur="80s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Secure data flows */}
      <g stroke="url(#secureFlow)" strokeWidth="1.5" fill="none" opacity="0.4">
        {/* Encrypted data streams */}
        <path d="M 200,200 Q 480,300 760,200 Q 1040,100 1320,200 Q 1600,300 1720,200" strokeDasharray="12,6">
          <animate attributeName="stroke-dashoffset" values="0;-36;0" dur="20s" repeatCount="indefinite" />
        </path>
        <path d="M 200,880 Q 480,780 760,880 Q 1040,980 1320,880 Q 1600,780 1720,880" strokeDasharray="12,6">
          <animate attributeName="stroke-dashoffset" values="0;36;0" dur="18s" repeatCount="indefinite" />
        </path>
        <path d="M 100,540 Q 300,340 500,540 Q 700,740 900,540 Q 1100,340 1300,540 Q 1500,740 1700,540" strokeDasharray="8,4">
          <animate attributeName="stroke-dashoffset" values="0;-24;0" dur="25s" repeatCount="indefinite" />
        </path>
        
        {/* Vertical security channels */}
        <path d="M 400,0 Q 450,270 400,540 Q 350,810 400,1080" strokeDasharray="10,5">
          <animate attributeName="stroke-dashoffset" values="0;-30;0" dur="22s" repeatCount="indefinite" />
        </path>
        <path d="M 1520,0 Q 1470,270 1520,540 Q 1570,810 1520,1080" strokeDasharray="10,5">
          <animate attributeName="stroke-dashoffset" values="0;30;0" dur="24s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Privacy shield nodes - positioned for the 4 features */}
      <g>
        {/* GDPR Compliant - Green */}
        <circle cx="480" cy="350" r="25" fill="url(#shieldGlow)" filter="url(#privacyGlow)">
          <animate attributeName="r" values="25;30;25" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="480" cy="350" r="15" fill="#10B981" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" repeatCount="indefinite" />
        </circle>
        <path d="M 470,345 L 475,350 L 490,335" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
        
        {/* Zero Knowledge - Blue */}
        <circle cx="1440" cy="350" r="25" fill="url(#shieldGlow)" filter="url(#privacyGlow)">
          <animate attributeName="r" values="25;30;25" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="1440" cy="350" r="15" fill="#3B82F6" opacity="0.9">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="1440" cy="350" r="8" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
        <circle cx="1440" cy="350" r="4" fill="white" opacity="0.6" />
        
        {/* Data Sovereignty - Purple */}
        <circle cx="480" cy="730" r="25" fill="url(#shieldGlow)" filter="url(#privacyGlow)">
          <animate attributeName="r" values="25;30;25" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="480" cy="730" r="15" fill="#8B5CF6" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="5s" repeatCount="indefinite" />
        </circle>
        <rect x="475" y="725" width="10" height="10" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
        <rect x="477" y="727" width="6" height="6" fill="white" opacity="0.5" />
        
        {/* Federated System - Cyan */}
        <circle cx="1440" cy="730" r="25" fill="url(#shieldGlow)" filter="url(#privacyGlow)">
          <animate attributeName="r" values="25;30;25" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="1440" cy="730" r="15" fill="#06B6D4" opacity="0.9">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="4.5s" repeatCount="indefinite" />
        </circle>
        <g stroke="white" strokeWidth="1.5" fill="none" opacity="0.7">
          <circle cx="1435" cy="725" r="3" />
          <circle cx="1445" cy="725" r="3" />
          <circle cx="1435" cy="735" r="3" />
          <circle cx="1445" cy="735" r="3" />
          <path d="M 1435,725 L 1445,735" />
          <path d="M 1445,725 L 1435,735" />
        </g>
      </g>

      {/* Encrypted data particles */}
      <g fill="#10B981" opacity="0.6">
        <circle cx="150" cy="150" r="2">
          <animateMotion dur="30s" repeatCount="indefinite">
            <path d="M 0,0 Q 500,200 1000,100 Q 1500,0 1770,200 Q 1500,400 1000,300 Q 500,200 0,400 Q 0,200 0,0" />
          </animateMotion>
        </circle>
        <circle cx="250" cy="100" r="1.5">
          <animateMotion dur="35s" repeatCount="indefinite">
            <path d="M 0,0 Q 700,300 1400,150 Q 1800,0 1400,450 Q 700,600 0,300 Q 0,150 0,0" />
          </animateMotion>
        </circle>
        <circle cx="350" cy="50" r="2.5">
          <animateMotion dur="28s" repeatCount="indefinite">
            <path d="M 0,0 Q 900,400 1800,200 Q 1900,600 900,800 Q 0,400 0,0" />
          </animateMotion>
        </circle>
      </g>

      {/* Security status indicators */}
      <g fill="#10B981" fontSize="8" fontFamily="monospace" opacity="0.4">
        <text x="100" y="100">
          [SECURE] 256-bit AES
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 50,20; 0,0"
            dur="40s"
            repeatCount="indefinite"
          />
        </text>
        <text x="1500" y="150">
          [ENCRYPTED] RSA-4096
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -60,30; 0,0"
            dur="35s"
            repeatCount="indefinite"
          />
        </text>
        <text x="300" y="950">
          [VERIFIED] SHA-512
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 80,-25; 0,0"
            dur="45s"
            repeatCount="indefinite"
          />
        </text>
        <text x="1200" y="980">
          [PROTECTED] Zero-Knowledge
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -40,15; 0,0"
            dur="38s"
            repeatCount="indefinite"
          />
        </text>
      </g>

      {/* Security perimeter pulses */}
      <g fill="none" strokeWidth="1" opacity="0.15">
        <circle cx="480" cy="350" r="60" stroke="#10B981">
          <animate attributeName="r" values="60;90;60" dur="12s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0;0.15" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle cx="1440" cy="350" r="70" stroke="#3B82F6">
          <animate attributeName="r" values="70;100;70" dur="14s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0;0.12" dur="14s" repeatCount="indefinite" />
        </circle>
        <circle cx="480" cy="730" r="65" stroke="#8B5CF6">
          <animate attributeName="r" values="65;95;65" dur="13s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0;0.15" dur="13s" repeatCount="indefinite" />
        </circle>
        <circle cx="1440" cy="730" r="75" stroke="#06B6D4">
          <animate attributeName="r" values="75;105;75" dur="15s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.13;0;0.13" dur="15s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

interface PrivacySectionProps {
  scrollY: number;
}

export default function PrivacySection({ scrollY }: PrivacySectionProps) {
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
    <div className="relative w-full h-full px-6 bg-black overflow-hidden flex items-center justify-center" data-section="privacy">
      {/* Multi-layer Privacy Background with Parallax */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ 
          transform: `translateY(${scrollY * 0.2}px) scale(${1 + scrollY * 0.00008})`,
          transformOrigin: 'center center'
        }}
      >
        <PrivacySpaceSVG />
        {/* Deep space gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-gray-900/20 to-black/40"></div>
      </div>

      {/* Floating privacy particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `translateY(${scrollY * (0.1 + Math.random() * 0.3)}px)`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          >
            {i % 4 === 0 ? (
              <Lock className="w-3 h-3 text-green-400 animate-pulse" />
            ) : i % 4 === 1 ? (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
            ) : i % 4 === 2 ? (
              <div className="w-3 h-3 border border-purple-400/60 rotate-45 animate-spin" style={{animationDuration: '12s'}}></div>
            ) : (
              <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse"></div>
            )}
          </div>
        ))}
      </div>
      
      <div className="relative max-w-7xl mx-auto z-10 w-full py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile optimized */}
        <ScrollReveal direction="down" duration={1000} delay={200}>
          <div className="text-center mb-6 sm:mb-8 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('dishub.privacy.title')}
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {t('dishub.privacy.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* Privacy Features Grid - Mobile first layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8 px-4">
          {privacyFeatures.map((feature, index) => (
            <ScrollReveal
              key={index}
              direction={index % 2 === 0 ? 'left' : 'right'}
              duration={800}
              delay={400 + index * 100}
            >
              <div className={`group relative p-2 sm:p-3 lg:p-4 rounded-lg lg:rounded-xl ${feature.bgColor} ${feature.borderColor} border backdrop-blur-xl hover:scale-105 transition-all duration-500 hover:shadow-xl overflow-hidden`}>
                {/* Security grid pattern background */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(rgba(16,185,129,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(16,185,129,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '15px 15px'
                  }}></div>
                </div>

                {/* Subtle security glow */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${feature.color.replace('text-', 'from-')}/20 to-black/20 opacity-0 group-hover:opacity-40 rounded-lg lg:rounded-xl blur-xl transition-opacity duration-500`}></div>
                
                <div className="relative z-10 text-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${feature.bgColor} rounded-md lg:rounded-lg flex items-center justify-center mb-2 sm:mb-3 mx-auto group-hover:scale-110 transition-transform duration-300 relative overflow-hidden`}>
                    {/* Icon glow effect */}
                    <div className={`absolute inset-0 ${feature.bgColor} opacity-0 group-hover:opacity-60 transition-opacity duration-300 animate-pulse`}></div>
                    <feature.icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${feature.color} relative z-10 drop-shadow-lg`} />
                  </div>
                  <h3 className={`text-xs sm:text-sm font-bold mb-1 sm:mb-2 ${feature.color} group-hover:text-white transition-colors duration-300`}>
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed hidden sm:block">
                    {feature.description}
                  </p>
                </div>

                {/* Animated security border */}
                <div className="absolute inset-0 rounded-lg lg:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 rounded-lg lg:rounded-xl border ${feature.borderColor} animate-pulse`}></div>
                  <div className={`absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-t-2 border-l-2 ${feature.color.replace('text-', 'border-')} rounded-tl-lg lg:rounded-tl-xl`}></div>
                  <div className={`absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-t-2 border-r-2 ${feature.color.replace('text-', 'border-')} rounded-tr-lg lg:rounded-tr-xl`}></div>
                  <div className={`absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-b-2 border-l-2 ${feature.color.replace('text-', 'border-')} rounded-bl-lg lg:rounded-bl-xl`}></div>
                  <div className={`absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-b-2 border-r-2 ${feature.color.replace('text-', 'border-')} rounded-br-lg lg:rounded-br-xl`}></div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Privacy Guarantee Statement - Mobile optimized */}
        <ScrollReveal direction="up" duration={1000} delay={600}>
          <div className="text-center bg-gradient-to-r from-green-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-green-500/20 mx-4">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white drop-shadow-lg" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
              {t('dishub.privacy.guarantee.title')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 max-w-lg sm:max-w-xl lg:max-w-2xl mx-auto leading-relaxed mb-3 sm:mb-4">
              {t('dishub.privacy.guarantee.description')}
            </p>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 lg:gap-4 text-xs">
              <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs">{t('dishub.privacy.guarantee.zeroLogs')}</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs">{t('dishub.privacy.guarantee.endToEnd')}</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-xs">{t('dishub.privacy.guarantee.gdprCompliant')}</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-xs">{t('dishub.privacy.guarantee.openSource')}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
} 