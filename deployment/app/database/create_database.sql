-- ==========================================================================
-- Create database for Internal Portal System
-- ==========================================================================

-- Create database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'PortalDB')
BEGIN
    CREATE DATABASE [PortalDB]
    CONTAINMENT = NONE
    ON PRIMARY 
    (
        NAME = N'PortalDB', 
        FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\PortalDB.mdf', 
        SIZE = 8192KB, 
        MAXSIZE = UNLIMITED, 
        FILEGROWTH = 65536KB
    )
    LOG ON 
    (
        NAME = N'PortalDB_log', 
        FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\PortalDB_log.ldf', 
        SIZE = 8192KB, 
        MAXSIZE = 2048GB, 
        FILEGROWTH = 65536KB
    )
    WITH CATALOG_COLLATION = DATABASE_DEFAULT;
END
GO

USE [PortalDB]
GO

-- ==========================================================================
-- Create tables
-- ==========================================================================

-- Create Users table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Users] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [username] NVARCHAR(100) NOT NULL UNIQUE,
        [password] NVARCHAR(100) NULL,
        [email] NVARCHAR(255) NOT NULL UNIQUE,
        [fullName] NVARCHAR(255) NOT NULL,
        [department] NVARCHAR(50) NULL CHECK ([department] IN ('it', 'hr', 'finance', 'legal', 'marketing', 'operations', 'other')),
        [role] NVARCHAR(50) NOT NULL CHECK ([role] IN ('admin', 'manager', 'user')),
        [status] NVARCHAR(50) NOT NULL CHECK ([status] IN ('active', 'inactive', 'pending')),
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [lastLogin] DATETIME NULL,
        [profileImage] NVARCHAR(255) NULL
    )
END
GO

-- Create RequestTypes table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RequestTypes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RequestTypes] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [department] NVARCHAR(50) NULL CHECK ([department] IN ('it', 'hr', 'finance', 'legal', 'marketing', 'operations', 'other')),
        [fields] NVARCHAR(MAX) NOT NULL, -- JSON format for customizable fields
        [approverConfig] NVARCHAR(MAX) NOT NULL, -- JSON format for approval workflow
        [createdBy] INT NOT NULL,
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [isActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [FK_RequestTypes_Users] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create Requests table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Requests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Requests] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [requestTypeId] INT NOT NULL,
        [title] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [status] NVARCHAR(50) NOT NULL CHECK ([status] IN ('draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled', 'requires_action')),
        [priority] NVARCHAR(20) NOT NULL CHECK ([priority] IN ('low', 'normal', 'high', 'urgent')),
        [data] NVARCHAR(MAX) NOT NULL, -- JSON format for form data
        [createdBy] INT NOT NULL,
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [dueDate] DATETIME NULL,
        [currentApprover] INT NULL,
        CONSTRAINT [FK_Requests_RequestTypes] FOREIGN KEY ([requestTypeId]) REFERENCES [dbo].[RequestTypes] ([id]),
        CONSTRAINT [FK_Requests_Users_Creator] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[Users] ([id]),
        CONSTRAINT [FK_Requests_Users_Approver] FOREIGN KEY ([currentApprover]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create RequestAttachments table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RequestAttachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RequestAttachments] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [requestId] INT NOT NULL,
        [fileName] NVARCHAR(255) NOT NULL,
        [filePath] NVARCHAR(500) NOT NULL,
        [fileType] NVARCHAR(100) NOT NULL,
        [fileSize] BIGINT NOT NULL,
        [uploadedBy] INT NOT NULL,
        [uploadedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_RequestAttachments_Requests] FOREIGN KEY ([requestId]) REFERENCES [dbo].[Requests] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RequestAttachments_Users] FOREIGN KEY ([uploadedBy]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create Approvals table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Approvals]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Approvals] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [requestId] INT NOT NULL,
        [approverId] INT NOT NULL,
        [status] NVARCHAR(50) NOT NULL CHECK ([status] IN ('draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled', 'requires_action')),
        [comments] NVARCHAR(MAX) NULL,
        [actionDate] DATETIME NULL,
        [stepOrder] INT NOT NULL,
        [notifiedAt] DATETIME NULL,
        CONSTRAINT [FK_Approvals_Requests] FOREIGN KEY ([requestId]) REFERENCES [dbo].[Requests] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Approvals_Users] FOREIGN KEY ([approverId]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create Workflows table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Workflows]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Workflows] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [requestId] INT NOT NULL,
        [status] NVARCHAR(50) NOT NULL CHECK ([status] IN ('draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled', 'requires_action')),
        [currentStep] INT NOT NULL DEFAULT 1,
        [startedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [completedAt] DATETIME NULL,
        CONSTRAINT [FK_Workflows_Requests] FOREIGN KEY ([requestId]) REFERENCES [dbo].[Requests] ([id]) ON DELETE CASCADE
    )
