'use client';

import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import PrivacyFirstSVG from '@/components/animations/PrivacyFirstSVG';
import AIPoweredSVG from '@/components/animations/AIPoweredSVG';
import BlockchainReadySVG from '@/components/animations/BlockchainReadySVG';
import GlobalScaleIconSVG from '@/components/animations/GlobalScaleIconSVG';

// Connecting SVG Background that continues from Hero
function CyberSpaceConnectingSVG() {
  return (
    <svg
      viewBox="0 0 1920 1080"
      className="absolute inset-0 w-full h-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradientes que conectan con el Hero */}
        <radialGradient id="connectingGlow" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#8000FF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#FF00FF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
        </radialGradient>
        
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.6" />
          <stop offset="30%" stopColor="#0080FF" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#8000FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF00FF" stopOpacity="0.5" />
        </linearGradient>
        
        <radialGradient id="nodeConnectGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#0080FF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Patrón de Grid más denso para la sección de features */}
        <pattern id="featureGrid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00FFFF" strokeWidth="0.3" opacity="0.15"/>
          <path d="M 30 0 L 30 60" fill="none" stroke="#8000FF" strokeWidth="0.2" opacity="0.1"/>
          <path d="M 0 30 L 60 30" fill="none" stroke="#8000FF" strokeWidth="0.2" opacity="0.1"/>
          <circle cx="0" cy="0" r="1" fill="#00FFFF" opacity="0.2" />
          <circle cx="60" cy="0" r="1" fill="#00FFFF" opacity="0.2" />
          <circle cx="30" cy="30" r="0.5" fill="#FF00FF" opacity="0.3" />
        </pattern>

        {/* Filtros para efectos especiales */}
        <filter id="connectGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Grid Background más denso */}
      <rect width="1920" height="1080" fill="url(#featureGrid)" opacity="0.6" />
      
      {/* Glow superior que conecta con el hero */}
      <ellipse cx="960" cy="0" rx="800" ry="300" fill="url(#connectingGlow)" />
      
      {/* Red de conexiones que fluye desde arriba */}
      <g stroke="url(#flowGradient)" strokeWidth="1.5" fill="none" opacity="0.5">
        {/* Flujos principales desde el hero */}
        <path d="M 480,0 Q 600,200 720,400 Q 840,600 960,800" strokeDasharray="8,4">
          <animate attributeName="stroke-dashoffset" values="0;-24;0" dur="12s" repeatCount="indefinite" />
        </path>
        <path d="M 1440,0 Q 1320,200 1200,400 Q 1080,600 960,800" strokeDasharray="8,4">
          <animate attributeName="stroke-dashoffset" values="0;24;0" dur="10s" repeatCount="indefinite" />
        </path>
        <path d="M 960,0 Q 1080,150 1200,300 Q 1320,450 1440,600" strokeDasharray="6,3">
          <animate attributeName="stroke-dashoffset" values="0;-18;0" dur="14s" repeatCount="indefinite" />
        </path>
        <path d="M 960,0 Q 840,150 720,300 Q 600,450 480,600" strokeDasharray="6,3">
          <animate attributeName="stroke-dashoffset" values="0;18;0" dur="16s" repeatCount="indefinite" />
        </path>
        
        {/* Conexiones horizontales entre features */}
        <path d="M 200,400 Q 480,350 760,400 Q 1040,450 1320,400 Q 1600,350 1720,400" strokeDasharray="10,5">
          <animate attributeName="stroke-dashoffset" values="0;-30;0" dur="18s" repeatCount="indefinite" />
        </path>
        <path d="M 200,600 Q 480,650 760,600 Q 1040,550 1320,600 Q 1600,650 1720,600" strokeDasharray="10,5">
          <animate attributeName="stroke-dashoffset" values="0;30;0" dur="15s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Nodos de features - posicionados donde estarán las cards */}
      <g>
        {/* Feature nodes - 4 principales */}
        <circle cx="384" cy="400" r="20" fill="url(#nodeConnectGlow)" filter="url(#connectGlow)">
          <animate attributeName="r" values="20;25;20" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="384" cy="400" r="12" fill="#8B5CF6" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="3s" repeatCount="indefinite" />
        </circle>
        
        <circle cx="768" cy="400" r="20" fill="url(#nodeConnectGlow)" filter="url(#connectGlow)">
          <animate attributeName="r" values="20;25;20" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="768" cy="400" r="12" fill="#06B6D4" opacity="0.9">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3.5s" repeatCount="indefinite" />
        </circle>
        
        <circle cx="1152" cy="400" r="20" fill="url(#nodeConnectGlow)" filter="url(#connectGlow)">
          <animate attributeName="r" values="20;25;20" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="1152" cy="400" r="12" fill="#FFD700" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" repeatCount="indefinite" />
        </circle>
        
        <circle cx="1536" cy="400" r="20" fill="url(#nodeConnectGlow)" filter="url(#connectGlow)">
          <animate attributeName="r" values="20;25;20" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="1536" cy="400" r="12" fill="#10B981" opacity="0.9">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.8s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Partículas de datos que fluyen desde el hero */}
      <g fill="#00FFFF" opacity="0.7">
        <circle cx="100" cy="100" r="2">
          <animateMotion dur="20s" repeatCount="indefinite">
            <path d="M 0,0 Q 400,100 800,200 Q 1200,300 1600,400 Q 1800,500 1600,600 Q 1200,700 800,800 Q 400,900 100,1000" />
          </animateMotion>
        </circle>
        <circle cx="200" cy="50" r="1.5">
          <animateMotion dur="25s" repeatCount="indefinite">
            <path d="M 0,0 Q 600,150 1200,300 Q 1800,450 1200,600 Q 600,750 0,900" />
          </animateMotion>
        </circle>
        <circle cx="300" cy="0" r="2.5">
          <animateMotion dur="18s" repeatCount="indefinite">
            <path d="M 0,0 Q 800,200 1600,400 Q 1900,600 1000,800 Q 200,1000 0,800 Q 0,400 0,0" />
          </animateMotion>
        </circle>
      </g>

      {/* Código binario que fluye */}
      <g fill="#00FF00" fontSize="10" fontFamily="monospace" opacity="0.3">
        <text x="100" y="200" className="text-xs">
          01000110 01100101 01100001
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 100,50; 0,0"
            dur="30s"
            repeatCount="indefinite"
          />
        </text>
        <text x="1400" y="150" className="text-xs">
          01110100 01110101 01110010
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -80,30; 0,0"
            dur="25s"
            repeatCount="indefinite"
          />
        </text>
        <text x="500" y="800" className="text-xs">
          01100101 01110011 01110000
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 60,-20; 0,0"
            dur="35s"
            repeatCount="indefinite"
          />
        </text>
      </g>

      {/* Ondas de energía que se expanden desde los nodos */}
      <g fill="none" strokeWidth="1" opacity="0.2">
        <circle cx="384" cy="400" r="50" stroke="#8B5CF6">
          <animate attributeName="r" values="50;80;50" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="768" cy="400" r="60" stroke="#06B6D4">
          <animate attributeName="r" values="60;90;60" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0;0.15" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="1152" cy="400" r="55" stroke="#FFD700">
          <animate attributeName="r" values="55;85;55" dur="9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="1536" cy="400" r="65" stroke="#10B981">
          <animate attributeName="r" values="65;95;65" dur="11s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.18;0;0.18" dur="11s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

interface FeaturesSectionProps {
  scrollY: number;
}

export default function FeaturesSection({ scrollY }: FeaturesSectionProps) {
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
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center" data-section="features">
      {/* Connecting Background SVG with Parallax */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ 
          transform: `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0001})`,
          transformOrigin: 'center top'
        }}
      >
        <CyberSpaceConnectingSVG />
        {/* Gradient overlay for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-gray-900/40 to-black/60"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto z-10 w-full py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        <ScrollReveal direction="up" duration={800} delay={200}>
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 lg:mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {t('dishub.features.nativeByDesign')}
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-300 max-w-3xl mx-auto px-2 sm:px-4 leading-relaxed">
              {t('dishub.features.subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
          {features.map((feature, index) => (
            <ScrollReveal
              key={index}
              direction={index % 2 === 0 ? 'left' : 'right'}
              duration={800}
              delay={400 + index * 200}
            >
              <div className="group relative bg-gray-900/40 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 xl:p-8 border border-gray-700/30 hover:border-cyan-500/50 transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-cyan-500/10 overflow-hidden min-h-[200px] sm:min-h-[240px] lg:min-h-[280px]">
                {/* Tech grid pattern background */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '12px 12px sm:15px sm:15px'
                  }}></div>
                </div>
                
                {/* Subtle glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-30 rounded-xl lg:rounded-2xl blur-xl transition-opacity duration-500"></div>
                
                {/* SVG Icon - Better mobile sizing */}
                <div className="relative z-10 mb-3 sm:mb-4 lg:mb-6 flex justify-center group-hover:scale-110 transition-transform duration-500">
                  <feature.icon className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-500" />
                </div>
                
                {/* Content - Better mobile typography */}
                <div className="relative z-10 text-center flex-1 flex flex-col justify-center">
                  <h3 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-white mb-2 sm:mb-3 transition-all duration-300 group-hover:text-cyan-100 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {feature.description}
                  </p>
                </div>

                {/* Animated tech border effect */}
                <div className="absolute inset-0 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 rounded-xl lg:rounded-2xl border border-cyan-500/30 animate-pulse"></div>
                  <div className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl lg:rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl lg:rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl lg:rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-xl lg:rounded-br-2xl"></div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Tech floating elements animation - Mobile optimized */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
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
                <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-cyan-400 rounded-full animate-pulse"></div>
              ) : i % 3 === 1 ? (
                <div className="w-1 h-1 sm:w-2 sm:h-2 border border-cyan-400/50 rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
              ) : (
                <div className="w-0.5 h-2 sm:w-1 sm:h-4 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 