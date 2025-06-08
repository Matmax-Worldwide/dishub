'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import AuthNavigation from './AuthNavigation';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const { t } = useI18n();

  return (
    <nav className={`fixed top-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 pointer-events-auto ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {t('dishub.nav.brand')}
          </span>
        </div>
        
        {/* Authentication Navigation */}
        <AuthNavigation />
      </div>
    </nav>
  );
} 