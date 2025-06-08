import React from 'react';
import { ComponentStyling, PADDING_OPTIONS, MARGIN_OPTIONS, BORDER_RADIUS_OPTIONS, SHADOW_OPTIONS } from '@/types/cms-styling';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface StyleControlsProps {
  styling: ComponentStyling;
  onChange: (styling: ComponentStyling) => void;
}

const StyleControls: React.FC<StyleControlsProps> = ({ styling, onChange }) => {
  const handleChange = (key: keyof ComponentStyling, value: string | number | ComponentStyling['border']) => {
    onChange({
      ...styling,
      [key]: value
    });
  };

  const handleBorderChange = (childKey: 'width' | 'color' | 'style', value: string | number) => {
    const currentBorder = styling.border || { width: 0, color: '#e5e7eb', style: 'solid' as const };
    onChange({
      ...styling,
      border: {
        ...currentBorder,
        [childKey]: value
      }
    });
  };

  return (
    <div className="space-y-6 p-4">
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="border">Border</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={styling.backgroundColor || '#ffffff'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <Input
                id="textColor"
                type="color"
                value={styling.textColor || '#000000'}
                onChange={(e) => handleChange('textColor', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="backgroundTransparency">Background Transparency</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[styling.backgroundTransparency || 0]}
                onValueChange={(value) => handleChange('backgroundTransparency', value[0])}
                max={100}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12">
                {styling.backgroundTransparency || 0}%
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="textTransparency">Text Transparency</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[styling.textTransparency || 0]}
                onValueChange={(value) => handleChange('textTransparency', value[0])}
                max={100}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12">
                {styling.textTransparency || 0}%
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="spacing" className="space-y-4">
          <div>
            <Label htmlFor="padding">Padding</Label>
            <Select value={styling.padding || 'none'} onValueChange={(value) => handleChange('padding', value as ComponentStyling['padding'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select padding" />
              </SelectTrigger>
              <SelectContent>
                {PADDING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="margin">Margin</Label>
            <Select value={styling.margin || 'none'} onValueChange={(value) => handleChange('margin', value as ComponentStyling['margin'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select margin" />
              </SelectTrigger>
              <SelectContent>
                {MARGIN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="border" className="space-y-4">
          <div>
            <Label htmlFor="borderRadius">Border Radius</Label>
            <Select value={styling.borderRadius || 'none'} onValueChange={(value) => handleChange('borderRadius', value as ComponentStyling['borderRadius'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select border radius" />
              </SelectTrigger>
              <SelectContent>
                {BORDER_RADIUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="borderColor">Border Color</Label>
            <Input
              id="borderColor"
              type="color"
              value={styling.borderColor || '#e5e7eb'}
              onChange={(e) => handleChange('borderColor', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Border Settings</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="borderWidth" className="text-xs">Width</Label>
                <Input
                  id="borderWidth"
                  type="number"
                  value={styling.border?.width || 0}
                  onChange={(e) => handleBorderChange('width', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="borderColor" className="text-xs">Color</Label>
                <Input
                  id="borderColor"
                  type="color"
                  value={styling.border?.color || '#e5e7eb'}
                  onChange={(e) => handleBorderChange('color', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="borderStyle" className="text-xs">Style</Label>
                <Select value={styling.border?.style || 'solid'} onValueChange={(value) => handleBorderChange('style', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          <div>
            <Label htmlFor="shadow">Shadow</Label>
            <Select value={styling.shadow || 'none'} onValueChange={(value) => handleChange('shadow', value as ComponentStyling['shadow'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select shadow" />
              </SelectTrigger>
              <SelectContent>
                {SHADOW_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="customCss">Custom CSS</Label>
            <Textarea
              id="customCss"
              value={styling.customCss || ''}
              onChange={(e) => handleChange('customCss', e.target.value)}
              placeholder="Enter custom CSS rules..."
              rows={4}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StyleControls; 