'use client';

import React from 'react';
import { Lock, Database, Rocket, Cpu, Network } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import TechArchitectureSVG from '@/components/animations/TechArchitectureSVG';

// Advanced Technology Background SVG
function TechnologySpaceSVG() {
  return (
    <svg
      viewBox="0 0 1920 1080"
      className="absolute inset-0 w-full h-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Technology-themed gradients */}
        <radialGradient id="techCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#8B5CF6" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
        </radialGradient>
        
        <linearGradient id="dataFlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
          <stop offset="25%" stopColor="#8B5CF6" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.5" />
          <stop offset="75%" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
        </linearGradient>

        {/* Circuit pattern */}
        <pattern id="circuitGrid" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#3B82F6" strokeWidth="0.5" opacity="0.2"/>
          <path d="M 50 0 L 50 100" fill="none" stroke="#8B5CF6" strokeWidth="0.3" opacity="0.15"/>
          <path d="M 0 50 L 100 50" fill="none" stroke="#8B5CF6" strokeWidth="0.3" opacity="0.15"/>
          <circle cx="0" cy="0" r="2" fill="#3B82F6" opacity="0.3" />
          <circle cx="100" cy="0" r="2" fill="#3B82F6" opacity="0.3" />
          <circle cx="50" cy="50" r="1.5" fill="#8B5CF6" opacity="0.4" />
          <rect x="48" y="48" width="4" height="4" fill="none" stroke="#06B6D4" strokeWidth="0.5" opacity="0.3" />
        </pattern>

        {/* Tech node glow */}
        <filter id="techGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Multi-layer circuit background */}
      <rect width="1920" height="1080" fill="url(#circuitGrid)" opacity="0.6" />
      
      {/* Central tech core */}
      <ellipse cx="960" cy="540" rx="700" ry="500" fill="url(#techCore)" />
      
      {/* Data processing rings */}
      <g fill="none" strokeWidth="2" opacity="0.4">
        <circle cx="960" cy="540" r="250" stroke="#3B82F6" strokeDasharray="30,15">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 960 540;360 960 540"
            dur="40s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="960" cy="540" r="350" stroke="#8B5CF6" strokeDasharray="20,10">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="360 960 540;0 960 540"
            dur="30s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="960" cy="540" r="450" stroke="#06B6D4" strokeDasharray="40,20">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 960 540;360 960 540"
            dur="60s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Tech stack layers */}
      <g stroke="url(#dataFlow)" strokeWidth="2" fill="none" opacity="0.5">
        {/* Horizontal data streams */}
        <path d="M 100,300 Q 480,250 860,300 Q 1240,350 1620,300 Q 1800,250 1820,300" strokeDasharray="15,8">
          <animate attributeName="stroke-dashoffset" values="0;-46;0" dur="15s" repeatCount="indefinite" />
        </path>
        <path d="M 100,780 Q 480,830 860,780 Q 1240,730 1620,780 Q 1800,830 1820,780" strokeDasharray="15,8">
          <animate attributeName="stroke-dashoffset" values="0;46;0" dur="18s" repeatCount="indefinite" />
        </path>
        
        {/* Vertical processing channels */}
        <path d="M 300,0 Q 350,270 300,540 Q 250,810 300,1080" strokeDasharray="12,6">
          <animate attributeName="stroke-dashoffset" values="0;-36;0" dur="20s" repeatCount="indefinite" />
        </path>
        <path d="M 1620,0 Q 1570,270 1620,540 Q 1670,810 1620,1080" strokeDasharray="12,6">
          <animate attributeName="stroke-dashoffset" values="0;36;0" dur="22s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Processing nodes */}
      <g>
        {/* AI Processing Node */}
        <circle cx="400" cy="400" r="30" fill="#3B82F6" opacity="0.6" filter="url(#techGlow)">
          <animate attributeName="r" values="30;35;30" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="400" cy="400" r="20" fill="#ffffff" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="3s" repeatCount="indefinite" />
        </circle>
        
        {/* Blockchain Node */}
        <circle cx="1520" cy="400" r="30" fill="#8B5CF6" opacity="0.6" filter="url(#techGlow)">
          <animate attributeName="r" values="30;35;30" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="1520" cy="400" r="20" fill="#ffffff" opacity="0.9">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Database Node */}
        <circle cx="400" cy="680" r="30" fill="#06B6D4" opacity="0.6" filter="url(#techGlow)">
          <animate attributeName="r" values="30;35;30" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="400" cy="680" r="20" fill="#ffffff" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" repeatCount="indefinite" />
        </circle>
        
        {/* Edge Computing Node */}
        <circle cx="1520" cy="680" r="30" fill="#10B981" opacity="0.6" filter="url(#techGlow)">
          <animate attributeName="r" values="30;35;30" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="1520" cy="680" r="20" fill="#ffffff" opacity="0.9">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.8s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Data packets flowing */}
      <g fill="#60A5FA" opacity="0.8">
        <circle cx="200" cy="200" r="3">
          <animateMotion dur="25s" repeatCount="indefinite">
            <path d="M 0,0 Q 600,200 1200,100 Q 1800,0 1200,400 Q 600,800 0,600 Q 0,300 0,0" />
          </animateMotion>
        </circle>
        <circle cx="300" cy="150" r="2">
          <animateMotion dur="30s" repeatCount="indefinite">
            <path d="M 0,0 Q 800,300 1600,150 Q 1900,0 800,450 Q 0,750 0,0" />
          </animateMotion>
        </circle>
        <circle cx="100" cy="100" r="2.5">
          <animateMotion dur="20s" repeatCount="indefinite">
            <path d="M 0,0 Q 400,100 800,50 Q 1200,0 1600,100 Q 1200,200 800,150 Q 400,100 0,0" />
          </animateMotion>
        </circle>
      </g>

      {/* Processing status indicators */}
      <g fill="#10B981" fontSize="10" fontFamily="monospace" opacity="0.4">
        <text x="50" y="100">
          [AI] Neural Processing Active
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 60,25; 0,0"
            dur="35s"
            repeatCount="indefinite"
          />
        </text>
        <text x="1400" y="150">
          [BLOCKCHAIN] Mining Block #847291
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -70,20; 0,0"
            dur="40s"
            repeatCount="indefinite"
          />
        </text>
        <text x="200" y="950">
          [DATABASE] Sharding 99.7% Complete
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 90,-30; 0,0"
            dur="32s"
            repeatCount="indefinite"
          />
        </text>
        <text x="1100" y="980">
          [EDGE] 2847 Nodes Online
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; -50,10; 0,0"
            dur="28s"
            repeatCount="indefinite"
          />
        </text>
      </g>
    </svg>
  );
}

