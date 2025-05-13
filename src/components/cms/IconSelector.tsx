import React, { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  className?: string;
}

type IconCategory = {
  name: string;
  label: string;
  icons: string[];
};

const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  onSelectIcon,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('common');
  const selectorRef = useRef<HTMLDivElement>(null);

  // Category definitions
  const iconCategories: IconCategory[] = [
    {
      name: 'common',
      label: 'Common',
      icons: [
        'User', 'Settings', 'Home', 'Mail', 'Search', 'Star', 
        'Heart', 'Bell', 'Check', 'Calendar', 'Clock', 'Image',
        'File', 'FileText', 'Send', 'MessageSquare', 'Phone',
        'Lock', 'Unlock', 'Shield', 'Globe', 'Map', 'MapPin',
        'Bookmark', 'Save', 'Trash', 'Edit', 'Pencil', 'Download',
        'Upload', 'ExternalLink', 'Link', 'Share', 'Printer', 'Copy'
      ]
    },
    {
      name: 'arrows',
      label: 'Arrows',
      icons: [
        'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft',
        'ArrowUpRight', 'ArrowUpLeft', 'ArrowDownRight', 'ArrowDownLeft',
        'ChevronUp', 'ChevronRight', 'ChevronDown', 'ChevronLeft',
        'ChevronsUp', 'ChevronsRight', 'ChevronsDown', 'ChevronsLeft',
        'MoveHorizontal', 'MoveVertical', 'Move', 'RefreshCw',
        'RefreshCcw', 'RotateCw', 'RotateCcw', 'Undo', 'Redo',
        'ArrowUpCircle', 'ArrowRightCircle', 'ArrowDownCircle', 'ArrowLeftCircle',
        'CornerUpLeft', 'CornerUpRight', 'CornerDownLeft', 'CornerDownRight'
      ]
    },
    {
      name: 'media',
      label: 'Media',
      icons: [
        'Play', 'Pause', 'Stop', 'SkipBack', 'SkipForward',
        'Music', 'Video', 'Camera', 'Film', 'Tv', 'Volume',
        'Volume1', 'Volume2', 'VolumeX', 'Mic', 'MicOff',
        'Headphones', 'Radio', 'Speaker', 'Youtube', 'PlayCircle',
        'PauseCircle', 'StopCircle', 'FastForward', 'Rewind',
        'SpeakerLoud', 'SpeakerQuiet', 'SpeakerOff', 'Album',
        'SquarePlay', 'SquarePause', 'SquareStop'
      ]
    },
    {
      name: 'weather',
      label: 'Weather',
      icons: [
        'Cloud', 'CloudRain', 'CloudSnow', 'CloudDrizzle', 'CloudLightning',
        'CloudFog', 'CloudOff', 'Sun', 'Sunrise', 'Sunset',
        'Moon', 'Wind', 'Umbrella', 'Thermometer', 'ThermometerSnowflake',
        'ThermometerSun', 'CloudSun', 'CloudMoon', 'Snowflake', 'Rainbow'
      ]
    },
    {
      name: 'devices',
      label: 'Devices',
      icons: [
        'Smartphone', 'Tablet', 'Monitor', 'Laptop', 'Tv',
        'Printer', 'Mouse', 'Keyboard', 'Battery', 'BatteryCharging',
        'BatteryFull', 'BatteryLow', 'BatteryMedium', 'BatteryWarning',
        'Bluetooth', 'Wifi', 'WifiOff', 'Server', 'HardDrive',
        'PenTool', 'Cpu', 'Disc', 'Camera', 'Gamepad', 'Headphones',
        'Microphone', 'Desktop', 'Webcam', 'SpeakerHigh', 'Watch'
      ]
    },
    {
      name: 'finance',
      label: 'Finance',
      icons: [
        'DollarSign', 'CreditCard', 'Bank', 'Wallet', 'Coins',
        'Landmark', 'Receipt', 'PiggyBank', 'BarChart', 'LineChart',
        'TrendingUp', 'TrendingDown', 'Percent', 'Banknote', 'Bitcoin',
        'Pound', 'Euro', 'IndianRupee', 'RussianRuble', 'JapaneseYen',
        'Building', 'BuildingBank', 'CircleDollarSign', 'CircleEuro'
      ]
    },
    {
      name: 'social',
      label: 'Social',
      icons: [
        'Twitter', 'Instagram', 'Facebook', 'Youtube', 'Linkedin',
        'Github', 'Gitlab', 'Slack', 'Twitch', 'Dribbble',
        'Figma', 'Chrome', 'Firefox', 'Safari', 'Edge',
        'Discord', 'ThumbsUp', 'ThumbsDown', 'Share2', 'MessageCircle',
        'AtSign', 'Hash', 'Share', 'Users', 'UserPlus', 'UserMinus'
      ]
    },
    {
      name: 'shapes',
      label: 'Shapes',
      icons: [
        'Square', 'Circle', 'Triangle', 'Hexagon', 'Octagon',
        'Pentagon', 'Diamond', 'Star', 'Heart', 'CheckSquare',
        'CheckCircle', 'Plus', 'Minus', 'X', 'XCircle',
        'XSquare', 'Divide', 'CircleDot', 'SquareDot', 'CircleCheck',
        'SquareCheck', 'CircleX', 'SquareX'
      ]
    },
    {
      name: 'text',
      label: 'Text',
      icons: [
        'Type', 'Heading1', 'Heading2', 'Heading3', 'Heading4',
        'Heading5', 'Heading6', 'Bold', 'Italic', 'Underline',
        'Strikethrough', 'List', 'ListOrdered', 'AlignLeft', 'AlignCenter',
        'AlignRight', 'AlignJustify', 'Indent', 'Outdent', 'ParagraphSpacing',
        'Quote', 'MessageSquare', 'FileText', 'FileJson', 'FileCode'
      ]
    }
  ];

  // Process icon categories to ensure no duplicates
  const processedIconCategories = iconCategories.map(category => {
    // Use a Set to remove duplicates but maintain order
    const uniqueIcons = Array.from(new Set(category.icons));
    // Filter for only icons that exist in Lucide
    const validIcons = uniqueIcons.filter(
      icon => LucideIcons[icon as keyof typeof LucideIcons]
    );
    return {
      ...category,
      icons: validIcons
    };
  });

  // Get all unique icons from processed categories
  const allUniqueIcons = Array.from(
    new Set(
      processedIconCategories.flatMap(category => category.icons)
    )
  );

  // Filter icons based on search query
  const filteredIcons = searchQuery 
    ? allUniqueIcons.filter(name => 
        name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Get the currently selected icon component
  const SelectedIcon = LucideIcons[selectedIcon as keyof typeof LucideIcons] as React.ElementType || LucideIcons.HelpCircle;

  // Handle click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName);
    setIsOpen(false);
  };

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const searchInput = document.getElementById('icon-search-input');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    } else {
      // Reset search when closing
      setSearchQuery('');
      // Reset to common category
      setActiveCategory('common');
    }
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={selectorRef}>
      {/* Selected icon display */}
      <div 
        className="flex items-center gap-2 p-2 border border-input rounded-md cursor-pointer hover:border-ring"
        onClick={toggleOpen}
      >
        <span className="p-1.5 bg-muted rounded-md">
          <SelectedIcon className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium flex-1">{selectedIcon}</span>
        <LucideIcons.ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Icon selector dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-[320px] max-h-[420px] bg-white shadow-lg rounded-md border-2 border-border/60 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b-2 border-border/60 sticky top-0 bg-white backdrop-blur-sm z-10">
            <div className="relative">
              <LucideIcons.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="icon-search-input"
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Category tabs - only show when not searching */}
          {!searchQuery && (
            <div className="flex overflow-x-auto border-b-2 border-border/60 px-2 pt-2 space-x-1 no-scrollbar bg-white">
              {processedIconCategories.map((category) => (
                <button
                  key={category.name}
                  className={cn(
                    "px-3 py-1.5 text-xs whitespace-nowrap transition-colors font-medium",
                    activeCategory === category.name
                      ? "bg-accent text-accent-foreground rounded-t-md shadow-md border-l border-r border-t border-accent-foreground/30"
                      : "text-muted-foreground hover:bg-muted/20 hover:text-foreground rounded-t-md border border-transparent"
                  )}
                  onClick={() => setActiveCategory(category.name)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          )}

          {/* Icon grid */}
          <div className="overflow-y-auto p-2 flex-1 bg-white">
            {searchQuery ? (
              // Show search results
              <>
                <div className="text-xs text-foreground font-medium mb-1.5">
                  Search results ({filteredIcons.length})
                </div>
                
                {filteredIcons.length > 0 ? (
                  <div className="grid grid-cols-8 gap-1">
                    {filteredIcons.map(iconName => {
                      const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => handleSelectIcon(iconName)}
                          className={cn(
                            "p-1.5 rounded-md flex items-center justify-center hover:bg-accent/70 focus:outline-none focus:ring-2 focus:ring-ring",
                            selectedIcon === iconName 
                              ? "bg-accent text-accent-foreground shadow-sm border border-accent-foreground/30" 
                              : "bg-muted/30 hover:shadow-sm border border-muted/30"
                          )}
                          title={iconName}
                        >
                          <IconComponent className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No icons found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </>
            ) : (
              // Show categorized icons
              <>
                {processedIconCategories
                  .filter(category => category.name === activeCategory)
                  .map(category => (
                    <div key={category.name}>
                      <div className="mb-2">
                        <div className="flex items-center justify-between bg-muted/20 p-1 px-2 rounded-md">
                          <div className="text-sm text-foreground font-medium">{category.label}</div>
                          <div className="text-xs text-muted-foreground bg-white/90 px-2 py-0.5 rounded-full border border-muted">{category.icons.length} icons</div>
                        </div>
                        <div className="grid grid-cols-8 gap-1 mt-2">
                          {category.icons.map(iconName => {
                            const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
                            return (
                              <button
                                key={iconName}
                                type="button"
                                onClick={() => handleSelectIcon(iconName)}
                                className={cn(
                                  "p-1.5 rounded-md flex items-center justify-center hover:bg-accent/70 focus:outline-none focus:ring-2 focus:ring-ring",
                                  selectedIcon === iconName 
                                    ? "bg-accent text-accent-foreground shadow-sm border border-accent-foreground/30" 
                                    : "bg-muted/30 hover:shadow-sm border border-muted/30"
                                )}
                                title={iconName}
                              >
                                <IconComponent className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconSelector; 