END
GO

-- Create WorkflowSteps table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WorkflowSteps]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[WorkflowSteps] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [workflowId] INT NOT NULL,
        [stepName] NVARCHAR(255) NOT NULL,
        [stepDescription] NVARCHAR(MAX) NULL,
        [stepType] NVARCHAR(50) NOT NULL CHECK ([stepType] IN ('approval', 'notification', 'action', 'decision')),
        [stepOrder] INT NOT NULL,
        [approverId] INT NULL,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'pending' CHECK ([status] IN ('pending', 'in_progress', 'completed', 'skipped')),
        [data] NVARCHAR(MAX) NULL, -- JSON format for step-specific data
        [startedAt] DATETIME NULL,
        [completedAt] DATETIME NULL,
        CONSTRAINT [FK_WorkflowSteps_Workflows] FOREIGN KEY ([workflowId]) REFERENCES [dbo].[Workflows] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_WorkflowSteps_Users] FOREIGN KEY ([approverId]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create Announcements table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Announcements]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Announcements] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [title] NVARCHAR(255) NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [imageUrl] NVARCHAR(500) NULL,
        [authorId] INT NOT NULL,
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [expiresAt] DATETIME NULL,
        [isActive] BIT NOT NULL DEFAULT 1,
        [targetAudience] NVARCHAR(MAX) NULL, -- JSON format for targeting specific users
        CONSTRAINT [FK_Announcements_Users] FOREIGN KEY ([authorId]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create AnnouncementAttachments table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AnnouncementAttachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AnnouncementAttachments] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [announcementId] INT NOT NULL,
        [fileName] NVARCHAR(255) NOT NULL,
        [filePath] NVARCHAR(500) NOT NULL,
        [fileType] NVARCHAR(100) NOT NULL,
        [fileSize] BIGINT NOT NULL,
        [uploadedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_AnnouncementAttachments_Announcements] FOREIGN KEY ([announcementId]) REFERENCES [dbo].[Announcements] ([id]) ON DELETE CASCADE
    )
END
GO

-- Create AnnouncementReads table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AnnouncementReads]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AnnouncementReads] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [announcementId] INT NOT NULL,
        [userId] INT NOT NULL,
        [readAt] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_AnnouncementReads_Announcements] FOREIGN KEY ([announcementId]) REFERENCES [dbo].[Announcements] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AnnouncementReads_Users] FOREIGN KEY ([userId]) REFERENCES [dbo].[Users] ([id]),
        CONSTRAINT [UQ_AnnouncementReads_User_Announcement] UNIQUE ([userId], [announcementId])
    )
END
GO

