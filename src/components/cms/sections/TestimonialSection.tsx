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
        <div className="space-y-4">
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
          
          {/* Preview */}
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
          
          {/* Full Preview */}
          <div className="mt-6 bg-card p-6 rounded-md">
            <div className="text-xs font-medium text-muted-foreground mb-2">Preview:</div>
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