import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import StableInput from './StableInput';

interface TestimonialSectionProps {
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  isEditing?: boolean;
  onUpdate?: (data: Partial<TestimonialSectionProps>) => void;
}

const TestimonialSection = React.memo(function TestimonialSection({ 
  quote, 
  author, 
  role,
  avatar,
  isEditing = false,
  onUpdate
}: TestimonialSectionProps) {
  // Local state to maintain during typing
  const [localQuote, setLocalQuote] = useState(quote);
  const [localAuthor, setLocalAuthor] = useState(author);
  const [localRole, setLocalRole] = useState(role || '');
  const [localAvatar, setLocalAvatar] = useState(avatar || '');
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (quote !== localQuote) setLocalQuote(quote);
      if (author !== localAuthor) setLocalAuthor(author);
      if ((role || '') !== localRole) setLocalRole(role || '');
      if ((avatar || '') !== localAvatar) setLocalAvatar(avatar || '');
    }
  }, [quote, author, role, avatar, localQuote, localAuthor, localRole, localAvatar]);
  
  // Optimize update handler with useCallback and debouncing
  const handleUpdateField = useCallback((field: string, value: string) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        onUpdate({ [field]: value });
        
        // Reset editing flag after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Individual change handlers to maintain state locally
  const handleQuoteChange = useCallback((newValue: string) => {
    setLocalQuote(newValue);
    handleUpdateField('quote', newValue);
  }, [handleUpdateField]);
  
  const handleAuthorChange = useCallback((newValue: string) => {
    setLocalAuthor(newValue);
    handleUpdateField('author', newValue);
  }, [handleUpdateField]);
  
  const handleRoleChange = useCallback((newValue: string) => {
    setLocalRole(newValue);
    handleUpdateField('role', newValue);
  }, [handleUpdateField]);
  
  const handleAvatarChange = useCallback((newValue: string) => {
    setLocalAvatar(newValue);
    handleUpdateField('avatar', newValue);
  }, [handleUpdateField]);

  return (
    <div className={cn(
      "max-w-4xl mx-auto",
      isEditing ? "" : "bg-muted/10 p-8 rounded-lg"
    )}>
      {isEditing ? (
        <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
          <div className="flex space-x-1  to-gray-100/80 p-2 rounded-t-xl border-b border-gray-200/50">
            <button className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-white/60 active:scale-[0.98] bg-white shadow-md shadow-gray-900/10 ring-1 ring-gray-900/5 text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
              </svg>
              Testimonial Content
            </button>
          </div>
          
          <div className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Quote Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Quote</h3>
              </div>
              <div className="pl-6 space-y-4">
                <StableInput
                  value={localQuote}
                  onChange={handleQuoteChange}
                  placeholder="Enter quote..."
                  isTextArea={true}
                  rows={4}
                  className="font-medium text-foreground italic"
                  label="Quote"
                  debounceTime={300}
                  data-field-id="quote"
                  data-component-type="Testimonial"
                />
              </div>
            </div>

            {/* Author Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Author Information</h3>
              </div>
              <div className="pl-6 space-y-4">
                <StableInput
                  value={localAuthor}
                  onChange={handleAuthorChange}
                  placeholder="Enter author name..."
                  className="font-medium text-foreground"
                  label="Author"
                  debounceTime={300}
                  data-field-id="author"
                  data-component-type="Testimonial"
                />
                
                <StableInput
                  value={localRole}
                  onChange={handleRoleChange}
                  placeholder="Enter author role or position (optional)..."
                  className="text-muted-foreground text-sm"
                  label="Role (optional)"
                  debounceTime={300}
                  data-field-id="role"
                  data-component-type="Testimonial"
                />
                
                <StableInput
                  value={localAvatar}
                  onChange={handleAvatarChange}
                  placeholder="Enter avatar image URL (optional)..."
                  label="Avatar URL (optional)"
                  debounceTime={300}
                  data-field-id="avatar"
                  data-component-type="Testimonial"
                />
                
                {/* Avatar Preview */}
                {localAvatar && (
                  <div className="mt-4">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Avatar Preview:</div>
                    <div className="flex justify-center">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden">
                        <Image 
                          src={localAvatar}
                          alt={localAuthor}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="bg-card p-6 rounded-md border border-gray-200">
                  <blockquote className="text-center">
                    <div className="text-lg font-medium italic text-foreground mb-4">
                      &ldquo;{localQuote}&rdquo;
                    </div>
                    
                    <div className="flex items-center justify-center">
                      {localAvatar && (
                        <div className="mr-4">
                          <Image 
                            src={localAvatar} 
                            alt={localAuthor}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-base font-medium text-foreground">{localAuthor}</div>
                        {localRole && (
                          <div className="text-sm text-muted-foreground">{localRole}</div>
                        )}
                      </div>
                    </div>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <blockquote className="text-center">
          <div className="text-2xl font-medium italic text-foreground mb-6" data-field-type="quote" data-component-type="Testimonial">
            &ldquo;{localQuote}&rdquo;
          </div>
          
          <div className="flex items-center justify-center">
            {localAvatar && (
              <div className="mr-4" data-field-type="avatar" data-component-type="Testimonial">
                <Image 
                  src={localAvatar} 
                  alt={localAuthor}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="text-lg font-medium text-foreground" data-field-type="author" data-component-type="Testimonial">
                {localAuthor}
              </div>
              {localRole && (
                <div className="text-sm text-muted-foreground" data-field-type="role" data-component-type="Testimonial">
                  {localRole}
                </div>
              )}
            </div>
          </div>
        </blockquote>
      )}
    </div>
  );
});

export default TestimonialSection; 