import React, { useState } from 'react';
import { FirebaseTemplate } from '@/lib/firebase-types';
import { ElementRenderer } from './ElementRenderer';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Users, 
  FileText, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle,
  Filter,
  Settings,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface TemplatePreviewDialogProps {
  template: FirebaseTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (templateId: string) => Promise<void>;
  onReject?: (templateId: string, reason: string) => Promise<void>;
  currentUserRole?: string;
  isProcessing?: boolean;
}

export const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  template,
  isOpen,
  onClose,
  onApprove,
  onReject,
  currentUserRole = 'Admin',
  isProcessing = false
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!template) return null;

  const handleApprove = async () => {
    if (!onApprove) return;
    
    setIsSubmitting(true);
    try {
      await onApprove(template.templateId);
      toast.success('Template approved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to approve template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    
    // Prompt for rejection reason
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || !reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReject(template.templateId, reason.trim());
      toast.success('Template rejected');
      onClose();
    } catch (error) {
      toast.error('Failed to reject template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFilteredElements = () => {
    if (selectedRole === 'all') {
      return template.elements;
    }
    
    return template.elements.filter(element => {
      // Show elements that have no role restrictions or include the selected role
      return !element.taggedRoles || 
             element.taggedRoles.length === 0 || 
             element.taggedRoles.includes(selectedRole);
    });
  };

  const sortedElements = getFilteredElements()
    .sort((a, b) => a.order - b.order);

  const availableRoles = template.availableJobRoles || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                {template.templateName}
              </DialogTitle>
              <DialogDescription className="text-base">
                Template ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{template.templateId}</code>
                {' • '}Version {template.version} • Project: {template.projectName}
              </DialogDescription>
            </div>
            <Badge className={`${getStatusColor(template.status)} text-sm px-3 py-1`}>
              {template.status.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Role Filter */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <h3 className="text-lg font-medium">Role-Based Preview</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">View as:</Label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">All Roles (Admin View)</option>
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                {selectedRole === 'all' 
                  ? 'Showing all elements (Admin view)'
                  : `Showing elements visible to: ${selectedRole}`
                }
              </div>
              
              {/* Template Elements - Full Width Layout */}
              <div className="space-y-4 w-full">
                {sortedElements.length > 0 ? (
                  sortedElements.map((element) => (
                    <ElementRenderer
                      key={element.id}
                      element={element}
                      showRoleInfo={selectedRole === 'all'}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No elements match the selected role filter.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Template ID</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">{template.templateId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Project Name</Label>
                    <p className="text-sm">{template.projectName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Version</Label>
                    <p className="text-sm">{template.version}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm">{template.description || 'No description provided'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {template.createdAt ? template.createdAt.toDate().toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  {template.approvedAt && (
                    <div>
                      <Label className="text-sm font-medium">Approved</Label>
                      <p className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {template.approvedAt.toDate().toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Created By</Label>
                    <p className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {template.createdBy}
                    </p>
                  </div>
                  {template.approvedBy && (
                    <div>
                      <Label className="text-sm font-medium">Approved By</Label>
                      <p className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {template.approvedBy}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Available Job Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {availableRoles.map((role, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>

        <Separator />

        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          
          {template.status === 'pending' && (
            <>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
