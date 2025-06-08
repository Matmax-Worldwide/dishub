'use client';

import React from 'react';

const InterstellarTechSVG = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-40">
      <svg
        viewBox="0 0 1200 600"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for space theme */}
          <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="70%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
          </radialGradient>
          
          <linearGradient id="nebulaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
            <stop offset="30%" stopColor="#ec4899" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background nebula */}
        <rect width="1200" height="600" fill="url(#nebulaGradient)" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="12s" repeatCount="indefinite" />
        </rect>

        {/* Distant stars background */}
        <g id="distantStars">
          {[...Array(80)].map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 1200}
              cy={Math.random() * 600}
              r={Math.random() * 1.5 + 0.5}
              fill="#ffffff"
              opacity={Math.random() * 0.7 + 0.3}
            >
              <animate
                attributeName="opacity"
                values={`${Math.random() * 0.3 + 0.2};${Math.random() * 0.9 + 0.6};${Math.random() * 0.3 + 0.2}`}
                dur={`${Math.random() * 6 + 3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        {/* Technological grid network */}
        <g id="techGrid" opacity="0.4">
          {/* Horizontal grid lines */}
          {[...Array(6)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 100 + 50}
              x2="1200"
              y2={i * 100 + 50}
              stroke="#06b6d4"
              strokeWidth="0.5"
              opacity="0.5"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.8;0.2"
                dur={`${4 + i * 0.8}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}
          {/* Vertical grid lines */}
          {[...Array(10)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 120 + 60}
              y1="0"
              x2={i * 120 + 60}
              y2="600"
              stroke="#a855f7"
              strokeWidth="0.5"
              opacity="0.5"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.8;0.2"
                dur={`${4 + i * 0.4}s`}
                repeatCount="indefinite"
                begin={`${i * 0.3}s`}
              />
            </line>
          ))}
        </g>

        {/* Floating tech nodes */}
        <g id="techNodes">
          {[
            { x: 150, y: 120, delay: 0 },
            { x: 400, y: 200, delay: 1 },
            { x: 650, y: 150, delay: 2 },
            { x: 900, y: 280, delay: 0.5 },
            { x: 1050, y: 180, delay: 1.5 },
            { x: 250, y: 350, delay: 2.5 },
            { x: 550, y: 400, delay: 3 },
            { x: 800, y: 450, delay: 1.8 },
          ].map((node, i) => (
            <g key={i} transform={`translate(${node.x}, ${node.y})`}>
              <circle
                cx="0"
                cy="0"
                r="6"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                filter="url(#glow)"
              >
                <animate
                  attributeName="r"
                  values="4;10;4"
                  dur="5s"
                  repeatCount="indefinite"
                  begin={`${node.delay}s`}
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0.4;1;0.4"
                  dur="5s"
                  repeatCount="indefinite"
                  begin={`${node.delay}s`}
                />
              </circle>
              <circle
                cx="0"
                cy="0"
                r="2"
                fill="#06b6d4"
                opacity="0.9"
              >
                <animate
                  attributeName="opacity"
                  values="0.6;1;0.6"
                  dur="5s"
                  repeatCount="indefinite"
                  begin={`${node.delay}s`}
                />
              </circle>
            </g>
          ))}
        </g>

        {/* Constellation connections */}
        <g id="constellations" stroke="#a855f7" strokeWidth="1" fill="none" opacity="0.5">
          <path d="M 150 120 L 400 200 L 650 150 L 900 280 L 800 450 L 550 400 L 250 350 L 150 120">
            <animate
              attributeName="stroke-dasharray"
              values="0 2000;1000 1000;2000 0"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
          <path d="M 400 200 L 800 450 M 650 150 L 250 350 M 1050 180 L 550 400">
            <animate
              attributeName="stroke-dasharray"
              values="0 800;400 400;800 0"
              dur="8s"
              repeatCount="indefinite"
              begin="2s"
            />
          </path>
        </g>

        {/* Floating data particles */}
        <g id="dataParticles">
          {[...Array(20)].map((_, i) => (
            <rect
              key={i}
              x={Math.random() * 1200}
              y={Math.random() * 600}
              width="2"
              height="2"
              fill="#ec4899"
              opacity="0.7"
              transform={`rotate(${Math.random() * 360})`}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,0; ${Math.random() * 300 - 150},${Math.random() * 300 - 150}; 0,0`}
                dur={`${Math.random() * 15 + 8}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.4;0.9;0.4"
                dur={`${Math.random() * 4 + 2}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </g>

        {/* Energy waves */}
        <g id="energyWaves">
          <circle
            cx="600"
            cy="300"
            r="50"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            opacity="0"
          >
            <animate
              attributeName="r"
              values="50;150;250"
              dur="8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0.4;0"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="600"
            cy="300"
            r="50"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1"
            opacity="0"
          >
            <animate
              attributeName="r"
              values="50;150;250"
              dur="8s"
              repeatCount="indefinite"
              begin="3s"
            />
            <animate
              attributeName="opacity"
              values="0.6;0.3;0"
              dur="8s"
              repeatCount="indefinite"
              begin="3s"
            />
          </circle>
        </g>

        {/* Binary code streams */}
        <g id="binaryStreams" opacity="0.3">
          {[...Array(6)].map((_, i) => (
            <text
              key={i}
              x={i * 200 + 100}
              y="0"
              fill="#06b6d4"
              fontSize="10"
              fontFamily="monospace"
            >
              {Array.from({ length: 8 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,0; 0,620; 0,0`}
                dur={`${Math.random() * 12 + 6}s`}
                repeatCount="indefinite"
                begin={`${i * 1}s`}
              />
              <animate
                attributeName="opacity"
                values="0;0.6;0"
                dur={`${Math.random() * 12 + 6}s`}
                repeatCount="indefinite"
                begin={`${i * 1}s`}
              />
            </text>
          ))}
        </g>

        {/* Satellite orbits */}
        <g id="satelliteOrbits">
          <circle
            cx="600"
            cy="300"
            r="100"
            fill="none"
            stroke="#a855f7"
            strokeWidth="0.8"
            opacity="0.4"
            strokeDasharray="4,4"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 600 300;360 600 300"
              dur="25s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="700"
            cy="300"
            r="4"
            fill="#ec4899"
            filter="url(#glow)"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 600 300;360 600 300"
              dur="25s"
              repeatCount="indefinite"
            />
          </circle>

          <circle
            cx="600"
            cy="300"
            r="140"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="0.8"
            opacity="0.4"
            strokeDasharray="6,6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="360 600 300;0 600 300"
              dur="35s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="740"
            cy="300"
            r="3"
            fill="#fbbf24"
            filter="url(#glow)"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="360 600 300;0 600 300"
              dur="35s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Central tech core */}
        <g id="techCore" transform="translate(600, 300)">
          <circle
            cx="0"
            cy="0"
            r="15"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            filter="url(#glow)"
          >
            <animate
              attributeName="r"
              values="12;20;12"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="0"
            cy="0"
            r="8"
            fill="#a855f7"
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values="0.7;1;0.7"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Core inner rings */}
          {[...Array(2)].map((_, i) => (
            <circle
              key={i}
              cx="0"
              cy="0"
              r={4 + i * 2}
              fill="none"
              stroke="#ec4899"
              strokeWidth="0.8"
              opacity="0.7"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={`0;${360 * (i % 2 === 0 ? 1 : -1)}`}
                dur={`${5 + i}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        {/* Cosmic rays */}
        <g id="cosmicRays" opacity="0.6">
          {[...Array(5)].map((_, i) => (
            <line
              key={i}
              x1={Math.random() * 1200}
              y1="0"
              x2={Math.random() * 1200}
              y2="600"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0.8;0"
                dur="0.3s"
                repeatCount="indefinite"
                begin={`${Math.random() * 10}s`}
              />
            </line>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default InterstellarTechSVG; 