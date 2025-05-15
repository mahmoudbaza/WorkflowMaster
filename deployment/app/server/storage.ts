import { 
  users, User, InsertUser, 
  requestTypes, RequestType, InsertRequestType,
  requests, Request, InsertRequest,
  requestAttachments, InsertRequestAttachment,
  approvals, Approval, InsertApproval,
  workflows, Workflow, InsertWorkflow,
  workflowSteps, WorkflowStep, InsertWorkflowStep,
  announcements, Announcement, InsertAnnouncement,
  announcementAttachments, InsertAnnouncementAttachment,
  announcementReads, 
  documents, Document, InsertDocument,
  documentSignatures, DocumentSignature, InsertDocumentSignature,
  quickLinks, QuickLink, InsertQuickLink,
  systemSettings, SystemSettings, 
  systemLogs
} from "@shared/schema";

import { db } from "./db";
import { eq, and, desc, like, isNull, gte, inArray } from "drizzle-orm";
import { configManager } from "./config";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsersByTargetAudience(targetAudience: any): Promise<User[]>;

  // Request type methods
  getRequestType(id: number): Promise<RequestType | undefined>;
  getAllRequestTypes(): Promise<RequestType[]>;
  createRequestType(requestType: Partial<InsertRequestType>): Promise<RequestType>;

  // Request methods
  getRequest(id: number): Promise<Request | undefined>;
  getUserRequests(userId: number): Promise<any[]>;
  getRecentRequests(userId: number, limit?: number): Promise<any[]>;
  createRequest(request: Partial<InsertRequest>): Promise<Request>;
  updateRequestStatus(id: number, status: string): Promise<Request | undefined>;
  
  // Request attachment methods
  addRequestAttachment(attachment: Partial<InsertRequestAttachment>): Promise<any>;

  // Approval methods
  getApproval(id: number): Promise<Approval | undefined>;
  getUserApprovals(userId: number): Promise<any[]>;
  getPendingApprovals(userId: number): Promise<any[]>;
  approveRequest(approvalId: number, userId: number, comments?: string): Promise<Approval>;
  rejectRequest(approvalId: number, userId: number, comments?: string): Promise<Approval>;

  // Workflow methods
  getWorkflow(id: number): Promise<Workflow | undefined>;
  getActiveWorkflows(userId: number): Promise<any[]>;
  getAllWorkflows(): Promise<any[]>;
  startWorkflow(requestId: number): Promise<Workflow>;
  advanceWorkflow(workflowId: number): Promise<Workflow | undefined>;

  // Announcement methods
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getRecentAnnouncements(limit?: number): Promise<any[]>;
  getAllAnnouncements(): Promise<any[]>;
  createAnnouncement(announcement: Partial<InsertAnnouncement>): Promise<Announcement>;
  markAnnouncementRead(announcementId: number, userId: number): Promise<void>;
  addAnnouncementAttachment(attachment: Partial<InsertAnnouncementAttachment>): Promise<any>;

  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getUserDocuments(userId: number): Promise<any[]>;
  getDocumentsToSign(userId: number): Promise<any[]>;
  createDocument(document: Partial<InsertDocument>): Promise<Document>;
  createDocumentSignature(signature: Partial<InsertDocumentSignature>): Promise<DocumentSignature>;
  updateDocumentSignatureStatus(id: number, status: string, signedDocumentPath?: string): Promise<DocumentSignature | undefined>;

  // Quick link methods
  getQuickLinks(): Promise<QuickLink[]>;
  createQuickLink(quickLink: Partial<InsertQuickLink>): Promise<QuickLink>;

  // System settings methods
  getSetting(key: string): Promise<string | undefined>;
  updateSetting(key: string, value: string, userId: number): Promise<void>;
  
  // System logs
  logSystemEvent(level: string, message: string, userId?: number, metadata?: any): Promise<void>;
}

class DbStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.fullName);
  }

  async createUser(user: Partial<InsertUser>): Promise<User> {
    const results = await db.insert(users).values(user as InsertUser).returning();
    await this.logSystemEvent('INFO', `User created: ${user.username}`, undefined, { userId: results[0].id });
    return results[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const results = await db.update(users).set(user).where(eq(users.id, id)).returning();
    if (results.length === 0) return undefined;
    
    await this.logSystemEvent('INFO', `User updated: ${results[0].username}`, undefined, { userId: id });
    return results[0];
  }

  async getUsersByTargetAudience(targetAudience: any): Promise<User[]> {
    if (!targetAudience) {
      return await this.getAllUsers(); // If no target specified, return all users
    }

    // Implementation depends on the structure of targetAudience
    // This is a simplified version
    if (targetAudience.departments) {
      return await db.select().from(users).where(inArray(users.department, targetAudience.departments));
    }

    if (targetAudience.roles) {
      return await db.select().from(users).where(inArray(users.role, targetAudience.roles));
    }

    return await this.getAllUsers();
  }

  // Request type methods
  async getRequestType(id: number): Promise<RequestType | undefined> {
    const results = await db.select().from(requestTypes).where(eq(requestTypes.id, id));
    return results[0];
  }

  async getAllRequestTypes(): Promise<RequestType[]> {
    return await db.select().from(requestTypes).orderBy(requestTypes.name);
  }

  async createRequestType(requestType: Partial<InsertRequestType>): Promise<RequestType> {
    const results = await db.insert(requestTypes).values(requestType as InsertRequestType).returning();
    await this.logSystemEvent('INFO', `Request type created: ${requestType.name}`, requestType.createdBy);
    return results[0];
  }

  // Request methods
  async getRequest(id: number): Promise<Request | undefined> {
    const results = await db.select().from(requests).where(eq(requests.id, id));
    return results[0];
  }

  async getUserRequests(userId: number): Promise<any[]> {
    // Get requests created by the user
    const userRequests = await db.select().from(requests)
      .where(eq(requests.createdBy, userId))
      .orderBy(desc(requests.updatedAt));

    // Enrich with request type information and attachments
    const enrichedRequests = await Promise.all(userRequests.map(async (request) => {
      const requestType = await this.getRequestType(request.requestTypeId);
      const attachments = await db.select().from(requestAttachments)
        .where(eq(requestAttachments.requestId, request.id));

      return {
        ...request,
        typeName: requestType?.name || 'Unknown',
        attachments: attachments || []
      };
    }));

    return enrichedRequests;
  }

  async getRecentRequests(userId: number, limit: number = 5): Promise<any[]> {
    // Get the most recent requests created by the user
    const userRequests = await db.select().from(requests)
      .where(eq(requests.createdBy, userId))
      .orderBy(desc(requests.updatedAt))
      .limit(limit);

    // Enrich with request type information
    const enrichedRequests = await Promise.all(userRequests.map(async (request) => {
      const requestType = await this.getRequestType(request.requestTypeId);
      return {
        ...request,
        typeName: requestType?.name || 'Unknown'
      };
    }));

    return enrichedRequests;
  }

  async createRequest(request: Partial<InsertRequest>): Promise<Request> {
    const results = await db.insert(requests).values(request as InsertRequest).returning();
    await this.logSystemEvent('INFO', `Request created: ${request.title}`, request.createdBy);
    return results[0];
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const results = await db.update(requests)
      .set({ status: status, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    
    if (results.length === 0) return undefined;
    
    await this.logSystemEvent('INFO', `Request status updated: ${results[0].title} -> ${status}`, undefined);
    return results[0];
  }

  // Request attachment methods
  async addRequestAttachment(attachment: Partial<InsertRequestAttachment>): Promise<any> {
    const results = await db.insert(requestAttachments).values(attachment as any).returning();
    return results[0];
  }

  // Approval methods
  async getApproval(id: number): Promise<Approval | undefined> {
    const results = await db.select().from(approvals).where(eq(approvals.id, id));
    return results[0];
  }

  async getUserApprovals(userId: number): Promise<any[]> {
    // Get approvals assigned to this user
    const userApprovals = await db.select().from(approvals)
      .where(eq(approvals.approverId, userId))
      .orderBy(desc(approvals.notifiedAt));

    // Enrich with request information
    const enrichedApprovals = await Promise.all(userApprovals.map(async (approval) => {
      const request = await this.getRequest(approval.requestId);
      if (!request) return null;

      const requester = await this.getUser(request.createdBy);
      const requestType = await this.getRequestType(request.requestTypeId);

      return {
        ...approval,
        requestTitle: request.title,
        requestDescription: request.description,
        requesterName: requester?.fullName || 'Unknown',
        department: requestType?.department || 'Unknown',
        submittedDate: request.createdAt,
        isUrgent: request.priority === 'urgent' || request.priority === 'high'
      };
    }));

    return enrichedApprovals.filter(Boolean) as any[];
  }

  async getPendingApprovals(userId: number): Promise<any[]> {
    // Get pending approvals assigned to this user
    const pendingApprovals = await db.select().from(approvals)
      .where(and(
        eq(approvals.approverId, userId),
        eq(approvals.status, 'pending_approval')
      ))
      .orderBy(desc(approvals.notifiedAt));

    // Enrich with request information
    const enrichedApprovals = await Promise.all(pendingApprovals.map(async (approval) => {
      const request = await this.getRequest(approval.requestId);
      if (!request) return null;

      const requester = await this.getUser(request.createdBy);
      const requestType = await this.getRequestType(request.requestTypeId);
      const attachments = await db.select().from(requestAttachments)
        .where(eq(requestAttachments.requestId, request.id));

      return {
        ...approval,
        requestTitle: request.title,
        title: request.title,
        description: request.description,
        requesterName: requester?.fullName || 'Unknown',
        department: requestType?.department || 'Unknown',
        submittedDate: request.createdAt,
        isUrgent: request.priority === 'urgent' || request.priority === 'high',
        attachments: attachments.map(att => ({
          name: att.fileName,
          url: att.filePath,
          type: att.fileType,
          size: att.fileSize
        }))
      };
    }));

    return enrichedApprovals.filter(Boolean) as any[];
  }

  async approveRequest(approvalId: number, userId: number, comments?: string): Promise<Approval> {
    // Get the approval to verify the user is the approver
    const approval = await this.getApproval(approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }

    if (approval.approverId !== userId) {
      throw new Error("User is not authorized to approve this request");
    }

    // Update the approval record
    const results = await db.update(approvals)
      .set({ 
        status: 'approved', 
        comments: comments || null,
        actionDate: new Date()
      })
      .where(eq(approvals.id, approvalId))
      .returning();

    if (results.length === 0) {
      throw new Error("Failed to update approval status");
    }

    // Get the request and update its status if this was the final approval
    const request = await this.getRequest(approval.requestId);
    if (!request) {
      throw new Error("Associated request not found");
    }

    // Check if there are any remaining pending approvals for this request
    const pendingApprovals = await db.select().from(approvals)
      .where(and(
        eq(approvals.requestId, approval.requestId),
        eq(approvals.status, 'pending_approval')
      ));

    if (pendingApprovals.length === 0) {
      // No more pending approvals, update request status to approved
      await this.updateRequestStatus(approval.requestId, 'approved');
      
      // Advance the workflow if applicable
      const workflow = await db.select().from(workflows)
        .where(eq(workflows.requestId, approval.requestId))
        .limit(1);
      
      if (workflow.length > 0) {
        await this.advanceWorkflow(workflow[0].id);
      }
    }

    await this.logSystemEvent('INFO', `Request approved: ${request.title}`, userId);
    return results[0];
  }

  async rejectRequest(approvalId: number, userId: number, comments?: string): Promise<Approval> {
    // Get the approval to verify the user is the approver
    const approval = await this.getApproval(approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }

    if (approval.approverId !== userId) {
      throw new Error("User is not authorized to reject this request");
    }

    // Update the approval record
    const results = await db.update(approvals)
      .set({ 
        status: 'rejected', 
        comments: comments || null,
        actionDate: new Date()
      })
      .where(eq(approvals.id, approvalId))
      .returning();

    if (results.length === 0) {
      throw new Error("Failed to update approval status");
    }

    // Update the request status to rejected
    const request = await this.getRequest(approval.requestId);
    if (!request) {
      throw new Error("Associated request not found");
    }

    await this.updateRequestStatus(approval.requestId, 'rejected');
    
    // Update workflow status to terminated
    const workflow = await db.select().from(workflows)
      .where(eq(workflows.requestId, approval.requestId))
      .limit(1);
    
    if (workflow.length > 0) {
      await db.update(workflows)
        .set({ status: 'terminated' })
        .where(eq(workflows.id, workflow[0].id));
    }

    await this.logSystemEvent('INFO', `Request rejected: ${request.title}`, userId);
    return results[0];
  }

  // Workflow methods
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const results = await db.select().from(workflows).where(eq(workflows.id, id));
    return results[0];
  }

  async getActiveWorkflows(userId: number): Promise<any[]> {
    // Get workflows associated with requests created by the user
    const userRequests = await db.select().from(requests).where(eq(requests.createdBy, userId));
    const requestIds = userRequests.map(r => r.id);

    // Get active workflows for these requests
    const activeWorkflows = await db.select().from(workflows)
      .where(and(
        inArray(workflows.requestId, requestIds),
        eq(workflows.status, 'active')
      ))
      .orderBy(workflows.dueDate);

    // Enrich workflows with steps and request information
    const enrichedWorkflows = await Promise.all(activeWorkflows.map(async (workflow) => {
      const request = await this.getRequest(workflow.requestId);
      const steps = await db.select().from(workflowSteps)
        .where(eq(workflowSteps.workflowId, workflow.id))
        .orderBy(workflowSteps.stepOrder);

      // Find the current step
      const currentStepIndex = workflow.currentStep;
      const currentStep = steps.find(s => s.stepOrder === currentStepIndex);
      
      // Format for frontend
      return {
        id: workflow.id,
        title: request?.title || 'Unknown Request',
        description: request?.description,
        startDate: workflow.startedAt,
        dueDate: workflow.dueDate,
        status: workflow.currentStep === steps.length && steps.every(s => s.isCompleted) 
          ? 'Completed' 
          : workflow.dueDate && new Date(workflow.dueDate) < new Date() 
            ? 'Delayed' 
            : currentStep && !currentStep.isCompleted && currentStep.assignedTo 
              ? 'Waiting for Input' 
              : 'On Track',
        steps: steps.map(step => ({
          id: step.id,
          name: step.name,
          isCompleted: step.isCompleted
        })),
        nextAction: currentStep && !currentStep.isCompleted ? {
          text: `Next action: ${currentStep.description || currentStep.name}`,
          actionText: 'Complete',
          isUrgent: workflow.dueDate && new Date(workflow.dueDate) < new Date()
        } : null
      };
    }));

    return enrichedWorkflows;
  }

  async getAllWorkflows(): Promise<any[]> {
    // Get all workflows
    const allWorkflows = await db.select().from(workflows).orderBy(desc(workflows.startedAt));

    // Enrich with request info
    const enrichedWorkflows = await Promise.all(allWorkflows.map(async (workflow) => {
      const request = await this.getRequest(workflow.requestId);
      const requestType = request ? await this.getRequestType(request.requestTypeId) : null;
      const steps = await db.select().from(workflowSteps)
        .where(eq(workflowSteps.workflowId, workflow.id))
        .orderBy(workflowSteps.stepOrder);

      return {
        ...workflow,
        requestTitle: request?.title || 'Unknown',
        requestType: requestType?.name || 'Unknown',
        stepCount: steps.length,
        completedSteps: steps.filter(s => s.isCompleted).length
      };
    }));

    return enrichedWorkflows;
  }

  async startWorkflow(requestId: number): Promise<Workflow> {
    const request = await this.getRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    const requestType = await this.getRequestType(request.requestTypeId);
    if (!requestType) {
      throw new Error("Request type not found");
    }

    // Parse the approver configuration from the request type
    const approverConfig = requestType.approverConfig;
    if (!approverConfig || !Array.isArray(approverConfig)) {
      throw new Error("Invalid approver configuration");
    }

    // Create the workflow
    const workflow = await db.insert(workflows).values({
      requestId,
      currentStep: 1,
      startedAt: new Date(),
      dueDate: request.dueDate,
      status: 'active'
    }).returning();

    if (workflow.length === 0) {
      throw new Error("Failed to create workflow");
    }

    // Create workflow steps based on approver config
    for (let i = 0; i < approverConfig.length; i++) {
      const config = approverConfig[i];
      await db.insert(workflowSteps).values({
        workflowId: workflow[0].id,
        name: config.name || `Approval Step ${i+1}`,
        description: config.description,
        stepOrder: i + 1,
        assignedTo: config.approverId,
        isCompleted: false,
        dueDate: config.dueDate
      });

      // Create approval record
      await db.insert(approvals).values({
        requestId,
        approverId: config.approverId,
        status: i === 0 ? 'pending_approval' : 'waiting',
        stepOrder: i + 1,
        notifiedAt: i === 0 ? new Date() : undefined
      });
    }

    // Update request status to pending approval
    await this.updateRequestStatus(requestId, 'pending_approval');

    await this.logSystemEvent('INFO', `Workflow started for request ${requestId}`, request.createdBy);
    return workflow[0];
  }

  async advanceWorkflow(workflowId: number): Promise<Workflow | undefined> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // If workflow is not active, don't advance it
    if (workflow.status !== 'active') {
      return workflow;
    }

    // Get the steps for this workflow
    const steps = await db.select().from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .orderBy(workflowSteps.stepOrder);

    if (steps.length === 0) {
      throw new Error("No steps found for workflow");
    }

    // Check if the current step is completed
    const currentStep = steps.find(s => s.stepOrder === workflow.currentStep);
    if (!currentStep || !currentStep.isCompleted) {
      throw new Error("Current step is not completed");
    }

    // Check if there's a next step
    const nextStepIndex = workflow.currentStep + 1;
    const nextStep = steps.find(s => s.stepOrder === nextStepIndex);

    if (!nextStep) {
      // No more steps, complete the workflow
      const updated = await db.update(workflows)
        .set({ 
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(workflows.id, workflowId))
        .returning();

      // Update the request status
      await this.updateRequestStatus(workflow.requestId, 'completed');

      await this.logSystemEvent('INFO', `Workflow completed for request ${workflow.requestId}`, undefined);
      return updated[0];
    }

    // Advance to the next step
    const updated = await db.update(workflows)
      .set({ currentStep: nextStepIndex })
      .where(eq(workflows.id, workflowId))
      .returning();

    if (updated.length === 0) {
      throw new Error("Failed to update workflow");
    }

    // Update the approvals
    // Mark current step's approval as approved
    await db.update(approvals)
      .set({ status: 'approved' })
      .where(and(
        eq(approvals.requestId, workflow.requestId),
        eq(approvals.stepOrder, workflow.currentStep)
      ));

    // Activate the next approval
    await db.update(approvals)
      .set({ 
        status: 'pending_approval',
        notifiedAt: new Date()
      })
      .where(and(
        eq(approvals.requestId, workflow.requestId),
        eq(approvals.stepOrder, nextStepIndex)
      ));

    await this.logSystemEvent('INFO', `Workflow advanced to step ${nextStepIndex} for request ${workflow.requestId}`, undefined);
    return updated[0];
  }

  // Announcement methods
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const results = await db.select().from(announcements).where(eq(announcements.id, id));
    return results[0];
  }

  async getRecentAnnouncements(limit: number = 5): Promise<any[]> {
    // Get recent active announcements
    const recentAnnouncements = await db.select().from(announcements)
      .where(and(
        eq(announcements.isActive, true),
        or(
          isNull(announcements.expiresAt),
          gte(announcements.expiresAt, new Date())
        )
      ))
      .orderBy(desc(announcements.createdAt))
      .limit(limit);

    // Enrich with author info and attachments
    const enrichedAnnouncements = await Promise.all(recentAnnouncements.map(async (announcement) => {
      const author = await this.getUser(announcement.authorId);
      const attachments = await db.select().from(announcementAttachments)
        .where(eq(announcementAttachments.announcementId, announcement.id));

      return {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        imageUrl: announcement.imageUrl,
        author: author?.fullName || 'Unknown',
        date: announcement.createdAt,
        isNew: new Date(announcement.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Less than 7 days old
        attachments: attachments.map(att => ({
          name: att.fileName,
          url: att.filePath,
          type: att.fileType,
          size: att.fileSize
        }))
      };
    }));

    return enrichedAnnouncements;
  }

  async getAllAnnouncements(): Promise<any[]> {
    // Get all announcements
    const allAnnouncements = await db.select().from(announcements)
      .orderBy(desc(announcements.createdAt));

    // Enrich with author info
    const enrichedAnnouncements = await Promise.all(allAnnouncements.map(async (announcement) => {
      const author = await this.getUser(announcement.authorId);
      const attachments = await db.select().from(announcementAttachments)
        .where(eq(announcementAttachments.announcementId, announcement.id));

      return {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        imageUrl: announcement.imageUrl,
        author: author?.fullName || 'Unknown',
        date: announcement.createdAt,
        isActive: announcement.isActive,
        expiresAt: announcement.expiresAt,
        isNew: new Date(announcement.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Less than 7 days old
        targetAudience: announcement.targetAudience,
        attachments: attachments.map(att => ({
          name: att.fileName,
          url: att.filePath,
          type: att.fileType,
          size: att.fileSize
        }))
      };
    }));

    return enrichedAnnouncements;
  }

  async createAnnouncement(announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    const results = await db.insert(announcements).values(announcement as InsertAnnouncement).returning();
    await this.logSystemEvent('INFO', `Announcement created: ${announcement.title}`, announcement.authorId);
    return results[0];
  }

  async markAnnouncementRead(announcementId: number, userId: number): Promise<void> {
    // Check if already marked as read
    const existing = await db.select().from(announcementReads)
      .where(and(
        eq(announcementReads.announcementId, announcementId),
        eq(announcementReads.userId, userId)
      ));

    if (existing.length === 0) {
      await db.insert(announcementReads).values({
        announcementId,
        userId,
        readAt: new Date()
      });
    }
  }

  async addAnnouncementAttachment(attachment: Partial<InsertAnnouncementAttachment>): Promise<any> {
    const results = await db.insert(announcementAttachments).values(attachment as any).returning();
    return results[0];
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const results = await db.select().from(documents).where(eq(documents.id, id));
    return results[0];
  }

  async getUserDocuments(userId: number): Promise<any[]> {
    // Get documents owned by the user
    const userDocuments = await db.select().from(documents)
      .where(eq(documents.ownerId, userId))
      .orderBy(desc(documents.updatedAt));

    // Get documents where user is a signer
    const signerDocs = await db.select({
      documentId: documentSignatures.documentId,
      status: documentSignatures.status
    }).from(documentSignatures)
      .where(eq(documentSignatures.signerId, userId));

    const signerDocIds = signerDocs.map(d => d.documentId);
    const signerDocuments = signerDocIds.length > 0 
      ? await db.select().from(documents).where(inArray(documents.id, signerDocIds))
      : [];

    // Combine and enrich documents
    const allDocs = [...userDocuments, ...signerDocuments.filter(d => !userDocuments.some(ud => ud.id === d.id))];
    
    const enrichedDocuments = allDocs.map(doc => {
      const signerStatus = signerDocs.find(sd => sd.documentId === doc.id)?.status;
      const now = new Date();
      const uploadDate = new Date(doc.uploadedAt);
      
      // Calculate "days left" for documents requiring signature - just for display purposes
      let daysLeft = 0;
      if (doc.requiresSignature && signerStatus === 'pending') {
        // Random days left based on upload date - in a real system this would come from the signature service
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;
        const elapsed = now.getTime() - uploadDate.getTime();
        daysLeft = Math.max(0, Math.floor((twoWeeks - elapsed) / (24 * 60 * 60 * 1000)));
      }

      return {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        type: doc.fileType?.split('/')[1]?.toUpperCase() || 'Document',
        date: doc.uploadedAt,
        url: doc.filePath,
        size: `${Math.round(doc.fileSize! / 1024)} KB`,
        status: signerStatus === 'pending' ? 'Requires Signature' : 
                signerStatus === 'completed' ? 'Signed' : 'Uploaded',
        category: doc.category || 'General',
        daysLeft: daysLeft,
      };
    });

    return enrichedDocuments;
  }

  async getDocumentsToSign(userId: number): Promise<any[]> {
    // Get documents that require signature from this user
    const pendingSignatures = await db.select().from(documentSignatures)
      .where(and(
        eq(documentSignatures.signerId, userId),
        eq(documentSignatures.status, 'pending')
      ));

    if (pendingSignatures.length === 0) {
      return [];
    }

    const documentIds = pendingSignatures.map(s => s.documentId);
    const documentsToSign = await db.select().from(documents)
      .where(inArray(documents.id, documentIds));

    // Enrich with owner info
    const enrichedDocuments = await Promise.all(documentsToSign.map(async (doc) => {
      const owner = await this.getUser(doc.ownerId);
      
      // Calculate "days left" - in a real system this would come from signature service
      const now = new Date();
      const uploadDate = new Date(doc.uploadedAt);
      const twoWeeks = 14 * 24 * 60 * 60 * 1000;
      const elapsed = now.getTime() - uploadDate.getTime();
      const daysLeft = Math.max(0, Math.floor((twoWeeks - elapsed) / (24 * 60 * 60 * 1000)));

      return {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        type: doc.fileType?.split('/')[1]?.toUpperCase() || 'Document',
        date: doc.uploadedAt,
        url: doc.filePath,
        size: `${Math.round(doc.fileSize! / 1024)} KB`,
        status: 'Requires Signature',
        daysLeft,
        requester: owner?.fullName || 'Unknown'
      };
    }));

    return enrichedDocuments;
  }

  async createDocument(document: Partial<InsertDocument>): Promise<Document> {
    const results = await db.insert(documents).values(document as InsertDocument).returning();
    await this.logSystemEvent('INFO', `Document created: ${document.title}`, document.ownerId);
    return results[0];
  }

  async createDocumentSignature(signature: Partial<InsertDocumentSignature>): Promise<DocumentSignature> {
    const results = await db.insert(documentSignatures).values(signature as InsertDocumentSignature).returning();
    
    const document = await this.getDocument(signature.documentId!);
    const signer = await this.getUser(signature.signerId!);
    
    await this.logSystemEvent('INFO', `Signature requested for document: ${document?.title || 'Unknown'}, signer: ${signer?.fullName || 'Unknown'}`, document?.ownerId);
    return results[0];
  }

  async updateDocumentSignatureStatus(id: number, status: string, signedDocumentPath?: string): Promise<DocumentSignature | undefined> {
    const updateValues: Partial<DocumentSignature> = { 
      status: status,
    };
    
    if (status === 'completed') {
      updateValues.signedAt = new Date();
      if (signedDocumentPath) {
        updateValues.signedDocumentPath = signedDocumentPath;
      }
    }
    
    const results = await db.update(documentSignatures)
      .set(updateValues)
      .where(eq(documentSignatures.id, id))
      .returning();
    
    if (results.length === 0) return undefined;
    
    await this.logSystemEvent('INFO', `Document signature status updated to ${status}`, undefined);
    return results[0];
  }

  // Quick link methods
  async getQuickLinks(): Promise<QuickLink[]> {
    return await db.select().from(quickLinks).orderBy(quickLinks.order);
  }

  async createQuickLink(quickLink: Partial<InsertQuickLink>): Promise<QuickLink> {
    const results = await db.insert(quickLinks).values(quickLink as InsertQuickLink).returning();
    await this.logSystemEvent('INFO', `Quick link created: ${quickLink.title}`, quickLink.createdBy);
    return results[0];
  }

  // System settings methods
  async getSetting(key: string): Promise<string | undefined> {
    const results = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key));
    return results[0]?.settingValue;
  }

  async updateSetting(key: string, value: string, userId: number): Promise<void> {
    const existing = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key));
    
    if (existing.length === 0) {
      await db.insert(systemSettings).values({
        settingKey: key,
        settingValue: value,
        lastUpdated: new Date(),
        lastUpdatedBy: userId
      });
    } else {
      await db.update(systemSettings)
        .set({ 
          settingValue: value,
          lastUpdated: new Date(),
          lastUpdatedBy: userId
        })
        .where(eq(systemSettings.settingKey, key));
    }
    
    await this.logSystemEvent('INFO', `System setting updated: ${key}`, userId);
  }

  // System logs
  async logSystemEvent(level: string, message: string, userId?: number, metadata?: any): Promise<void> {
    await db.insert(systemLogs).values({
      level,
      message,
      userId,
      metadata: metadata || null,
      timestamp: new Date()
    });
  }
}

