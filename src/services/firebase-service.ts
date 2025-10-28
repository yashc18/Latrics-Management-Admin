import { collection, query, where, getDocs, doc, updateDoc, Timestamp, orderBy, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { FirebaseUser, FirebaseTemplate, FirebaseSubmission, FirebaseActivity, MediaAttachment } from '@/lib/firebase-types';

export const firebaseService = {
  // Helper function to create activity records
  async createActivity(type: string, description: string, userId: string, userName: string, metadata?: Record<string, any>): Promise<void> {
    const activityData = {
      type,
      description,
      userId,
      userName,
      timestamp: Timestamp.now(),
      metadata: metadata || {}
    };
    
    await addDoc(collection(db, 'activity'), activityData);
  },
  // User Requests
  async getUserRequests(): Promise<FirebaseUser[]> {
    const q = query(collection(db, 'User'), where('status', 'in', ['pending', 'approved']));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as FirebaseUser));
  },

  async getAllUsers(): Promise<FirebaseUser[]> {
    const q = query(collection(db, 'User'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as FirebaseUser));
  },

  async approveUser(uid: string, approvedBy: string, note?: string): Promise<void> {
    const userRef = doc(db, 'User', uid);
    await updateDoc(userRef, {
      status: 'approved',
      approvedAt: Timestamp.now(),
      approvedBy,
      rejectionReason: ''
    });

    // Get admin user name and user name for activity log
    const adminDoc = await getDoc(doc(db, 'User', approvedBy));
    const userDoc = await getDoc(doc(db, 'User', uid));
    const adminName = adminDoc.exists() ? adminDoc.data().name || adminDoc.data().email : 'Admin';
    const userName = userDoc.exists() ? userDoc.data().name || userDoc.data().email : uid;

    // Create activity record
    await this.createActivity(
      'user_approved',
      `${userName} approved by ${adminName}${note ? ': ' + note : ''}`,
      uid,
      userName,
      { note, approvedBy: adminName }
    );
  },

  async rejectUser(uid: string, reason: string, rejectedBy: string): Promise<void> {
    const userRef = doc(db, 'User', uid);
    await updateDoc(userRef, {
      status: 'rejected',
      rejectionReason: reason
    });

    // Get admin user name and user name for activity log
    const adminDoc = await getDoc(doc(db, 'User', rejectedBy));
    const userDoc = await getDoc(doc(db, 'User', uid));
    const adminName = adminDoc.exists() ? adminDoc.data().name || adminDoc.data().email : 'Admin';
    const userName = userDoc.exists() ? userDoc.data().name || userDoc.data().email : uid;

    // Create activity record
    await this.createActivity(
      'user_rejected',
      `${userName} rejected by ${adminName}: ${reason}`,
      uid,
      userName,
      { reason, rejectedBy: adminName }
    );
  },

  async deleteUser(uid: string, deletedBy: string): Promise<void> {
    // Get user data before deletion for activity log
    const userDoc = await getDoc(doc(db, 'User', uid));
    const adminDoc = await getDoc(doc(db, 'User', deletedBy));
    const adminName = adminDoc.exists() ? adminDoc.data().name || adminDoc.data().email : 'Admin';
    const userName = userDoc.exists() ? userDoc.data().name || userDoc.data().email : uid;

    // Delete user document
    const userRef = doc(db, 'User', uid);
    await deleteDoc(userRef);

    // Create activity record
    await this.createActivity(
      'user_deleted',
      `${userName} profile deleted by ${adminName}`,
      uid,
      userName,
      { deletedBy: adminName }
    );
  },

  // Templates
  async getTemplates(): Promise<FirebaseTemplate[]> {
    const q = query(
      collection(db, 'Templates'), 
      where('status', 'in', ['draft', 'pending', 'approved'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      templateId: doc.id 
    } as FirebaseTemplate));
  },

  async approveTemplate(id: string, approvedBy: string): Promise<void> {
    const templateRef = doc(db, 'Templates', id);
    await updateDoc(templateRef, {
      status: 'approved',
      approvedAt: Timestamp.now(),
      approvedBy,
      rejectionReason: ''
    });

    // Get admin user name for activity log
    const adminDoc = await getDoc(doc(db, 'User', approvedBy));
    const adminName = adminDoc.exists() ? adminDoc.data().name || adminDoc.data().email : 'Admin';

    // Create activity record
    await this.createActivity(
      'template_approved',
      `Template approved by admin`,
      approvedBy,
      adminName,
      { templateId: id }
    );
  },

  async rejectTemplate(id: string, reason: string, rejectedBy: string): Promise<void> {
    const templateRef = doc(db, 'Templates', id);
    await updateDoc(templateRef, {
      status: 'rejected',
      rejectionReason: reason
    });

    // Get admin user name for activity log
    const adminDoc = await getDoc(doc(db, 'User', rejectedBy));
    const adminName = adminDoc.exists() ? adminDoc.data().name || adminDoc.data().email : 'Admin';

    // Create activity record
    await this.createActivity(
      'template_rejected',
      `Template rejected by admin: ${reason}`,
      rejectedBy,
      adminName,
      { templateId: id, reason }
    );
  },

  // Submissions
  async getSubmissions(): Promise<FirebaseSubmission[]> {
    const q = query(
      collection(db, 'FormSubmissions'),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id,
      ...doc.data() 
    } as FirebaseSubmission));
  },

  async getSubmissionById(id: string): Promise<FirebaseSubmission | null> {
    const docRef = doc(db, 'FormSubmissions', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { 
        id: docSnap.id,
        ...docSnap.data() 
      } as FirebaseSubmission;
    }
    return null;
  },

  async getSubmissionWithTemplate(submissionId: string): Promise<{ submission: FirebaseSubmission; template: FirebaseTemplate | null } | null> {
    const submission = await this.getSubmissionById(submissionId);
    if (!submission) return null;

    const template = await this.getTemplateById(submission.templateId);
    return { submission, template };
  },

  async getTemplateById(templateId: string): Promise<FirebaseTemplate | null> {
    try {
      if (!templateId) return null;
      const docRef = doc(db, 'Templates', templateId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { 
          templateId: docSnap.id,
          ...docSnap.data() 
        } as FirebaseTemplate;
      }
      return null;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  },

  async getUserByUid(uid: string): Promise<FirebaseUser | null> {
    try {
      if (!uid) return null;
      const docRef = doc(db, 'User', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { 
          uid: docSnap.id,
          ...docSnap.data() 
        } as FirebaseUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async getMediaDownloadUrl(storagePath: string): Promise<string | null> {
    try {
      const storageRef = ref(storage, storagePath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  },

  async getSubmissionsWithResolvedData(): Promise<FirebaseSubmission[]> {
    try {
      const submissions = await this.getSubmissions();
      const resolvedSubmissions: FirebaseSubmission[] = [];

      for (const submission of submissions) {
        try {
          // Resolve template name
          const template = submission.templateId ? await this.getTemplateById(submission.templateId) : null;
          const templateName = template?.templateName || 'Template Not Found';

          // Resolve user name
          const user = submission.assigneeUid ? await this.getUserByUid(submission.assigneeUid) : null;
          const userName = user?.name || user?.email || submission.assigneeUsername || submission.assigneeUid || 'Unknown User';

          // Map draft to status
          const status = submission.draft ? 'draft' : 'submitted';

          resolvedSubmissions.push({
            ...submission,
            templateName,
            submittedByName: userName,
            status: status as any,
            submissionId: submission.id
          });
        } catch (error) {
          console.error('Error resolving submission data:', error);
          // Add submission with fallback data
          resolvedSubmissions.push({
            ...submission,
            templateName: 'Template Not Found',
            submittedByName: submission.assigneeUsername || submission.assigneeUid || 'Unknown User',
            status: (submission.draft ? 'draft' : 'submitted') as any,
            submissionId: submission.id
          });
        }
      }

      return resolvedSubmissions;
    } catch (error) {
      console.error('Error getting submissions with resolved data:', error);
      return [];
    }
  },

  // Activity
  async getActivity(): Promise<FirebaseActivity[]> {
    const q = query(collection(db, 'activity'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FirebaseActivity));
  },

  // Admin submission methods
  async getAllSubmissions(): Promise<FirebaseSubmission[]> {
    try {
      const q = query(
        collection(db, 'FormSubmissions'),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id,
        ...doc.data() 
      } as FirebaseSubmission));
    } catch (error) {
      console.error('Error fetching all submissions:', error);
      return [];
    }
  },

  async getSubmissionsFiltered(filters: any): Promise<FirebaseSubmission[]> {
    try {
      let q = query(collection(db, 'FormSubmissions'));
      
      if (filters.templateId) {
        q = query(q, where('templateId', '==', filters.templateId));
      }
      
      if (filters.startDate) {
        q = query(q, where('submittedAt', '>=', filters.startDate));
      }
      
      if (filters.endDate) {
        q = query(q, where('submittedAt', '<=', filters.endDate));
      }
      
      q = query(q, orderBy('submittedAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const submissions = snapshot.docs.map(doc => ({ 
        id: doc.id,
        ...doc.data() 
      } as FirebaseSubmission));
      
      // Apply userId filter client-side (since it's in userContributions)
      if (filters.userId) {
        return submissions.filter(sub => sub.userContributions?.[filters.userId]);
      }
      
      return submissions;
    } catch (error) {
      console.error('Error filtering submissions:', error);
      return [];
    }
  },

  async getSubmissionStatistics(): Promise<any> {
    try {
      const submissions = await this.getAllSubmissions();
      
      // Get unique contributors
      const contributors = new Set<string>();
      const submissionsByTemplate: { [key: string]: number } = {};
      const contributorsByUser: { [key: string]: number } = {};
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let recentActivityCount = 0;
      
      submissions.forEach(sub => {
        // Count by template
        submissionsByTemplate[sub.templateId] = (submissionsByTemplate[sub.templateId] || 0) + 1;
        
        // Count contributors
        if (sub.userContributions) {
          Object.keys(sub.userContributions).forEach(userId => {
            contributors.add(userId);
            contributorsByUser[userId] = (contributorsByUser[userId] || 0) + 1;
          });
          
          // Check recent activity
          const submissionDate = sub.submittedAt?.toDate();
          if (submissionDate && submissionDate > sevenDaysAgo) {
            recentActivityCount++;
          }
        }
      });
      
      return {
        totalSubmissions: submissions.length,
        totalContributors: contributors.size,
        submissionsByTemplate,
        contributorsByUser,
        recentActivityCount
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        totalSubmissions: 0,
        totalContributors: 0,
        submissionsByTemplate: {},
        contributorsByUser: {},
        recentActivityCount: 0
      };
    }
  },

  async exportSubmissionsAsCSV(submissions: FirebaseSubmission[], detailed: boolean = false): Promise<string> {
    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Helper function to get field label from template
    const getFieldLabel = (template: any, fieldId: string): string => {
      if (!template || !template.elements) return fieldId;
      let element = template.elements.find((el: any) => el.id === fieldId);
      
      if (!element && template.elements) {
        for (const el of template.elements) {
          if (el.nestedElements && el.nestedElements.length > 0) {
            const nested = el.nestedElements.find((nel: any) => nel.id === fieldId);
            if (nested) {
              element = nested;
              break;
            }
          }
        }
      }
      
      if (!element) return fieldId;
      return element.label || element.placeholder || element.sectionTitle || fieldId;
    };

    if (!detailed) {
      const headers = ['Template ID', 'Template Name', 'Contributors Count', 'Last Updated'];
      const rows = submissions.map(sub => {
        const contributorCount = sub.userContributions ? Object.keys(sub.userContributions).length : 0;
        const lastUpdated = sub.submittedAt?.toDate().toISOString() || 'N/A';
        return [
          escapeCSV(sub.templateId || sub.id),
          escapeCSV(sub.templateName || 'Unknown Template'),
          escapeCSV(contributorCount.toString()),
          escapeCSV(lastUpdated)
        ];
      });
      
      return [headers.map(escapeCSV), ...rows].map(row => row.join(',')).join('\n');
    } else {
      const headers = ['Template ID', 'Template Name', 'User ID', 'Username', 'Question', 'Answer', 'Contributed At'];
      const rows: string[] = [];
      
      // Get all templates for lookup
      const templates = await this.getTemplates();
      const templateMap = new Map(templates.map(t => [t.templateId, t]));
      
      submissions.forEach(sub => {
        const template = templateMap.get(sub.templateId);
        const templateName = template?.templateName || sub.templateName || 'Unknown Template';
        
        if (sub.userContributions) {
          Object.entries(sub.userContributions).forEach(([userId, contribution]) => {
            if (contribution.data) {
              Object.entries(contribution.data).forEach(([fieldId, value]) => {
                const metadata = contribution.fieldMetadata?.[fieldId];
                const question = metadata?.fieldLabel || getFieldLabel(template, fieldId);
                const sectionLabel = metadata?.sectionLabel || '';
                const answer = value === null || value === undefined || value === '' ? 'Not answered' : String(value);
                
                const fullQuestion = sectionLabel 
                  ? `${question} [Section: ${sectionLabel}]`
                  : question;
                
                rows.push([
                  escapeCSV(sub.templateId || sub.id),
                  escapeCSV(templateName),
                  escapeCSV(userId),
                  escapeCSV(contribution.username || 'Unknown User'),
                  escapeCSV(fullQuestion),
                  escapeCSV(answer),
                  escapeCSV(contribution.contributedAt?.toDate().toISOString() || 'N/A')
                ].join(','));
              });
            }
          });
        }
      });
      
      return [headers.map(escapeCSV), ...rows].join('\n');
    }
  }
};
