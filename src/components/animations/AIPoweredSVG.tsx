import React from 'react';

interface AIPoweredSVGProps {
  className?: string;
}

export default function AIPoweredSVG({ className }: AIPoweredSVGProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFFF" />
          <stop offset="100%" stopColor="#0080FF" />
        </linearGradient>

      </defs>



      {/* Cerebro principal */}
      <g transform="translate(16, 12)">
        {/* Hemisferio izquierdo */}
        <path 
          d="M8 8 Q2 8 2 16 Q2 24 8 28 Q12 30 16 28 L16 12 Q12 8 8 8 Z" 
          fill="url(#brainGradient)" 
          stroke="#00FFFF" 
          strokeWidth="0.5"
        />
        
        {/* Hemisferio derecho */}
        <path 
          d="M24 8 Q30 8 30 16 Q30 24 24 28 Q20 30 16 28 L16 12 Q20 8 24 8 Z" 
          fill="url(#brainGradient)" 
          stroke="#00FFFF" 
          strokeWidth="0.5"
        />
        
        {/* Líneas del cerebro */}
        <g stroke="#00FFFF" strokeWidth="0.5" opacity="0.6">
          <path d="M6 12 Q8 14 10 12" />
          <path d="M6 16 Q8 18 10 16" />
          <path d="M6 20 Q8 22 10 20" />
          <path d="M22 12 Q24 14 26 12" />
          <path d="M22 16 Q24 18 26 16" />
          <path d="M22 20 Q24 22 26 20" />
        </g>
      </g>

      {/* Red neuronal */}
      <g stroke="url(#neuralGradient)" strokeWidth="1" fill="none" opacity="0.7">
        {/* Conexiones principales */}
        <line x1="32" y1="20" x2="20" y2="8">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="32" y1="20" x2="44" y2="8">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" />
        </line>
        <line x1="32" y1="44" x2="20" y2="56">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.8s" repeatCount="indefinite" />
        </line>
        <line x1="32" y1="44" x2="44" y2="56">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.2s" repeatCount="indefinite" />
        </line>
        
        {/* Conexiones laterales */}
        <line x1="12" y1="32" x2="20" y2="20">
          <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="52" y1="32" x2="44" y2="20">
          <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2.5s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Nodos neuronales */}
      <g fill="url(#neuralGradient)">
        {/* Nodos principales */}
        <circle cx="32" cy="20" r="3">
          <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="32" cy="44" r="3">
          <animate attributeName="r" values="3;4;3" dur="2.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Nodos secundarios */}
        <circle cx="20" cy="8" r="2" opacity="0.8">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="44" cy="8" r="2" opacity="0.8">
          <animate attributeName="opacity" values="1;0.8;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="56" r="2" opacity="0.8">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="44" cy="56" r="2" opacity="0.8">
          <animate attributeName="opacity" values="1;0.8;1" dur="2.2s" repeatCount="indefinite" />
        </circle>
        
        {/* Nodos laterales */}
        <circle cx="12" cy="32" r="2" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="52" cy="32" r="2" opacity="0.6">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Pulsos de datos */}
      <g fill="#00FFFF" opacity="0.8">
        <circle cx="26" cy="14" r="1">
          <animateMotion dur="4s" repeatCount="indefinite">
            <path d="M 0,0 L 6,6 L 12,0 L 6,-6 Z" />
          </animateMotion>
        </circle>
        <circle cx="38" cy="14" r="1">
          <animateMotion dur="3s" repeatCount="indefinite">
            <path d="M 0,0 L -6,6 L -12,0 L -6,-6 Z" />
          </animateMotion>
        </circle>
      </g>



      {/* Indicadores de AI */}
      <g fill="#00FFFF" fontSize="3" fontFamily="monospace" opacity="0.5">
        <text x="4" y="8">AI</text>
        <text x="54" y="8">ML</text>
        <text x="4" y="58">NN</text>
        <text x="52" y="58">DL</text>
      </g>

      {/* Circuitos integrados */}
      <g stroke="#0EA5E9" strokeWidth="0.5" opacity="0.4">
        <rect x="8" y="24" width="6" height="4" rx="1" fill="none" />
        <rect x="50" y="24" width="6" height="4" rx="1" fill="none" />
        <rect x="8" y="36" width="6" height="4" rx="1" fill="none" />
        <rect x="50" y="36" width="6" height="4" rx="1" fill="none" />
        
        {/* Conexiones de circuitos */}
        <line x1="14" y1="26" x2="20" y2="26" />
        <line x1="44" y1="26" x2="50" y2="26" />
        <line x1="14" y1="38" x2="20" y2="38" />
        <line x1="44" y1="38" x2="50" y2="38" />
      </g>

      {/* Partículas de procesamiento */}
      <g fill="#3B82F6" opacity="0.6">
        <circle cx="16" cy="16" r="0.5">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="48" cy="16" r="0.5">
          <animate attributeName="opacity" values="1;0.6;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="48" r="0.5">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="48" cy="48" r="0.5">
          <animate attributeName="opacity" values="1;0.6;1" dur="1.7s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
} 