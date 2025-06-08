'use client';

import React from 'react';

const GlobalScaleSVG = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-35">
      <svg
        viewBox="0 0 1200 600"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for global theme */}
          <radialGradient id="worldGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#a855f7" stopOpacity="0.2" />
            <stop offset="80%" stopColor="#ec4899" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.05" />
          </radialGradient>
          
          <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
          </linearGradient>

          <filter id="globalGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* World background */}
        <rect width="1200" height="600" fill="url(#worldGradient)" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="10s" repeatCount="indefinite" />
        </rect>

        {/* Global network grid */}
        <g id="globalGrid" opacity="0.3">
          {/* Latitude lines */}
          {[...Array(8)].map((_, i) => (
            <ellipse
              key={`lat-${i}`}
              cx="600"
              cy="300"
              rx={200 + i * 40}
              ry={100 + i * 20}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="0.5"
              opacity="0.4"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.6;0.2"
                dur={`${6 + i * 0.5}s`}
                repeatCount="indefinite"
              />
            </ellipse>
          ))}
          {/* Longitude lines */}
          {[...Array(12)].map((_, i) => (
            <path
              key={`lng-${i}`}
              d={`M 600 300 Q ${600 + Math.cos(i * 30 * Math.PI / 180) * 300} ${300 + Math.sin(i * 30 * Math.PI / 180) * 150} 600 300`}
              fill="none"
              stroke="#a855f7"
              strokeWidth="0.5"
              opacity="0.4"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.6;0.2"
                dur={`${5 + i * 0.3}s`}
                repeatCount="indefinite"
                begin={`${i * 0.2}s`}
              />
            </path>
          ))}
        </g>

        {/* Major global cities/nodes */}
        <g id="globalCities">
          {[
            { x: 200, y: 200, name: "NYC", delay: 0 },
            { x: 400, y: 150, name: "LON", delay: 0.5 },
            { x: 650, y: 180, name: "BER", delay: 1 },
            { x: 800, y: 220, name: "TOK", delay: 1.5 },
            { x: 950, y: 280, name: "SYD", delay: 2 },
            { x: 150, y: 350, name: "SF", delay: 2.5 },
            { x: 500, y: 400, name: "SAO", delay: 3 },
            { x: 750, y: 450, name: "SIN", delay: 3.5 },
          ].map((city, i) => (
            <g key={i} transform={`translate(${city.x}, ${city.y})`}>
              {/* City glow */}
              <circle
                cx="0"
                cy="0"
                r="15"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                filter="url(#globalGlow)"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  values="10;20;10"
                  dur="4s"
                  repeatCount="indefinite"
                  begin={`${city.delay}s`}
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0.4;0.9;0.4"
                  dur="4s"
                  repeatCount="indefinite"
                  begin={`${city.delay}s`}
                />
              </circle>
              {/* City core */}
              <circle
                cx="0"
                cy="0"
                r="5"
                fill="#06b6d4"
                opacity="0.9"
              >
                <animate
                  attributeName="opacity"
                  values="0.7;1;0.7"
                  dur="4s"
                  repeatCount="indefinite"
                  begin={`${city.delay}s`}
                />
              </circle>
              {/* City label */}
              <text
                x="0"
                y="-25"
                fontSize="8"
                fill="#06b6d4"
                textAnchor="middle"
                opacity="0.8"
              >
                {city.name}
              </text>
              {/* Data pulses */}
              <circle
                cx="0"
                cy="0"
                r="5"
                fill="none"
                stroke="#ec4899"
                strokeWidth="1"
                opacity="0"
              >
                <animate
                  attributeName="r"
                  values="5;25;40"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${city.delay + 1}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0.8;0.3;0"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${city.delay + 1}s`}
                />
              </circle>
            </g>
          ))}
        </g>

        {/* Global connections */}
        <g id="globalConnections" stroke="#a855f7" strokeWidth="1" fill="none" opacity="0.5">
          {/* Primary network backbone */}
          <path d="M 200 200 Q 300 100 400 150 Q 525 125 650 180 Q 725 200 800 220 Q 875 250 950 280">
            <animate
              attributeName="stroke-dasharray"
              values="0 1500;750 750;1500 0"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
          {/* Secondary connections */}
          <path d="M 200 200 Q 175 275 150 350 Q 325 375 500 400 Q 625 425 750 450">
            <animate
              attributeName="stroke-dasharray"
              values="0 1200;600 600;1200 0"
              dur="10s"
              repeatCount="indefinite"
              begin="2s"
            />
          </path>
          {/* Cross connections */}
          <path d="M 400 150 Q 500 300 650 180 M 800 220 Q 650 350 500 400 M 200 200 Q 500 300 800 220">
            <animate
              attributeName="stroke-dasharray"
              values="0 800;400 400;800 0"
              dur="6s"
              repeatCount="indefinite"
              begin="1s"
            />
          </path>
        </g>

        {/* Data centers */}
        <g id="dataCenters">
          {[
            { x: 300, y: 250, scale: 1.2 },
            { x: 600, y: 300, scale: 1.5 },
            { x: 900, y: 350, scale: 1.1 },
          ].map((dc, i) => (
            <g key={i} transform={`translate(${dc.x}, ${dc.y}) scale(${dc.scale})`}>
              <rect
                x="-15"
                y="-10"
                width="30"
                height="20"
                rx="3"
                fill="#1e1b4b"
                stroke="#06b6d4"
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Server racks */}
              <rect x="-12" y="-7" width="6" height="14" fill="#06b6d4" opacity="0.6" />
              <rect x="-3" y="-7" width="6" height="14" fill="#a855f7" opacity="0.6" />
              <rect x="6" y="-7" width="6" height="14" fill="#ec4899" opacity="0.6" />
              {/* Data center activity */}
              <circle
                cx="0"
                cy="0"
                r="20"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                opacity="0"
              >
                <animate
                  attributeName="r"
                  values="20;35;50"
                  dur="5s"
                  repeatCount="indefinite"
                  begin={`${i * 1.5}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0.2;0"
                  dur="5s"
                  repeatCount="indefinite"
                  begin={`${i * 1.5}s`}
                />
              </circle>
            </g>
          ))}
        </g>

        {/* Floating data packets */}
        <g id="dataPackets">
          {[...Array(15)].map((_, i) => (
            <g key={i}>
              <rect
                x={Math.random() * 1200}
                y={Math.random() * 600}
                width="4"
                height="4"
                rx="1"
                fill="#ec4899"
                opacity="0.7"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`0,0; ${Math.random() * 400 - 200},${Math.random() * 300 - 150}; 0,0`}
                  dur={`${Math.random() * 12 + 8}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.4;0.9;0.4"
                  dur={`${Math.random() * 4 + 2}s`}
                  repeatCount="indefinite"
                />
              </rect>
            </g>
          ))}
        </g>

        {/* Satellite network */}
        <g id="satelliteNetwork">
          <circle
            cx="600"
            cy="300"
            r="200"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1"
            opacity="0.3"
            strokeDasharray="8,8"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 600 300;360 600 300"
              dur="30s"
              repeatCount="indefinite"
            />
          </circle>
          {[...Array(6)].map((_, i) => (
            <circle
              key={i}
              cx={600 + Math.cos(i * 60 * Math.PI / 180) * 200}
              cy={300 + Math.sin(i * 60 * Math.PI / 180) * 200}
              r="3"
              fill="#a855f7"
              filter="url(#globalGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 600 300;360 600 300"
                dur="30s"
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        {/* Central global hub */}
        <g id="globalHub" transform="translate(600, 300)">
          <circle
            cx="0"
            cy="0"
            r="25"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            filter="url(#globalGlow)"
          >
            <animate
              attributeName="r"
              values="20;30;20"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="0"
            cy="0"
            r="12"
            fill="#a855f7"
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Hub rings */}
          {[...Array(3)].map((_, i) => (
            <circle
              key={i}
              cx="0"
              cy="0"
              r={8 + i * 4}
              fill="none"
              stroke="#ec4899"
              strokeWidth="1"
              opacity="0.6"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={`0;${360 * (i % 2 === 0 ? 1 : -1)}`}
                dur={`${6 + i * 2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        {/* World map outline (simplified) */}
        <g id="worldOutline" opacity="0.2" stroke="#06b6d4" strokeWidth="1" fill="none">
          {/* Simplified continents */}
          <path d="M 100 250 Q 200 200 300 250 Q 400 280 500 250 Q 600 220 700 250 Q 800 280 900 250 Q 1000 220 1100 250" />
          <path d="M 150 350 Q 250 320 350 350 Q 450 380 550 350 Q 650 320 750 350 Q 850 380 950 350" />
        </g>
      </svg>
    </div>
  );
};

export default GlobalScaleSVG;