// Types for Announcements
export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  imageUrl?: string;
  isNew?: boolean;
  isRead?: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: string;
  }[];
}

// Types for Requests
export interface Request {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: string;
  }[];
}

// Types for Workflows
export interface Workflow {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  status: string;
  steps: WorkflowStep[];
  nextAction?: {
    text: string;
    actionText: string;
    isUrgent: boolean;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  isCompleted: boolean;
  assignedTo?: string;
  completedBy?: string;
  completedAt?: string;
}

// Types for Approvals
export interface Approval {
  id: string;
  title: string;
  description?: string;
  requesterName: string;
  department: string;
  submittedDate: string;
  isUrgent: boolean;
  status?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: string;
  }[];
}

// Types for Documents
export interface Document {
  id: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  url?: string;
  size: string;
  status: string;
  category: string;
  daysLeft?: number;
  createdBy?: string;
  signers?: string[];
  signatureInfo?: {
    signedBy?: string;
    signedAt?: string;
    status: string;
  };
}

// Types for Quick Links
export interface QuickLink {
  id: string;
  title: string;
  url: string;
  iconPath: string;
  order: number;
  category?: string;
}

// Types for Users
export interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  department?: string;
  role?: string;
  status?: string;
  isAdmin?: boolean;
  lastLogin?: string;
}

// Types for Form Builder
export interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  validation?: string;
  order: number;
}

export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  department: string;
  fields: FormField[];
  approvers: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// System Configuration
export interface SystemConfig {
  appPort: number;
  attachmentPath: string;
  logPath: string;
  signatureProvider: 'adobe' | 'docusign';
  enableEmailApprovals: boolean;
  useSSO: boolean;
  maxAttachmentSizeMB: number;
  dbConnectionString: string;
  deployEnv: 'development' | 'staging' | 'production';
  microsoftIntegration: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  emailSettings: {
    sender: string;
    senderName: string;
  };
  signatureSettings: {
    apiKey: string;
    accountId: string;
    userId: string;
    baseUri: string;
    storeInDb: boolean;
    storeInFileSystem: boolean;
  };
}