-- Create Documents table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Documents]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Documents] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [title] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [filePath] NVARCHAR(500) NOT NULL,
        [fileType] NVARCHAR(100) NOT NULL,
        [fileSize] BIGINT NOT NULL,
        [category] NVARCHAR(100) NULL,
        [tags] NVARCHAR(500) NULL,
        [ownerId] INT NOT NULL,
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [isArchived] BIT NOT NULL DEFAULT 0,
        [requiresSignature] BIT NOT NULL DEFAULT 0,
        CONSTRAINT [FK_Documents_Users] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create DocumentSignatures table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentSignatures]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DocumentSignatures] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [documentId] INT NOT NULL,
        [signerId] INT NOT NULL,
        [status] NVARCHAR(50) NOT NULL CHECK ([status] IN ('pending', 'viewed', 'signed', 'declined', 'expired')),
        [signedAt] DATETIME NULL,
        [signatureProvider] NVARCHAR(50) NOT NULL CHECK ([signatureProvider] IN ('docusign', 'adobe')),
        [externalId] NVARCHAR(255) NULL,
        [signedDocumentPath] NVARCHAR(500) NULL,
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_DocumentSignatures_Documents] FOREIGN KEY ([documentId]) REFERENCES [dbo].[Documents] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_DocumentSignatures_Users] FOREIGN KEY ([signerId]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create QuickLinks table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[QuickLinks]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[QuickLinks] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [title] NVARCHAR(100) NOT NULL,
        [url] NVARCHAR(500) NOT NULL,
        [iconPath] NVARCHAR(500) NULL,
        [description] NVARCHAR(255) NULL,
        [order] INT NOT NULL DEFAULT 0,
        [createdBy] INT NOT NULL,
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [isActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [FK_QuickLinks_Users] FOREIGN KEY ([createdBy]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create SystemSettings table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemSettings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SystemSettings] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [key] NVARCHAR(100) NOT NULL UNIQUE,
        [value] NVARCHAR(MAX) NOT NULL,
        [description] NVARCHAR(500) NULL,
        [isSecret] BIT NOT NULL DEFAULT 0,
        [updatedBy] INT NULL,
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_SystemSettings_Users] FOREIGN KEY ([updatedBy]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create SystemLogs table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SystemLogs] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [level] NVARCHAR(20) NOT NULL CHECK ([level] IN ('info', 'warning', 'error', 'debug')),
        [message] NVARCHAR(MAX) NOT NULL,
        [userId] INT NULL,
        [metadata] NVARCHAR(MAX) NULL, -- JSON format for additional data
        [timestamp] DATETIME NOT NULL DEFAULT GETDATE(),
        [ipAddress] NVARCHAR(50) NULL,
        [userAgent] NVARCHAR(500) NULL,
        CONSTRAINT [FK_SystemLogs_Users] FOREIGN KEY ([userId]) REFERENCES [dbo].[Users] ([id])
    )
END
GO

-- Create Sessions table (for Express-session)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Sessions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Sessions] (
        [sid] NVARCHAR(255) NOT NULL PRIMARY KEY,
        [expires] DATETIME NOT NULL,
        [data] NVARCHAR(MAX) NOT NULL,
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE()
    )
END
GO

-- ==========================================================================
-- Create indexes
-- ==========================================================================