// Placeholder storage for development purposes
class MemStorage implements IStorage {
  private userMap: Map<number, User> = new Map();
  private requestTypeMap: Map<number, RequestType> = new Map();
  private requestMap: Map<number, Request> = new Map();
  private requestAttachmentsMap: Map<number, any[]> = new Map();
  private approvalMap: Map<number, Approval> = new Map();
  private workflowMap: Map<number, Workflow> = new Map();
  private workflowStepsMap: Map<number, WorkflowStep[]> = new Map();
  private announcementMap: Map<number, Announcement> = new Map();
  private announcementAttachmentsMap: Map<number, any[]> = new Map();
  private announcementReadsMap: Map<string, Date> = new Map();
  private documentMap: Map<number, Document> = new Map();
  private documentSignatureMap: Map<number, DocumentSignature> = new Map();
  private quickLinkMap: Map<number, QuickLink> = new Map();
  private settingsMap: Map<string, string> = new Map();
  private logs: any[] = [];
  
  private userId = 1;
  private requestTypeId = 1;
  private requestId = 1;
  private approvalId = 1;
  private workflowId = 1;
  private announcementId = 1;
  private documentId = 1;
  private documentSignatureId = 1;
  private quickLinkId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed users
    this.createUser({
      username: 'john.smith',
      password: 'password123',
      email: 'john.smith@company.com',
      fullName: 'John Smith',
      department: 'it',
      role: 'admin',
      status: 'active'
    });

