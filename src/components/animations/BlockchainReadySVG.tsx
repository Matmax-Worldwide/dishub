import React from 'react';

interface BlockchainReadySVGProps {
  className?: string;
}

export default function BlockchainReadySVG({ className }: BlockchainReadySVGProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFF00" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Cuerpo principal de la llave */}
      <rect 
        x="8" 
        y="28" 
        width="32" 
        height="8" 
        rx="4" 
        fill="url(#keyGradient)" 
        filter="url(#glow)"
      />
      
      {/* Cabeza circular de la llave */}
      <circle 
        cx="12" 
        cy="32" 
        r="8" 
        fill="none" 
        stroke="url(#keyGradient)" 
        strokeWidth="3"
        filter="url(#glow)"
      />
      
      {/* Agujero interior de la llave */}
      <circle 
        cx="12" 
        cy="32" 
        r="3" 
        fill="none" 
        stroke="url(#keyGradient)" 
        strokeWidth="1.5"
      />
      
      {/* Dientes de la llave */}
      <g fill="url(#keyGradient)">
        <rect x="36" y="24" width="4" height="6" rx="1" />
        <rect x="32" y="26" width="4" height="4" rx="1" />
        <rect x="28" y="25" width="4" height="5" rx="1" />
        <rect x="36" y="34" width="4" height="8" rx="1" />
        <rect x="32" y="36" width="4" height="6" rx="1" />
      </g>
      
      {/* Elementos blockchain - bloques conectados */}
      <g stroke="url(#chainGradient)" strokeWidth="2" fill="none">
        {/* Bloque 1 */}
        <rect x="44" y="12" width="8" height="6" rx="2" />
        <circle cx="48" cy="15" r="1" fill="url(#chainGradient)" />
        
        {/* Bloque 2 */}
        <rect x="54" y="12" width="8" height="6" rx="2" />
        <circle cx="58" cy="15" r="1" fill="url(#chainGradient)" />
        
        {/* Bloque 3 */}
        <rect x="44" y="46" width="8" height="6" rx="2" />
        <circle cx="48" cy="49" r="1" fill="url(#chainGradient)" />
        
        {/* Bloque 4 */}
        <rect x="54" y="46" width="8" height="6" rx="2" />
        <circle cx="58" cy="49" r="1" fill="url(#chainGradient)" />
        
        {/* Conexiones de cadena */}
        <line x1="52" y1="15" x2="54" y2="15" strokeWidth="3" />
        <line x1="52" y1="49" x2="54" y2="49" strokeWidth="3" />
        <line x1="48" y1="18" x2="48" y2="22" strokeWidth="2" />
        <line x1="58" y1="18" x2="58" y2="22" strokeWidth="2" />
        <line x1="48" y1="42" x2="48" y2="46" strokeWidth="2" />
        <line x1="58" y1="42" x2="58" y2="46" strokeWidth="2" />
      </g>
      
      {/* Partículas digitales flotantes */}
      <g fill="url(#chainGradient)" opacity="0.8">
        <circle cx="24" cy="16" r="1">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="18" cy="48" r="1">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="38" cy="12" r="1">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="26" cy="52" r="1">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* Código binario sutil */}
      <g fill="url(#chainGradient)" fontSize="4" fontFamily="monospace" opacity="0.4">
        <text x="2" y="8">101</text>
        <text x="2" y="58">010</text>
        <text x="56" y="8">110</text>
        <text x="56" y="58">011</text>
      </g>
      
      {/* Efecto de brillo en la llave */}
      <ellipse 
        cx="32" 
        cy="32" 
        rx="20" 
        ry="8" 
        fill="url(#keyGradient)" 
        opacity="0.2"
      >
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
} 