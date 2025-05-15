/*
  Internal Portal System - Database Creation Script
  For SQL Server 2019 or later
  This script creates the database, tables, and initial data for the Internal Portal System.
  It includes error handling and checks to prevent errors when running multiple times.
*/

-- Set error handling options
SET NOCOUNT ON;
GO

-- Check if database exists, create if it doesn't
PRINT 'Checking if database exists...';
IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = 'PortalDB')
BEGIN
    PRINT 'Creating database PortalDB...';
    CREATE DATABASE [PortalDB];
    PRINT 'Database created successfully.';
END
ELSE
BEGIN
    PRINT 'Database PortalDB already exists.';
END
GO

-- Use the PortalDB database for all subsequent operations
USE [PortalDB];
GO

-- Begin transaction for table creation
BEGIN TRY
    BEGIN TRANSACTION;

    PRINT 'Creating database schema...';

    -- Create Users table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating Users table...';
        CREATE TABLE [dbo].[Users] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Username] NVARCHAR(50) NOT NULL UNIQUE,
            [Email] NVARCHAR(100) NOT NULL UNIQUE,
            [FirstName] NVARCHAR(50) NOT NULL,
            [LastName] NVARCHAR(50) NOT NULL,
            [PasswordHash] NVARCHAR(255) NOT NULL,
            [Role] NVARCHAR(20) NOT NULL DEFAULT 'user',
            [Department] NVARCHAR(50) NULL,
            [IsActive] BIT NOT NULL DEFAULT 1,
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [LastLoginAt] DATETIME NULL,
            [ResetPasswordToken] NVARCHAR(255) NULL,
            [ResetPasswordExpiry] DATETIME NULL
        );
        PRINT 'Users table created.';
    END
    ELSE
    BEGIN
        PRINT 'Users table already exists.';
    END

    -- Create RequestTypes table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RequestTypes]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating RequestTypes table...';
        CREATE TABLE [dbo].[RequestTypes] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Name] NVARCHAR(100) NOT NULL,
            [Description] NVARCHAR(MAX) NULL,
            [Department] NVARCHAR(50) NULL,
            [FormSchema] NVARCHAR(MAX) NOT NULL,
            [IsActive] BIT NOT NULL DEFAULT 1,
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [CreatedBy] INT NOT NULL,
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_RequestTypes_CreatedBy FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'RequestTypes table created.';
    END
    ELSE
    BEGIN
        PRINT 'RequestTypes table already exists.';
    END

    -- Create Requests table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Requests]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating Requests table...';
        CREATE TABLE [dbo].[Requests] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Title] NVARCHAR(255) NOT NULL,
            [Description] NVARCHAR(MAX) NULL,
            [RequestTypeId] INT NOT NULL,
            [CreatedBy] INT NOT NULL,
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [Status] NVARCHAR(50) NOT NULL DEFAULT 'draft',
            [Priority] NVARCHAR(20) NOT NULL DEFAULT 'normal',
            [DueDate] DATETIME NULL,
            [Data] NVARCHAR(MAX) NOT NULL,
            [CurrentApprover] INT NULL,
            CONSTRAINT FK_Requests_RequestTypeId FOREIGN KEY ([RequestTypeId]) REFERENCES [dbo].[RequestTypes]([Id]),
            CONSTRAINT FK_Requests_CreatedBy FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([Id]),
            CONSTRAINT FK_Requests_CurrentApprover FOREIGN KEY ([CurrentApprover]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'Requests table created.';
    END
    ELSE
    BEGIN
        PRINT 'Requests table already exists.';
    END

    -- Create RequestAttachments table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RequestAttachments]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating RequestAttachments table...';
        CREATE TABLE [dbo].[RequestAttachments] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [RequestId] INT NOT NULL,
            [FileName] NVARCHAR(255) NOT NULL,
            [FilePath] NVARCHAR(MAX) NOT NULL,
            [FileSize] INT NOT NULL,
            [FileType] NVARCHAR(50) NOT NULL,
            [UploadedBy] INT NOT NULL,
            [UploadedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_RequestAttachments_RequestId FOREIGN KEY ([RequestId]) REFERENCES [dbo].[Requests]([Id]) ON DELETE CASCADE,
            CONSTRAINT FK_RequestAttachments_UploadedBy FOREIGN KEY ([UploadedBy]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'RequestAttachments table created.';
    END
    ELSE
    BEGIN
        PRINT 'RequestAttachments table already exists.';
    END

    -- Create Approvals table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Approvals]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating Approvals table...';
        CREATE TABLE [dbo].[Approvals] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [RequestId] INT NOT NULL,
            [ApproverId] INT NOT NULL,
            [StepOrder] INT NOT NULL,
            [Status] NVARCHAR(50) NOT NULL DEFAULT 'pending_approval',
            [Comments] NVARCHAR(MAX) NULL,
            [ActionDate] DATETIME NULL,
            [NotifiedAt] DATETIME NULL,
            CONSTRAINT FK_Approvals_RequestId FOREIGN KEY ([RequestId]) REFERENCES [dbo].[Requests]([Id]) ON DELETE CASCADE,
            CONSTRAINT FK_Approvals_ApproverId FOREIGN KEY ([ApproverId]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'Approvals table created.';
    END
    ELSE
    BEGIN
        PRINT 'Approvals table already exists.';
    END

    -- Create Workflows table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Workflows]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating Workflows table...';
        CREATE TABLE [dbo].[Workflows] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [RequestId] INT NOT NULL,
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [Status] NVARCHAR(50) NOT NULL DEFAULT 'in_progress',
            [CurrentStep] INT NOT NULL DEFAULT 0,
            [CompletedAt] DATETIME NULL,
            CONSTRAINT FK_Workflows_RequestId FOREIGN KEY ([RequestId]) REFERENCES [dbo].[Requests]([Id]) ON DELETE CASCADE
        );
        PRINT 'Workflows table created.';
    END
    ELSE
    BEGIN
        PRINT 'Workflows table already exists.';
    END

    -- Create WorkflowSteps table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WorkflowSteps]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating WorkflowSteps table...';
        CREATE TABLE [dbo].[WorkflowSteps] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [WorkflowId] INT NOT NULL,
            [StepNumber] INT NOT NULL,
            [StepType] NVARCHAR(50) NOT NULL,
            [AssignedTo] INT NULL,
            [Status] NVARCHAR(50) NOT NULL DEFAULT 'pending',
            [CompletedAt] DATETIME NULL,
            [Data] NVARCHAR(MAX) NULL,
            CONSTRAINT FK_WorkflowSteps_WorkflowId FOREIGN KEY ([WorkflowId]) REFERENCES [dbo].[Workflows]([Id]) ON DELETE CASCADE,
            CONSTRAINT FK_WorkflowSteps_AssignedTo FOREIGN KEY ([AssignedTo]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'WorkflowSteps table created.';
    END
    ELSE
    BEGIN
        PRINT 'WorkflowSteps table already exists.';
    END

    -- Create Announcements table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Announcements]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating Announcements table...';
        CREATE TABLE [dbo].[Announcements] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Title] NVARCHAR(255) NOT NULL,
            [Content] NVARCHAR(MAX) NOT NULL,
            [CreatedBy] INT NOT NULL,
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [IsActive] BIT NOT NULL DEFAULT 1,
            [ExpiresAt] DATETIME NULL,
            [TargetAudience] NVARCHAR(MAX) NULL,
            [Priority] NVARCHAR(20) NOT NULL DEFAULT 'normal',
            CONSTRAINT FK_Announcements_CreatedBy FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'Announcements table created.';
    END
    ELSE
    BEGIN
        PRINT 'Announcements table already exists.';
    END

    -- Create AnnouncementAttachments table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AnnouncementAttachments]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating AnnouncementAttachments table...';
        CREATE TABLE [dbo].[AnnouncementAttachments] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [AnnouncementId] INT NOT NULL,
            [FileName] NVARCHAR(255) NOT NULL,
            [FilePath] NVARCHAR(MAX) NOT NULL,
            [FileSize] INT NOT NULL,
            [FileType] NVARCHAR(50) NOT NULL,
            [UploadedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_AnnouncementAttachments_AnnouncementId FOREIGN KEY ([AnnouncementId]) REFERENCES [dbo].[Announcements]([Id]) ON DELETE CASCADE
        );
        PRINT 'AnnouncementAttachments table created.';
    END
    ELSE
    BEGIN
        PRINT 'AnnouncementAttachments table already exists.';
    END

    -- Create AnnouncementReads table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AnnouncementReads]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating AnnouncementReads table...';
        CREATE TABLE [dbo].[AnnouncementReads] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [AnnouncementId] INT NOT NULL,
            [UserId] INT NOT NULL,
            [ReadAt] DATETIME NOT NULL DEFAULT GETDATE(),
            CONSTRAINT FK_AnnouncementReads_AnnouncementId FOREIGN KEY ([AnnouncementId]) REFERENCES [dbo].[Announcements]([Id]) ON DELETE CASCADE,
            CONSTRAINT FK_AnnouncementReads_UserId FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
            CONSTRAINT UQ_AnnouncementReads UNIQUE ([AnnouncementId], [UserId])
        );
        PRINT 'AnnouncementReads table created.';
    END
    ELSE
    BEGIN
        PRINT 'AnnouncementReads table already exists.';
    END

    -- Create Documents table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Documents]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating Documents table...';
        CREATE TABLE [dbo].[Documents] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Title] NVARCHAR(255) NOT NULL,
            [Description] NVARCHAR(MAX) NULL,
            [FilePath] NVARCHAR(MAX) NOT NULL,
            [FileSize] INT NOT NULL,
            [FileType] NVARCHAR(50) NOT NULL,
            [UploadedBy] INT NOT NULL,
            [UploadedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [CategoryId] INT NULL,
            [VersionNumber] INT NOT NULL DEFAULT 1,
            [IsLatestVersion] BIT NOT NULL DEFAULT 1,
            [ParentDocumentId] INT NULL,
            [Status] NVARCHAR(50) NOT NULL DEFAULT 'active',
            CONSTRAINT FK_Documents_UploadedBy FOREIGN KEY ([UploadedBy]) REFERENCES [dbo].[Users]([Id]),
            CONSTRAINT FK_Documents_ParentDocumentId FOREIGN KEY ([ParentDocumentId]) REFERENCES [dbo].[Documents]([Id])
        );
        PRINT 'Documents table created.';
    END
    ELSE
    BEGIN
        PRINT 'Documents table already exists.';
    END

    -- Create DocumentSignatures table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentSignatures]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating DocumentSignatures table...';
        CREATE TABLE [dbo].[DocumentSignatures] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [DocumentId] INT NOT NULL,
            [RequesterId] INT NOT NULL,
            [SignerId] INT NOT NULL,
            [RequestedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [SignedAt] DATETIME NULL,
            [Status] NVARCHAR(50) NOT NULL DEFAULT 'pending',
            [SignatureProviderId] NVARCHAR(255) NULL,
            [SignedDocumentPath] NVARCHAR(MAX) NULL,
            [ExpiresAt] DATETIME NULL,
            [Comments] NVARCHAR(MAX) NULL,
            CONSTRAINT FK_DocumentSignatures_DocumentId FOREIGN KEY ([DocumentId]) REFERENCES [dbo].[Documents]([Id]),
            CONSTRAINT FK_DocumentSignatures_RequesterId FOREIGN KEY ([RequesterId]) REFERENCES [dbo].[Users]([Id]),
            CONSTRAINT FK_DocumentSignatures_SignerId FOREIGN KEY ([SignerId]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'DocumentSignatures table created.';
    END
    ELSE
    BEGIN
        PRINT 'DocumentSignatures table already exists.';
    END

    -- Create QuickLinks table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[QuickLinks]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating QuickLinks table...';
        CREATE TABLE [dbo].[QuickLinks] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Title] NVARCHAR(100) NOT NULL,
            [Url] NVARCHAR(MAX) NOT NULL,
            [Icon] NVARCHAR(50) NULL,
            [SortOrder] INT NOT NULL DEFAULT 0,
            [CreatedBy] INT NOT NULL,
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [IsActive] BIT NOT NULL DEFAULT 1,
            [TargetRole] NVARCHAR(50) NULL,
            CONSTRAINT FK_QuickLinks_CreatedBy FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'QuickLinks table created.';
    END
    ELSE
    BEGIN
        PRINT 'QuickLinks table already exists.';
    END

    -- Create EmailTemplates table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailTemplates]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating EmailTemplates table...';
        CREATE TABLE [dbo].[EmailTemplates] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Name] NVARCHAR(100) NOT NULL UNIQUE,
            [Subject] NVARCHAR(255) NOT NULL,
            [HtmlContent] NVARCHAR(MAX) NOT NULL,
            [TextContent] NVARCHAR(MAX) NULL,
            [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [IsActive] BIT NOT NULL DEFAULT 1
        );
        PRINT 'EmailTemplates table created.';
    END
    ELSE
    BEGIN
        PRINT 'EmailTemplates table already exists.';
    END

    -- Create EmailLogs table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailLogs]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating EmailLogs table...';
        CREATE TABLE [dbo].[EmailLogs] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [TemplateId] INT NULL,
            [ToEmail] NVARCHAR(255) NOT NULL,
            [FromEmail] NVARCHAR(255) NOT NULL,
            [Subject] NVARCHAR(255) NOT NULL,
            [Body] NVARCHAR(MAX) NOT NULL,
            [SentAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [Status] NVARCHAR(50) NOT NULL,
            [ErrorMessage] NVARCHAR(MAX) NULL,
            [RelatedEntity] NVARCHAR(50) NULL,
            [RelatedEntityId] INT NULL,
            CONSTRAINT FK_EmailLogs_TemplateId FOREIGN KEY ([TemplateId]) REFERENCES [dbo].[EmailTemplates]([Id])
        );
        PRINT 'EmailLogs table created.';
    END
    ELSE
    BEGIN
        PRINT 'EmailLogs table already exists.';
    END

    -- Create EmailAttachments table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailAttachments]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating EmailAttachments table...';
        CREATE TABLE [dbo].[EmailAttachments] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [EmailLogId] INT NOT NULL,
            [FileName] NVARCHAR(255) NOT NULL,
            [FilePath] NVARCHAR(MAX) NOT NULL,
            [FileSize] INT NOT NULL,
            [FileType] NVARCHAR(50) NOT NULL,
            CONSTRAINT FK_EmailAttachments_EmailLogId FOREIGN KEY ([EmailLogId]) REFERENCES [dbo].[EmailLogs]([Id]) ON DELETE CASCADE
        );
        PRINT 'EmailAttachments table created.';
    END
    ELSE
    BEGIN
        PRINT 'EmailAttachments table already exists.';
    END

    -- Create SystemSettings table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemSettings]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating SystemSettings table...';
        CREATE TABLE [dbo].[SystemSettings] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Key] NVARCHAR(100) NOT NULL UNIQUE,
            [Value] NVARCHAR(MAX) NULL,
            [Description] NVARCHAR(MAX) NULL,
            [Group] NVARCHAR(50) NULL,
            [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
            [UpdatedBy] INT NULL,
            CONSTRAINT FK_SystemSettings_UpdatedBy FOREIGN KEY ([UpdatedBy]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'SystemSettings table created.';
    END
    ELSE
    BEGIN
        PRINT 'SystemSettings table already exists.';
    END

    -- Create SystemLogs table if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemLogs]') AND type in (N'U'))
    BEGIN
        PRINT 'Creating SystemLogs table...';
        CREATE TABLE [dbo].[SystemLogs] (
            [Id] INT IDENTITY(1,1) PRIMARY KEY,
            [Timestamp] DATETIME NOT NULL DEFAULT GETDATE(),
            [Level] NVARCHAR(20) NOT NULL,
            [Message] NVARCHAR(MAX) NOT NULL,
            [UserId] INT NULL,
            [Metadata] NVARCHAR(MAX) NULL,
            CONSTRAINT FK_SystemLogs_UserId FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id])
        );
        PRINT 'SystemLogs table created.';
    END
    ELSE
    BEGIN
        PRINT 'SystemLogs table already exists.';
    END

    -- Insert admin user if it doesn't exist
    PRINT 'Checking for admin user...';
    IF NOT EXISTS (SELECT * FROM [dbo].[Users] WHERE [Username] = 'admin')
    BEGIN
        PRINT 'Creating admin user...';
        -- Password is 'admin123' hashed
        INSERT INTO [dbo].[Users] ([Username], [Email], [FirstName], [LastName], [PasswordHash], [Role])
        VALUES ('admin', 'admin@example.com', 'System', 'Administrator', '$2b$10$ECmGdNyqNoU2t8Q3RlBxXO5IVgzJImYeGDOCUa9.WqHFUXWr5Kdmy', 'admin');
        PRINT 'Admin user created.';
    END
    ELSE
    BEGIN
        PRINT 'Admin user already exists.';
    END

    -- Insert demo users if they don't exist
    PRINT 'Checking for demo users...';
    IF NOT EXISTS (SELECT * FROM [dbo].[Users] WHERE [Username] = 'manager')
    BEGIN
        PRINT 'Creating demo users...';
        -- Password is 'password' hashed
        INSERT INTO [dbo].[Users] ([Username], [Email], [FirstName], [LastName], [PasswordHash], [Role], [Department])
        VALUES ('manager', 'manager@example.com', 'Department', 'Manager', '$2b$10$ECmGdNyqNoU2t8Q3RlBxXO5IVgzJImYeGDOCUa9.WqHFUXWr5Kdmy', 'manager', 'HR');
        
        INSERT INTO [dbo].[Users] ([Username], [Email], [FirstName], [LastName], [PasswordHash], [Role], [Department])
        VALUES ('employee', 'employee@example.com', 'Regular', 'Employee', '$2b$10$ECmGdNyqNoU2t8Q3RlBxXO5IVgzJImYeGDOCUa9.WqHFUXWr5Kdmy', 'user', 'IT');
        
        PRINT 'Demo users created.';
    END
    ELSE
    BEGIN
        PRINT 'Demo users already exist.';
    END

    -- Insert sample request types if they don't exist
    PRINT 'Checking for sample request types...';
    IF NOT EXISTS (SELECT * FROM [dbo].[RequestTypes] WHERE [Name] = 'IT Support Request')
    BEGIN
        PRINT 'Creating sample request types...';
        -- Get admin user id
        DECLARE @AdminId INT;
        SELECT @AdminId = [Id] FROM [dbo].[Users] WHERE [Username] = 'admin';

        -- IT Support Request
        INSERT INTO [dbo].[RequestTypes] ([Name], [Description], [Department], [FormSchema], [CreatedBy])
        VALUES ('IT Support Request', 'Request for IT support or equipment', 'IT', '{
            "fields": [
                {
                    "name": "issue_type",
                    "label": "Issue Type",
                    "type": "select",
                    "required": true,
                    "options": ["Hardware", "Software", "Network", "Other"]
                },
                {
                    "name": "priority",
                    "label": "Priority",
                    "type": "select",
                    "required": true,
                    "options": ["Low", "Medium", "High", "Critical"]
                },
                {
                    "name": "description",
                    "label": "Description",
                    "type": "textarea",
                    "required": true
                },
                {
                    "name": "location",
                    "label": "Location",
                    "type": "text",
                    "required": true
                }
            ]
        }', @AdminId);

        -- Time Off Request
        INSERT INTO [dbo].[RequestTypes] ([Name], [Description], [Department], [FormSchema], [CreatedBy])
        VALUES ('Time Off Request', 'Request for vacation or personal leave', 'HR', '{
            "fields": [
                {
                    "name": "leave_type",
                    "label": "Leave Type",
                    "type": "select",
                    "required": true,
                    "options": ["Vacation", "Sick Leave", "Personal", "Family Emergency", "Other"]
                },
                {
                    "name": "start_date",
                    "label": "Start Date",
                    "type": "date",
                    "required": true
                },
                {
                    "name": "end_date",
                    "label": "End Date",
                    "type": "date",
                    "required": true
                },
                {
                    "name": "reason",
                    "label": "Reason",
                    "type": "textarea",
                    "required": false
                }
            ]
        }', @AdminId);

        -- Purchase Request
        INSERT INTO [dbo].[RequestTypes] ([Name], [Description], [Department], [FormSchema], [CreatedBy])
        VALUES ('Purchase Request', 'Request for purchasing equipment or supplies', 'Finance', '{
            "fields": [
                {
                    "name": "item_name",
                    "label": "Item Name",
                    "type": "text",
                    "required": true
                },
                {
                    "name": "quantity",
                    "label": "Quantity",
                    "type": "number",
                    "required": true
                },
                {
                    "name": "estimated_cost",
                    "label": "Estimated Cost",
                    "type": "number",
                    "required": true
                },
                {
                    "name": "vendor",
                    "label": "Vendor",
                    "type": "text",
                    "required": false
                },
                {
                    "name": "justification",
                    "label": "Justification",
                    "type": "textarea",
                    "required": true
                }
            ]
        }', @AdminId);

        PRINT 'Sample request types created.';
    END
    ELSE
    BEGIN
        PRINT 'Sample request types already exist.';
    END

    -- Insert sample quick links if they don't exist
    PRINT 'Checking for quick links...';
    IF NOT EXISTS (SELECT * FROM [dbo].[QuickLinks])
    BEGIN
        PRINT 'Creating sample quick links...';
        -- Get admin user id
        DECLARE @AdminId INT;
        SELECT @AdminId = [Id] FROM [dbo].[Users] WHERE [Username] = 'admin';

        INSERT INTO [dbo].[QuickLinks] ([Title], [Url], [Icon], [SortOrder], [CreatedBy])
        VALUES ('New Request', '/new-request', 'file-plus', 1, @AdminId);

        INSERT INTO [dbo].[QuickLinks] ([Title], [Url], [Icon], [SortOrder], [CreatedBy])
        VALUES ('My Approvals', '/approvals', 'check-circle', 2, @AdminId);

        INSERT INTO [dbo].[QuickLinks] ([Title], [Url], [Icon], [SortOrder], [CreatedBy])
        VALUES ('Documents', '/documents', 'file-text', 3, @AdminId);

        INSERT INTO [dbo].[QuickLinks] ([Title], [Url], [Icon], [SortOrder], [CreatedBy])
        VALUES ('Help', '/help', 'help-circle', 4, @AdminId);

        PRINT 'Sample quick links created.';
    END
    ELSE
    BEGIN
        PRINT 'Quick links already exist.';
    END

    -- Insert sample announcements if they don't exist
    PRINT 'Checking for sample announcements...';
    IF NOT EXISTS (SELECT * FROM [dbo].[Announcements])
    BEGIN
        PRINT 'Creating sample announcements...';
        -- Get admin user id
        DECLARE @AdminId INT;
        SELECT @AdminId = [Id] FROM [dbo].[Users] WHERE [Username] = 'admin';

        INSERT INTO [dbo].[Announcements] ([Title], [Content], [CreatedBy], [Priority], [ExpiresAt])
        VALUES ('New Internal Portal System Launch', 'We are excited to announce the launch of our new Internal Portal System. This system will streamline our internal processes and make it easier to submit and track requests.', @AdminId, 'high', DATEADD(MONTH, 1, GETDATE()));

        INSERT INTO [dbo].[Announcements] ([Title], [Content], [CreatedBy], [Priority])
        VALUES ('IT Maintenance Scheduled', 'The IT department will be performing system maintenance this weekend. Please save your work and log out before leaving on Friday.', @AdminId, 'normal');

        PRINT 'Sample announcements created.';
    END
    ELSE
    BEGIN
        PRINT 'Announcements already exist.';
    END

    -- Insert email templates if they don't exist
    PRINT 'Checking for email templates...';
    IF NOT EXISTS (SELECT * FROM [dbo].[EmailTemplates])
    BEGIN
        PRINT 'Creating email templates...';

        -- Welcome Email Template
        INSERT INTO [dbo].[EmailTemplates] ([Name], [Subject], [HtmlContent], [TextContent])
        VALUES ('welcome_email', 'Welcome to the Internal Portal System', 
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Welcome to the Internal Portal System</h2>
            <p>Hello {{firstName}},</p>
            <p>Welcome to our Internal Portal System! Your account has been created successfully.</p>
            <p>Here are your account details:</p>
            <ul>
                <li><strong>Username:</strong> {{username}}</li>
                <li><strong>Email:</strong> {{email}}</li>
            </ul>
            <p>You can log in using your temporary password: <strong>{{temporaryPassword}}</strong></p>
            <p>Please change your password after your first login.</p>
            <p>If you have any questions, please contact the IT department.</p>
            <p>Best regards,<br/>The System Administration Team</p>
        </div>', 
        'Welcome to the Internal Portal System\n\nHello {{firstName}},\n\nWelcome to our Internal Portal System! Your account has been created successfully.\n\nHere are your account details:\n- Username: {{username}}\n- Email: {{email}}\n\nYou can log in using your temporary password: {{temporaryPassword}}\n\nPlease change your password after your first login.\n\nIf you have any questions, please contact the IT department.\n\nBest regards,\nThe System Administration Team');

        -- Request Submitted Template
        INSERT INTO [dbo].[EmailTemplates] ([Name], [Subject], [HtmlContent], [TextContent])
        VALUES ('request_submitted', 'Request Submitted: {{requestTitle}}', 
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Request Submitted</h2>
            <p>Hello {{recipientName}},</p>
            <p>A new request has been submitted:</p>
            <ul>
                <li><strong>Request ID:</strong> {{requestId}}</li>
                <li><strong>Title:</strong> {{requestTitle}}</li>
                <li><strong>Type:</strong> {{requestType}}</li>
                <li><strong>Submitted by:</strong> {{submitterName}}</li>
                <li><strong>Submitted on:</strong> {{submissionDate}}</li>
            </ul>
            <p>To view the request details, please click the button below:</p>
            <p style="text-align: center;">
                <a href="{{requestUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">View Request</a>
            </p>
            <p>Thank you,<br/>Internal Portal System</p>
        </div>', 
        'Request Submitted: {{requestTitle}}\n\nHello {{recipientName}},\n\nA new request has been submitted:\n- Request ID: {{requestId}}\n- Title: {{requestTitle}}\n- Type: {{requestType}}\n- Submitted by: {{submitterName}}\n- Submitted on: {{submissionDate}}\n\nTo view the request details, please visit: {{requestUrl}}\n\nThank you,\nInternal Portal System');

        -- Approval Required Template
        INSERT INTO [dbo].[EmailTemplates] ([Name], [Subject], [HtmlContent], [TextContent])
        VALUES ('approval_required', 'Approval Required: {{requestTitle}}', 
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Approval Required</h2>
            <p>Hello {{approverName}},</p>
            <p>Your approval is required for the following request:</p>
            <ul>
                <li><strong>Request ID:</strong> {{requestId}}</li>
                <li><strong>Title:</strong> {{requestTitle}}</li>
                <li><strong>Type:</strong> {{requestType}}</li>
                <li><strong>Submitted by:</strong> {{submitterName}}</li>
                <li><strong>Submitted on:</strong> {{submissionDate}}</li>
            </ul>
            <p>To approve or reject this request, please click the button below:</p>
            <p style="text-align: center;">
                <a href="{{approvalUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Review Request</a>
            </p>
            <p>Thank you,<br/>Internal Portal System</p>
        </div>', 
        'Approval Required: {{requestTitle}}\n\nHello {{approverName}},\n\nYour approval is required for the following request:\n- Request ID: {{requestId}}\n- Title: {{requestTitle}}\n- Type: {{requestType}}\n- Submitted by: {{submitterName}}\n- Submitted on: {{submissionDate}}\n\nTo approve or reject this request, please visit: {{approvalUrl}}\n\nThank you,\nInternal Portal System');

        -- Document Signature Template
        INSERT INTO [dbo].[EmailTemplates] ([Name], [Subject], [HtmlContent], [TextContent])
        VALUES ('document_signature', 'Document Signature Required: {{documentTitle}}', 
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Document Signature Required</h2>
            <p>Hello {{signerName}},</p>
            <p>Your signature is required for the following document:</p>
            <ul>
                <li><strong>Document:</strong> {{documentTitle}}</li>
                <li><strong>Requested by:</strong> {{requesterName}}</li>
                <li><strong>Requested on:</strong> {{requestDate}}</li>
                <li><strong>Expires on:</strong> {{expirationDate}}</li>
            </ul>
            <p>To review and sign this document, please click the button below:</p>
            <p style="text-align: center;">
                <a href="{{signatureUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Sign Document</a>
            </p>
            <p>Thank you,<br/>Internal Portal System</p>
        </div>', 
        'Document Signature Required: {{documentTitle}}\n\nHello {{signerName}},\n\nYour signature is required for the following document:\n- Document: {{documentTitle}}\n- Requested by: {{requesterName}}\n- Requested on: {{requestDate}}\n- Expires on: {{expirationDate}}\n\nTo review and sign this document, please visit: {{signatureUrl}}\n\nThank you,\nInternal Portal System');

        PRINT 'Email templates created.';
    END
    ELSE
    BEGIN
        PRINT 'Email templates already exist.';
    END

    -- Insert initial system settings if they don't exist
    PRINT 'Checking for system settings...';
    IF NOT EXISTS (SELECT * FROM [dbo].[SystemSettings])
    BEGIN
        PRINT 'Creating initial system settings...';

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('APP_NAME', 'Internal Portal System', 'The name of the application displayed in the UI', 'General');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('COMPANY_NAME', 'Your Company Name', 'The name of the company', 'General');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('LOGO_URL', '/assets/logo.png', 'URL to the company logo', 'General');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('ENABLE_EMAIL_NOTIFICATIONS', 'true', 'Enable or disable email notifications', 'Email');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('DEFAULT_FROM_EMAIL', 'portal@example.com', 'Default from email address', 'Email');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('DEFAULT_FROM_NAME', 'Internal Portal System', 'Default from name', 'Email');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('SIGNATURE_PROVIDER', 'docusign', 'Digital signature provider (docusign or adobe)', 'Signatures');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('ENABLE_SSO', 'false', 'Enable or disable single sign-on', 'Authentication');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('PASSWORD_EXPIRATION_DAYS', '90', 'Number of days before password expires', 'Authentication');

        INSERT INTO [dbo].[SystemSettings] ([Key], [Value], [Description], [Group])
        VALUES ('MAX_ATTACHMENT_SIZE_MB', '10', 'Maximum attachment size in MB', 'Files');

        PRINT 'Initial system settings created.';
    END
    ELSE
    BEGIN
        PRINT 'System settings already exist.';
    END

    -- Commit the transaction
    COMMIT TRANSACTION;
    PRINT 'Database setup completed successfully.';

END TRY
BEGIN CATCH
    -- If there is an error, roll back the transaction
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    -- Display error information
    PRINT 'Error occurred during database setup:';
    PRINT 'Error Number: ' + CAST(ERROR_NUMBER() AS VARCHAR(10));
    PRINT 'Error Message: ' + ERROR_MESSAGE();
    PRINT 'Error Severity: ' + CAST(ERROR_SEVERITY() AS VARCHAR(10));
    PRINT 'Error State: ' + CAST(ERROR_STATE() AS VARCHAR(10));
    PRINT 'Error Line: ' + CAST(ERROR_LINE() AS VARCHAR(10));
    PRINT 'Error Procedure: ' + ISNULL(ERROR_PROCEDURE(), 'N/A');
    
    -- Raise the error to the calling application
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO

PRINT 'Database script execution completed.';
GO