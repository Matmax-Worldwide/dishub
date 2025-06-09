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
  console.log('🚀 Scrolling to slide:', sectionId);
  
  // Simple approach - use the browser's native scrollIntoView with snap behavior
  const element = document.querySelector(`[data-section="${sectionId}"]`);
  
  if (element) {
    console.log('✅ Found slide, scrolling...');
    
    // Get the parent slide container
    const slideContainer = element.closest('.snap-start');
    
    if (slideContainer) {
      slideContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    } else {
      // Fallback to element itself
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  } else {
    console.log('❌ Slide not found, using index-based navigation...');
    
    // Use slide index for navigation
    const slideOrder = ['hero', 'features', 'privacy', 'technology', 'cta'];
    const slideIndex = slideOrder.indexOf(sectionId);
    
    if (slideIndex >= 0) {
      const targetY = slideIndex * window.innerHeight;
      console.log(`📍 Scrolling to slide ${slideIndex} at position ${targetY}`);
      
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }
};

export default function Header({ className = '' }: HeaderProps) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className={`fixed top-0 w-full z-[9999] backdrop-blur-xl bg-black/30 border-b border-white/10 pointer-events-auto ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        {/* Brand Logo - Mobile optimized */}
        <button 
          onClick={() => scrollToSection('hero')}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {t('dishub.nav.brand')}
          </span>
        </button>

        {/* Tech Navigation - Hidden on mobile, show from md up */}
        {!isAuthenticated && (
          <div className="hidden md:flex items-center space-x-6">
            {/* Platform Dropdown */}
            <TechNavDropdown />
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              <button
                onClick={() => {
                  console.log('Features button clicked');
                  scrollToSection('features');
                }}
                className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span className="text-sm font-medium">Features</span>
              </button>
              
              <button
                onClick={() => {
                  console.log('Technology button clicked');
                  scrollToSection('technology');
                }}
                className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">Technology</span>
              </button>
              
              <button
                onClick={() => {
                  console.log('Privacy button clicked');
                  scrollToSection('privacy');
                }}
                className="flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Privacy</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile Menu Button and Auth */}
        <div className="flex items-center space-x-3">
          {/* Auth Navigation - Always visible */}
          <AuthNavigation />
          
          {/* Mobile Menu Button - Only show if not authenticated */}
          {!isAuthenticated && (
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </motion.button>
          )}
        </div>

        {/* Desktop Authentication Navigation - Hidden, moved to mobile section */}
      </div>

      {/* Mobile Menu - Enhanced mobile-first experience */}
      <AnimatePresence>
        {isMobileMenuOpen && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="px-2 sm:px-3 py-2 sm:py-3 space-y-2 sm:space-y-3 max-h-[75vh] overflow-y-auto">
              {/* Mobile Platform Section - Ultra compact */}
              <div className="border-b border-white/10 pb-2 sm:pb-3">
                <div className="text-center">
                  <h3 className="text-xs sm:text-sm font-bold text-white mb-1">
                    dishub.city Platform
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-400">
                    Engines & Modules for your digital empire
                  </p>
                </div>
              </div>
              
              {/* Mobile Navigation Links - iPhone optimized */}
              <div className="space-y-1 sm:space-y-2">
                <motion.button
                  onClick={() => {
                    console.log('Features button clicked');
                    scrollToSection('features');
                    setIsMobileMenuOpen(false);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 rounded-md sm:rounded-lg text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-cyan-600/20 transition-all duration-300 w-full text-left border border-transparent hover:border-purple-500/30 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600/20 rounded-md flex items-center justify-center group-hover:bg-purple-600/40 transition-colors">
                    <Rocket className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-xs sm:text-sm">Features</span>
                    <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-400">Explore capabilities</p>
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    console.log('Technology button clicked');
                    scrollToSection('technology');
                    setIsMobileMenuOpen(false);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 rounded-md sm:rounded-lg text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-600/20 hover:to-blue-600/20 transition-all duration-300 w-full text-left border border-transparent hover:border-cyan-500/30 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-cyan-600/20 rounded-md flex items-center justify-center group-hover:bg-cyan-600/40 transition-colors">
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-xs sm:text-sm">Technology</span>
                    <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-400">Our tech stack</p>
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    console.log('Privacy button clicked');
                    scrollToSection('privacy');
                    setIsMobileMenuOpen(false);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 rounded-md sm:rounded-lg text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-600/20 hover:to-emerald-600/20 transition-all duration-300 w-full text-left border border-transparent hover:border-green-500/30 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600/20 rounded-md flex items-center justify-center group-hover:bg-green-600/40 transition-colors">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-xs sm:text-sm">Privacy & Security</span>
                    <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-400">Data protection</p>
                  </div>
                </motion.button>
              </div>

              {/* Mobile CTA Section - Compact */}
              <div className="border-t border-white/10 pt-2 sm:pt-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-3 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-md sm:rounded-lg font-semibold text-white text-xs sm:text-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Get Started</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 