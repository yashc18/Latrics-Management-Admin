import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { firebaseService } from "@/services/firebase-service";
import { FirebaseTemplate } from "@/lib/firebase-types";
import { StatusChip } from "@/components/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, MobileTableContainer } from "@/components/MobileOptimized";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ElementRenderer } from "@/components/TemplatePreview/ElementRenderer";

export default function Templates() {
  const [templates, setTemplates] = useState<FirebaseTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FirebaseTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("pending");
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; template?: FirebaseTemplate }>({
    open: false,
  });
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; templateId?: string }>({
    open: false,
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; templateId?: string }>({
    open: false,
  });
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { adminData } = useAuth();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, activeTab]);

  const loadTemplates = async () => {
    try {
      const data = await firebaseService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (activeTab === "pending") {
      filtered = filtered.filter((t) => t.status === "pending");
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.templateName.toLowerCase().includes(query) ||
          t.projectName.toLowerCase().includes(query) ||
          t.templateId.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleApprove = async () => {
    if (!adminData) return;
    
    setLoading(true);
    const templateIds = approveDialog.templateId
      ? [approveDialog.templateId]
      : Array.from(selectedTemplates);

    try {
      for (const id of templateIds) {
        await firebaseService.approveTemplate(id, adminData.uid);
      }

      await loadTemplates();
      setApproveDialog({ open: false });
      setApproveNote("");
      setSelectedTemplates(new Set());
      toast.success(`${templateIds.length} template(s) approved successfully`);
    } catch (error) {
      console.error("Error approving templates:", error);
      toast.error("Failed to approve templates");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setLoading(true);
    const templateIds = rejectDialog.templateId
      ? [rejectDialog.templateId]
      : Array.from(selectedTemplates);

    try {
      for (const id of templateIds) {
        await firebaseService.rejectTemplate(id, rejectReason, adminData.uid);
      }

      await loadTemplates();
      setRejectDialog({ open: false });
      setRejectReason("");
      setSelectedTemplates(new Set());
      toast.success(`${templateIds.length} template(s) rejected`);
    } catch (error) {
      console.error("Error rejecting templates:", error);
      toast.error("Failed to reject templates");
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplateSelection = (templateId: string) => {
    const newSelection = new Set(selectedTemplates);
    if (newSelection.has(templateId)) {
      newSelection.delete(templateId);
    } else {
      newSelection.add(templateId);
    }
    setSelectedTemplates(newSelection);
  };

  return (
    <DashboardLayout>
      <div className="space-y-3 md:space-y-4">
        <PageHeader 
          title="Templates"
          description="Approve or reject form templates"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-9 md:h-10"
              />
            </div>

            {selectedTemplates.size > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 md:flex-none"
                  onClick={() => setApproveDialog({ open: true })}
                >
                  <Check className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Approve ({selectedTemplates.size})</span>
                  <span className="sm:hidden">Approve</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 md:flex-none"
                  onClick={() => setRejectDialog({ open: true })}
                >
                  <X className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Reject ({selectedTemplates.size})</span>
                  <span className="sm:hidden">Reject</span>
                </Button>
              </div>
            )}
          </div>

          <TabsContent value={activeTab} className="mt-4">
            <MobileTableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedTemplates.size === filteredTemplates.length &&
                          filteredTemplates.length > 0
                        }
                        onCheckedChange={() => {
                          if (selectedTemplates.size === filteredTemplates.length) {
                            setSelectedTemplates(new Set());
                          } else {
                            setSelectedTemplates(new Set(filteredTemplates.map((t) => t.templateId)));
                          }
                        }}
                        aria-label="Select all templates"
                      />
                    </TableHead>
                    <TableHead className="min-w-[200px]">Template Name</TableHead>
                    <TableHead className="min-w-[120px]">Template ID</TableHead>
                    <TableHead className="min-w-[120px]">Project Name</TableHead>
                    <TableHead className="min-w-[80px]">Version</TableHead>
                    <TableHead className="min-w-[120px]">Job Roles</TableHead>
                    <TableHead className="min-w-[120px]">Created At</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.templateId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTemplates.has(template.templateId)}
                          onCheckedChange={() => toggleTemplateSelection(template.templateId)}
                          aria-label={`Select ${template.templateName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{template.templateName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{template.templateId}</TableCell>
                      <TableCell>{template.projectName}</TableCell>
                      <TableCell>{template.version}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {Array.isArray(template.jobRoles) 
                            ? template.jobRoles.join(", ") 
                            : typeof template.jobRoles === 'object' && template.jobRoles !== null
                            ? Object.values(template.jobRoles).join(", ")
                            : template.jobRoles || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {template.createdAt.toDate().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={template.status === 'draft' ? 'pending' : template.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewDialog({ open: true, template })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(template.status === "pending" || template.status === "draft") && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setApproveDialog({ open: true, templateId: template.templateId })
                                }
                              >
                                <Check className="h-4 w-4 text-status-approved" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setRejectDialog({ open: true, templateId: template.templateId })
                                }
                              >
                                <X className="h-4 w-4 text-status-rejected" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </MobileTableContainer>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ open })}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewDialog.template?.templateName}</DialogTitle>
            <DialogDescription>
              Version {previewDialog.template?.version} • Project: {previewDialog.template?.projectName}
            </DialogDescription>
          </DialogHeader>
          {previewDialog.template && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4">
                <div>
                  <Label className="text-muted-foreground">Template ID</Label>
                  <p className="text-sm font-mono">{previewDialog.template.templateId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusChip status={previewDialog.template.status === 'draft' ? 'pending' : previewDialog.template.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Job Roles</Label>
                  <p className="text-sm">
                    {Array.isArray(previewDialog.template.jobRoles) 
                      ? previewDialog.template.jobRoles.join(", ") 
                      : typeof previewDialog.template.jobRoles === 'object' && previewDialog.template.jobRoles !== null
                      ? Object.values(previewDialog.template.jobRoles).join(", ")
                      : previewDialog.template.jobRoles || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="text-sm">{previewDialog.template.createdAt.toDate().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-semibold">Form Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    This is how the form will appear to users
                  </p>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {previewDialog.template.elements
                    .sort((a, b) => a.order - b.order)
                    .map((element) => (
                      <ElementRenderer
                        key={element.id}
                        element={element}
                        showRoleInfo={true}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialogs */}
      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this template?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approve-note">Note (optional)</Label>
              <Textarea
                id="approve-note"
                placeholder="Add a note..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setApproveDialog({ open: false })} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading} className="flex-1 sm:flex-none">
              {loading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Template</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false })} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading} className="flex-1 sm:flex-none">
              {loading ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
