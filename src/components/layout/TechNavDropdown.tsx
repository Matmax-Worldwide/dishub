'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Cpu, Layers, Zap } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { ENGINES_CONFIG, MODULES_CONFIG } from '@/config/engines';

const TechNavDropdown = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // No mostrar el dropdown si el usuario está autenticado
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 backdrop-blur-xl"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Layers className="w-4 h-4 text-cyan-400" />
        <span className="text-white font-medium">Platform</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 right-0 w-[420px] max-h-[80vh] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-[200]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white mb-1">
                dishub.city Platform
              </h3>
              <p className="text-sm text-gray-400">
                Engines & Modules for your digital empire
              </p>
            </div>

            {/* Engines Section */}
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wide">
                  Core Engines
                </h4>
              </div>
              <div className="grid gap-2">
                {ENGINES_CONFIG.map((engine, index) => (
                  <motion.div
                    key={engine.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-purple-600/20 hover:border-purple-400/30 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {engine.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {engine.name}
                          </h5>
                          <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors line-clamp-2">
                            {engine.description}
                          </p>
                          {engine.dependencies && (
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-yellow-400">
                                Requires: {engine.dependencies.map(dep => 
                                  ENGINES_CONFIG.find(e => e.id === dep)?.name || dep
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 ml-1">Active</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Modules Section */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                  Add-on Modules
                </h4>
              </div>
              <div className="grid gap-2">
                {MODULES_CONFIG.map((module, index) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (ENGINES_CONFIG.length + index) * 0.05 }}
                    className="group p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-600/20 hover:border-cyan-400/30 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {module.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {module.name}
                          </h5>
                          <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors line-clamp-2">
                            {module.description}
                          </p>
                          {module.dependencies && (
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-yellow-400">
                                Requires: {module.dependencies.map(dep => 
                                  ENGINES_CONFIG.find(e => e.id === dep)?.name || dep
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                       
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-blue-400 ml-1">Available</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-gradient-to-r from-purple-600/10 to-cyan-600/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Ready to build?
                  </p>
                  <p className="text-xs text-gray-400">
                    Start with any engine combination
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg text-sm font-semibold text-white hover:shadow-lg transition-all duration-300"
                >
                  Get Started
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TechNavDropdown;