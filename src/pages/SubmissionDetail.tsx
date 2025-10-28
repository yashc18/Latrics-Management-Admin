import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { firebaseService } from "@/services/firebase-service";
import { FirebaseSubmission, FirebaseTemplate, FirebaseUser, MediaAttachment, UserContribution } from "@/lib/firebase-types";
import { StatusChip } from "@/components/StatusChip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Link as LinkIcon, Image as ImageIcon, FileText, Users, ChevronDown, ChevronUp, User } from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SubmissionDetail() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<FirebaseSubmission | null>(null);
  const [template, setTemplate] = useState<FirebaseTemplate | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [expandedContributors, setExpandedContributors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (submissionId) {
      loadSubmission(submissionId);
    }
  }, [submissionId]);

  const loadSubmission = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch submission
      const submissionData = await firebaseService.getSubmissionById(id);
      if (!submissionData) {
        toast.error("Submission not found");
        return;
      }

      setSubmission(submissionData);

      // Fetch template
      if (submissionData.templateId) {
        const templateData = await firebaseService.getTemplateById(submissionData.templateId);
        setTemplate(templateData);
      }

      // If there's an assigneeUid at top level, fetch user data
      if (submissionData.assigneeUid) {
        const userData = await firebaseService.getUserByUid(submissionData.assigneeUid);
        setUser(userData);
      }

      // Load media download URLs from first user contribution if any
      const firstContribution = submissionData.userContributions && 
        Object.values(submissionData.userContributions)[0];
      if (firstContribution && firstContribution.media && firstContribution.media.length > 0) {
        const urlMap = new Map<string, string>();
        for (const media of firstContribution.media) {
          const url = await firebaseService.getMediaDownloadUrl(media.storagePath);
          if (url) {
            urlMap.set(media.storagePath, url);
          }
        }
        setMediaUrls(urlMap);
      }
    } catch (error) {
      console.error("Error loading submission:", error);
      toast.error("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const toggleContributor = (userId: string) => {
    const newExpanded = new Set(expandedContributors);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedContributors(newExpanded);
  };

  const getContributorCount = () => {
    return submission?.userContributions ? Object.keys(submission.userContributions).length : 0;
  };

  const handleDownload = async (type: "pdf" | "excel") => {
    setDownloading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("File ready for download", {
      description: `Downloaded as ${type.toUpperCase()}`,
    });
    setDownloading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading submission...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!submission) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Submission not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => navigate("/submissions")} className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" disabled={downloading}>
                  <Download className="mr-2 h-4 w-4" />
                  {downloading ? "Preparing..." : "Download"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("excel")}>
                  Download as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{submission.submissionId || submission.id}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submitted {submission.submittedAt ? submission.submittedAt.toDate().toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusChip status={submission.status || (submission.draft ? 'draft' : 'submitted')} />
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Template</span>
                  <p className="mt-1 font-medium">{template?.templateName || 'Template Not Found'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Project</span>
                  <p className="mt-1 font-medium">{template?.projectName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Assignment ID</span>
                  <p className="mt-1 font-mono text-sm">{submission.assignmentId || submission.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <p className="mt-1 text-sm">{submission.draft ? 'Draft' : 'Submitted'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Version</span>
                  <p className="mt-1 text-sm">{submission.version || '1'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Created</span>
                  <p className="mt-1 text-sm">
                    {submission.createdAt?.toDate().toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                  <p className="mt-1 text-sm">
                    {submission.updatedAt?.toDate().toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Submitted At</span>
                  <p className="mt-1 text-sm">
                    {submission.submittedAt?.toDate().toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Contributors Summary */}
              {submission.userContributions && Object.keys(submission.userContributions).length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Contributors</h4>
                  <div className="space-y-2">
                    {Object.entries(submission.userContributions).map(([userId, contribution]) => (
                      <div key={userId} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{contribution.username || userId}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Object.keys(contribution.data || {}).length} responses • 
                          {contribution.contributedAt?.toDate().toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Responses ({getContributorCount()} contributors)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {submission.userContributions && Object.keys(submission.userContributions).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(submission.userContributions).map(([userId, contribution]) => {
                    const isExpanded = expandedContributors.has(userId);
                    
                    // Group fields by section
                    const sectionGroups: { [sectionKey: string]: { [fieldId: string]: any } } = {};
                    const topLevelFields: { [fieldId: string]: any } = {};
                    
                    Object.entries(contribution.data || {}).forEach(([fieldId, value]) => {
                      const metadata = contribution.fieldMetadata?.[fieldId];
                      if (metadata?.sectionPath && metadata.sectionPath.length > 0) {
                        const sectionKey = metadata.sectionPath.join(' > ');
                        if (!sectionGroups[sectionKey]) {
                          sectionGroups[sectionKey] = {};
                        }
                        sectionGroups[sectionKey][fieldId] = value;
                      } else {
                        topLevelFields[fieldId] = value;
                      }
                    });

                    return (
                      <Collapsible
                        key={userId}
                        open={isExpanded}
                        onOpenChange={() => toggleContributor(userId)}
                        className="rounded-lg border bg-card"
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-primary" />
                              <div className="text-left">
                                <p className="font-medium">{contribution.username || userId}</p>
                                <p className="text-sm text-muted-foreground">
                                  {contribution.contributedAt?.toDate().toLocaleString()} • 
                                  {Object.keys(contribution.data || {}).length} responses
                                </p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="px-4 pb-4">
                          <div className="space-y-4">
                            {/* Top-level fields (no section) */}
                            {Object.keys(topLevelFields).length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                                  General Information
                                </h4>
                                {Object.entries(topLevelFields).map(([fieldId, value]) => {
                                  const metadata = contribution.fieldMetadata?.[fieldId];
                                  const label = metadata?.fieldLabel || fieldId;
                                  
                                  return (
                                    <div key={fieldId} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2">
                                      <div className="font-medium text-sm text-muted-foreground">
                                        {label}:
                                      </div>
                                      <div className="md:col-span-2 text-sm">
                                        {String(value || 'N/A')}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Sectioned fields */}
                            {Object.entries(sectionGroups).map(([sectionKey, fields]) => (
                              <div key={sectionKey} className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                                  {sectionKey}
                                </h4>
                                {Object.entries(fields).map(([fieldId, value]) => {
                                  const metadata = contribution.fieldMetadata?.[fieldId];
                                  const label = metadata?.fieldLabel || fieldId;
                                  
                                  return (
                                    <div key={fieldId} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2">
                                      <div className="font-medium text-sm text-muted-foreground">
                                        {label}:
                                      </div>
                                      <div className="md:col-span-2 text-sm">
                                        {String(value || 'N/A')}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : Object.keys(submission.data || {}).length > 0 ? (
                // Fallback to legacy data structure
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                    Legacy Submission Data
                  </h4>
                  {Object.entries(submission.data || {}).map(([elementId, value]) => {
                    const element = template?.elements?.find(el => el.id === elementId);
                    const label = element?.label || `Field ${elementId}`;
                    
                    let displayValue = value;
                    if (element?.type === 'YES_NO_TOGGLE') {
                      displayValue = value ? 'Yes' : 'No';
                    } else if (element?.type === 'DATE_PICKER' && typeof value === 'string') {
                      try {
                        displayValue = new Date(value).toLocaleDateString();
                      } catch {
                        displayValue = value;
                      }
                    } else if (element?.type === 'PHOTO_UPLOAD') {
                      displayValue = 'Photo uploaded (see Media Gallery)';
                    }

                    return (
                      <div key={elementId} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2">
                        <div className="font-medium text-sm text-muted-foreground">
                          {label}:
                        </div>
                        <div className="md:col-span-2 text-sm">
                          {String(displayValue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No responses recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Submission created */}
              {submission.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Submission Created</p>
                    <p className="text-xs text-muted-foreground">
                      {submission.createdAt.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* User contributions */}
              {submission.userContributions && Object.entries(submission.userContributions).map(([userId, contribution]) => (
                <div key={userId} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {contribution.username || userId} contributed {Object.keys(contribution.data || {}).length} responses
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contribution.contributedAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {/* Last updated */}
              {submission.updatedAt && submission.updatedAt !== submission.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {submission.updatedAt.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Submitted */}
              {submission.submittedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {submission.draft ? 'Draft Saved' : 'Submission Submitted'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {submission.submittedAt.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {submission.media && submission.media.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Media Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {submission.media.map((media, index) => {
                  const downloadUrl = mediaUrls.get(media.storagePath);
                  const isImage = media.mimeType.startsWith('image/');
                  
                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-3 rounded-lg border p-3"
                    >
                      {isImage && downloadUrl ? (
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                          <img
                            src={downloadUrl}
                            alt={media.caption || 'Uploaded image'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {media.caption || `Media ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {media.mimeType} • {(media.size / 1024).toFixed(1)} KB
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {media.uploadedAt.toDate().toLocaleString()}
                        </p>
                        {downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(downloadUrl, '_blank')}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
