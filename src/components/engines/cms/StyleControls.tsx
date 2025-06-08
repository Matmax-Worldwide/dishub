import React from 'react';
import { ComponentStyling } from '@/types/cms-styling';
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
import { Switch } from "@/components/ui/switch";

interface StyleControlsProps {
  styling: ComponentStyling;
  onChange: (styling: ComponentStyling) => void;
}

const StyleControls: React.FC<StyleControlsProps> = ({ styling, onChange }) => {
  const handleChange = (key: keyof ComponentStyling, value: any) => {
    onChange({
      ...styling,
      [key]: value
    });
  };

  const handleNestedChange = (parentKey: keyof ComponentStyling, childKey: string, value: any) => {
    const parent = styling[parentKey] as any;
    onChange({
      ...styling,
      [parentKey]: {
        ...parent,
        [childKey]: value
      }
    });
  };

  return (
    <div className="space-y-6 p-4">
      <Tabs defaultValue="layout" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={styling.width || ''}
                onChange={(e) => handleChange('width', e.target.value)}
                placeholder="auto, 100%, 300px"
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={styling.height || ''}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="auto, 100vh, 200px"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Padding</Label>
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Top"
                value={styling.padding?.top || ''}
                onChange={(e) => handleNestedChange('padding', 'top', e.target.value)}
              />
              <Input
                placeholder="Right"
                value={styling.padding?.right || ''}
                onChange={(e) => handleNestedChange('padding', 'right', e.target.value)}
              />
              <Input
                placeholder="Bottom"
                value={styling.padding?.bottom || ''}
                onChange={(e) => handleNestedChange('padding', 'bottom', e.target.value)}
              />
              <Input
                placeholder="Left"
                value={styling.padding?.left || ''}
                onChange={(e) => handleNestedChange('padding', 'left', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Margin</Label>
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Top"
                value={styling.margin?.top || ''}
                onChange={(e) => handleNestedChange('margin', 'top', e.target.value)}
              />
              <Input
                placeholder="Right"
                value={styling.margin?.right || ''}
                onChange={(e) => handleNestedChange('margin', 'right', e.target.value)}
              />
              <Input
                placeholder="Bottom"
                value={styling.margin?.bottom || ''}
                onChange={(e) => handleNestedChange('margin', 'bottom', e.target.value)}
              />
              <Input
                placeholder="Left"
                value={styling.margin?.left || ''}
                onChange={(e) => handleNestedChange('margin', 'left', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="display">Display</Label>
            <Select value={styling.display || 'block'} onValueChange={(value) => handleChange('display', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select display type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="inline">Inline</SelectItem>
                <SelectItem value="inline-block">Inline Block</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

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
                value={styling.color || '#000000'}
                onChange={(e) => handleChange('color', e.target.value)}
              />
            </div>
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

          <div>
            <Label htmlFor="borderWidth">Border Width</Label>
            <Input
              id="borderWidth"
              value={styling.borderWidth || ''}
              onChange={(e) => handleChange('borderWidth', e.target.value)}
              placeholder="1px, 2px, 0"
            />
          </div>

          <div>
            <Label htmlFor="borderRadius">Border Radius</Label>
            <Input
              id="borderRadius"
              value={styling.borderRadius || ''}
              onChange={(e) => handleChange('borderRadius', e.target.value)}
              placeholder="4px, 8px, 50%"
            />
          </div>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <div>
            <Label htmlFor="fontSize">Font Size</Label>
            <Input
              id="fontSize"
              value={styling.fontSize || ''}
              onChange={(e) => handleChange('fontSize', e.target.value)}
              placeholder="16px, 1rem, 1.2em"
            />
          </div>

          <div>
            <Label htmlFor="fontWeight">Font Weight</Label>
            <Select value={styling.fontWeight || 'normal'} onValueChange={(value) => handleChange('fontWeight', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select font weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">Thin</SelectItem>
                <SelectItem value="200">Extra Light</SelectItem>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semi Bold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
                <SelectItem value="800">Extra Bold</SelectItem>
                <SelectItem value="900">Black</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="textAlign">Text Align</Label>
            <Select value={styling.textAlign || 'left'} onValueChange={(value) => handleChange('textAlign', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select text alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="justify">Justify</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lineHeight">Line Height</Label>
            <Input
              id="lineHeight"
              value={styling.lineHeight || ''}
              onChange={(e) => handleChange('lineHeight', e.target.value)}
              placeholder="1.5, 24px, normal"
            />
          </div>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          <div>
            <Label htmlFor="opacity">Opacity</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseFloat(styling.opacity || '1') * 100]}
                onValueChange={(value) => handleChange('opacity', (value[0] / 100).toString())}
                max={100}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12">
                {Math.round(parseFloat(styling.opacity || '1') * 100)}%
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="boxShadow">Box Shadow</Label>
            <Input
              id="boxShadow"
              value={styling.boxShadow || ''}
              onChange={(e) => handleChange('boxShadow', e.target.value)}
              placeholder="0 4px 6px rgba(0, 0, 0, 0.1)"
            />
          </div>

          <div>
            <Label htmlFor="transform">Transform</Label>
            <Input
              id="transform"
              value={styling.transform || ''}
              onChange={(e) => handleChange('transform', e.target.value)}
              placeholder="rotate(45deg), scale(1.1)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="overflow-hidden"
              checked={styling.overflow === 'hidden'}
              onCheckedChange={(checked) => handleChange('overflow', checked ? 'hidden' : 'visible')}
            />
            <Label htmlFor="overflow-hidden">Hide Overflow</Label>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StyleControls; 