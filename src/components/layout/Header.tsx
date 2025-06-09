'use client';

import React, { useState } from 'react';
import { Zap, Globe, Rocket, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import AuthNavigation from './AuthNavigation';
import TechNavDropdown from './TechNavDropdown';

interface HeaderProps {
  className?: string;
}

// Smooth scroll to section utility function
const scrollToSection = (sectionId: string) => {
  const element = document.querySelector(`[data-section="${sectionId}"]`);
  if (element) {
    const headerHeight = 80; // Approximate header height
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerHeight;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

export default function Header({ className = '' }: HeaderProps) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className={`fixed top-0 w-full z-[9999] backdrop-blur-xl bg-black/30 border-b border-white/10 pointer-events-auto ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Brand Logo */}
        <button 
          onClick={() => scrollToSection('hero')}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {t('dishub.nav.brand')}
          </span>
        </button>

        {/* Tech Navigation - Solo mostrar si NO está autenticado */}
        {!isAuthenticated && (
          <div className="hidden md:flex items-center space-x-6">
            {/* Platform Dropdown */}
            <TechNavDropdown />
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => scrollToSection('features')}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span className="text-sm font-medium">Features</span>
              </button>
              
              <button
                onClick={() => scrollToSection('technology')}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">Technology</span>
              </button>
              
              <button
                onClick={() => scrollToSection('privacy')}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Privacy</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <AuthNavigation />
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </motion.button>
        </div>

        {/* Desktop Authentication Navigation */}
        <div className="hidden md:block">
          <AuthNavigation />
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-white/10 bg-black/90 backdrop-blur-xl"
          >
            <div className="px-6 py-4 space-y-4">
              {/* Mobile Platform Section - Solo si NO está autenticado */}
              {!isAuthenticated && (
                <>
                  <div className="border-b border-white/10 pb-4">
                    <TechNavDropdown />
                  </div>
                  
                  {/* Mobile Navigation Links */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        scrollToSection('features');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 w-full text-left"
                    >
                      <Rocket className="w-5 h-5" />
                      <span className="font-medium">Features</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        scrollToSection('technology');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 w-full text-left"
                    >
                      <Globe className="w-5 h-5" />
                      <span className="font-medium">Technology</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        scrollToSection('privacy');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 w-full text-left"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Privacy & Security</span>
                    </button>
                  </div>
                </>
              )}
              
              {/* Mensaje para usuarios autenticados */}
              {isAuthenticated && (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    Welcome back! Use your dashboard to manage your platform.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 