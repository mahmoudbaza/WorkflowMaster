import nodemailer from 'nodemailer';
import { storage } from '../storage';
import { configManager } from '../config';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { Attachment } from 'nodemailer/lib/mailer';

// Define the Handlebars template delegate type
type HandlebarsTemplateDelegate = (context?: any) => string;

interface EmailSettings {
  smtpServer: string;
  smtpPort: number;
  useSSL: boolean;
  username: string;
  password: string;
  defaultSender: string;
  defaultSenderName: string | null;
  maxRetries: number;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateName?: string;
  templateData?: Record<string, any>;
  from?: string;
  fromName?: string;
  attachments?: Attachment[];
  cc?: string | string[];
  bcc?: string | string[];
  relatedEntityType?: string;
  relatedEntityId?: number;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private settings: EmailSettings | null = null;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private initialized = false;

  /**
   * Initialize the email service
   */
  async init(): Promise<void> {
    try {
      // Try to get settings from database
      const smtpServer = await storage.getSetting('SMTP_SERVER');
      const smtpPort = await storage.getSetting('SMTP_PORT');
      const useSSL = await storage.getSetting('SMTP_USE_SSL');
      const username = await storage.getSetting('SMTP_USERNAME');
      const password = await storage.getSetting('SMTP_PASSWORD');
      const defaultSender = await storage.getSetting('EMAIL_SENDER');
      const defaultSenderName = await storage.getSetting('EMAIL_SENDER_NAME');
      const maxRetries = await storage.getSetting('EMAIL_MAX_RETRIES');

      if (smtpServer && smtpPort && defaultSender) {
        this.settings = {
          smtpServer,
          smtpPort: parseInt(smtpPort, 10),
          useSSL: useSSL === 'true',
          username: username || '',
          password: password || '',
          defaultSender,
          defaultSenderName: defaultSenderName || null,
          maxRetries: maxRetries ? parseInt(maxRetries, 10) : 3
        };
      } else {
        // Fallback to config settings
        const emailSender = configManager.get('EMAIL_SENDER') || 'portal@company.com';
        const emailSenderName = configManager.get('EMAIL_SENDER_NAME') || 'Internal Portal System';

        this.settings = {
          smtpServer: 'smtp.office365.com',
          smtpPort: 587,
          useSSL: true,
          username: emailSender,
          password: 'placeholder_password', // This should be set via environment variables
          defaultSender: emailSender,
          defaultSenderName: emailSenderName,
          maxRetries: 3
        };
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: this.settings.smtpServer,
        port: this.settings.smtpPort,
        secure: this.settings.useSSL,
        auth: this.settings.username ? {
          user: this.settings.username,
          pass: this.settings.password
        } : undefined,
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });

      this.initialized = true;
      console.log('Email service initialized');
    } catch (error) {
      console.error('Failed to initialize email service', error);
      throw error;
    }
  }

  /**
   * Send an email
   * @param options Email options
   * @returns Promise resolving to the message ID
   */
  async sendEmail(options: SendEmailOptions): Promise<string> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.transporter || !this.settings) {
      throw new Error('Email service not initialized');
    }

    try {
      let html = options.html;
      let text = options.text;

      // If a template is specified, render it
      if (options.templateName && options.templateData) {
        const template = await this.getEmailTemplate(options.templateName);
        if (template) {
          try {
            const templateData = {
              ...options.templateData,
              year: new Date().getFullYear()
            };
            html = template(templateData);
          } catch (err) {
            console.error(`Error rendering email template ${options.templateName}:`, err);
            throw new Error(`Failed to render email template: ${err.message}`);
          }
        } else {
          throw new Error(`Email template not found: ${options.templateName}`);
        }
      }

      if (!html && !text) {
        throw new Error('Email must have either HTML or text content');
      }

      const from = options.fromName
        ? `"${options.fromName}" <${options.from || this.settings.defaultSender}>`
        : options.from || (this.settings.defaultSenderName
          ? `"${this.settings.defaultSenderName}" <${this.settings.defaultSender}>`
          : this.settings.defaultSender);

      // Send email
      const result = await this.transporter.sendMail({
        from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments
      });

      // Log email in database
      try {
        let templateId = null;
        if (options.templateName) {
          const template = await storage.getEmailTemplateByName(options.templateName);
          if (template) {
            templateId = template.id;
          }
        }

        const emailId = await storage.createEmailLog({
          recipient: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          body: html || text || '',
          status: 'sent',
          templateId,
          relatedEntityType: options.relatedEntityType,
          relatedEntityId: options.relatedEntityId,
          sender: options.from || this.settings.defaultSender,
          senderName: options.fromName || this.settings.defaultSenderName,
          metadata: JSON.stringify({ messageId: result.messageId })
        });

        // Log attachments if any
        if (options.attachments && options.attachments.length > 0) {
          for (const attachment of options.attachments) {
            if (attachment.path) {
              const stats = fs.statSync(attachment.path);
              await storage.createEmailAttachment({
                emailId,
                fileName: attachment.filename || path.basename(attachment.path),
                filePath: attachment.path,
                fileType: attachment.contentType || 'application/octet-stream',
                fileSize: stats.size
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to log email to database:', err);
        // Don't throw error, as the email was sent successfully
      }

      return result.messageId;
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Log failed email
      try {
        let templateId = null;
        if (options.templateName) {
          const template = await storage.getEmailTemplateByName(options.templateName);
          if (template) {
            templateId = template.id;
          }
        }

        await storage.createEmailLog({
          recipient: Array.isArray(options.to) ? options.to.join(', ') : options.to,
          subject: options.subject,
          body: options.html || options.text || '',
          status: 'failed',
          templateId,
          relatedEntityType: options.relatedEntityType,
          relatedEntityId: options.relatedEntityId,
          sender: options.from || this.settings.defaultSender,
          senderName: options.fromName || this.settings.defaultSenderName,
          errorMessage: error.message,
          metadata: JSON.stringify({ error: error.message })
        });
      } catch (err) {
        console.error('Failed to log failed email to database:', err);
      }

      throw error;
    }
  }

  /**
   * Get email template by name
   * @param templateName Template name
   * @returns Compiled template
   */
  private async getEmailTemplate(templateName: string): Promise<HandlebarsTemplateDelegate | null> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      // Get template from database
      const template = await storage.getEmailTemplateByName(templateName);
      if (template) {
        const compiled = Handlebars.compile(template.body);
        this.templateCache.set(templateName, compiled);
        return compiled;
      }
    } catch (err) {
      console.error(`Failed to get email template ${templateName}:`, err);
    }

    return null;
  }

  /**
   * Send a welcome email to a new user
   * @param userId User ID
   * @param password Initial password (if any)
   * @returns Promise resolving to the message ID
   */
  async sendWelcomeEmail(userId: number, password?: string): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const baseUrl = configManager.get('BASE_URL') || 'http://localhost:7001';
    const loginUrl = `${baseUrl}/login`;

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to the Internal Portal System',
      templateName: 'welcome_email',
      templateData: {
        name: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        password: password || 'Your administrator-set password',
        loginUrl
      },
      relatedEntityType: 'user',
      relatedEntityId: userId
    });
  }

  /**
   * Send an approval request email
   * @param approvalId Approval ID
   * @returns Promise resolving to the message ID
   */
  async sendApprovalRequestEmail(approvalId: number): Promise<string> {
    const approval = await storage.getApproval(approvalId);
    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }

    const request = await storage.getRequest(approval.requestId);
    if (!request) {
      throw new Error(`Request not found: ${approval.requestId}`);
    }

    const requester = await storage.getUser(request.createdBy);
    if (!requester) {
      throw new Error(`Requester not found: ${request.createdBy}`);
    }

    const approver = await storage.getUser(approval.approverId);
    if (!approver) {
      throw new Error(`Approver not found: ${approval.approverId}`);
    }

    const requestType = await storage.getRequestType(request.requestTypeId);
    if (!requestType) {
      throw new Error(`Request type not found: ${request.requestTypeId}`);
    }

    const baseUrl = configManager.get('BASE_URL') || 'http://localhost:7001';
    const approveUrl = `${baseUrl}/api/approvals/${approvalId}/approve?token=${this.generateToken(approvalId, 'approve')}`;
    const rejectUrl = `${baseUrl}/api/approvals/${approvalId}/reject?token=${this.generateToken(approvalId, 'reject')}`;
    const portalUrl = `${baseUrl}/approvals/${approvalId}`;

    return this.sendEmail({
      to: approver.email,
      subject: `Request Requires Your Approval: ${request.title}`,
      templateName: 'approval_request',
      templateData: {
        approverName: approver.fullName,
        requestTitle: request.title,
        requesterName: requester.fullName,
        requestType: requestType.name,
        submissionDate: new Date(request.createdAt).toLocaleDateString(),
        description: request.description,
        approveUrl,
        rejectUrl,
        portalUrl
      },
      relatedEntityType: 'approval',
      relatedEntityId: approvalId
    });
  }

  /**
   * Send a request status update email
   * @param requestId Request ID
   * @param status New status
   * @param comments Comments (if any)
   * @returns Promise resolving to the message ID
   */
  async sendRequestStatusUpdateEmail(requestId: number, status: string, comments?: string): Promise<string> {
    const request = await storage.getRequest(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    const requester = await storage.getUser(request.createdBy);
    if (!requester) {
      throw new Error(`Requester not found: ${request.createdBy}`);
    }

    const requestType = await storage.getRequestType(request.requestTypeId);
    if (!requestType) {
      throw new Error(`Request type not found: ${request.requestTypeId}`);
    }

    let statusClass = '';
    switch (status) {
      case 'approved':
        statusClass = 'approved';
        break;
      case 'rejected':
        statusClass = 'rejected';
        break;
      case 'in_progress':
      case 'pending_approval':
        statusClass = 'in-progress';
        break;
      case 'completed':
        statusClass = 'completed';
        break;
      default:
        statusClass = '';
    }

    const baseUrl = configManager.get('BASE_URL') || 'http://localhost:7001';
    const portalUrl = `${baseUrl}/requests/${requestId}`;

    return this.sendEmail({
      to: requester.email,
      subject: `Request Status Update: ${request.title}`,
      templateName: 'request_status_update',
      templateData: {
        requesterName: requester.fullName,
        requestTitle: request.title,
        requestType: requestType.name,
        submissionDate: new Date(request.createdAt).toLocaleDateString(),
        status: this.formatStatus(status),
        statusClass,
        comments,
        portalUrl
      },
      relatedEntityType: 'request',
      relatedEntityId: requestId
    });
  }

  /**
   * Send a document signature request email
   * @param signatureId Signature ID
   * @returns Promise resolving to the message ID
   */
  async sendSignatureRequestEmail(signatureId: number): Promise<string> {
    const signature = await storage.getDocumentSignature(signatureId);
    if (!signature) {
      throw new Error(`Signature request not found: ${signatureId}`);
    }

    const document = await storage.getDocument(signature.documentId);
    if (!document) {
      throw new Error(`Document not found: ${signature.documentId}`);
    }

    const owner = await storage.getUser(document.ownerId);
    if (!owner) {
      throw new Error(`Document owner not found: ${document.ownerId}`);
    }

    const signer = await storage.getUser(signature.signerId);
    if (!signer) {
      throw new Error(`Signer not found: ${signature.signerId}`);
    }

    const baseUrl = configManager.get('BASE_URL') || 'http://localhost:7001';
    const signUrl = `${baseUrl}/documents/sign/${signatureId}`;

    // Set expiration date (30 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    return this.sendEmail({
      to: signer.email,
      subject: `Document Awaiting Your Signature: ${document.title}`,
      templateName: 'signature_request',
      templateData: {
        signerName: signer.fullName,
        documentTitle: document.title,
        senderName: owner.fullName,
        sharedDate: new Date(signature.createdAt).toLocaleDateString(),
        description: document.description,
        signUrl,
        expirationDate: expirationDate.toLocaleDateString()
      },
      relatedEntityType: 'document_signature',
      relatedEntityId: signatureId
    });
  }

  /**
   * Send an announcement notification email
   * @param announcementId Announcement ID
   * @param recipientId Recipient user ID
   * @returns Promise resolving to the message ID
   */
  async sendAnnouncementEmail(announcementId: number, recipientId: number): Promise<string> {
    const announcement = await storage.getAnnouncement(announcementId);
    if (!announcement) {
      throw new Error(`Announcement not found: ${announcementId}`);
    }

    const author = await storage.getUser(announcement.authorId);
    if (!author) {
      throw new Error(`Announcement author not found: ${announcement.authorId}`);
    }

    const recipient = await storage.getUser(recipientId);
    if (!recipient) {
      throw new Error(`Recipient not found: ${recipientId}`);
    }

    const baseUrl = configManager.get('BASE_URL') || 'http://localhost:7001';
    const portalUrl = `${baseUrl}/announcements/${announcementId}`;

    return this.sendEmail({
      to: recipient.email,
      subject: `New Announcement: ${announcement.title}`,
      templateName: 'announcement_notification',
      templateData: {
        recipientName: recipient.fullName,
        announcementTitle: announcement.title,
        announcementContent: announcement.content,
        announcementImage: announcement.imageUrl,
        authorName: author.fullName,
        postDate: new Date(announcement.createdAt).toLocaleDateString(),
        portalUrl
      },
      relatedEntityType: 'announcement',
      relatedEntityId: announcementId
    });
  }

  /**
   * Generate a secure token for email actions
   * @param id Entity ID
   * @param action Action type
   * @returns Secure token
   */
  private generateToken(id: number, action: string): string {
    // In a real implementation, this would use a secure method like JWT
    // with proper signing and verification
    const timestamp = Date.now();
    const data = `${id}:${action}:${timestamp}`;
    
    // This is a simplified implementation - should use proper crypto in production
    return Buffer.from(data).toString('base64');
  }

  /**
   * Format status string for display
   * @param status Status string
   * @returns Formatted status
   */
  private formatStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export const emailService = new EmailService();

