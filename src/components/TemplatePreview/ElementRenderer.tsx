import React from 'react';
import { TemplateElement } from '@/lib/firebase-types';
import { 
  Calendar, 
  ToggleLeft, 
  ToggleRight, 
  Camera, 
  Save, 
  Send, 
  Type, 
  Hash,
  FileText,
  Folder,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ElementRendererProps {
  element: TemplateElement;
  level?: number;
  showRoleInfo?: boolean;
}

const getElementIcon = (type: string) => {
  switch (type) {
    case 'TITLE':
      return <FileText className="h-4 w-4" />;
    case 'SUBTITLE':
      return <Type className="h-4 w-4" />;
    case 'TEXT_INPUT':
      return <Type className="h-4 w-4" />;
    case 'NUMBER_INPUT':
      return <Hash className="h-4 w-4" />;
    case 'DATE_PICKER':
      return <Calendar className="h-4 w-4" />;
    case 'YES_NO_TOGGLE':
      return <ToggleLeft className="h-4 w-4" />;
    case 'PHOTO_UPLOAD':
      return <Camera className="h-4 w-4" />;
    case 'SAVE_DRAFT':
      return <Save className="h-4 w-4" />;
    case 'SUBMIT_FORM':
      return <Send className="h-4 w-4" />;
    case 'CONTAINER':
      return <Folder className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getElementColor = (type: string) => {
  switch (type) {
    case 'TITLE':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SUBTITLE':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'TEXT_INPUT':
    case 'NUMBER_INPUT':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'DATE_PICKER':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'YES_NO_TOGGLE':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'PHOTO_UPLOAD':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'SAVE_DRAFT':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'SUBMIT_FORM':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'CONTAINER':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const ElementRenderer: React.FC<ElementRendererProps> = ({ 
  element, 
  level = 0, 
  showRoleInfo = true 
}) => {
  const indentClass = level > 0 ? `ml-${level * 4}` : '';
  const isContainer = element.type === 'CONTAINER';
  const hasNestedElements = element.nestedElements && element.nestedElements.length > 0;

  const renderElementContent = () => {
    switch (element.type) {
      case 'TITLE':
        return (
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">{element.label}</h2>
            {element.sectionTitle && (
              <p className="text-sm text-gray-600">{element.sectionTitle}</p>
            )}
          </div>
        );

      case 'SUBTITLE':
        return (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">{element.label}</h3>
            {element.sectionTitle && (
              <p className="text-sm text-gray-600">{element.sectionTitle}</p>
            )}
          </div>
        );

      case 'TEXT_INPUT':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {element.label}
              {element.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input 
              placeholder={element.placeholder || "Type your answer here..."}
              disabled
              className="bg-gray-50"
            />
            {element.isRepeatable && (
              <p className="text-xs text-gray-500">
                Repeatable (Max: {element.maxRepeats || 10})
              </p>
            )}
          </div>
        );

      case 'NUMBER_INPUT':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {element.label}
              {element.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input 
              type="number"
              placeholder={element.placeholder || "Enter number..."}
              disabled
              className="bg-gray-50"
            />
            {element.isRepeatable && (
              <p className="text-xs text-gray-500">
                Repeatable (Max: {element.maxRepeats || 10})
              </p>
            )}
          </div>
        );

      case 'DATE_PICKER':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {element.label}
              {element.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input 
              type="date"
              disabled
              className="bg-gray-50"
            />
          </div>
        );

      case 'YES_NO_TOGGLE':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {element.label}
              {element.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex items-center space-x-2">
              <ToggleLeft className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-600">Yes/No</span>
            </div>
          </div>
        );

      case 'PHOTO_UPLOAD':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {element.label}
              {element.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload photo</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>
        );

      case 'SAVE_DRAFT':
        return (
          <Button variant="outline" disabled className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {element.label}
          </Button>
        );

      case 'SUBMIT_FORM':
        return (
          <Button disabled className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {element.label}
          </Button>
        );

      case 'CONTAINER':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Folder className="h-5 w-5 text-amber-600" />
              <h4 className="font-medium text-gray-900">{element.label}</h4>
              {element.sectionTitle && (
                <Badge variant="secondary" className="text-xs">
                  {element.sectionTitle}
                </Badge>
              )}
            </div>
            {hasNestedElements && (
              <div className="ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                {element.nestedElements
                  .sort((a, b) => a.order - b.order)
                  .map((nestedElement) => (
                    <ElementRenderer
                      key={nestedElement.id}
                      element={nestedElement}
                      level={level + 1}
                      showRoleInfo={showRoleInfo}
                    />
                  ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{element.label}</Label>
            <p className="text-sm text-gray-500">Unknown element type: {element.type}</p>
          </div>
        );
    }
  };

  return (
    <Card className={`${indentClass} transition-all duration-200 hover:shadow-sm w-full`}>
      <CardContent className="p-4">
        <div className="space-y-3 w-full">
          {/* Element Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getElementIcon(element.type)}
              <Badge className={`${getElementColor(element.type)} text-xs`}>
                {element.type.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-gray-500">#{element.order}</span>
            </div>
            {showRoleInfo && element.taggedRoles && element.taggedRoles.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3 text-gray-400" />
                <div className="flex space-x-1">
                  {element.taggedRoles.map((role, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Element Properties */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {element.isRequired && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
            {element.isRepeatable && (
              <Badge variant="secondary" className="text-xs">Repeatable</Badge>
            )}
            {element.maxRepeats && element.maxRepeats > 1 && (
              <span className="text-xs">Max: {element.maxRepeats}</span>
            )}
          </div>

          {/* Element Content */}
          {renderElementContent()}
        </div>
      </CardContent>
    </Card>
  );
};
