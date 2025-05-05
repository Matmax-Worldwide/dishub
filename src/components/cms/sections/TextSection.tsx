import React from 'react';

interface TextSectionProps {
  title?: string;
  subtitle?: string;
  content?: string;
}

export default function TextSection({ title, subtitle, content }: TextSectionProps) {
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">{title}</h2>
        <h3 className="text-xl font-bold mb-6">{subtitle}</h3>
        <div className="prose lg:prose-xl">
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
} 