// Define empty stubs for storage methods that don't exist yet
// These should be implemented in storage.ts
declare module '../storage' {
  interface IStorage {
    getEmailTemplateByName(name: string): Promise<any>;
    createEmailLog(log: any): Promise<number>;
    createEmailAttachment(attachment: any): Promise<any>;
    getDocumentSignature(id: number): Promise<any>;
  }
}

// Initialize extensions to the storage interface if they don't already exist
if (!storage.getEmailTemplateByName) {
  storage.getEmailTemplateByName = async (name: string) => {
    // Temporary implementation until database table is available
    const templates: Record<string, { id: number, body: string }> = {
      'welcome_email': {
        id: 1,
        body: `<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0056b3; color: white; padding: 10px 20px; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { font-size: 12px; color: #777; padding: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to the Internal Portal System</h1>
        </div>
        <div class="content">
            <p>Hello {{name}},</p>
            <p>Welcome to the Internal Portal System! Your account has been created successfully.</p>
            <p>Here are your account details:</p>
            <ul>
                <li><strong>Username:</strong> {{username}}</li>
                <li><strong>Email:</strong> {{email}}</li>
                <li><strong>Role:</strong> {{role}}</li>
            </ul>
            <p>You can log in to the system using the link below:</p>
            <p><a href="{{loginUrl}}" style="background-color: #0056b3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Login to Portal</a></p>
            <p>If you have any questions or need assistance, please contact the system administrator.</p>
            <p>Thank you,<br>Internal Portal System Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{year}} Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
      },
      'approval_request': {
        id: 2,
        body: `<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0056b3; color: white; padding: 10px 20px; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { font-size: 12px; color: #777; padding: 20px; text-align: center; }
        .button { display: inline-block; padding: 10px 15px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px; }
        .button.approve { background-color: #28a745; }
        .button.reject { background-color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Request Approval Required</h1>
        </div>
        <div class="content">
            <p>Hello {{approverName}},</p>
            <p>A new request requires your approval:</p>
            <p><strong>Request Title:</strong> {{requestTitle}}</p>
            <p><strong>Requested By:</strong> {{requesterName}}</p>
            <p><strong>Request Type:</strong> {{requestType}}</p>
            <p><strong>Submitted On:</strong> {{submissionDate}}</p>
            <p><strong>Description:</strong> {{description}}</p>
            
            <p>Please review this request and take action by clicking one of the buttons below:</p>
            
            <p>
                <a href="{{approveUrl}}" class="button approve">Approve Request</a>
                <a href="{{rejectUrl}}" class="button reject">Reject Request</a>
            </p>
            
            <p>Alternatively, you can log in to the Internal Portal System to review the full details and take action:</p>
            <p><a href="{{portalUrl}}" style="color: #0056b3;">View Request in Portal</a></p>
            
            <p>Thank you,<br>Internal Portal System</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{year}} Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
      },
      'request_status_update': {
        id: 3,
        body: `<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0056b3; color: white; padding: 10px 20px; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { font-size: 12px; color: #777; padding: 20px; text-align: center; }
        .status { padding: 5px 10px; border-radius: 4px; display: inline-block; font-weight: bold; }
        .status.approved { background-color: #d4edda; color: #155724; }
        .status.rejected { background-color: #f8d7da; color: #721c24; }
        .status.in-progress { background-color: #d1ecf1; color: #0c5460; }
        .status.completed { background-color: #d4edda; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Request Status Update</h1>
        </div>
        <div class="content">
            <p>Hello {{requesterName}},</p>
            <p>The status of your request has been updated:</p>
            
            <p><strong>Request Title:</strong> {{requestTitle}}</p>
            <p><strong>Request Type:</strong> {{requestType}}</p>
            <p><strong>Submitted On:</strong> {{submissionDate}}</p>
            <p><strong>New Status:</strong> <span class="status {{statusClass}}">{{status}}</span></p>
            
            {{#if comments}}
            <p><strong>Comments:</strong> {{comments}}</p>
            {{/if}}
            
            <p>You can view the full details of your request by logging into the Internal Portal System:</p>
            <p><a href="{{portalUrl}}" style="background-color: #0056b3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Request</a></p>
            
            <p>Thank you,<br>Internal Portal System</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{year}} Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
      },
      'signature_request': {
        id: 4,
        body: `<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0056b3; color: white; padding: 10px 20px; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { font-size: 12px; color: #777; padding: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Document Signing Request</h1>
        </div>
        <div class="content">
            <p>Hello {{signerName}},</p>
            <p>A document has been shared with you for electronic signature:</p>
            
            <p><strong>Document Title:</strong> {{documentTitle}}</p>
            <p><strong>Shared By:</strong> {{senderName}}</p>
            <p><strong>Date Shared:</strong> {{sharedDate}}</p>
            {{#if description}}
            <p><strong>Description:</strong> {{description}}</p>
            {{/if}}
            
            <p>Please click the button below to review and sign the document:</p>
            <p><a href="{{signUrl}}" style="background-color: #0056b3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Review & Sign</a></p>
            
            <p>This signing request will expire on {{expirationDate}}. Please sign the document before it expires.</p>
            
            <p>Thank you,<br>Internal Portal System</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{year}} Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
      },
      'announcement_notification': {
        id: 5,
        body: `<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0056b3; color: white; padding: 10px 20px; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { font-size: 12px; color: #777; padding: 20px; text-align: center; }
        .announcement-image { max-width: 100%; height: auto; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Announcement</h1>
        </div>
        <div class="content">
            <p>Hello {{recipientName}},</p>
            <p>A new announcement has been posted:</p>
            
            <h2>{{announcementTitle}}</h2>
            
            {{#if announcementImage}}
            <img src="{{announcementImage}}" alt="Announcement Image" class="announcement-image">
            {{/if}}
            
            <div>{{announcementContent}}</div>
            
            <p><strong>Posted By:</strong> {{authorName}}</p>
            <p><strong>Date:</strong> {{postDate}}</p>
            
            <p>To view the full announcement and all attachments, please visit the Internal Portal System:</p>
            <p><a href="{{portalUrl}}" style="background-color: #0056b3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Announcement</a></p>
            
            <p>Thank you,<br>Internal Portal System</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{year}} Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
      }
    };

    return templates[name] || null;
  };
}

if (!storage.createEmailLog) {
  storage.createEmailLog = async (log: any) => {
    // Temporary implementation until database table is available
    console.log('Email log created:', log);
    return 1; // Dummy ID
  };
}

if (!storage.createEmailAttachment) {
  storage.createEmailAttachment = async (attachment: any) => {
    // Temporary implementation until database table is available
    console.log('Email attachment created:', attachment);
    return 1; // Dummy ID
  };
}

if (!storage.getDocumentSignature) {
  storage.getDocumentSignature = async (id: number) => {
    // Temporary implementation until database table is available
    const docSignatures = await storage.getDocumentsToSign(1); // Just get any user's signatures
    return docSignatures.find(sig => sig.id === id) || null;
  };
}