import React from 'react';

interface GlobalScaleIconSVGProps {
  className?: string;
}

export default function GlobalScaleIconSVG({ className }: GlobalScaleIconSVGProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <radialGradient id="globalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
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
      <circle cx="32" cy="32" r="28" fill="url(#globalGlow)" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.6;0.4" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Globo principal */}
      <circle 
        cx="32" 
        cy="32" 
        r="16" 
        fill="url(#globeGradient)" 
        filter="url(#glow)"
        stroke="#34D399" 
        strokeWidth="1"
      />

      {/* Líneas de latitud */}
      <g stroke="#34D399" strokeWidth="0.5" opacity="0.6" fill="none">
        <ellipse cx="32" cy="32" rx="16" ry="8" />
        <ellipse cx="32" cy="32" rx="16" ry="4" />
        <ellipse cx="32" cy="32" rx="12" ry="16" />
        <ellipse cx="32" cy="32" rx="8" ry="16" />
      </g>

      {/* Continentes simplificados */}
      <g fill="#047857" opacity="0.8">
        {/* América */}
        <path d="M24 28 Q26 26 28 28 Q30 30 28 32 Q26 34 24 32 Z" />
        {/* Europa/África */}
        <path d="M32 26 Q34 24 36 26 Q38 28 36 30 Q34 32 32 30 Z" />
        {/* Asia */}
        <path d="M38 30 Q40 28 42 30 Q44 32 42 34 Q40 36 38 34 Z" />
      </g>

      {/* Nodos de conexión global */}
      <g fill="url(#connectionGradient)">
        {/* Nodos principales */}
        <circle cx="20" cy="20" r="2" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="44" cy="20" r="2" opacity="0.9">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="44" r="2" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="44" cy="44" r="2" opacity="0.9">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.2s" repeatCount="indefinite" />
        </circle>
        
        {/* Nodos secundarios */}
        <circle cx="12" cy="32" r="1.5" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="52" cy="32" r="1.5" opacity="0.7">
          <animate attributeName="opacity" values="1;0.7;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="12" r="1.5" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="52" r="1.5" opacity="0.7">
          <animate attributeName="opacity" values="1;0.7;1" dur="2.3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Conexiones globales */}
      <g stroke="url(#connectionGradient)" strokeWidth="1" fill="none" opacity="0.6">
        {/* Conexiones principales */}
        <path d="M20 20 Q32 16 44 20" strokeDasharray="3,2">
          <animate attributeName="stroke-dashoffset" values="0;-10;0" dur="4s" repeatCount="indefinite" />
        </path>
        <path d="M20 44 Q32 48 44 44" strokeDasharray="3,2">
          <animate attributeName="stroke-dashoffset" values="0;10;0" dur="3.5s" repeatCount="indefinite" />
        </path>
        <path d="M12 32 Q32 28 52 32" strokeDasharray="3,2">
          <animate attributeName="stroke-dashoffset" values="0;-10;0" dur="5s" repeatCount="indefinite" />
        </path>
        <path d="M32 12 Q28 32 32 52" strokeDasharray="3,2">
          <animate attributeName="stroke-dashoffset" values="0;10;0" dur="4.5s" repeatCount="indefinite" />
        </path>
        
        {/* Conexiones diagonales */}
        <path d="M20 20 Q32 32 44 44" strokeDasharray="2,3" opacity="0.4">
          <animate attributeName="stroke-dashoffset" values="0;-8;0" dur="6s" repeatCount="indefinite" />
        </path>
        <path d="M44 20 Q32 32 20 44" strokeDasharray="2,3" opacity="0.4">
          <animate attributeName="stroke-dashoffset" values="0;8;0" dur="5.5s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Pulsos de datos */}
      <g fill="#34D399" opacity="0.8">
        <circle cx="26" cy="26" r="1">
          <animateMotion dur="6s" repeatCount="indefinite">
            <path d="M 0,0 Q 6,-6 12,0 Q 18,6 24,0 Q 18,-6 12,0 Q 6,6 0,0 Z" />
          </animateMotion>
        </circle>
        <circle cx="38" cy="38" r="1">
          <animateMotion dur="5s" repeatCount="indefinite">
            <path d="M 0,0 Q -6,6 -12,0 Q -18,-6 -24,0 Q -18,6 -12,0 Q -6,-6 0,0 Z" />
          </animateMotion>
        </circle>
      </g>

      {/* Ondas de expansión global */}
      <g fill="none" stroke="#10B981" strokeWidth="1" opacity="0.3">
        <circle cx="32" cy="32" r="20">
          <animate attributeName="r" values="20;24;20" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="32" r="24">
          <animate attributeName="r" values="24;28;24" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Indicadores de regiones */}
      <g fill="#34D399" fontSize="3" fontFamily="monospace" opacity="0.5">
        <text x="8" y="8">US</text>
        <text x="52" y="8">EU</text>
        <text x="8" y="58">SA</text>
        <text x="52" y="58">AS</text>
      </g>

      {/* Satélites orbitales */}
      <g fill="#10B981" opacity="0.7">
        <circle cx="32" cy="32" r="1">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 32 32;360 32 32"
            dur="8s"
            repeatCount="indefinite"
          />
          <animate attributeName="cx" values="50;50" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="32" r="1">
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="180 32 32;540 32 32"
            dur="6s"
            repeatCount="indefinite"
          />
          <animate attributeName="cx" values="14;14" dur="6s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
} 