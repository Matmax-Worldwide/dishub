'use client';

import React from 'react';

const TechArchitectureSVG = () => {
  return (
    <div className="relative w-full h-96">
      <svg
        viewBox="0 0 600 400"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.6" />
          </linearGradient>
          
          {/* Filters */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Regions - Sovereign Data Zones */}
        <g id="regions">
          {/* US Region */}
          <ellipse cx="150" cy="150" rx="80" ry="60" fill="url(#blueGradient)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
          </ellipse>
          <text x="150" y="155" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="bold">US</text>
          
          {/* Europe Region */}
          <ellipse cx="300" cy="120" rx="70" ry="55" fill="url(#greenGradient)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" begin="1.3s" />
          </ellipse>
          <text x="300" y="125" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="bold">EU</text>
          
          {/* Asia Region */}
          <ellipse cx="450" cy="180" rx="75" ry="65" fill="url(#purpleGradient)" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" begin="2.6s" />
          </ellipse>
          <text x="450" y="185" textAnchor="middle" fill="#8B5CF6" fontSize="12" fontWeight="bold">ASIA</text>
        </g>

        {/* Multi-Region Resilience - Main Nodes */}
        <g id="mainNodes">
          {/* US Node */}
          <circle cx="150" cy="150" r="20" fill="url(#blueGradient)" filter="url(#glow)">
            <animate attributeName="r" values="20;25;20" dur="3s" repeatCount="indefinite" />
          </circle>
          
          {/* Europe Node */}
          <circle cx="300" cy="120" r="20" fill="url(#greenGradient)" filter="url(#glow)">
            <animate attributeName="r" values="20;25;20" dur="3s" repeatCount="indefinite" begin="1s" />
          </circle>
          
          {/* Asia Node - Failover Animation */}
          <circle cx="450" cy="180" r="20" fill="url(#purpleGradient)" filter="url(#glow)">
            <animate attributeName="opacity" values="1;0.3;1" dur="6s" repeatCount="indefinite" />
            <animate attributeName="r" values="20;15;25" dur="6s" repeatCount="indefinite" />
          </circle>
          
          {/* Backup Node - Takes over during failover */}
          <circle cx="420" cy="210" r="15" fill="#F59E0B" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="6s" repeatCount="indefinite" begin="3s" />
            <animate attributeName="r" values="15;20;15" dur="6s" repeatCount="indefinite" begin="3s" />
          </circle>
        </g>

        {/* Connection Lines - Data Transfer Animation */}
        <g id="connections">
          {/* US to Europe */}
          <path d="M 170 150 Q 225 100 280 120" stroke="#60A5FA" strokeWidth="2" fill="none" opacity="0.6">
            <animate attributeName="stroke-dasharray" values="0 200;100 100;200 0" dur="2s" repeatCount="indefinite" />
          </path>
          
          {/* Europe to Asia */}
          <path d="M 320 120 Q 375 140 430 180" stroke="#34D399" strokeWidth="2" fill="none" opacity="0.6">
            <animate attributeName="stroke-dasharray" values="0 200;100 100;200 0" dur="2s" repeatCount="indefinite" begin="0.7s" />
          </path>
          
          {/* Asia to US (completing the triangle) */}
          <path d="M 430 180 Q 300 250 170 150" stroke="#A78BFA" strokeWidth="2" fill="none" opacity="0.6">
            <animate attributeName="stroke-dasharray" values="0 300;150 150;300 0" dur="2s" repeatCount="indefinite" begin="1.4s" />
          </path>
          
          {/* Failover Connection */}
          <path d="M 450 180 L 420 210" stroke="#F59E0B" strokeWidth="3" fill="none" opacity="0">
            <animate attributeName="opacity" values="0;1;0" dur="6s" repeatCount="indefinite" begin="2.5s" />
          </path>
        </g>

        {/* Edge Computing Devices */}
        <g id="edgeDevices">
          {/* US Edge Devices */}
          <g transform="translate(150, 150)">
            <rect x="-60" y="-40" width="8" height="8" rx="2" fill="#3B82F6" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="10s" repeatCount="indefinite" />
            </rect>
            <rect x="52" y="-35" width="8" height="8" rx="2" fill="#3B82F6" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" values="0;-360" dur="8s" repeatCount="indefinite" />
            </rect>
            <rect x="-45" y="32" width="8" height="8" rx="2" fill="#3B82F6" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="12s" repeatCount="indefinite" />
            </rect>
            
            {/* Signal waves from edge devices */}
            <circle cx="-60" cy="-40" r="5" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0">
              <animate attributeName="r" values="5;15;25" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="52" cy="-35" r="5" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0">
              <animate attributeName="r" values="5;15;25" dur="2s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.8;0.3;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>

          {/* Europe Edge Devices */}
          <g transform="translate(300, 120)">
            <rect x="-50" y="-30" width="8" height="8" rx="2" fill="#10B981" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="9s" repeatCount="indefinite" />
            </rect>
            <rect x="42" y="25" width="8" height="8" rx="2" fill="#10B981" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" values="0;-360" dur="11s" repeatCount="indefinite" />
            </rect>
            
            {/* Signal waves */}
            <circle cx="-50" cy="-30" r="5" fill="none" stroke="#10B981" strokeWidth="1" opacity="0">
              <animate attributeName="r" values="5;15;25" dur="2s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="opacity" values="0.8;0.3;0" dur="2s" repeatCount="indefinite" begin="1s" />
            </circle>
          </g>

          {/* Asia Edge Devices */}
          <g transform="translate(450, 180)">
            <rect x="-55" y="-25" width="8" height="8" rx="2" fill="#8B5CF6" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="7s" repeatCount="indefinite" />
            </rect>
            <rect x="47" y="-30" width="8" height="8" rx="2" fill="#8B5CF6" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" values="0;-360" dur="13s" repeatCount="indefinite" />
            </rect>
            <rect x="-40" y="35" width="8" height="8" rx="2" fill="#8B5CF6" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="6s" repeatCount="indefinite" />
            </rect>
            
            {/* Signal waves */}
            <circle cx="-55" cy="-25" r="5" fill="none" stroke="#8B5CF6" strokeWidth="1" opacity="0">
              <animate attributeName="r" values="5;15;25" dur="2s" repeatCount="indefinite" begin="1.5s" />
              <animate attributeName="opacity" values="0.8;0.3;0" dur="2s" repeatCount="indefinite" begin="1.5s" />
            </circle>
          </g>
        </g>

        {/* Data Flow Particles */}
        <g id="dataFlow">
          {/* Particles flowing between nodes */}
          <circle cx="150" cy="150" r="3" fill="#60A5FA" opacity="0.8">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 0,0 Q 75,-50 150,-30 Q 225,-10 280,30" />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="4s" repeatCount="indefinite" />
          </circle>
          
          <circle cx="300" cy="120" r="3" fill="#34D399" opacity="0.8">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 0,0 Q 75,30 150,60" />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
          
          <circle cx="450" cy="180" r="3" fill="#A78BFA" opacity="0.8">
            <animateMotion dur="5s" repeatCount="indefinite" path="M 0,0 Q -150,70 -300,-30" />
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Status Indicators */}
        <g id="statusIndicators">
          <text x="50" y="370" fill="#3B82F6" fontSize="11" fontWeight="500">Multi-Region Resilience</text>
          <circle cx="35" cy="366" r="4" fill="#3B82F6">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
          
          <text x="220" y="370" fill="#10B981" fontSize="11" fontWeight="500">Sovereign Data Zones</text>
          <circle cx="205" cy="366" r="4" fill="#10B981">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="0.7s" />
          </circle>
          
          <text x="400" y="370" fill="#8B5CF6" fontSize="11" fontWeight="500">Edge Computing</text>
          <circle cx="385" cy="366" r="4" fill="#8B5CF6">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="1.4s" />
          </circle>
        </g>

        {/* Central Processing Indicator */}
        <g id="centralProcessor">
          <circle cx="300" cy="200" r="8" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.6">
            <animate attributeName="r" values="8;20;8" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          <text x="300" y="235" textAnchor="middle" fill="#F59E0B" fontSize="10" fontWeight="bold">CORE</text>
        </g>
      </svg>
    </div>
  );
};

export default TechArchitectureSVG;