import React from 'react';
import { 
  StarIcon, 
  BoltIcon, 
  CogIcon, 
  LightBulbIcon, 
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface FeatureSectionProps {
  title: string;
  description: string;
  icon: string;
}

export default function FeatureSection({ 
  title, 
  description, 
  icon = 'star' 
}: FeatureSectionProps) {
  
  // Icon mapping
  const iconMap: Record<string, React.ReactNode> = {
    star: <StarIcon className="h-12 w-12" />,
    bolt: <BoltIcon className="h-12 w-12" />,
    cog: <CogIcon className="h-12 w-12" />,
    lightbulb: <LightBulbIcon className="h-12 w-12" />,
    check: <CheckCircleIcon className="h-12 w-12" />,
  };

  // Default to star if icon not found
  const IconComponent = iconMap[icon] || iconMap.star;
  
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 mb-6">
            {IconComponent}
          </div>
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          <p className="text-gray-600 max-w-md">{description}</p>
        </div>
      </div>
    </div>
  );
} 