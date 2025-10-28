// Mock data types aligned with Android field naming
export type UserType = "External" | "Internal" | "InVigilator";

export interface UserRequest {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  department: string;
  phone: string;
  jobRole: string;
  userType: UserType;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

export interface Section {
  id: string;
  title: string;
  fields: Field[];
}

export interface Field {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  required: boolean;
  validations?: string[];
}

export interface TemplateItem {
  id: string;
  templateId: string;
  templateName: string;
  version: string;
  ownerName: string;
  submittedAt: string;
  visibility: {
    roles: string[];
    locations: string[];
  };
  status: "pending" | "approved" | "rejected";
  sections: Section[];
}

export interface Answer {
  fieldId: string;
  fieldLabel: string;
  value: string | number | boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  type: "image" | "document";
  url: string;
}

export interface Submission {
  id: string;
  submissionId: string;
  templateId: string;
  templateName: string;
  userId: string;
  displayName: string;
  submittedAt: string;
  status: "submitted" | "approved" | "rejected";
  reviewStatus: "unreviewed" | "approved" | "rejected";
  answers: Answer[];
  attachments: Attachment[];
  device?: string;
  platform?: string;
  appVersion?: string;
  location?: string;
}

export interface ActivityItem {
  id: string;
  actorName: string;
  action: string;
  entityType: "user" | "template" | "submission";
  entityId: string;
  timestamp: string;
  status: "success" | "failure";
}

// Mock data generators
const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"];
const jobRoles = ["Manager", "Developer", "Designer", "Analyst", "Coordinator", "Specialist"];
const userTypes: UserType[] = ["External", "Internal", "InVigilator"];

function randomDate(daysAgo: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

function randomStatus<T extends string>(statuses: T[]): T {
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Generate user requests
export function generateUserRequests(count: number = 50): UserRequest[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `UR${String(i + 1).padStart(4, "0")}`,
    userId: `USR${String(i + 1).padStart(6, "0")}`,
    displayName: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    department: departments[Math.floor(Math.random() * departments.length)],
    phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    jobRole: jobRoles[Math.floor(Math.random() * jobRoles.length)],
    userType: userTypes[Math.floor(Math.random() * userTypes.length)],
    requestedAt: randomDate(60),
    status: randomStatus(["pending", "approved", "rejected"]),
    notes: i % 3 === 0 ? "Additional verification required" : undefined,
  }));
}

// Generate templates
export function generateTemplates(count: number = 30): TemplateItem[] {
  const templateNames = [
    "Employee Onboarding",
    "Security Audit",
    "Equipment Request",
    "Leave Application",
    "Expense Report",
    "Performance Review",
    "Training Request",
    "Incident Report",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `TPL${String(i + 1).padStart(4, "0")}`,
    templateId: `TMPL${String(i + 1).padStart(6, "0")}`,
    templateName: templateNames[i % templateNames.length],
    version: `v${Math.floor(i / templateNames.length) + 1}.0`,
    ownerName: `Admin ${Math.floor(Math.random() * 5) + 1}`,
    submittedAt: randomDate(45),
    visibility: {
      roles: ["Admin", "Manager"].slice(0, Math.floor(Math.random() * 2) + 1),
      locations: ["HQ", "Branch A", "Branch B"].slice(0, Math.floor(Math.random() * 3) + 1),
    },
    status: randomStatus(["pending", "approved", "rejected"]),
    sections: [
      {
        id: "sec1",
        title: "Basic Information",
        fields: [
          { id: "f1", label: "Full Name", type: "text", required: true },
          { id: "f2", label: "Employee ID", type: "text", required: true },
          { id: "f3", label: "Date", type: "date", required: true },
        ],
      },
      {
        id: "sec2",
        title: "Details",
        fields: [
          { id: "f4", label: "Description", type: "text", required: false },
          { id: "f5", label: "Amount", type: "number", required: false },
        ],
      },
    ],
  }));
}

