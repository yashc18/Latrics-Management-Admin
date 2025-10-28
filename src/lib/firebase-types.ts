import { Timestamp } from 'firebase/firestore';

export interface FirebaseUser {
  uid: string;
  email: string;
  name: string;
  phone: string;
  companyName: string;
  jobTitle: string;
  licenseId: string;
  status: 'pending' | 'approved' | 'rejected';
  isProjectManager: boolean;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectionReason?: string;
  permissions: {
    canCreateTemplates: boolean;
    canApproveUsers: boolean;
    canManageJobRoles: boolean;
  };
}

export interface FirebaseTemplate {
  templateId: string;
  templateName: string;
  description: string;
  projectName: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectionReason?: string;
  version: number;
  jobRoles: string[];
  availableJobRoles: string[];
  elements: TemplateElement[];
}

export interface TemplateElement {
  id: string;
  type: 'TITLE' | 'SUBTITLE' | 'TEXT_INPUT' | 'NUMBER_INPUT' | 'DATE_PICKER' | 'YES_NO_TOGGLE' | 'PHOTO_UPLOAD' | 'SAVE_DRAFT' | 'SUBMIT_FORM' | 'CONTAINER';
  label: string;
  order: number;
  isRequired: boolean;
  isRepeatable: boolean;
  maxRepeats: number;
  repeatCount: number;
  taggedRoles: string[];
  nestedElements: TemplateElement[];
  placeholder: string;
  sectionTitle: string;
  parentElementId: string;
  sectionLevel?: number;
  sectionPath?: string;
}

export interface MediaAttachment {
  elementId: string;
  storagePath: string;
  localUri: string;
  mimeType: string;
  size: number;
  caption: string;
  uploadedAt: Timestamp;
}

export interface FirebaseSubmission {
  // Android schema fields
  id: string;
  assignmentId: string;
  templateId: string;
  assigneeUsername: string;
  assigneeUid: string;
  data: {
    [elementId: string]: any;
  };
  media: MediaAttachment[];
  submittedAt: Timestamp;
  draft: boolean;
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Legacy fields for backwards compatibility
  submissionId?: string;
  templateName?: string;
  projectName?: string;
  submittedBy?: string;
  submittedByName?: string;
  userRole?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  formData?: {
    [key: string]: any;
    attachments?: Attachment[];
    metadata?: SubmissionMetadata;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Timestamp;
  };
}

export interface Attachment {
  id: string;
  fieldId: string;
  fileName: string;
  originalName: string;
  downloadUrl: string;
  mimeType: string;
  fileSize: string;
  uploadedAt: Timestamp;
}

export interface SubmissionMetadata {
  appVersion: string;
  deviceInfo: string;
  isOfflineSubmission: boolean;
  submissionDuration: number;
  syncedAt: Timestamp;
}

export interface FirebaseActivity {
  id: string;
  type: 'user_approved' | 'user_rejected' | 'user_deleted' | 'template_approved' | 'template_rejected' | 'submission_created' | 'submission_updated';
  description: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}