interface TechnologySectionProps {
  scrollY: number;
}

export default function TechnologySection({ scrollY }: TechnologySectionProps) {
  const { t } = useI18n();

  // Full tech features for desktop
  const techFeatures = [
    {
      icon: Lock,
      title: t('dishub.technology.endToEnd'),
      description: "256-bit AES encryption with perfect forward secrecy",
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/30',
    },
    {
      icon: Database,
      title: t('dishub.technology.decentralized'),
      description: "IPFS and blockchain-based distributed storage",
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10', 
      borderColor: 'border-cyan-400/30',
    },
    {
      icon: Rocket,
      title: t('dishub.technology.aiInsights'),
      description: "Machine learning models trained on federated data",
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/10',
      borderColor: 'border-pink-400/30',
    }
  ];

  // Reduced tech features for mobile (only 2)
  const techFeaturesMobile = techFeatures.slice(0, 2);

  // const architectureFeatures = [
  //   {
  //     icon: Globe,
  //     title: t('dishub.federated.multiRegion.title'),
  //     description: t('dishub.federated.multiRegion.desc'),
  //     color: 'text-blue-400',
  //   },
  //   {
  //     icon: Shield,
  //     title: t('dishub.federated.sovereignZones.title'),
  //     description: t('dishub.federated.sovereignZones.desc'),
  //     color: 'text-green-400',
  //   },
  //   {
  //     icon: Zap,
  //     title: t('dishub.federated.edgeComputing.title'),
  //     description: t('dishub.federated.edgeComputing.desc'),
  //     color: 'text-yellow-400',
  //   },
  // ];

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center" data-section="technology">
      {/* Technology Background with Parallax */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ 
          transform: `translateY(${scrollY * 0.25}px) scale(${1 + scrollY * 0.00006})`,
          transformOrigin: 'center center'
        }}
      >
        <TechnologySpaceSVG />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50"></div>
      </div>

      {/* Tech floating particles - Reduced for mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-15 sm:opacity-20 hidden sm:block"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `translateY(${scrollY * (0.05 + Math.random() * 0.1)}px)`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          >
            {i % 4 === 0 ? (
              <Cpu className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-blue-400 animate-pulse" />
            ) : i % 4 === 1 ? (
              <Network className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 text-purple-400 animate-spin" style={{animationDuration: '8s'}} />
            ) : i % 4 === 2 ? (
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-3 lg:h-3 bg-cyan-400 rounded-full animate-ping"></div>
            ) : (
              <div className="w-0.5 h-3 sm:w-1 sm:h-4 lg:w-2 lg:h-6 bg-gradient-to-b from-green-400 to-transparent animate-pulse"></div>
            )}
          </div>
        ))}
      </div>
      
      <div className="relative max-w-7xl mx-auto z-10 w-full py-3 sm:py-4 lg:py-6 xl:py-8 px-3 sm:px-4 lg:px-6">
        {/* Mobile Layout - Simplified single column */}
        <div className="block lg:hidden">
          <div className="text-center space-y-3 sm:space-y-4">
            <ScrollReveal direction="up" duration={800} delay={200}>
              <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 px-1">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {t('dishub.technology.title')}
                </span>
                <br />
                <span className="text-white text-base sm:text-lg">
                  {t('dishub.technology.subtitle')}
                </span>
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" duration={800} delay={400}>
              <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 leading-relaxed px-2">
                {t('dishub.technology.description')}
              </p>
            </ScrollReveal>

            {/* Mobile Tech Features - Only 2 features */}
            <div className="space-y-2">
              {techFeaturesMobile.map((feature, index) => (
                <ScrollReveal
                  key={index}
                  direction="up"
                  duration={600}
                  delay={600 + index * 200}
                >
                  <div className={`group flex items-center space-x-2 p-2 rounded-md backdrop-blur-xl ${feature.bgColor} border ${feature.borderColor} hover:bg-white/10 transition-all duration-300`}>
                    <div className={`w-6 h-6 ${feature.bgColor} rounded-md flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-3 h-3 ${feature.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold ${feature.color} leading-tight`}>
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>


          </div>
        </div>

        {/* Desktop Layout - Full content */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
          
          {/* Left Column - Main Content - Desktop */}
          <div className="text-left space-y-6 xl:space-y-8">
            <ScrollReveal direction="up" duration={800} delay={200}>
              <h2 className="text-3xl xl:text-4xl font-bold mb-4 xl:mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {t('dishub.technology.title')}
                </span>
                <br />
                <span className="text-white text-2xl xl:text-3xl">
                  {t('dishub.technology.subtitle')}
                </span>
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" duration={800} delay={400}>
              <p className="text-base xl:text-lg text-gray-300 mb-6 xl:mb-8 leading-relaxed">
                {t('dishub.technology.description')}
              </p>
            </ScrollReveal>

            {/* Desktop Tech Features - All 3 features */}
            <div className="space-y-3 xl:space-y-4">
              {techFeatures.map((feature, index) => (
                <ScrollReveal
                  key={index}
                  direction="left"
                  duration={600}
                  delay={600 + index * 200}
                >
                  <div className={`group flex items-start space-x-4 p-4 xl:p-5 rounded-xl backdrop-blur-xl ${feature.bgColor} border ${feature.borderColor} hover:bg-white/10 transition-all duration-300 hover:scale-105`}>
                    <div className={`w-8 h-8 xl:w-10 xl:h-10 ${feature.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`w-4 h-4 xl:w-5 xl:h-5 ${feature.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base xl:text-lg font-semibold ${feature.color} mb-2 leading-tight`}>
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Right Column - Architecture Diagram - Desktop */}
          <div className="relative">
            <ScrollReveal direction="right" duration={1000} delay={800}>
              <div className="bg-gradient-to-br from-gray-900/60 to-black/40 backdrop-blur-xl rounded-xl xl:rounded-2xl p-4 xl:p-6 border border-gray-700/30">
                <div className="mb-4 xl:mb-6">
                  <h3 className="text-lg xl:text-xl font-bold text-white mb-3">
                    <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                      {t('dishub.federated.title')}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {t('dishub.federated.description')}
                  </p>
                </div>

                {/* Architecture SVG - Desktop */}
                <div className="mb-4 xl:mb-6 h-48 xl:h-64">
                  <TechArchitectureSVG />
                </div>

              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
} 