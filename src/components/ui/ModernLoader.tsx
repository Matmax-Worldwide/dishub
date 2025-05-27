'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ModernLoaderProps {
  type?: 'page' | 'video' | 'image' | 'content';
  progress?: number;
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  variant?: 'netflix' | 'apple' | 'google' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ModernLoader: React.FC<ModernLoaderProps> = ({
  type = 'content',
  progress = 0,
  message,
  subMessage,
  showProgress = false,
  variant = 'apple',
  size = 'md'
}) => {
  console.log('ModernLoader', { type, progress, message, subMessage, showProgress, variant, size });

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'md':
        return 'w-12 h-12';
      case 'lg':
        return 'w-16 h-16';
      case 'xl':
        return 'w-20 h-20';
      default:
        return 'w-12 h-12';
    }
  };

  const renderNetflixLoader = () => (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Netflix-style loading animation */}
      <div className="relative">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-8 bg-red-600 rounded-full"
              animate={{
                scaleY: [1, 2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
      
      {message && (
        <motion.p
          className="text-white text-lg font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
      
      {showProgress && (
        <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-red-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );

  const renderAppleLoader = () => (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Apple-style loading spinner */}
      <div className="relative">
        <motion.div
          className={`${getSizeClasses()} border-4 border-gray-200 rounded-full`}
          style={{ borderTopColor: '#007AFF' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/apple-logo.svg" className="w-4 h-4" alt="Apple logo" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        {message && (
          <motion.p
            className="text-gray-900 text-lg font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {message}
          </motion.p>
        )}
        
        {subMessage && (
          <motion.p
            className="text-gray-500 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {subMessage}
          </motion.p>
        )}
      </div>
      
      {showProgress && (
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );

  const renderGoogleLoader = () => (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Google-style material design loader */}
      <div className="relative">
        <motion.div
          className={`${getSizeClasses()} border-4 border-transparent rounded-full`}
          style={{
            borderImage: 'linear-gradient(45deg, #4285F4, #34A853, #FBBC05, #EA4335) 1',
            borderTopColor: '#4285F4'
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Pulsing center */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-4 h-4 bg-blue-500 rounded-full" />
        </motion.div>
      </div>
      
      <div className="text-center space-y-2">
        {message && (
          <motion.p
            className="text-gray-700 text-lg font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {message}
          </motion.p>
        )}
        
        {subMessage && (
          <motion.p
            className="text-gray-500 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {subMessage}
          </motion.p>
        )}
      </div>
      
      {showProgress && (
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );

  const renderMinimalLoader = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Minimal dots loader */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-gray-400 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
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
      
      {message && (
        <motion.p
          className="text-gray-600 text-sm font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'netflix':
        return renderNetflixLoader();
      case 'apple':
        return renderAppleLoader();
      case 'google':
        return renderGoogleLoader();
      case 'minimal':
        return renderMinimalLoader();
      default:
        return renderAppleLoader();
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-[200px] p-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {renderLoader()}
    </motion.div>
  );
};

// Specialized loaders for different use cases
export const VideoLoader: React.FC<Omit<ModernLoaderProps, 'type'>> = (props) => (
  <ModernLoader {...props} type="video" />
);

export const ImageLoader: React.FC<Omit<ModernLoaderProps, 'type'>> = (props) => (
  <ModernLoader {...props} type="image" />
);

export const PageLoader: React.FC<Omit<ModernLoaderProps, 'type'>> = (props) => (
  <ModernLoader {...props} type="page" />
);

export default ModernLoader; 