// Generate submissions
export function generateSubmissions(count: number = 100): Submission[] {
  const templateNames = [
    "Employee Onboarding",
    "Security Audit",
    "Equipment Request",
    "Leave Application",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `SUB${String(i + 1).padStart(4, "0")}`,
    submissionId: `SUBM${String(i + 1).padStart(6, "0")}`,
    templateId: `TMPL${String(Math.floor(Math.random() * 10) + 1).padStart(6, "0")}`,
    templateName: templateNames[Math.floor(Math.random() * templateNames.length)],
    userId: `USR${String(Math.floor(Math.random() * 50) + 1).padStart(6, "0")}`,
    displayName: `User ${Math.floor(Math.random() * 50) + 1}`,
    submittedAt: randomDate(30),
    status: randomStatus(["submitted", "approved", "rejected"]),
    reviewStatus: randomStatus(["unreviewed", "approved", "rejected"]),
    answers: [
      { fieldId: "f1", fieldLabel: "Full Name", value: `Name ${i + 1}` },
      { fieldId: "f2", fieldLabel: "Employee ID", value: `EMP${i + 1}` },
      { fieldId: "f3", fieldLabel: "Date", value: randomDate(15) },
    ],
    attachments: i % 3 === 0 ? [
      { id: "att1", filename: "document.pdf", type: "document", url: "#" },
    ] : [],
    device: i % 2 === 0 ? "Pixel 6" : "Samsung Galaxy S21",
    platform: "Android 13",
    appVersion: "1.2.3",
    location: i % 4 === 0 ? "New York, USA" : undefined,
  }));
}

// Generate activity
export function generateActivity(count: number = 100): ActivityItem[] {
  const actions = [
    "approved user request",
    "rejected user request",
    "approved template",
    "rejected template",
    "exported submissions",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `ACT${String(i + 1).padStart(5, "0")}`,
    actorName: `Admin ${Math.floor(Math.random() * 5) + 1}`,
    action: actions[Math.floor(Math.random() * actions.length)],
    entityType: randomStatus(["user", "template", "submission"]),
    entityId: `ENT${String(i + 1).padStart(6, "0")}`,
    timestamp: randomDate(14),
    status: randomStatus(["success", "failure"]),
  }));
}

// In-memory mock state
class MockDataStore {
  private users: UserRequest[] = generateUserRequests();
  private templates: TemplateItem[] = generateTemplates();
  private submissions: Submission[] = generateSubmissions();
  private activity: ActivityItem[] = generateActivity();

  // Users
  async getUserRequests(): Promise<UserRequest[]> {
    await this.delay();
    return [...this.users];
  }

  async approveUser(id: string, note?: string): Promise<void> {
    await this.delay();
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.status = "approved";
      user.notes = note;
      this.addActivity(`Admin User`, `approved user request`, "user", id, "success");
    }
  }

  async rejectUser(id: string, reason: string): Promise<void> {
    await this.delay();
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.status = "rejected";
      user.notes = reason;
      this.addActivity(`Admin User`, `rejected user request`, "user", id, "success");
    }
  }

  // Templates
  async getTemplates(): Promise<TemplateItem[]> {
    await this.delay();
    return [...this.templates];
  }

  async approveTemplate(id: string, note?: string): Promise<void> {
    await this.delay();
    const template = this.templates.find((t) => t.id === id);
    if (template) {
      template.status = "approved";
      this.addActivity(`Admin User`, `approved template`, "template", id, "success");
    }
  }

  async rejectTemplate(id: string, reason: string): Promise<void> {
    await this.delay();
    const template = this.templates.find((t) => t.id === id);
    if (template) {
      template.status = "rejected";
      this.addActivity(`Admin User`, `rejected template`, "template", id, "success");
    }
  }

  // Submissions
  async getSubmissions(): Promise<Submission[]> {
    await this.delay();
    return [...this.submissions];
  }

  async getSubmissionById(id: string): Promise<Submission | undefined> {
    await this.delay();
    return this.submissions.find((s) => s.id === id);
  }

  // Activity
  async getActivity(): Promise<ActivityItem[]> {
    await this.delay();
    return [...this.activity].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private addActivity(
    actorName: string,
    action: string,
    entityType: ActivityItem["entityType"],
    entityId: string,
    status: ActivityItem["status"]
  ) {
    this.activity.unshift({
      id: `ACT${String(this.activity.length + 1).padStart(5, "0")}`,
      actorName,
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      status,
    });
  }

  async reset(): Promise<void> {
    await this.delay();
    this.users = generateUserRequests();
    this.templates = generateTemplates();
    this.submissions = generateSubmissions();
    this.activity = generateActivity();
  }

  private delay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockDataStore = new MockDataStore();
