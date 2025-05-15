-- ==========================================================================
-- Add email template tables to Internal Portal System database
-- ==========================================================================

USE [PortalDB]
GO

-- Create EmailTemplates table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailTemplates]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EmailTemplates] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL UNIQUE,
        [subject] NVARCHAR(255) NOT NULL,
        [body] NVARCHAR(MAX) NOT NULL,
        [description] NVARCHAR(500) NULL,
        [type] NVARCHAR(50) NOT NULL CHECK ([type] IN ('approval', 'notification', 'reminder', 'welcome', 'signature', 'custom')),
        [createdBy] INT NOT NULL,
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [isActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [FK_EmailTemplates_Users] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create EmailLog table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailLog]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EmailLog] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [recipient] NVARCHAR(255) NOT NULL,
        [subject] NVARCHAR(255) NOT NULL,
        [body] NVARCHAR(MAX) NOT NULL,
        [sentAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [status] NVARCHAR(50) NOT NULL CHECK ([status] IN ('pending', 'sent', 'failed', 'delivered')),
        [templateId] INT NULL,
        [relatedEntityType] NVARCHAR(50) NULL,
        [relatedEntityId] INT NULL,
        [sender] NVARCHAR(255) NOT NULL,
        [senderName] NVARCHAR(255) NULL,
        [errorMessage] NVARCHAR(MAX) NULL,
        [metadata] NVARCHAR(MAX) NULL, -- JSON format for additional data
        CONSTRAINT [FK_EmailLog_EmailTemplates] FOREIGN KEY ([templateId]) REFERENCES [dbo].[EmailTemplates] ([id])
    )
END
GO

-- Create EmailAttachments table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailAttachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EmailAttachments] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [emailId] INT NOT NULL,
        [fileName] NVARCHAR(255) NOT NULL,
        [filePath] NVARCHAR(500) NOT NULL,
        [fileType] NVARCHAR(100) NOT NULL,
        [fileSize] BIGINT NOT NULL,
        CONSTRAINT [FK_EmailAttachments_EmailLog] FOREIGN KEY ([emailId]) REFERENCES [dbo].[EmailLog] ([id]) ON DELETE CASCADE
    )
END
GO

-- Create EmailSettings table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailSettings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EmailSettings] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [smtpServer] NVARCHAR(255) NOT NULL,
        [smtpPort] INT NOT NULL,
        [useSSL] BIT NOT NULL DEFAULT 1,
        [username] NVARCHAR(255) NULL,
        [password] NVARCHAR(255) NULL,
        [defaultSender] NVARCHAR(255) NOT NULL,
        [defaultSenderName] NVARCHAR(255) NULL,
        [maxRetries] INT NOT NULL DEFAULT 3,
        [updatedBy] INT NULL,
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [isActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [FK_EmailSettings_Users] FOREIGN KEY ([updatedBy]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create indexes for email tables
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EmailTemplates_Type' AND object_id = OBJECT_ID('dbo.EmailTemplates'))
    CREATE INDEX [IX_EmailTemplates_Type] ON [dbo].[EmailTemplates] ([type]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EmailTemplates_IsActive' AND object_id = OBJECT_ID('dbo.EmailTemplates'))
    CREATE INDEX [IX_EmailTemplates_IsActive] ON [dbo].[EmailTemplates] ([isActive]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EmailLog_Status' AND object_id = OBJECT_ID('dbo.EmailLog'))
    CREATE INDEX [IX_EmailLog_Status] ON [dbo].[EmailLog] ([status]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EmailLog_SentAt' AND object_id = OBJECT_ID('dbo.EmailLog'))
    CREATE INDEX [IX_EmailLog_SentAt] ON [dbo].[EmailLog] ([sentAt]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EmailLog_RelatedEntity' AND object_id = OBJECT_ID('dbo.EmailLog'))
    CREATE INDEX [IX_EmailLog_RelatedEntity] ON [dbo].[EmailLog] ([relatedEntityType], [relatedEntityId]);

GO

-- Insert default email templates
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[EmailTemplates])
BEGIN
    -- Get admin user ID
    DECLARE @AdminId INT
    SELECT @AdminId = [id] FROM [dbo].[Users] WHERE [username] = 'admin'

    -- Welcome Email Template
    INSERT INTO [dbo].[EmailTemplates] (
        [name], [subject], [body], [description], [type], [createdBy]
    ) VALUES (
        'welcome_email',
        'Welcome to the Internal Portal System',
        N'<html>
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
</html>',
        'Welcome email sent to new users when their account is created',
        'welcome',
        @AdminId
    )

    -- Request Approval Email Template
    INSERT INTO [dbo].[EmailTemplates] (
        [name], [subject], [body], [description], [type], [createdBy]
    ) VALUES (
        'approval_request',
        'Request Requires Your Approval: {{requestTitle}}',
        N'<html>
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
</html>',
        'Email sent to approvers when a request requires their approval',
        'approval',
        @AdminId
    )

    -- Request Status Update Email Template
    INSERT INTO [dbo].[EmailTemplates] (
        [name], [subject], [body], [description], [type], [createdBy]
    ) VALUES (
        'request_status_update',
        'Request Status Update: {{requestTitle}}',
        N'<html>
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
</html>',
        'Email sent to requesters when the status of their request changes',
        'notification',
        @AdminId
    )

    -- Document Signature Request Email Template
    INSERT INTO [dbo].[EmailTemplates] (
        [name], [subject], [body], [description], [type], [createdBy]
    ) VALUES (
        'signature_request',
        'Document Awaiting Your Signature: {{documentTitle}}',
        N'<html>
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
</html>',
        'Email sent to request document signatures',
        'signature',
        @AdminId
    )

    -- Announcement Email Template
    INSERT INTO [dbo].[EmailTemplates] (
        [name], [subject], [body], [description], [type], [createdBy]
    ) VALUES (
        'announcement_notification',
        'New Announcement: {{announcementTitle}}',
        N'<html>
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
</html>',
        'Email sent when a new announcement is posted',
        'notification',
        @AdminId
    )
END
GO

-- Insert default email settings if none exist
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[EmailSettings])
BEGIN
    -- Get admin user ID
    DECLARE @AdminId INT
    SELECT @AdminId = [id] FROM [dbo].[Users] WHERE [username] = 'admin'

    INSERT INTO [dbo].[EmailSettings] (
        [smtpServer], [smtpPort], [useSSL], [username], [password],
        [defaultSender], [defaultSenderName], [updatedBy]
    ) VALUES (
        'smtp.office365.com',
        587,
        1,
        'portal@company.com',
        'placeholder_password', -- This should be replaced with a secure password
        'portal@company.com',
        'Internal Portal System',
        @AdminId
    )
END
GO

PRINT 'Email tables and initial data added successfully.'
GO