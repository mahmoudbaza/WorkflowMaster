import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { configManager } from "./config";
import { microsoftService } from "./services/microsoft";
import { signatureService } from "./services/signature";
import { emailService } from "./services/email";
import multer from "multer";
import path from "path";
import fs from "fs";
import { users, insertUserSchema } from "@shared/schema";

// Set up file upload handling
const setupFileUploads = (app: Express) => {
  const attachmentPath = configManager.get("ATTACHMENT_PATH") || path.join(process.cwd(), "uploads");
  
  // Ensure the upload directory exists
  if (!fs.existsSync(attachmentPath)) {
    fs.mkdirSync(attachmentPath, { recursive: true });
  }
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, attachmentPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  return multer({ 
    storage,
    limits: {
      fileSize: parseInt(configManager.get("MAX_ATTACHMENT_SIZE_MB") || "10") * 1024 * 1024, // 10MB default
    },
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const upload = setupFileUploads(app);
  
  // Authentication routes
  app.get("/api/auth/microsoft", (req, res) => {
    // Redirect to Microsoft login page
    const redirectUrl = microsoftService.getAuthUrl();
    res.redirect(redirectUrl);
  });
  
  app.get("/api/auth/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }
      
      const tokenData = await microsoftService.getTokenFromCode(code);
      const userInfo = await microsoftService.getUserInfo(tokenData.access_token);
      
      // Check if user exists, create if not
      let user = await storage.getUserByEmail(userInfo.mail || userInfo.userPrincipalName);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          username: userInfo.userPrincipalName,
          email: userInfo.mail || userInfo.userPrincipalName,
          fullName: userInfo.displayName,
          status: 'active',
          role: 'user', // Default role
        });
      }
      
      // Set session
      if (req.session) {
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;
      }
      
      res.redirect('/');
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });
  
  app.get("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.redirect('/');
      });
    } else {
      res.redirect('/');
    }
  });
  
  // User profile and session info
  app.get("/api/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send sensitive info
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user information" });
    }
  });
  
  // Announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getRecentAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });
  
  app.get("/api/announcements/all", async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching all announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });
  
  app.post("/api/announcements", upload.array("attachments"), async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const announcement = await storage.createAnnouncement({
        title: req.body.title,
        content: req.body.content,
        imageUrl: req.body.imageUrl,
        authorId: req.session.userId,
        expiresAt: req.body.expiresAt,
        targetAudience: req.body.targetAudience ? JSON.parse(req.body.targetAudience) : null,
      });
      
      // Handle attachments if any
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await storage.addAnnouncementAttachment({
            announcementId: announcement.id,
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
          });
        }
      }
      
      // Send email notification if requested
      if (req.body.sendEmail === 'true') {
        const users = await storage.getUsersByTargetAudience(announcement.targetAudience);
        await emailService.sendAnnouncementEmail(announcement, users);
      }
      
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });
  
  // Requests
  app.get("/api/requests", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const requests = await storage.getUserRequests(req.session.userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });
  
  app.get("/api/requests/recent", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const requests = await storage.getRecentRequests(req.session.userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching recent requests:", error);
      res.status(500).json({ message: "Failed to fetch recent requests" });
    }
  });
  
  app.post("/api/requests", upload.array("attachments"), async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const request = await storage.createRequest({
        requestTypeId: parseInt(req.body.type),
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority || 'normal',
        createdBy: req.session.userId,
        data: req.body.data ? JSON.parse(req.body.data) : {},
      });
      
      // Handle attachments if any
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          await storage.addRequestAttachment({
            requestId: request.id,
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedBy: req.session.userId,
          });
        }
      }
      
      // Start the approval workflow
      await storage.startWorkflow(request.id);
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ message: "Failed to create request" });
    }
  });
  
  // Approvals
  app.get("/api/approvals", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const approvals = await storage.getUserApprovals(req.session.userId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });
  
  app.get("/api/approvals/pending", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const approvals = await storage.getPendingApprovals(req.session.userId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });
  
  app.post("/api/approvals/:id/approve", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const approvalId = parseInt(req.params.id);
      const approval = await storage.approveRequest(approvalId, req.session.userId, req.body.comments);
      
      // Send notification email to the requester
      const request = await storage.getRequest(approval.requestId);
      if (request) {
        const requester = await storage.getUser(request.createdBy);
        if (requester && requester.email) {
          await emailService.sendApprovalNotification(request, approval, requester.email);
        }
      }
      
      res.json(approval);
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ message: "Failed to approve request" });
    }
  });
  
  app.post("/api/approvals/:id/reject", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const approvalId = parseInt(req.params.id);
      const approval = await storage.rejectRequest(approvalId, req.session.userId, req.body.comments);
      
      // Send notification email to the requester
      const request = await storage.getRequest(approval.requestId);
      if (request) {
        const requester = await storage.getUser(request.createdBy);
        if (requester && requester.email) {
          await emailService.sendRejectionNotification(request, approval, requester.email);
        }
      }
      
      res.json(approval);
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ message: "Failed to reject request" });
    }
  });
  
  // Workflows
  app.get("/api/workflows/active", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const workflows = await storage.getActiveWorkflows(req.session.userId);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching active workflows:", error);
      res.status(500).json({ message: "Failed to fetch active workflows" });
    }
  });
  
  // Documents
  app.get("/api/documents", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const documents = await storage.getUserDocuments(req.session.userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  
  app.get("/api/documents/to-sign", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const documents = await storage.getDocumentsToSign(req.session.userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents to sign:", error);
      res.status(500).json({ message: "Failed to fetch documents to sign" });
    }
  });
  
  app.post("/api/documents", upload.single("file"), async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }
      
      const document = await storage.createDocument({
        title: req.body.title,
        description: req.body.description,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        category: req.body.category,
        ownerId: req.session.userId,
        requiresSignature: req.body.requiresSignature === 'true',
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });
  
  app.post("/api/documents/:id/request-signature", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to request signatures for this document" });
      }
      
      const signerIds = req.body.signerIds;
      if (!signerIds || !Array.isArray(signerIds) || signerIds.length === 0) {
        return res.status(400).json({ message: "At least one signer is required" });
      }
      
      // Get signer information
      const signers = await Promise.all(signerIds.map(id => storage.getUser(parseInt(id))));
      
      // Send signature requests
      const signatureProvider = configManager.get("SIGNATURE_PROVIDER") as "adobe" | "docusign";
      const signatureRequests = await signatureService.requestSignatures(document, signers, signatureProvider);
      
      // Save signature requests to database
      for (let i = 0; i < signerIds.length; i++) {
        await storage.createDocumentSignature({
          documentId: document.id,
          signerId: parseInt(signerIds[i]),
          status: 'pending',
          signatureProvider,
          externalId: signatureRequests[i].id,
        });
      }
      
      res.json({ message: "Signature requests sent successfully" });
    } catch (error) {
      console.error("Error requesting signatures:", error);
      res.status(500).json({ message: "Failed to request signatures" });
    }
  });
  
  // Quick Links
  app.get("/api/quicklinks", async (req, res) => {
    try {
      const quickLinks = await storage.getQuickLinks();
      res.json(quickLinks);
    } catch (error) {
      console.error("Error fetching quick links:", error);
      res.status(500).json({ message: "Failed to fetch quick links" });
    }
  });
  
  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/admin/request-types", async (req, res) => {
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const requestTypes = await storage.getAllRequestTypes();
      res.json(requestTypes);
    } catch (error) {
      console.error("Error fetching request types:", error);
      res.status(500).json({ message: "Failed to fetch request types" });
    }
  });
  
  app.get("/api/admin/workflows", async (req, res) => {
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const workflows = await storage.getAllWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });
  
  // Config routes
  app.get("/api/config", async (req, res) => {
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      const config = configManager.getPublicConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });
  
  app.post("/api/config", async (req, res) => {
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    try {
      // Validate the config data
      const newConfig = req.body;
      
      // Update the configuration
      await configManager.updateConfig(newConfig, req.session.userId);
      
      res.json({ message: "Configuration updated successfully" });
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  return httpServer;
}
