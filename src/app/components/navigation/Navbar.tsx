'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '../LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  dictionary: {
    nav: {
      home: string;
      about: string;
      services: string;
      wellness: string;
      contact: string;
      apply: string;
      login: string;
      loginOrApply: string;
    };
  };
  locale: string;
}

export default function Navbar({ dictionary, locale }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isContactInView, setIsContactInView] = useState(false);

  function smoothScrollTo(start: number, end: number, duration: number) {
    const startTime = performance.now();
  
    function scroll(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, start + (end - start) * ease);
  
      if (elapsed < duration) {
        requestAnimationFrame(scroll);
      }
    }
  
    requestAnimationFrame(scroll);
  }
  
  function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Check if contact section is in view
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        const isInView = (
          rect.top <= window.innerHeight && 
          rect.bottom >= 0
        );
        setIsContactInView(isInView);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleLoginDropdown = () => {
    setIsLoginDropdownOpen(!isLoginDropdownOpen);
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md shadow-md py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <div className="relative h-10 w-32">
              <Image 
                src="/images/logo.png" 
                alt="E-Voque Logo" 
                fill
                sizes="128px"
                priority
                style={{ objectFit: 'contain' }}
                className={`${scrolled ? '' : ''}`}
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <LanguageSwitcher isContactInView={isContactInView} />
            <div className="relative">
              <button
                onClick={toggleLoginDropdown}
                className={`flex items-center space-x-1 px-4 py-2 rounded-md ${
                  scrolled 
                  ? 'bg-[#01319c] text-white hover:bg-[#012b88]' 
                  : 'bg-[#01319c] text-white hover:bg-[#012b88]'
                } transition-colors`}
              >
                <span>{dictionary.nav.loginOrApply}</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {isLoginDropdownOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white/90 backdrop-blur-md rounded-md shadow-lg z-10">
                  <Link
                    href={`/${locale}/login`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:bg-white/50"
                  >
                    {dictionary.nav.login}
                  </Link>
                  <Link
                    href={`/${locale}/#contact`}
                    onClick={() => {
                      const section = document.getElementById('contact');
                      if (section) {
                        const targetY = section.getBoundingClientRect().top + window.scrollY;
                        smoothScrollTo(window.scrollY, targetY, 1500); // duración en ms (más lenta)
                      }
                      setIsLoginDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:bg-white/50"
                  >
                    {dictionary.nav.apply}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <LanguageSwitcher isContactInView={isContactInView} />
            <button
              onClick={toggleMenu}
              className={`ml-4 focus:outline-none ${scrolled ? 'text-gray-700' : 'text-[hsla(225,55%,21%,1)]'}`}
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/90 backdrop-blur-md shadow-lg"
          >
            <div className="px-4 py-2 space-y-1">
              <div className="space-y-2 mt-4">
                <Link
                  href={`/${locale}/login`}
                  className="block px-3 py-2 bg-[#01319c] text-white hover:bg-[#012b88] rounded-md text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href={`/${locale}/#contact`}
                  className="block px-3 py-2 bg-white text-[#01319c] border border-[#01319c] hover:bg-blue-50 rounded-md text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Apply here
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 