'use client';

import { useEffect, useState } from 'react';

export default function BenefitsPage() {
  const [iframeHeight, setIframeHeight] = useState('100vh');
  
  useEffect(() => {
    // Set iframe height to window height minus some space for header
    const updateHeight = () => {
      const height = window.innerHeight - 40;
      setIframeHeight(`${height}px`);
    };
    
    // Initial height
    updateHeight();
    
    // Update height on resize
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  return (
    <div className="w-full">
      <div className="bg-gray-800 text-white p-6 mb-4">
        <h1 className="text-2xl font-bold">Beneficios E-Voque</h1>
      </div>
      
      <div className="w-full">
        <iframe 
          src="https://pe.e-voquebenefit.com/" 
          title="E-Voque Benefits"
          className="w-full border-none"
          style={{ height: iframeHeight }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
} 