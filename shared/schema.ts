import { pgTable, text, serial, integer, boolean, timestamp, json, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum definitions
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'user']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'pending']);
export const departmentEnum = pgEnum('department', ['it', 'hr', 'finance', 'legal', 'marketing', 'operations', 'other']);
export const requestStatusEnum = pgEnum('request_status', ['draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled', 'requires_action']);
export const priorityEnum = pgEnum('priority', ['low', 'normal', 'high', 'urgent']);
export const signatureProviderEnum = pgEnum('signature_provider', ['adobe', 'docusign']);
export const fieldTypeEnum = pgEnum('field_type', ['text', 'textarea', 'number', 'date', 'select', 'checkbox', 'file', 'radio', 'email', 'tel']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // Optional if using SSO only
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  department: departmentEnum("department"),
  role: userRoleEnum("role").notNull().default('user'),
  status: userStatusEnum("status").notNull().default('active'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Request Types (Form Definitions)
export const requestTypes = pgTable("request_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  department: departmentEnum("department").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  fields: json("fields").notNull(), // JSON array of field definitions
  approverConfig: json("approver_config").notNull(), // JSON defining approval workflow
});

// Requests (Submissions)
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  requestTypeId: integer("request_type_id").notNull().references(() => requestTypes.id),
  title: text("title").notNull(),
  description: text("description"),
  status: requestStatusEnum("status").notNull().default('draft'),
  priority: priorityEnum("priority").notNull().default('normal'),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  data: json("data").notNull(), // JSON with form submission data
  currentApprover: integer("current_approver").references(() => users.id),
});

// Request Attachments
export const requestAttachments = pgTable("request_attachments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: 'cascade' }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// Approvals
export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: 'cascade' }),
  approverId: integer("approver_id").notNull().references(() => users.id),
  status: requestStatusEnum("status").notNull().default('pending_approval'),
  comments: text("comments"),
  actionDate: timestamp("action_date"),
  stepOrder: integer("step_order").notNull(), // Order in approval workflow
  notifiedAt: timestamp("notified_at"),
});

// Workflows
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: 'cascade' }),
  currentStep: integer("current_step").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default('active'),
});

// Workflow Steps
export const workflowSteps = pgTable("workflow_steps", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  stepOrder: integer("step_order").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedBy: integer("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  targetAudience: json("target_audience"), // JSON array of departments/roles
});

// Announcement Attachments
export const announcementAttachments = pgTable("announcement_attachments", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// Announcement Reads (for tracking read status)
export const announcementReads = pgTable("announcement_reads", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  readAt: timestamp("read_at").notNull().defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  category: text("category"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  status: text("status").notNull().default('active'),
  requiresSignature: boolean("requires_signature").notNull().default(false),
});

// Document Signatures
export const documentSignatures = pgTable("document_signatures", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  signerId: integer("signer_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'),
  signedAt: timestamp("signed_at"),
  signatureProvider: signatureProviderEnum("signature_provider"),
  externalId: text("external_id"), // ID from DocuSign/Adobe Sign
  signedDocumentPath: text("signed_document_path"),
});

// Quick Links
export const quickLinks = pgTable("quick_links", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  iconPath: text("icon_path"),
  order: integer("order").notNull().default(0),
  category: text("category"),
  visibleTo: json("visible_to"), // JSON defining who can see this link
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// System Settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  description: text("description"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id),
});

// System Logs
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  userId: integer("user_id").references(() => users.id),
  metadata: json("metadata"),
});

// Insert schemas for form validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertRequestTypeSchema = createInsertSchema(requestTypes).omit({ id: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true });
export const insertApprovalSchema = createInsertSchema(approvals).omit({ id: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export const insertQuickLinkSchema = createInsertSchema(quickLinks).omit({ id: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type RequestType = typeof requestTypes.$inferSelect;
export type InsertRequestType = z.infer<typeof insertRequestTypeSchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type QuickLink = typeof quickLinks.$inferSelect;
export type InsertQuickLink = z.infer<typeof insertQuickLinkSchema>;
