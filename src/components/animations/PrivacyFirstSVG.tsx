import React from 'react';

interface PrivacyFirstSVGProps {
  className?: string;
}

export default function PrivacyFirstSVG({ className }: PrivacyFirstSVGProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="lockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        <radialGradient id="glowEffect" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Resplandor de fondo */}
      <circle cx="32" cy="32" r="28" fill="url(#glowEffect)" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.6;0.4" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Escudo principal */}
      <path 
        d="M32 8 L48 16 L48 32 Q48 48 32 56 Q16 48 16 32 L16 16 Z" 
        fill="url(#shieldGradient)" 
        filter="url(#glow)"
        stroke="#F472B6" 
        strokeWidth="1"
      />

      {/* Patrón interior del escudo */}
      <path 
        d="M32 12 L44 18 L44 32 Q44 44 32 50 Q20 44 20 32 L20 18 Z" 
        fill="none" 
        stroke="#F8FAFC" 
        strokeWidth="1" 
        opacity="0.3"
      />

      {/* Candado central */}
      <g transform="translate(26, 24)">
        {/* Cuerpo del candado */}
        <rect 
          x="2" 
          y="6" 
          width="8" 
          height="8" 
          rx="2" 
          fill="url(#lockGradient)"
          filter="url(#glow)"
        />
        
        {/* Arco del candado */}
        <path 
          d="M4 6 Q4 2 6 2 Q8 2 8 6" 
          fill="none" 
          stroke="url(#lockGradient)" 
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Punto de cerradura */}
        <circle cx="6" cy="10" r="1" fill="#F8FAFC" />
      </g>

      {/* Elementos de datos protegidos */}
      <g opacity="0.7">
        {/* Datos encriptados - líneas */}
        <g stroke="#F472B6" strokeWidth="1" opacity="0.6">
          <line x1="12" y1="20" x2="18" y2="20">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="12" y1="24" x2="16" y2="24">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite" />
          </line>
          <line x1="46" y1="20" x2="52" y2="20">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.8s" repeatCount="indefinite" />
          </line>
          <line x1="48" y1="24" x2="52" y2="24">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.2s" repeatCount="indefinite" />
          </line>
        </g>
      </g>

      {/* Partículas de seguridad */}
      <g fill="#EC4899" opacity="0.8">
        <circle cx="20" cy="16" r="1">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="44" cy="16" r="1">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="18" cy="40" r="1">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="46" cy="40" r="1">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Checkmark de verificación */}
      <g transform="translate(28, 38)">
        <circle cx="4" cy="4" r="6" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.8" />
        <path 
          d="M2 4 L4 6 L6 2" 
          fill="none" 
          stroke="#10B981" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Ondas de protección */}
      <g fill="none" stroke="#8B5CF6" strokeWidth="1" opacity="0.3">
        <circle cx="32" cy="32" r="20">
          <animate attributeName="r" values="20;24;20" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="32" r="24">
          <animate attributeName="r" values="24;28;24" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Texto de encriptación */}
      <g fill="#F472B6" fontSize="3" fontFamily="monospace" opacity="0.4">
        <text x="8" y="52">AES</text>
        <text x="48" y="52">256</text>
        <text x="8" y="12">RSA</text>
        <text x="48" y="12">SSL</text>
      </g>
    </svg>
  );
} 