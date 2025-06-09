'use client';

import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

// Nuevo SVG Background Espacial/Ciberpunk
function CyberSpaceBackgroundSVG() {
  return (
    <svg
      viewBox="0 0 1920 1080"
      className="absolute inset-0 w-full h-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradientes */}
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF00FF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#8000FF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </radialGradient>
        
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#0080FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF00FF" stopOpacity="0.6" />
        </linearGradient>
        
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#0080FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Patrón de Grid Ciberpunk */}
        <pattern id="cyberpunkGrid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#00FFFF" strokeWidth="0.5" opacity="0.2"/>
          <circle cx="0" cy="0" r="2" fill="#00FFFF" opacity="0.3" />
          <circle cx="100" cy="0" r="2" fill="#00FFFF" opacity="0.3" />
          <circle cx="0" cy="100" r="2" fill="#00FFFF" opacity="0.3" />
          <circle cx="100" cy="100" r="2" fill="#00FFFF" opacity="0.3" />
        </pattern>

        {/* Filtros para efectos especiales */}
        <filter id="glow">
          <feMorphology operator="dilate" radius="2"/>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="neonGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Grid Background */}
      <rect width="1920" height="1080" fill="url(#cyberpunkGrid)" opacity="0.4" />
      
      {/* Central Glow */}
      <ellipse cx="960" cy="540" rx="600" ry="400" fill="url(#centerGlow)" />
      
      {/* Conexiones principales - Red neural */}
      <g stroke="url(#connectionGradient)" strokeWidth="2" fill="none" opacity="0.6">
        {/* Red principal */}
        <path d="M 200,200 Q 500,300 800,400 Q 1100,300 1400,200" strokeDasharray="10,5">
          <animate attributeName="stroke-dashoffset" values="0;-30;0" dur="8s" repeatCount="indefinite" />
        </path>
        <path d="M 300,700 Q 600,600 900,500 Q 1200,600 1500,700" strokeDasharray="10,5">
          <animate attributeName="stroke-dashoffset" values="0;30;0" dur="6s" repeatCount="indefinite" />
        </path>
        <path d="M 100,540 Q 400,400 960,540 Q 1500,400 1800,540" strokeDasharray="15,8">
          <animate attributeName="stroke-dashoffset" values="0;-45;0" dur="10s" repeatCount="indefinite" />
        </path>
        
        {/* Conexiones verticales */}
        <path d="M 400,100 Q 500,300 600,500 Q 700,700 800,900" strokeDasharray="8,4">
          <animate attributeName="stroke-dashoffset" values="0;-24;0" dur="7s" repeatCount="indefinite" />
        </path>
        <path d="M 1200,100 Q 1100,300 1000,500 Q 900,700 800,900" strokeDasharray="8,4">
          <animate attributeName="stroke-dashoffset" values="0;24;0" dur="9s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Nodos de la red - Mundos interconectados */}
      <g>
        {/* Nodo Central Principal */}
        <circle cx="960" cy="540" r="25" fill="url(#nodeGlow)" filter="url(#neonGlow)">
          <animate attributeName="r" values="25;35;25" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="960" cy="540" r="15" fill="#FF00FF" opacity="0.8">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Nodos Primarios */}
        <circle cx="400" cy="300" r="18" fill="url(#nodeGlow)" filter="url(#glow)" />
        <circle cx="400" cy="300" r="10" fill="#00FFFF" opacity="0.9" />
        
        <circle cx="1500" cy="300" r="18" fill="url(#nodeGlow)" filter="url(#glow)" />
        <circle cx="1500" cy="300" r="10" fill="#00FFFF" opacity="0.9" />
        
        <circle cx="600" cy="750" r="18" fill="url(#nodeGlow)" filter="url(#glow)" />
        <circle cx="600" cy="750" r="10" fill="#0080FF" opacity="0.9" />
        
        <circle cx="1300" cy="750" r="18" fill="url(#nodeGlow)" filter="url(#glow)" />
        <circle cx="1300" cy="750" r="10" fill="#0080FF" opacity="0.9" />
        
        {/* Nodos Secundarios - Satélites */}
        <circle cx="200" cy="200" r="12" fill="#8000FF" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="1700" cy="200" r="12" fill="#8000FF" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="850" r="12" fill="#8000FF" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="1600" cy="850" r="12" fill="#8000FF" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2.8s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Partículas de datos en movimiento */}
      <g fill="#00FFFF" opacity="0.8">
        <circle cx="100" cy="100" r="3">
          <animateMotion dur="15s" repeatCount="indefinite">
            <path d="M 0,0 Q 400,200 800,100 Q 1200,0 1600,100 Q 1800,300 1600,500 Q 1200,400 800,500 Q 400,600 100,500 Q 0,300 0,0 Z" />
          </animateMotion>
        </circle>
        <circle cx="200" cy="200" r="2">
          <animateMotion dur="12s" repeatCount="indefinite">
            <path d="M 0,0 Q 600,300 1200,200 Q 1800,100 1200,800 Q 600,700 0,800 Q 0,400 0,0 Z" />
          </animateMotion>
        </circle>
        <circle cx="300" cy="300" r="2.5">
          <animateMotion dur="18s" repeatCount="indefinite">
            <path d="M 0,0 Q 800,400 1600,300 Q 1900,600 1000,900 Q 200,800 0,600 Q 0,300 0,0 Z" />
          </animateMotion>
        </circle>
      </g>

      {/* Elementos de código flotante */}
      <g fill="#00FF00" fontSize="14" fontFamily="monospace" opacity="0.4">
        <text x="100" y="50" className="text-xs">
          01001110 01100101 01110100
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 50,20; 0,0"
            dur="20s"
            repeatCount="indefinite"
          />
        </text>
        <text x="1400" y="80" className="text-xs">
          01110111 01101111 01110010
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -30,15; 0,0"
            dur="15s"
            repeatCount="indefinite"
          />
        </text>
        <text x="200" y="1000" className="text-xs">
          01101011 01110011 01110000
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 40,-10; 0,0"
            dur="25s"
            repeatCount="indefinite"
          />
        </text>
        <text x="1500" y="1020" className="text-xs">
          01100001 01100011 01100101
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -25,-5; 0,0"
            dur="18s"
            repeatCount="indefinite"
          />
        </text>
      </g>

      {/* Anillos de energía */}
      <g fill="none" strokeWidth="2" opacity="0.3">
        <circle cx="960" cy="540" r="150" stroke="#FF00FF">
          <animate attributeName="r" values="150;200;150" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="960" cy="540" r="250" stroke="#00FFFF">
          <animate attributeName="r" values="250;350;250" dur="12s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle cx="960" cy="540" r="400" stroke="#8000FF">
          <animate attributeName="r" values="400;500;400" dur="15s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.1;0;0.1" dur="15s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Efectos de brillo ambiental */}
      <g opacity="0.2">
        <ellipse cx="400" cy="300" rx="50" ry="30" fill="#00FFFF">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="6s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="1500" cy="300" rx="50" ry="30" fill="#FF00FF">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="7s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="600" cy="750" rx="40" ry="25" fill="#8000FF">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="5s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="1300" cy="750" rx="40" ry="25" fill="#0080FF">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="8s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
}

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
        router.push(`/${params.locale}/${user.tenantSlug}/dashboard`);
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
    <section className="relative w-full h-full flex items-center justify-center px-6 overflow-hidden z-0" data-section="hero">
      {/* Multi-layer Parallax Background System */}
      
      {/* Layer 1: Deep Background - Slowest */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ 
          transform: `translateY(${scrollY * 0.2}px) scale(${1 + scrollY * 0.0001})`,
          transformOrigin: 'center center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20"></div>
      </div>

      {/* Layer 2: Main SVG Background - Medium Speed */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ 
          transform: `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.0002})`,
          transformOrigin: 'center center'
        }}
      >
        <CyberSpaceBackgroundSVG />
      </div>

      {/* Layer 3: Floating Elements - Fast Speed */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ 
          transform: `translateY(${scrollY * 0.8}px)`,
          transformOrigin: 'center center'
        }}
      >
        {/* Floating tech elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute opacity-40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `translateY(${scrollY * (0.1 + Math.random() * 0.2)}px)`,
                willChange: 'transform'
              }}
            >
              {i % 5 === 0 ? (
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              ) : i % 5 === 1 ? (
                <div className="w-3 h-3 border border-purple-400/50 rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
              ) : i % 5 === 2 ? (
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse"></div>
              ) : i % 5 === 3 ? (
                <div className="w-6 h-1 bg-gradient-to-r from-purple-400 to-transparent animate-pulse"></div>
              ) : (
                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Layer 4: Overlay for text readability */}
      <div className="absolute inset-0 bg-black/30 z-1"></div>
      
      {/* Content overlay with subtle parallax */}
      <div 
        className="relative max-w-5xl mx-auto text-center z-10"
        style={{ 
          transform: `translateY(${scrollY * -0.1}px)`,
          willChange: 'transform'
        }}
      >
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
              <Link href={`/${params.locale}/login`} className="relative z-1 pointer-events-auto">
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
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-8 h-8 animate-bounce cursor-pointer hover:text-cyan-400 transition-colors duration-300 z-10 pointer-events-auto"
        style={{ 
          transform: `translateX(-50%) translateY(${scrollY * -0.3}px)`,
          willChange: 'transform'
        }}
      />
    </section>
  );
} 