    this.createUser({
      username: 'sarah.johnson',
      password: 'password123',
      email: 'sarah.johnson@company.com',
      fullName: 'Sarah Johnson',
      department: 'hr',
      role: 'manager',
      status: 'active'
    });

    this.createUser({
      username: 'alex.wong',
      password: 'password123',
      email: 'alex.wong@company.com',
      fullName: 'Alex Wong',
      department: 'it',
      role: 'user',
      status: 'active'
    });

    // Seed request types
    this.createRequestType({
      name: 'IT Equipment Request',
      description: 'Request for new IT equipment',
      department: 'it',
      createdBy: 1,
      fields: [
        { id: '1', label: 'Equipment Type', type: 'select', required: true, options: ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Other'] },
        { id: '2', label: 'Justification', type: 'textarea', required: true },
        { id: '3', label: 'Urgency', type: 'select', required: true, options: ['Low', 'Medium', 'High'] }
      ],
      approverConfig: [
        { name: 'Manager Approval', description: 'Approval by direct manager', approverId: 2 },
        { name: 'IT Review', description: 'Review by IT department', approverId: 1 }
      ]
    });

    this.createRequestType({
      name: 'Vacation Request',
      description: 'Request for vacation or time off',
      department: 'hr',
      createdBy: 2,
      fields: [
        { id: '1', label: 'Start Date', type: 'date', required: true },
        { id: '2', label: 'End Date', type: 'date', required: true },
        { id: '3', label: 'Reason', type: 'textarea', required: false }
      ],
      approverConfig: [
        { name: 'Manager Approval', description: 'Approval by direct manager', approverId: 2 }
      ]
    });

    // Seed announcements
    this.createAnnouncement({
      title: 'Quarterly All-Hands Meeting',
      content: 'Join us for our Q3 All-Hands meeting on Friday, September 15th at 2:00 PM in the Main Auditorium. We\'ll be discussing our quarterly results, upcoming projects, and recognizing top performers.',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300',
      authorId: 2,
      expiresAt: new Date(2023, 8, 15),
      isActive: true,
      targetAudience: { departments: ['all'] }
    });

    this.createAnnouncement({
      title: 'New Internal Portal System Launch',
      content: 'We\'re excited to announce the launch of our new Internal Portal System. This system will streamline all operational requests, approvals, and forms across our organization. Explore the new features including digital signatures, workflow automation, and more.',
      imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300',
      authorId: 1,
      isActive: true,
      targetAudience: { departments: ['all'] }
    });

    // Seed quick links
    this.createQuickLink({
      title: 'New Request',
      url: '/new-request',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      order: 1,
      createdBy: 1
    });

    this.createQuickLink({
      title: 'Calendar',
      url: '/calendar',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      order: 2,
      createdBy: 1
    });

    this.createQuickLink({
      title: 'Directory',
      url: '/directory',
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      order: 3,
      createdBy: 1
    });

    this.createQuickLink({
      title: 'Help Desk',
      url: '/help',
      iconPath: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      order: 4,
      createdBy: 1
    });

    this.createQuickLink({
      title: 'Document Repository',
      url: '/documents',
      iconPath: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      order: 5,
      createdBy: 1
    });

    // Seed sample requests
    const req1 = this.createRequest({
      requestTypeId: 1,
      title: 'Software License Request',
      description: 'Need Adobe Creative Cloud license',
      status: 'pending_approval',
      priority: 'normal',
      createdBy: 3,
      data: { 
        'Equipment Type': 'Other',
        'Justification': 'Need for design work',
        'Urgency': 'Medium'
      }
    });

    const req2 = this.createRequest({
      requestTypeId: 2,
      title: 'Vacation Request',
      description: 'Summer vacation',
      status: 'approved',
      priority: 'normal',
      createdBy: 3,
      data: {
        'Start Date': '2023-08-10',
        'End Date': '2023-08-20',
        'Reason': 'Family vacation'
      }
    });

    // Create a workflow for the request
    const vacation = this.requestMap.get(2);
    if (vacation) {
      const workflow = this.createWorkflow({
        requestId: vacation.id,
        status: 'completed',
        currentStep: 1,
        completedAt: new Date()
      });
    }

    // Seed document for signature
    this.createDocument({
      title: 'Annual Security Policy',
      description: 'Annual security policy acknowledgment',
      filePath: '/var/data/attachments/security-policy.pdf',
      fileType: 'application/pdf',
      fileSize: 1024 * 1024,
      category: 'Policy',
      ownerId: 1,
      requiresSignature: true
    });

    this.createDocumentSignature({
      documentId: 1,
      signerId: 3,
      status: 'pending',
      signatureProvider: 'docusign'
    });

    this.createDocument({
      title: 'Updated Employee Handbook',
      description: 'Updated employee handbook for 2023',
      filePath: '/var/data/attachments/employee-handbook.pdf',
      fileType: 'application/pdf',
      fileSize: 2 * 1024 * 1024,
      category: 'HR',
      ownerId: 2,
      requiresSignature: true
    });

    this.createDocumentSignature({
      documentId: 2,
      signerId: 3,
      status: 'pending',
      signatureProvider: 'docusign'
    });

    // Create some approvals
    this.createApproval({
      requestId: 1,
      approverId: 1,
      status: 'pending_approval',
      stepOrder: 1,
      notifiedAt: new Date()
    });

    // Create some pending approvals
    this.createApproval({
      requestId: 3,
      approverId: 1,
      status: 'pending_approval',
      stepOrder: 1,
      notifiedAt: new Date()
    });

    this.createRequest({
      requestTypeId: 1,
      title: 'Hardware Purchase Request',
      description: 'Need a new laptop',
      status: 'pending_approval',
      priority: 'urgent',
      createdBy: 2,
      data: { 
        'Equipment Type': 'Laptop',
        'Justification': 'Current one is broken',
        'Urgency': 'High'
      }
    });

    this.createApproval({
      requestId: 3,
      approverId: 1,
      status: 'pending_approval',
      stepOrder: 1,
      notifiedAt: new Date()
    });

    this.createRequest({
      requestTypeId: 2,
      title: 'New Vendor Contract',
      description: 'Contract for new supplier',
      status: 'pending_approval',
      priority: 'normal',
      createdBy: 3,
      data: { }
    });

    this.createApproval({
      requestId: 4,
      approverId: 1,
      status: 'pending_approval',
      stepOrder: 1,
      notifiedAt: new Date()
    });

    this.createRequest({
      requestTypeId: 1,
      title: 'Marketing Budget Increase',
      description: 'Need to increase marketing budget',
      status: 'pending_approval',
      priority: 'normal',
      createdBy: 1,
      data: { }
    });

    this.createApproval({
      requestId: 5,
      approverId: 1,
      status: 'pending_approval',
      stepOrder: 1,
      notifiedAt: new Date()
    });

    // Create a pending contract signature request
    this.createRequest({
      requestTypeId: 1,
      title: 'Contract Signature',
      description: 'Need signature on new contract',
      status: 'requires_action',
      priority: 'normal',
      createdBy: 1,
      data: { }
    });

    // Create active workflows
    this.createWorkflow({
      requestId: 6,
      currentStep: 3,
      startedAt: new Date(2023, 8, 5),
      dueDate: new Date(2023, 8, 15),
      status: 'active'
    });

    this.workflowStepsMap.set(2, [
      {
        id: 4,
        workflowId: 2,
        name: 'IT Setup',
        description: 'Setup IT accounts and equipment',
        stepOrder: 1,
        isCompleted: true,
        completedBy: 1,
        completedAt: new Date(2023, 8, 6)
      },
      {
        id: 5,
        workflowId: 2,
        name: 'HR Forms',
        description: 'Complete HR paperwork',
        stepOrder: 2,
        isCompleted: true,
        completedBy: 2,
        completedAt: new Date(2023, 8, 8)
      },
      {
        id: 6,
        workflowId: 2,
        name: 'Training',
        description: 'Complete onboarding training',
        stepOrder: 3,
        assignedTo: 3,
        isCompleted: false
      },
      {
        id: 7,
        workflowId: 2,
        name: 'Manager Review',
        description: 'Final review by manager',
        stepOrder: 4,
        assignedTo: 2,
        isCompleted: false
      }
    ]);

    this.createWorkflow({
      requestId: 7,
      currentStep: 2,
      startedAt: new Date(2023, 8, 1),
      dueDate: new Date(2023, 8, 30),
      status: 'active'
    });

    this.workflowStepsMap.set(3, [
      {
        id: 8,
        workflowId: 3,
        name: 'Department Submission',
        description: 'Departments submit budget requests',
        stepOrder: 1,
        isCompleted: true,
        completedBy: 1,
        completedAt: new Date(2023, 8, 3)
      },
      {
        id: 9,
        workflowId: 3,
        name: 'Finance Review',
        description: 'Finance team reviews budget',
        stepOrder: 2,
        assignedTo: 2,
        isCompleted: false
      },
      {
        id: 10,
        workflowId: 3,
        name: 'Executive Approval',
        description: 'Final approval by executives',
        stepOrder: 3,
        assignedTo: 1,
        isCompleted: false
      }
    ]);
  }

