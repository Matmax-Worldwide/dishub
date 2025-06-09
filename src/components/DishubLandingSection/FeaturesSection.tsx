'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import PrivacyFirstSVG from '@/components/animations/PrivacyFirstSVG';
import AIPoweredSVG from '@/components/animations/AIPoweredSVG';
import BlockchainReadySVG from '@/components/animations/BlockchainReadySVG';
import GlobalScaleIconSVG from '@/components/animations/GlobalScaleIconSVG';

// SVG de transición que conecta con el HeroSection
function CyberTransitionSVG({ scrollProgress }: { scrollProgress: number }) {
  return (
    <svg
      viewBox="0 0 1920 1080"
      className="absolute inset-0 w-full h-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="transitionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity={0.6 * scrollProgress} />
          <stop offset="50%" stopColor="#8000FF" stopOpacity={0.4 * scrollProgress} />
          <stop offset="100%" stopColor="#FF00FF" stopOpacity={0.3 * scrollProgress} />
        </linearGradient>
        
        <radialGradient id="featureGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity={0.3 * scrollProgress} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        <pattern id="techGrid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#00FFFF" strokeWidth="0.5" opacity={0.2 * scrollProgress}/>
          <circle cx="0" cy="0" r="1" fill="#00FFFF" opacity={0.4 * scrollProgress} />
          <circle cx="80" cy="0" r="1" fill="#00FFFF" opacity={0.4 * scrollProgress} />
          <circle cx="0" cy="80" r="1" fill="#00FFFF" opacity={0.4 * scrollProgress} />
          <circle cx="80" cy="80" r="1" fill="#00FFFF" opacity={0.4 * scrollProgress} />
        </pattern>
      </defs>

      {/* Grid de fondo que se intensifica con el scroll */}
      <rect width="1920" height="1080" fill="url(#techGrid)" />
      
      {/* Conexiones que emergen desde arriba */}
      <g stroke="url(#transitionGradient)" strokeWidth="2" fill="none" opacity={scrollProgress}>
        {/* Líneas que bajan desde el hero */}
        <path 
          d={`M 960,${-200 + (scrollProgress * 400)} Q 800,${100 + (scrollProgress * 200)} 600,${400 + (scrollProgress * 100)} Q 400,${600 + (scrollProgress * 50)} 200,${800 + (scrollProgress * 100)}`}
          strokeDasharray="8,4"
        >
          <animate attributeName="stroke-dashoffset" values="0;-24;0" dur="6s" repeatCount="indefinite" />
        </path>
        <path 
          d={`M 960,${-200 + (scrollProgress * 400)} Q 1120,${100 + (scrollProgress * 200)} 1320,${400 + (scrollProgress * 100)} Q 1520,${600 + (scrollProgress * 50)} 1720,${800 + (scrollProgress * 100)}`}
          strokeDasharray="8,4"
        >
          <animate attributeName="stroke-dashoffset" values="0;24;0" dur="8s" repeatCount="indefinite" />
        </path>
        
        {/* Conexiones horizontales que se forman */}
        <path 
          d={`M ${200 - (scrollProgress * 100)},${400 + (scrollProgress * 200)} Q 960,${300 + (scrollProgress * 150)} ${1720 + (scrollProgress * 100)},${400 + (scrollProgress * 200)}`}
          strokeDasharray="12,6"
          opacity={scrollProgress * 0.8}
        >
          <animate attributeName="stroke-dashoffset" values="0;-36;0" dur="10s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Nodos que aparecen progresivamente */}
      <g opacity={scrollProgress}>
        {/* Nodos principales que emergen */}
        <circle cx="480" cy={400 + (scrollProgress * 200)} r={8 + (scrollProgress * 4)} fill="url(#featureGlow)" />
        <circle cx="480" cy={400 + (scrollProgress * 200)} r="6" fill="#00FFFF" opacity={0.9 * scrollProgress} />
        
        <circle cx="960" cy={300 + (scrollProgress * 150)} r={10 + (scrollProgress * 5)} fill="url(#featureGlow)" />
        <circle cx="960" cy={300 + (scrollProgress * 150)} r="8" fill="#FF00FF" opacity={0.9 * scrollProgress} />
        
        <circle cx="1440" cy={400 + (scrollProgress * 200)} r={8 + (scrollProgress * 4)} fill="url(#featureGlow)" />
        <circle cx="1440" cy={400 + (scrollProgress * 200)} r="6" fill="#8000FF" opacity={0.9 * scrollProgress} />
        
        <circle cx="720" cy={600 + (scrollProgress * 100)} r={6 + (scrollProgress * 3)} fill="url(#featureGlow)" />
        <circle cx="720" cy={600 + (scrollProgress * 100)} r="4" fill="#0080FF" opacity={0.8 * scrollProgress} />
        
        <circle cx="1200" cy={600 + (scrollProgress * 100)} r={6 + (scrollProgress * 3)} fill="url(#featureGlow)" />
        <circle cx="1200" cy={600 + (scrollProgress * 100)} r="4" fill="#0080FF" opacity={0.8 * scrollProgress} />
      </g>

      {/* Partículas de datos que fluyen */}
      <g fill="#00FFFF" opacity={scrollProgress * 0.8}>
        <circle cx="300" cy="200" r="2">
          <animateMotion dur={`${12 - (scrollProgress * 4)}s`} repeatCount="indefinite">
            <path d={`M 0,0 Q 400,${200 + (scrollProgress * 100)} 800,${100 + (scrollProgress * 200)} Q 1200,${0 + (scrollProgress * 150)} 1400,${200 + (scrollProgress * 100)}`} />
          </animateMotion>
        </circle>
        <circle cx="600" cy="100" r="1.5">
          <animateMotion dur={`${15 - (scrollProgress * 5)}s`} repeatCount="indefinite">
            <path d={`M 0,0 Q 300,${300 + (scrollProgress * 150)} 600,${200 + (scrollProgress * 100)} Q 900,${100 + (scrollProgress * 200)} 1200,${300 + (scrollProgress * 150)}`} />
          </animateMotion>
        </circle>
      </g>

      {/* Ondas de energía que se expanden hacia las features */}
      <g fill="none" strokeWidth="1" opacity={scrollProgress * 0.4}>
        <circle cx="480" cy={400 + (scrollProgress * 200)} r={50 + (scrollProgress * 100)} stroke="#00FFFF">
          <animate attributeName="r" values={`${50 + (scrollProgress * 100)};${80 + (scrollProgress * 120)};${50 + (scrollProgress * 100)}`} dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values={`${scrollProgress * 0.4};0;${scrollProgress * 0.4}`} dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="1440" cy={400 + (scrollProgress * 200)} r={50 + (scrollProgress * 100)} stroke="#8000FF">
          <animate attributeName="r" values={`${50 + (scrollProgress * 100)};${80 + (scrollProgress * 120)};${50 + (scrollProgress * 100)}`} dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values={`${scrollProgress * 0.4};0;${scrollProgress * 0.4}`} dur="8s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Código binario que fluye */}
      <g fill="#00FF00" fontSize="12" fontFamily="monospace" opacity={scrollProgress * 0.3}>
        <text x={100 + (scrollProgress * 50)} y={200 + (scrollProgress * 100)}>
          01010000 01110010 01101001
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0,0; ${50 + (scrollProgress * 30)},${20 + (scrollProgress * 40)}; 0,0`}
            dur="20s"
            repeatCount="indefinite"
          />
        </text>
        <text x={1600 - (scrollProgress * 50)} y={300 + (scrollProgress * 150)}>
          01110110 01100001 01100011
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0,0; ${-30 - (scrollProgress * 20)},${15 + (scrollProgress * 30)}; 0,0`}
            dur="18s"
            repeatCount="indefinite"
          />
        </text>
      </g>
    </svg>
  );
}

interface FeaturesSectionProps {
  scrollY?: number;
}

export default function FeaturesSection({ scrollY = 0 }: FeaturesSectionProps) {
  const { t } = useI18n();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = scrollY || window.scrollY;
      const windowHeight = window.innerHeight;
      const heroHeight = windowHeight; // Altura del hero section
      
      // Calcular progreso basado en cuánto hemos scrolleado después del hero
      const progress = Math.max(0, Math.min(1, (scrollTop - heroHeight * 0.5) / (windowHeight * 0.8)));
      setScrollProgress(progress);
    };

    // Si tenemos scrollY como prop, usarlo directamente
    if (scrollY !== undefined) {
      handleScroll();
    } else {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Llamar una vez para establecer el estado inicial
    }
    
    return () => {
      if (scrollY === undefined) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [scrollY]);

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
    <div className="relative py-32 px-6 bg-gradient-to-b from-gray-900 to-black overflow-hidden" data-section="features">
      {/* Background SVG de transición */}
      <div className="absolute inset-0 z-0">
        <CyberTransitionSVG scrollProgress={scrollProgress} />
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative max-w-7xl mx-auto z-10">
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