'use client';

import React from 'react';

const WebsiteBuilderSVG = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      <svg
        viewBox="0 0 1200 800"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for website builder theme */}
          <linearGradient id="cityGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="builderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>

          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <pattern id="gridPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#06b6d4" strokeOpacity="0.1" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* City skyline background */}
        <rect width="1200" height="800" fill="url(#cityGradient)" />
        
        {/* Grid background for builder interface */}
        <rect width="1200" height="800" fill="url(#gridPattern)" opacity="0.4">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="8s" repeatCount="indefinite" />
        </rect>

        {/* City buildings (simplified) */}
        <g id="cityBuildings" opacity="0.6">
          {/* Building 1 */}
          <rect x="50" y="600" width="80" height="200" fill="#1e1b4b" opacity="0.8">
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="6s" repeatCount="indefinite" />
          </rect>
          <rect x="60" y="610" width="8" height="12" fill="#06b6d4" opacity="0.7">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="80" y="630" width="8" height="12" fill="#a855f7" opacity="0.7">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" />
          </rect>

          {/* Building 2 */}
          <rect x="150" y="550" width="60" height="250" fill="#312e81" opacity="0.8">
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="7s" repeatCount="indefinite" begin="1s" />
          </rect>
          <rect x="160" y="570" width="6" height="10" fill="#ec4899" opacity="0.7">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
          </rect>
          <rect x="180" y="590" width="6" height="10" fill="#06b6d4" opacity="0.7">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3.5s" repeatCount="indefinite" begin="1s" />
          </rect>

          {/* Building 3 */}
          <rect x="230" y="580" width="70" height="220" fill="#1e1b4b" opacity="0.8">
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur="5s" repeatCount="indefinite" begin="2s" />
          </rect>
        </g>

        {/* Main website builder interface */}
        <g id="builderInterface" transform="translate(350, 150)">
          {/* Main canvas */}
          <rect x="0" y="0" width="500" height="400" rx="12" fill="url(#builderGradient)" stroke="#06b6d4" strokeWidth="2" opacity="0.8" filter="url(#softGlow)">
            <animate attributeName="stroke-opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
          </rect>
          
          {/* Browser-like header */}
          <rect x="0" y="0" width="500" height="40" rx="12" fill="#1e1b4b" opacity="0.9" />
          <circle cx="20" cy="20" r="6" fill="#ef4444" opacity="0.8" />
          <circle cx="40" cy="20" r="6" fill="#f59e0b" opacity="0.8" />
          <circle cx="60" cy="20" r="6" fill="#10b981" opacity="0.8" />
          
          {/* URL bar */}
          <rect x="90" y="12" width="200" height="16" rx="8" fill="#374151" opacity="0.6" />
          <text x="100" y="22" fontSize="8" fill="#06b6d4" opacity="0.8">dishub.city</text>

          {/* Website elements being built */}
          <g id="websiteElements">
            {/* Header element */}
            <rect x="20" y="60" width="460" height="60" rx="8" fill="#7c3aed" opacity="0.4" stroke="#a855f7" strokeWidth="1">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
            </rect>
            <text x="30" y="85" fontSize="12" fill="#a855f7" opacity="0.9">HEADER</text>
            
            {/* Navigation */}
            <rect x="20" y="130" width="460" height="30" rx="4" fill="#ec4899" opacity="0.4" stroke="#ec4899" strokeWidth="1">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" begin="0.5s" />
            </rect>
            <text x="30" y="148" fontSize="8" fill="#ec4899" opacity="0.9">NAVIGATION</text>

            {/* Content blocks */}
            <rect x="20" y="170" width="220" height="80" rx="6" fill="#06b6d4" opacity="0.4" stroke="#06b6d4" strokeWidth="1">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="5s" repeatCount="indefinite" begin="1s" />
            </rect>
            <text x="25" y="190" fontSize="8" fill="#06b6d4" opacity="0.9">CONTENT BLOCK</text>
            
            <rect x="260" y="170" width="220" height="80" rx="6" fill="#8b5cf6" opacity="0.4" stroke="#8b5cf6" strokeWidth="1">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="6s" repeatCount="indefinite" begin="1.5s" />
            </rect>
            <text x="265" y="190" fontSize="8" fill="#8b5cf6" opacity="0.9">SIDEBAR</text>

            {/* Footer */}
            <rect x="20" y="260" width="460" height="40" rx="4" fill="#10b981" opacity="0.4" stroke="#10b981" strokeWidth="1">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="7s" repeatCount="indefinite" begin="2s" />
            </rect>
            <text x="30" y="278" fontSize="8" fill="#10b981" opacity="0.9">FOOTER</text>
          </g>
        </g>

        {/* Drag and drop elements sidebar */}
        <g id="elementsSidebar" transform="translate(100, 200)">
          <rect x="0" y="0" width="120" height="300" rx="8" fill="#1e1b4b" opacity="0.7" stroke="#374151" strokeWidth="1" />
          <text x="10" y="25" fontSize="10" fill="#06b6d4" opacity="0.9">ELEMENTS</text>
          
          {/* Draggable elements */}
          <g id="draggableElements">
            <rect x="15" y="40" width="90" height="25" rx="4" fill="#7c3aed" opacity="0.6">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
            </rect>
            <text x="20" y="55" fontSize="8" fill="#a855f7">Text Block</text>
            
            <rect x="15" y="75" width="90" height="25" rx="4" fill="#ec4899" opacity="0.6">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" begin="0.5s" />
            </rect>
            <text x="20" y="90" fontSize="8" fill="#ec4899">Image</text>
            
            <rect x="15" y="110" width="90" height="25" rx="4" fill="#06b6d4" opacity="0.6">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="5s" repeatCount="indefinite" begin="1s" />
            </rect>
            <text x="20" y="125" fontSize="8" fill="#06b6d4">Button</text>
            
            <rect x="15" y="145" width="90" height="25" rx="4" fill="#10b981" opacity="0.6">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="6s" repeatCount="indefinite" begin="1.5s" />
            </rect>
            <text x="20" y="160" fontSize="8" fill="#10b981">Form</text>
          </g>
        </g>

        {/* Properties panel */}
        <g id="propertiesPanel" transform="translate(900, 200)">
          <rect x="0" y="0" width="150" height="350" rx="8" fill="#1e1b4b" opacity="0.7" stroke="#374151" strokeWidth="1" />
          <text x="10" y="25" fontSize="10" fill="#06b6d4" opacity="0.9">PROPERTIES</text>
          
          {/* Property controls */}
          <rect x="15" y="40" width="120" height="15" rx="2" fill="#374151" opacity="0.6" />
          <text x="20" y="50" fontSize="7" fill="#9ca3af">Width: 100%</text>
          
          <rect x="15" y="65" width="120" height="15" rx="2" fill="#374151" opacity="0.6" />
          <text x="20" y="75" fontSize="7" fill="#9ca3af">Height: auto</text>
          
          <rect x="15" y="90" width="120" height="15" rx="2" fill="#374151" opacity="0.6" />
          <text x="20" y="100" fontSize="7" fill="#9ca3af">Margin: 20px</text>
        </g>

        {/* Floating UI elements */}
        <g id="floatingElements">
          {/* Cursor */}
          <g transform="translate(450, 220)">
            <path d="M0,0 L0,20 L6,15 L12,18 L15,12 L9,9 L12,3 Z" fill="#ffffff" opacity="0.8" filter="url(#softGlow)">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 30,20; 60,10; 30,30; 0,0"
                dur="8s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Selection handles */}
          <g id="selectionHandles" transform="translate(370, 230)">
            <rect x="0" y="0" width="100" height="60" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4,4" opacity="0.7">
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
            </rect>
            <circle cx="0" cy="0" r="3" fill="#06b6d4" />
            <circle cx="100" cy="0" r="3" fill="#06b6d4" />
            <circle cx="0" cy="60" r="3" fill="#06b6d4" />
            <circle cx="100" cy="60" r="3" fill="#06b6d4" />
          </g>
        </g>

        {/* Code preview window */}
        <g id="codePreview" transform="translate(950, 600)">
          <rect x="0" y="0" width="200" height="120" rx="6" fill="#0f172a" opacity="0.9" stroke="#334155" strokeWidth="1" />
          <text x="10" y="20" fontSize="8" fill="#06b6d4" opacity="0.8">CODE PREVIEW</text>
          <text x="10" y="40" fontSize="6" fill="#10b981" opacity="0.7">&lt;div class=&quot;hero&quot;&gt;</text>
          <text x="10" y="52" fontSize="6" fill="#ec4899" opacity="0.7">  &lt;h1&gt;Welcome&lt;/h1&gt;</text>
          <text x="10" y="64" fontSize="6" fill="#a855f7" opacity="0.7">  &lt;p&gt;Build amazing&lt;/p&gt;</text>
          <text x="10" y="76" fontSize="6" fill="#10b981" opacity="0.7">&lt;/div&gt;</text> 
        </g>

        {/* Connection lines between elements */}
        <g id="connectionLines" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.3">
          <path d="M 220 350 Q 280 300 350 320">
            <animate attributeName="stroke-dasharray" values="0 200;100 100;200 0" dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M 850 375 Q 900 350 900 400">
            <animate attributeName="stroke-dasharray" values="0 150;75 75;150 0" dur="5s" repeatCount="indefinite" begin="1s" />
          </path>
        </g>

        {/* Data flow particles */}
        <g id="dataFlow">
          {[...Array(8)].map((_, i) => (
            <circle
              key={i}
              cx={300 + i * 80}
              cy={400}
              r="2"
              fill="#ec4899"
              opacity="0.7"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,0; ${Math.random() * 100 - 50},${Math.random() * 100 - 50}; 0,0`}
                dur={`${Math.random() * 6 + 4}s`}
                repeatCount="indefinite"
                begin={`${i * 0.5}s`}
              />
              <animate
                attributeName="opacity"
                values="0.4;0.9;0.4"
                dur={`${Math.random() * 3 + 2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default WebsiteBuilderSVG; 