  private createApproval(approval: Partial<InsertApproval>): Approval {
    const id = this.approvalId++;
    const now = new Date();
    
    const newApproval: Approval = {
      id,
      requestId: approval.requestId!,
      approverId: approval.approverId!,
      status: approval.status || 'pending_approval',
      comments: approval.comments,
      actionDate: approval.actionDate,
      stepOrder: approval.stepOrder!,
      notifiedAt: approval.notifiedAt || now
    };
    
    this.approvalMap.set(id, newApproval);
    return newApproval;
  }

  private createWorkflow(workflow: Partial<InsertWorkflow>): Workflow {
    const id = this.workflowId++;
    const now = new Date();
    
    const newWorkflow: Workflow = {
      id,
      requestId: workflow.requestId!,
      currentStep: workflow.currentStep || 1,
      startedAt: workflow.startedAt || now,
      completedAt: workflow.completedAt,
      dueDate: workflow.dueDate,
      status: workflow.status || 'active'
    };
    
    this.workflowMap.set(id, newWorkflow);
    
    // Create dummy steps if none provided
    if (!this.workflowStepsMap.has(id)) {
      this.workflowStepsMap.set(id, [
        {
          id: 1,
          workflowId: id,
          name: 'Submit Request',
          description: 'Initial request submission',
          stepOrder: 1,
          isCompleted: true,
          completedBy: 3,
          completedAt: now
        },
        {
          id: 2,
          workflowId: id,
          name: 'Manager Approval',
          description: 'Approval by manager',
          stepOrder: 2,
          assignedTo: 2,
          isCompleted: false
        },
        {
          id: 3,
          workflowId: id,
          name: 'Final Review',
          description: 'Final review by department head',
          stepOrder: 3,
          assignedTo: 1,
          isCompleted: false
        }
      ]);
    }
    
    return newWorkflow;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.userMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.userMap.values()).find(u => u.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.userMap.values());
  }

  async createUser(user: Partial<InsertUser>): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    
    const newUser: User = {
      id,
      username: user.username!,
      password: user.password,
      email: user.email || `${user.username}@example.com`,
      fullName: user.fullName || user.username!,
      department: user.department,
      role: user.role || 'user',
      status: user.status || 'active',
      createdAt: now,
      updatedAt: now
    };
    
    this.userMap.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.userMap.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = {
      ...existingUser,
      ...user,
      updatedAt: new Date()
    };
    
    this.userMap.set(id, updatedUser);
    return updatedUser;
  }

  async getUsersByTargetAudience(targetAudience: any): Promise<User[]> {
    if (!targetAudience) {
      return await this.getAllUsers(); // If no target specified, return all users
    }

    // Filter users based on target audience
    return Array.from(this.userMap.values()).filter(user => {
      if (targetAudience.departments && targetAudience.departments.includes('all')) {
        return true;
      }

      if (targetAudience.departments && user.department && targetAudience.departments.includes(user.department)) {
        return true;
      }

      if (targetAudience.roles && user.role && targetAudience.roles.includes(user.role)) {
        return true;
      }

      return false;
    });
  }

  // Request type methods
  async getRequestType(id: number): Promise<RequestType | undefined> {
    return this.requestTypeMap.get(id);
  }

  async getAllRequestTypes(): Promise<RequestType[]> {
    return Array.from(this.requestTypeMap.values());
  }

  async createRequestType(requestType: Partial<InsertRequestType>): Promise<RequestType> {
    const id = this.requestTypeId++;
    const now = new Date();
    
    const newRequestType: RequestType = {
      id,
      name: requestType.name!,
      description: requestType.description,
      department: requestType.department!,
      createdBy: requestType.createdBy!,
      createdAt: now,
      updatedAt: now,
      fields: requestType.fields || [],
      approverConfig: requestType.approverConfig || []
    };
    
    this.requestTypeMap.set(id, newRequestType);
    return newRequestType;
  }

  // Request methods
  async getRequest(id: number): Promise<Request | undefined> {
    return this.requestMap.get(id);
  }

  async getUserRequests(userId: number): Promise<any[]> {
    const userRequests = Array.from(this.requestMap.values())
      .filter(r => r.createdBy === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    return Promise.all(userRequests.map(async (request) => {
      const requestType = await this.getRequestType(request.requestTypeId);
      const attachments = this.requestAttachmentsMap.get(request.id) || [];
      
      return {
        ...request,
        typeName: requestType?.name || 'Unknown',
        type: requestType?.department || 'Other',
        attachments
      };
    }));
  }

  async getRecentRequests(userId: number, limit: number = 5): Promise<any[]> {
    const userRequests = Array.from(this.requestMap.values())
      .filter(r => r.createdBy === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
    
    return Promise.all(userRequests.map(async (request) => {
      const requestType = await this.getRequestType(request.requestTypeId);
      
      return {
        ...request,
        typeName: requestType?.name || 'Unknown',
        type: requestType?.department || 'Other'
      };
    }));
  }

  async createRequest(request: Partial<InsertRequest>): Promise<Request> {
    const id = this.requestId++;
    const now = new Date();
    
    const newRequest: Request = {
      id,
      requestTypeId: request.requestTypeId!,
      title: request.title!,
      description: request.description,
      status: request.status || 'draft',
      priority: request.priority || 'normal',
      createdBy: request.createdBy!,
      createdAt: now,
      updatedAt: now,
      dueDate: request.dueDate,
      data: request.data || {},
      currentApprover: request.currentApprover
    };
    
    this.requestMap.set(id, newRequest);
    
    // Automatically start a workflow for this request
    await this.startWorkflow(id);
    
    return newRequest;
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const request = this.requestMap.get(id);
    if (!request) return undefined;
    
    const updatedRequest = {
      ...request,
      status,
      updatedAt: new Date()
    };
    
    this.requestMap.set(id, updatedRequest);
    return updatedRequest;
  }

  // Request attachment methods
  async addRequestAttachment(attachment: Partial<InsertRequestAttachment>): Promise<any> {
    const requestId = attachment.requestId!;
    const attachments = this.requestAttachmentsMap.get(requestId) || [];
    
    const newAttachment = {
      id: attachments.length + 1,
      requestId,
      fileName: attachment.fileName!,
      filePath: attachment.filePath!,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      uploadedBy: attachment.uploadedBy!,
      uploadedAt: new Date()
    };
    
    attachments.push(newAttachment);
    this.requestAttachmentsMap.set(requestId, attachments);
    
    return newAttachment;
  }

  // Approval methods
  async getApproval(id: number): Promise<Approval | undefined> {
    return this.approvalMap.get(id);
  }

  async getUserApprovals(userId: number): Promise<any[]> {
    const userApprovals = Array.from(this.approvalMap.values())
      .filter(a => a.approverId === userId)
      .sort((a, b) => {
        if (!a.notifiedAt || !b.notifiedAt) return 0;
        return new Date(b.notifiedAt).getTime() - new Date(a.notifiedAt).getTime();
      });
    
    return Promise.all(userApprovals.map(async (approval) => {
      const request = await this.getRequest(approval.requestId);
      if (!request) return null;
      
      const requester = await this.getUser(request.createdBy);
      const requestType = await this.getRequestType(request.requestTypeId);
      
      return {
        ...approval,
        requestTitle: request.title,
        requestDescription: request.description,
        requesterName: requester?.fullName || 'Unknown',
        department: requestType?.department || 'Unknown',
        submittedDate: request.createdAt,
        isUrgent: request.priority === 'urgent' || request.priority === 'high'
      };
    })).then(results => results.filter(Boolean) as any[]);
  }

  async getPendingApprovals(userId: number): Promise<any[]> {
    const pendingApprovals = Array.from(this.approvalMap.values())
      .filter(a => a.approverId === userId && a.status === 'pending_approval')
      .sort((a, b) => {
        if (!a.notifiedAt || !b.notifiedAt) return 0;
        return new Date(b.notifiedAt).getTime() - new Date(a.notifiedAt).getTime();
      });
    
    return Promise.all(pendingApprovals.map(async (approval) => {
      const request = await this.getRequest(approval.requestId);
      if (!request) return null;
      
      const requester = await this.getUser(request.createdBy);
      const requestType = await this.getRequestType(request.requestTypeId);
      const attachments = this.requestAttachmentsMap.get(request.id) || [];
      
      return {
        ...approval,
        id: approval.id.toString(), // Convert to string for frontend
        title: request.title,
        description: request.description,
        requesterName: requester?.fullName || 'Unknown',
        department: requestType?.department?.toUpperCase() || 'OTHER',
        submittedDate: request.createdAt.toISOString(),
        isUrgent: request.priority === 'urgent' || request.priority === 'high',
        attachments: attachments.map(att => ({
          name: att.fileName,
          url: att.filePath,
          type: att.fileType || 'application/octet-stream',
          size: `${Math.round((att.fileSize || 0) / 1024)} KB`
        }))
      };
    })).then(results => results.filter(Boolean) as any[]);
  }

  async approveRequest(approvalId: number, userId: number, comments?: string): Promise<Approval> {
    const approval = this.approvalMap.get(approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }
    
    if (approval.approverId !== userId) {
      throw new Error("User is not authorized to approve this request");
    }
    
    const updatedApproval = {
      ...approval,
      status: 'approved',
      comments,
      actionDate: new Date()
    };
    
    this.approvalMap.set(approvalId, updatedApproval);
    
    // Update request status if needed
    const request = this.requestMap.get(approval.requestId);
    if (request) {
      // Check if all approvals are complete
      const requestApprovals = Array.from(this.approvalMap.values())
        .filter(a => a.requestId === approval.requestId);
      
      const pendingApprovals = requestApprovals.filter(a => a.status === 'pending_approval');
      
      if (pendingApprovals.length === 0) {
        // All approvals are done, update request status
        await this.updateRequestStatus(approval.requestId, 'approved');
        
        // Update workflow
        const workflow = Array.from(this.workflowMap.values())
          .find(w => w.requestId === approval.requestId);
        
        if (workflow) {
          await this.advanceWorkflow(workflow.id);
        }
      }
    }
    
    return updatedApproval;
  }

  async rejectRequest(approvalId: number, userId: number, comments?: string): Promise<Approval> {
    const approval = this.approvalMap.get(approvalId);
    if (!approval) {
      throw new Error("Approval not found");
    }
    
    if (approval.approverId !== userId) {
      throw new Error("User is not authorized to reject this request");
    }
    
    const updatedApproval = {
      ...approval,
      status: 'rejected',
      comments,
      actionDate: new Date()
    };
    
    this.approvalMap.set(approvalId, updatedApproval);
    
    // Update request status
    await this.updateRequestStatus(approval.requestId, 'rejected');
    
    // Update workflow
    const workflow = Array.from(this.workflowMap.values())
      .find(w => w.requestId === approval.requestId);
    
    if (workflow) {
      const updatedWorkflow = {
        ...workflow,
        status: 'terminated'
      };
      this.workflowMap.set(workflow.id, updatedWorkflow);
    }
    
    return updatedApproval;
  }

  // Workflow methods
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflowMap.get(id);
  }

  async getActiveWorkflows(userId: number): Promise<any[]> {
    // Get requests created by the user
    const userRequests = Array.from(this.requestMap.values())
      .filter(r => r.createdBy === userId);
    
    const requestIds = userRequests.map(r => r.id);
    
    // Get active workflows for these requests
    const activeWorkflows = Array.from(this.workflowMap.values())
      .filter(w => requestIds.includes(w.requestId) && w.status === 'active')
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    
    // Enrich with steps and request info
    return Promise.all(activeWorkflows.map(async workflow => {
      const request = await this.getRequest(workflow.requestId);
      const steps = this.workflowStepsMap.get(workflow.id) || [];
      
      // Sort steps by order
      steps.sort((a, b) => a.stepOrder - b.stepOrder);
      
      // Find current step
      const currentStep = steps.find(s => s.stepOrder === workflow.currentStep);
      
      return {
        id: workflow.id.toString(),
        title: request?.title || 'Unknown Request',
        description: request?.description,
        startDate: workflow.startedAt.toISOString(),
        dueDate: workflow.dueDate?.toISOString(),
        status: workflow.currentStep === steps.length && steps.every(s => s.isCompleted) 
          ? 'Completed' 
          : workflow.dueDate && new Date(workflow.dueDate) < new Date() 
            ? 'Delayed' 
            : currentStep && !currentStep.isCompleted && currentStep.assignedTo 
              ? 'Waiting for Input' 
              : 'On Track',
        steps: steps.map(step => ({
          id: step.id.toString(),
          name: step.name,
          isCompleted: step.isCompleted
        })),
        nextAction: currentStep && !currentStep.isCompleted ? {
          text: `Next action: ${currentStep.description || currentStep.name}`,
          actionText: 'Complete',
          isUrgent: workflow.dueDate && new Date(workflow.dueDate) < new Date()
        } : null
      };
    }));
  }

  async getAllWorkflows(): Promise<any[]> {
    const allWorkflows = Array.from(this.workflowMap.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    
    return Promise.all(allWorkflows.map(async workflow => {
      const request = await this.getRequest(workflow.requestId);
      const requestType = request ? await this.getRequestType(request.requestTypeId) : null;
      const steps = this.workflowStepsMap.get(workflow.id) || [];
      
      return {
        ...workflow,
        requestTitle: request?.title || 'Unknown',
        requestType: requestType?.name || 'Unknown',
        stepCount: steps.length,
        completedSteps: steps.filter(s => s.isCompleted).length
      };
    }));
  }

  async startWorkflow(requestId: number): Promise<Workflow> {
    const request = await this.getRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }
    
    const requestType = await this.getRequestType(request.requestTypeId);
    if (!requestType) {
      throw new Error("Request type not found");
    }
    
    // Create workflow
    const workflow = {
      id: this.workflowId++,
      requestId,
      currentStep: 1,
      startedAt: new Date(),
      dueDate: request.dueDate,
      status: 'active'
    } as Workflow;
    
    this.workflowMap.set(workflow.id, workflow);
    
    // Create default steps if no approver config
    if (!requestType.approverConfig || !Array.isArray(requestType.approverConfig) || requestType.approverConfig.length === 0) {
      const steps = [
        {
          id: this.workflowId * 100 + 1,
          workflowId: workflow.id,
          name: 'Submit Request',
          description: 'Initial request submission',
          stepOrder: 1,
          isCompleted: true,
          completedBy: request.createdBy,
          completedAt: new Date()
        },
        {
          id: this.workflowId * 100 + 2,
          workflowId: workflow.id,
          name: 'Review',
          description: 'Review by administrator',
          stepOrder: 2,
          assignedTo: 1, // Admin user
          isCompleted: false
        }
      ];
      
      this.workflowStepsMap.set(workflow.id, steps);
      
      // Create approval
      this.createApproval({
        requestId,
        approverId: 1, // Admin user
        status: 'pending_approval',
        stepOrder: 1,
        notifiedAt: new Date()
      });
    } else {
      // Create steps and approvals based on approver config
      const steps: WorkflowStep[] = [];
      
      for (let i = 0; i < requestType.approverConfig.length; i++) {
        const config = requestType.approverConfig[i];
        
        steps.push({
          id: this.workflowId * 100 + i + 1,
          workflowId: workflow.id,
          name: config.name || `Approval Step ${i+1}`,
          description: config.description,
          stepOrder: i + 1,
          assignedTo: config.approverId,
          isCompleted: false
        });
        
        // Create approval
        this.createApproval({
          requestId,
          approverId: config.approverId,
          status: i === 0 ? 'pending_approval' : 'waiting',
          stepOrder: i + 1,
          notifiedAt: i === 0 ? new Date() : undefined
        });
      }
      
      this.workflowStepsMap.set(workflow.id, steps);
    }
    
    // Update request status
    await this.updateRequestStatus(requestId, 'pending_approval');
    
    return workflow;
  }

  async advanceWorkflow(workflowId: number): Promise<Workflow | undefined> {
    const workflow = this.workflowMap.get(workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    // If workflow is not active, don't advance it
    if (workflow.status !== 'active') {
      return workflow;
    }
    
    // Get steps
    const steps = this.workflowStepsMap.get(workflowId) || [];
    if (steps.length === 0) {
      throw new Error("No steps found for workflow");
    }
    
    // Sort steps by order
    steps.sort((a, b) => a.stepOrder - b.stepOrder);
    
    // Check if current step is completed
    const currentStep = steps.find(s => s.stepOrder === workflow.currentStep);
    if (!currentStep) {
      throw new Error("Current step not found");
    }
    
    // Mark current step as completed if not already
    if (!currentStep.isCompleted) {
      currentStep.isCompleted = true;
      currentStep.completedAt = new Date();
      this.workflowStepsMap.set(workflowId, steps);
    }
    
    // Check if there's a next step
    const nextStepIndex = workflow.currentStep + 1;
    const nextStep = steps.find(s => s.stepOrder === nextStepIndex);
    
    if (!nextStep) {
      // No more steps, complete workflow
      const updatedWorkflow = {
        ...workflow,
        status: 'completed',
        completedAt: new Date()
      };
      
      this.workflowMap.set(workflowId, updatedWorkflow);
      
      // Update request status
      await this.updateRequestStatus(workflow.requestId, 'completed');
      
      return updatedWorkflow;
    }
    
    // Advance to next step
    const updatedWorkflow = {
      ...workflow,
      currentStep: nextStepIndex
    };
    
    this.workflowMap.set(workflowId, updatedWorkflow);
    
    // Update approvals
    // Find current step's approval
    const currentApproval = Array.from(this.approvalMap.values())
      .find(a => a.requestId === workflow.requestId && a.stepOrder === workflow.currentStep);
    
    if (currentApproval) {
      // Mark as approved
      this.approvalMap.set(currentApproval.id, {
        ...currentApproval,
        status: 'approved',
        actionDate: new Date()
      });
    }
    
    // Find next step's approval
    const nextApproval = Array.from(this.approvalMap.values())
      .find(a => a.requestId === workflow.requestId && a.stepOrder === nextStepIndex);
    
    if (nextApproval) {
      // Activate it
      this.approvalMap.set(nextApproval.id, {
        ...nextApproval,
        status: 'pending_approval',
        notifiedAt: new Date()
      });
    }
    
    return updatedWorkflow;
  }

  // Announcement methods
  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    return this.announcementMap.get(id);
  }

  async getRecentAnnouncements(limit: number = 5): Promise<any[]> {
    const recentAnnouncements = Array.from(this.announcementMap.values())
      .filter(a => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > new Date()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    return Promise.all(recentAnnouncements.map(async announcement => {
      const author = await this.getUser(announcement.authorId);
      const attachments = this.announcementAttachmentsMap.get(announcement.id) || [];
      
      return {
        id: announcement.id.toString(),
        title: announcement.title,
        content: announcement.content,
        imageUrl: announcement.imageUrl,
        author: author?.fullName || 'Unknown',
        date: announcement.createdAt.toISOString(),
        isNew: new Date(announcement.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Less than 7 days old
        attachments: attachments.map(att => ({
          name: att.fileName,
          url: att.filePath,
          type: att.fileType || 'application/octet-stream',
          size: `${Math.round((att.fileSize || 0) / 1024)} KB`
        }))
      };
    }));
  }

  async getAllAnnouncements(): Promise<any[]> {
    const allAnnouncements = Array.from(this.announcementMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return Promise.all(allAnnouncements.map(async announcement => {
      const author = await this.getUser(announcement.authorId);
      const attachments = this.announcementAttachmentsMap.get(announcement.id) || [];
      const isRead = this.announcementReadsMap.has(`${announcement.id}-${1}`); // Hardcoded for current user
      
      return {
        id: announcement.id.toString(),
        title: announcement.title,
        content: announcement.content,
        imageUrl: announcement.imageUrl,
        author: author?.fullName || 'Unknown',
        date: announcement.createdAt.toISOString(),
        isActive: announcement.isActive,
        expiresAt: announcement.expiresAt?.toISOString(),
        isNew: new Date(announcement.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Less than 7 days old
        isRead,
        targetAudience: announcement.targetAudience,
        attachments: attachments.map(att => ({
          name: att.fileName,
          url: att.filePath,
          type: att.fileType || 'application/octet-stream',
          size: `${Math.round((att.fileSize || 0) / 1024)} KB`
        }))
      };
    }));
  }

  async createAnnouncement(announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    const id = this.announcementId++;
    const now = new Date();
    
    const newAnnouncement: Announcement = {
      id,
      title: announcement.title!,
      content: announcement.content!,
      imageUrl: announcement.imageUrl,
      authorId: announcement.authorId!,
      createdAt: now,
      updatedAt: now,
      expiresAt: announcement.expiresAt,
      isActive: true,
      targetAudience: announcement.targetAudience
    };
    
    this.announcementMap.set(id, newAnnouncement);
    return newAnnouncement;
  }

  async markAnnouncementRead(announcementId: number, userId: number): Promise<void> {
    const key = `${announcementId}-${userId}`;
    if (!this.announcementReadsMap.has(key)) {
      this.announcementReadsMap.set(key, new Date());
    }
  }

  async addAnnouncementAttachment(attachment: Partial<InsertAnnouncementAttachment>): Promise<any> {
    const announcementId = attachment.announcementId!;
    const attachments = this.announcementAttachmentsMap.get(announcementId) || [];
    
    const newAttachment = {
      id: attachments.length + 1,
      announcementId,
      fileName: attachment.fileName!,
      filePath: attachment.filePath!,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      uploadedAt: new Date()
    };
    
    attachments.push(newAttachment);
    this.announcementAttachmentsMap.set(announcementId, attachments);
    
    return newAttachment;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documentMap.get(id);
  }

  async getUserDocuments(userId: number): Promise<any[]> {
    // Get documents owned by the user
    const userDocuments = Array.from(this.documentMap.values())
      .filter(d => d.ownerId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Get documents where user is a signer
    const signerDocs = Array.from(this.documentSignatureMap.values())
      .filter(s => s.signerId === userId);
    
    const signerDocIds = signerDocs.map(s => s.documentId);
    const signerDocuments = Array.from(this.documentMap.values())
      .filter(d => signerDocIds.includes(d.id));
    
    // Combine and remove duplicates
    const allDocs = [...userDocuments];
    signerDocuments.forEach(doc => {
      if (!allDocs.some(d => d.id === doc.id)) {
        allDocs.push(doc);
      }
    });
    
    // Enrich with status info
    return allDocs.map(doc => {
      const signature = signerDocs.find(s => s.documentId === doc.id);
      
      // Calculate "days left" for demonstration purposes
      let daysLeft = 0;
      if (doc.requiresSignature && signature?.status === 'pending') {
        // Random days left based on upload date
        const now = new Date();
        const uploadDate = new Date(doc.uploadedAt);
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;
        const elapsed = now.getTime() - uploadDate.getTime();
        daysLeft = Math.max(0, Math.floor((twoWeeks - elapsed) / (24 * 60 * 60 * 1000)));
      }
      
      return {
        id: doc.id.toString(),
        title: doc.title,
        description: doc.description,
        type: doc.fileType?.split('/')[1]?.toUpperCase() || 'Document',
        date: doc.uploadedAt.toISOString(),
        url: doc.filePath,
        size: `${Math.round((doc.fileSize || 0) / 1024)} KB`,
        status: signature?.status === 'pending' ? 'Requires Signature' : 
                signature?.status === 'completed' ? 'Signed' : 'Uploaded',
        category: doc.category || 'General',
        daysLeft
      };
    });
  }

  async getDocumentsToSign(userId: number): Promise<any[]> {
    // Get signature requests assigned to this user
    const pendingSignatures = Array.from(this.documentSignatureMap.values())
      .filter(s => s.signerId === userId && s.status === 'pending');
    
    if (pendingSignatures.length === 0) {
      return [];
    }
    
    const documentIds = pendingSignatures.map(s => s.documentId);
    const documentsToSign = Array.from(this.documentMap.values())
      .filter(d => documentIds.includes(d.id));
    
    // Enrich with owner info and days left
    return Promise.all(documentsToSign.map(async doc => {
      const owner = await this.getUser(doc.ownerId);
      
      // Calculate days left
      const now = new Date();
      const uploadDate = new Date(doc.uploadedAt);
      const twoWeeks = 14 * 24 * 60 * 60 * 1000;
      const elapsed = now.getTime() - uploadDate.getTime();
      const daysLeft = Math.max(0, Math.floor((twoWeeks - elapsed) / (24 * 60 * 60 * 1000)));
      
      return {
        id: doc.id.toString(),
        title: doc.title,
        description: doc.description,
        type: doc.fileType?.split('/')[1]?.toUpperCase() || 'Document',
        date: doc.uploadedAt.toISOString(),
        url: doc.filePath,
        size: `${Math.round((doc.fileSize || 0) / 1024)} KB`,
        status: 'Requires Signature',
        daysLeft,
        requester: owner?.fullName || 'Unknown'
      };
    }));
  }

  async createDocument(document: Partial<InsertDocument>): Promise<Document> {
    const id = this.documentId++;
    const now = new Date();
    
    const newDocument: Document = {
      id,
      title: document.title!,
      description: document.description,
      filePath: document.filePath!,
      fileType: document.fileType,
      fileSize: document.fileSize,
      category: document.category,
      ownerId: document.ownerId!,
      uploadedAt: now,
      updatedAt: now,
      status: 'active',
      requiresSignature: document.requiresSignature || false
    };
    
    this.documentMap.set(id, newDocument);
    return newDocument;
  }

  async createDocumentSignature(signature: Partial<InsertDocumentSignature>): Promise<DocumentSignature> {
    const id = this.documentSignatureId++;
    
    const newSignature: DocumentSignature = {
      id,
      documentId: signature.documentId!,
      signerId: signature.signerId!,
      status: signature.status || 'pending',
      signatureProvider: signature.signatureProvider || 'docusign',
      externalId: signature.externalId
    };
    
    this.documentSignatureMap.set(id, newSignature);
    return newSignature;
  }

  async updateDocumentSignatureStatus(id: number, status: string, signedDocumentPath?: string): Promise<DocumentSignature | undefined> {
    const signature = this.documentSignatureMap.get(id);
    if (!signature) return undefined;
    
    const updatedSignature = {
      ...signature,
      status,
      signedAt: status === 'completed' ? new Date() : signature.signedAt,
      signedDocumentPath: signedDocumentPath || signature.signedDocumentPath
    };
    
    this.documentSignatureMap.set(id, updatedSignature);
    return updatedSignature;
  }

  // Quick link methods
  async getQuickLinks(): Promise<QuickLink[]> {
    return Array.from(this.quickLinkMap.values()).sort((a, b) => a.order - b.order);
  }

  async createQuickLink(quickLink: Partial<InsertQuickLink>): Promise<QuickLink> {
    const id = this.quickLinkId++;
    const now = new Date();
    
    const newQuickLink: QuickLink = {
      id,
      title: quickLink.title!,
      url: quickLink.url!,
      iconPath: quickLink.iconPath || '',
      order: quickLink.order || 0,
      category: quickLink.category,
      createdBy: quickLink.createdBy!,
      createdAt: now,
      updatedAt: now
    };
    
    this.quickLinkMap.set(id, newQuickLink);
    return newQuickLink;
  }

  // System settings methods
  async getSetting(key: string): Promise<string | undefined> {
    return this.settingsMap.get(key);
  }

  async updateSetting(key: string, value: string, userId: number): Promise<void> {
    this.settingsMap.set(key, value);
  }

  // System logs
  async logSystemEvent(level: string, message: string, userId?: number, metadata?: any): Promise<void> {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      userId,
      metadata
    });
  }
}

// If using an in-memory database, we would replace the actual database connection with the MemStorage class
export const storage: IStorage = new MemStorage();

// For a real database, we would use the DbStorage class instead
// export const storage: IStorage = new DbStorage();