-- Users indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE INDEX [IX_Users_Email] ON [dbo].[Users] ([email]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Department' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE INDEX [IX_Users_Department] ON [dbo].[Users] ([department]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Role' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE INDEX [IX_Users_Role] ON [dbo].[Users] ([role]);

-- RequestTypes indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RequestTypes_Department' AND object_id = OBJECT_ID('dbo.RequestTypes'))
    CREATE INDEX [IX_RequestTypes_Department] ON [dbo].[RequestTypes] ([department]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RequestTypes_IsActive' AND object_id = OBJECT_ID('dbo.RequestTypes'))
    CREATE INDEX [IX_RequestTypes_IsActive] ON [dbo].[RequestTypes] ([isActive]);

-- Requests indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_Status' AND object_id = OBJECT_ID('dbo.Requests'))
    CREATE INDEX [IX_Requests_Status] ON [dbo].[Requests] ([status]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_CreatedBy' AND object_id = OBJECT_ID('dbo.Requests'))
    CREATE INDEX [IX_Requests_CreatedBy] ON [dbo].[Requests] ([createdBy]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_RequestTypeId' AND object_id = OBJECT_ID('dbo.Requests'))
    CREATE INDEX [IX_Requests_RequestTypeId] ON [dbo].[Requests] ([requestTypeId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_CurrentApprover' AND object_id = OBJECT_ID('dbo.Requests'))
    CREATE INDEX [IX_Requests_CurrentApprover] ON [dbo].[Requests] ([currentApprover]);

-- Approvals indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Approvals_RequestId' AND object_id = OBJECT_ID('dbo.Approvals'))
    CREATE INDEX [IX_Approvals_RequestId] ON [dbo].[Approvals] ([requestId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Approvals_ApproverId' AND object_id = OBJECT_ID('dbo.Approvals'))
    CREATE INDEX [IX_Approvals_ApproverId] ON [dbo].[Approvals] ([approverId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Approvals_Status' AND object_id = OBJECT_ID('dbo.Approvals'))
    CREATE INDEX [IX_Approvals_Status] ON [dbo].[Approvals] ([status]);

-- Workflows indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Workflows_RequestId' AND object_id = OBJECT_ID('dbo.Workflows'))
    CREATE INDEX [IX_Workflows_RequestId] ON [dbo].[Workflows] ([requestId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Workflows_Status' AND object_id = OBJECT_ID('dbo.Workflows'))
    CREATE INDEX [IX_Workflows_Status] ON [dbo].[Workflows] ([status]);

-- WorkflowSteps indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkflowSteps_WorkflowId' AND object_id = OBJECT_ID('dbo.WorkflowSteps'))
    CREATE INDEX [IX_WorkflowSteps_WorkflowId] ON [dbo].[WorkflowSteps] ([workflowId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkflowSteps_ApproverId' AND object_id = OBJECT_ID('dbo.WorkflowSteps'))
    CREATE INDEX [IX_WorkflowSteps_ApproverId] ON [dbo].[WorkflowSteps] ([approverId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkflowSteps_Status' AND object_id = OBJECT_ID('dbo.WorkflowSteps'))
    CREATE INDEX [IX_WorkflowSteps_Status] ON [dbo].[WorkflowSteps] ([status]);

-- Announcements indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Announcements_AuthorId' AND object_id = OBJECT_ID('dbo.Announcements'))
    CREATE INDEX [IX_Announcements_AuthorId] ON [dbo].[Announcements] ([authorId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Announcements_IsActive' AND object_id = OBJECT_ID('dbo.Announcements'))
    CREATE INDEX [IX_Announcements_IsActive] ON [dbo].[Announcements] ([isActive]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Announcements_ExpiresAt' AND object_id = OBJECT_ID('dbo.Announcements'))
    CREATE INDEX [IX_Announcements_ExpiresAt] ON [dbo].[Announcements] ([expiresAt]);

-- Documents indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Documents_OwnerId' AND object_id = OBJECT_ID('dbo.Documents'))
    CREATE INDEX [IX_Documents_OwnerId] ON [dbo].[Documents] ([ownerId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Documents_Category' AND object_id = OBJECT_ID('dbo.Documents'))
    CREATE INDEX [IX_Documents_Category] ON [dbo].[Documents] ([category]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Documents_RequiresSignature' AND object_id = OBJECT_ID('dbo.Documents'))
    CREATE INDEX [IX_Documents_RequiresSignature] ON [dbo].[Documents] ([requiresSignature]);

-- DocumentSignatures indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DocumentSignatures_DocumentId' AND object_id = OBJECT_ID('dbo.DocumentSignatures'))
    CREATE INDEX [IX_DocumentSignatures_DocumentId] ON [dbo].[DocumentSignatures] ([documentId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DocumentSignatures_SignerId' AND object_id = OBJECT_ID('dbo.DocumentSignatures'))
    CREATE INDEX [IX_DocumentSignatures_SignerId] ON [dbo].[DocumentSignatures] ([signerId]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_DocumentSignatures_Status' AND object_id = OBJECT_ID('dbo.DocumentSignatures'))
    CREATE INDEX [IX_DocumentSignatures_Status] ON [dbo].[DocumentSignatures] ([status]);

-- QuickLinks indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_QuickLinks_Order' AND object_id = OBJECT_ID('dbo.QuickLinks'))
    CREATE INDEX [IX_QuickLinks_Order] ON [dbo].[QuickLinks] ([order]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_QuickLinks_IsActive' AND object_id = OBJECT_ID('dbo.QuickLinks'))
    CREATE INDEX [IX_QuickLinks_IsActive] ON [dbo].[QuickLinks] ([isActive]);

-- SystemLogs indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemLogs_Level' AND object_id = OBJECT_ID('dbo.SystemLogs'))
    CREATE INDEX [IX_SystemLogs_Level] ON [dbo].[SystemLogs] ([level]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemLogs_Timestamp' AND object_id = OBJECT_ID('dbo.SystemLogs'))
    CREATE INDEX [IX_SystemLogs_Timestamp] ON [dbo].[SystemLogs] ([timestamp]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemLogs_UserId' AND object_id = OBJECT_ID('dbo.SystemLogs'))
    CREATE INDEX [IX_SystemLogs_UserId] ON [dbo].[SystemLogs] ([userId]);

-- Sessions indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sessions_Expires' AND object_id = OBJECT_ID('dbo.Sessions'))
    CREATE INDEX [IX_Sessions_Expires] ON [dbo].[Sessions] ([expires]);

GO

-- ==========================================================================
-- Insert initial data
-- ==========================================================================

-- Insert admin user if no users exist
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[Users])
BEGIN
    INSERT INTO [dbo].[Users] (
        [username], [password], [email], [fullName], [department], [role], [status]
    ) VALUES (
        'admin', 
        -- Password is 'admin123' - in production use proper password hashing
        'admin123', 
        'admin@company.com', 
        'System Administrator', 
        'it', 
        'admin', 
        'active'
    )
END
GO

-- Insert default system settings
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'APP_PORT')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('APP_PORT', '7001', 'Application port', 0)
END
GO

IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'ATTACHMENT_PATH')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('ATTACHMENT_PATH', 'C:\PortalSystem\uploads', 'Path for file attachments', 0)
END
GO

IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'LOG_PATH')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('LOG_PATH', 'C:\PortalSystem\logs', 'Path for application logs', 0)
END
GO

IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'SIGNATURE_PROVIDER')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('SIGNATURE_PROVIDER', 'docusign', 'Digital signature provider (docusign or adobe)', 0)
END
GO

IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'ENABLE_EMAIL_APPROVALS')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('ENABLE_EMAIL_APPROVALS', 'true', 'Enable approval actions via email', 0)
END
GO

IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'USE_SSO')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('USE_SSO', 'false', 'Enable Microsoft SSO integration', 0)
END
GO

IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'MAX_ATTACHMENT_SIZE_MB')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('MAX_ATTACHMENT_SIZE_MB', '10', 'Maximum file attachment size in MB', 0)
END
GO

IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'EMAIL_SENDER')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('EMAIL_SENDER', 'portal@company.com', 'Email address for system notifications', 0)
END
GO

IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[SystemSettings] WHERE [key] = 'EMAIL_SENDER_NAME')
BEGIN
    INSERT INTO [dbo].[SystemSettings] ([key], [value], [description], [isSecret])
    VALUES ('EMAIL_SENDER_NAME', 'Internal Portal System', 'Display name for system notification emails', 0)
END
GO

-- Insert default request types if none exist
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[RequestTypes])
BEGIN
    -- Get admin user ID
    DECLARE @AdminId INT
    SELECT @AdminId = [id] FROM [dbo].[Users] WHERE [username] = 'admin'

    -- IT Equipment Request
    INSERT INTO [dbo].[RequestTypes] (
        [name], [description], [department], [fields], [approverConfig], [createdBy]
    ) VALUES (
        'IT Equipment Request',
        'Request for new IT equipment',
        'it',
        N'[
            { "id": "1", "label": "Equipment Type", "type": "select", "required": true, "options": ["Laptop", "Desktop", "Monitor", "Keyboard", "Mouse", "Other"] },
            { "id": "2", "label": "Justification", "type": "textarea", "required": true },
            { "id": "3", "label": "Urgency", "type": "select", "required": true, "options": ["Low", "Medium", "High"] }
        ]',
        N'[
            { "name": "Manager Approval", "description": "Approval by direct manager", "approverId": 1 },
            { "name": "IT Review", "description": "Review by IT department", "approverId": 1 }
        ]',
        @AdminId
    )

    -- Vacation Request
    INSERT INTO [dbo].[RequestTypes] (
        [name], [description], [department], [fields], [approverConfig], [createdBy]
    ) VALUES (
        'Vacation Request',
        'Request for vacation or time off',
        'hr',
        N'[
            { "id": "1", "label": "Start Date", "type": "date", "required": true },
            { "id": "2", "label": "End Date", "type": "date", "required": true },
            { "id": "3", "label": "Reason", "type": "textarea", "required": false }
        ]',
        N'[
            { "name": "Manager Approval", "description": "Approval by direct manager", "approverId": 1 }
        ]',
        @AdminId
    )
END
GO

-- Insert default announcements if none exist
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[Announcements])
BEGIN
    -- Get admin user ID
    DECLARE @AdminId INT
    SELECT @AdminId = [id] FROM [dbo].[Users] WHERE [username] = 'admin'

    -- Quarterly All-Hands Meeting
    INSERT INTO [dbo].[Announcements] (
        [title], [content], [imageUrl], [authorId], [expiresAt], [targetAudience]
    ) VALUES (
        'Quarterly All-Hands Meeting',
        'Join us for our Q3 All-Hands meeting on Friday, September 15th at 2:00 PM in the Main Auditorium. We''ll be discussing our quarterly results, upcoming projects, and recognizing top performers.',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300',
        @AdminId,
        DATEADD(MONTH, 3, GETDATE()),
        N'{ "departments": ["all"] }'
    )

    -- New Portal System Launch
    INSERT INTO [dbo].[Announcements] (
        [title], [content], [imageUrl], [authorId], [targetAudience]
    ) VALUES (
        'New Internal Portal System Launch',
        'We''re excited to announce the launch of our new Internal Portal System. This system will streamline all operational requests, approvals, and forms across our organization. Explore the new features including digital signatures, workflow automation, and more.',
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=300',
        @AdminId,
        N'{ "departments": ["all"] }'
    )
END
GO

-- Insert default quick links if none exist
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[QuickLinks])
BEGIN
    -- Get admin user ID
    DECLARE @AdminId INT
    SELECT @AdminId = [id] FROM [dbo].[Users] WHERE [username] = 'admin'

    -- New Request
    INSERT INTO [dbo].[QuickLinks] (
        [title], [url], [iconPath], [order], [createdBy]
    ) VALUES (
        'New Request',
        '/new-request',
        'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        1,
        @AdminId
    )

    -- Calendar
    INSERT INTO [dbo].[QuickLinks] (
        [title], [url], [iconPath], [order], [createdBy]
    ) VALUES (
        'Calendar',
        '/calendar',
        'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        2,
        @AdminId
    )

    -- Directory
    INSERT INTO [dbo].[QuickLinks] (
        [title], [url], [iconPath], [order], [createdBy]
    ) VALUES (
        'Directory',
        '/directory',
        'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        3,
        @AdminId
    )

    -- Help Desk
    INSERT INTO [dbo].[QuickLinks] (
        [title], [url], [iconPath], [order], [createdBy]
    ) VALUES (
        'Help Desk',
        '/help',
        'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        4,
        @AdminId
    )

    -- Document Repository
    INSERT INTO [dbo].[QuickLinks] (
        [title], [url], [iconPath], [order], [createdBy]
    ) VALUES (
        'Document Repository',
        '/documents',
        'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
        5,
        @AdminId
    )
END
GO

PRINT 'Database setup completed successfully.'
GO