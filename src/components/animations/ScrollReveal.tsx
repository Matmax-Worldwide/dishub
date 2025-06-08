'use client';

import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale' | 'rotate';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 600,
  distance = 50,
  className = '',
  threshold = 0.1,
  triggerOnce = true,
}) => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold, triggerOnce });

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return `translateY(${distance}px)`;
      case 'down':
        return `translateY(-${distance}px)`;
      case 'left':
        return `translateX(${distance}px)`;
      case 'right':
        return `translateX(-${distance}px)`;
      case 'scale':
        return 'scale(0.8)';
      case 'rotate':
        return 'rotate(10deg) scale(0.9)';
      case 'fade':
      default:
        return 'translateY(20px)';
    }
  };

  const getFinalTransform = () => {
    switch (direction) {
      case 'scale':
        return 'scale(1)';
      case 'rotate':
        return 'rotate(0deg) scale(1)';
      default:
        return 'translateX(0) translateY(0)';
    }
  };

  const animationStyle = {
    transform: isVisible ? getFinalTransform() : getInitialTransform(),
    opacity: isVisible ? 1 : 0,
    transition: `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms`,
  };

  return (
    <div
      ref={elementRef}
      style={animationStyle}
      className={className}
    >
      {children}
    </div>
  );
};

interface StaggeredRevealProps {
  children: React.ReactNode[];
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  staggerDelay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

export const StaggeredReveal: React.FC<StaggeredRevealProps> = ({
  children,
  direction = 'up',
  staggerDelay = 100,
  duration = 600,
  distance = 50,
  className = '',
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ScrollReveal
          key={index}
          direction={direction}
          delay={index * staggerDelay}
          duration={duration}
          distance={distance}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
};

export default ScrollReveal; 