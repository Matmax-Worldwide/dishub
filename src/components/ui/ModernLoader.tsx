'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ModernLoaderProps {
  variant?: 'apple' | 'netflix' | 'google' | 'minimal';
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ModernLoader: React.FC<ModernLoaderProps> = ({
  variant = 'apple',
  message = 'Cargando...',
  progress,
  showProgress = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const AppleLoader = () => (
    <div className={`fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] ${className}`}>
      <div className="text-center">
        {/* Apple-style spinning loader */}
        <div className="relative mb-8">
          <motion.div
            className={`${sizeClasses[size]} mx-auto`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg
              className="w-full h-full text-white"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="60 20"
                className="opacity-75"
              />
            </svg>
          </motion.div>
          
          {/* Pulsing background circle */}
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} mx-auto rounded-full bg-white/10`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-white text-lg font-medium mb-4"
        >
          {message}
        </motion.div>

        {/* Progress bar */}
        {showProgress && progress !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-64 mx-auto"
          >
            <div className="bg-white/20 rounded-full h-1 overflow-hidden">
              <motion.div
                className="bg-white h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="text-white/70 text-sm mt-2">
              {progress}%
            </div>
          </motion.div>
        )}

        {/* Apple logo animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mt-8"
        >
          <svg
            className="w-8 h-8 mx-auto text-white/50"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        </motion.div>
      </div>
    </div>
  );

  const NetflixLoader = () => (
    <div className={`fixed inset-0 bg-black flex items-center justify-center z-[9999] ${className}`}>
      <div className="text-center">
        <div className="flex space-x-1 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-8 bg-red-600 rounded"
              animate={{
                scaleY: [1, 2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-xl font-bold"
        >
          {message}
        </motion.div>
      </div>
    </div>
  );

  const GoogleLoader = () => (
    <div className={`fixed inset-0 bg-white flex items-center justify-center z-[9999] ${className}`}>
      <div className="text-center">
        <div className="relative mb-8">
          <motion.div
            className={`${sizeClasses[size]} mx-auto`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#4285f4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="15 85"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#ea4335"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="15 85"
                strokeDashoffset="25"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#fbbc04"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="15 85"
                strokeDashoffset="50"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#34a853"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="15 85"
                strokeDashoffset="75"
                fill="none"
              />
            </svg>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-700 text-lg font-medium"
        >
          {message}
        </motion.div>
      </div>
    </div>
  );

  const MinimalLoader = () => (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );

  switch (variant) {
    case 'apple':
      return <AppleLoader />;
    case 'netflix':
      return <NetflixLoader />;
    case 'google':
      return <GoogleLoader />;
    case 'minimal':
      return <MinimalLoader />;
    default:
      return <AppleLoader />;
  }
};

export default ModernLoader; 