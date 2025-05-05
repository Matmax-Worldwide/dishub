import React from 'react';

interface TestimonialSectionProps {
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
}

export default function TestimonialSection({ 
  quote, 
  author, 
  role, 
  avatar 
}: TestimonialSectionProps) {
  return (
    <div className="py-12 px-4 bg-blue-50 rounded-lg">
      <div className="max-w-4xl mx-auto">
        <blockquote className="text-center">
          <div className="text-3xl font-medium italic text-gray-800 mb-8">
            &ldquo;{quote}&rdquo;
          </div>
          
          <div className="flex items-center justify-center">
            {avatar && (
              <div className="mr-4">
                <img 
                  src={avatar} 
                  alt={author}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="text-lg font-medium text-gray-900">{author}</div>
              {role && (
                <div className="text-sm text-gray-600">{role}</div>
              )}
            </div>
          </div>
        </blockquote>
      </div>
    </div>
  );
} 