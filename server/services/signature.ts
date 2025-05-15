import { configManager } from '../config';
import { storage } from '../storage';
import axios from 'axios';
import { Document, User } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

interface SignatureRequest {
  id: string;
  status: string;
  documentId: string;
  signerId: string;
  created: string;
  expires: string;
}

// This class provides a unified interface for working with different signature providers
class SignatureService {
  private readonly adobeApiKey: string;
  private readonly adobeBaseUri: string;
  private readonly docusignApiKey: string;
  private readonly docusignAccountId: string;
  private readonly docusignBaseUri: string;
  private readonly docusignUserId: string;

  constructor() {
    this.adobeApiKey = configManager.get('ADOBE_API_KEY') || '';
    this.adobeBaseUri = configManager.get('ADOBE_BASE_URI') || 'https://api.adobe.io/';
    
    this.docusignApiKey = configManager.get('SIGNATURE_API_KEY') || '';
    this.docusignAccountId = configManager.get('SIGNATURE_ACCOUNT_ID') || '';
    this.docusignUserId = configManager.get('SIGNATURE_USER_ID') || '';
    this.docusignBaseUri = configManager.get('SIGNATURE_BASE_URI') || 'https://demo.docusign.net/restapi/v2.1';
  }

  /**
   * Request signatures for a document from multiple signers
   * @param document Document to sign
   * @param signers Users who need to sign
   * @param provider Signature provider to use
   * @returns Array of signature requests
   */
  public async requestSignatures(
    document: Document,
    signers: User[],
    provider: 'adobe' | 'docusign' = 'docusign'
  ): Promise<SignatureRequest[]> {
    try {
      if (provider === 'adobe') {
        return await this.requestAdobeSignatures(document, signers);
      } else {
        return await this.requestDocuSignSignatures(document, signers);
      }
    } catch (error) {
      console.error(`Error requesting signatures via ${provider}:`, error);
      
      // Log the error
      await storage.logSystemEvent(
        'ERROR',
        `Failed to request signatures for document ${document.title}`,
        document.ownerId,
        { error: String(error) }
      );
      
      throw new Error(`Failed to request signatures via ${provider}`);
    }
  }

  /**
   * Get the status of a signature request
   * @param requestId Signature request ID
   * @param provider Signature provider
   * @returns Signature request status
   */
  public async getSignatureStatus(
    requestId: string,
    provider: 'adobe' | 'docusign' = 'docusign'
  ): Promise<string> {
    try {
      if (provider === 'adobe') {
        return await this.getAdobeSignatureStatus(requestId);
      } else {
        return await this.getDocuSignSignatureStatus(requestId);
      }
    } catch (error) {
      console.error(`Error getting signature status from ${provider}:`, error);
      throw new Error(`Failed to get signature status from ${provider}`);
    }
  }

  /**
   * Download a signed document
   * @param requestId Signature request ID
   * @param provider Signature provider
   * @param documentName Name to save the document as
   * @returns Path to downloaded document
   */
  public async downloadSignedDocument(
    requestId: string,
    provider: 'adobe' | 'docusign' = 'docusign',
    documentName: string
  ): Promise<string> {
    try {
      if (provider === 'adobe') {
        return await this.downloadAdobeSignedDocument(requestId, documentName);
      } else {
        return await this.downloadDocuSignSignedDocument(requestId, documentName);
      }
    } catch (error) {
      console.error(`Error downloading signed document from ${provider}:`, error);
      throw new Error(`Failed to download signed document from ${provider}`);
    }
  }

  /**
   * Request signatures via Adobe Sign
   * @param document Document to sign
   * @param signers Users who need to sign
   * @returns Array of signature requests
   */
  private async requestAdobeSignatures(
    document: Document,
    signers: User[]
  ): Promise<SignatureRequest[]> {
    // This is a mock implementation
    // In a real implementation, you would use the Adobe Sign API
    
    console.log(`[MOCK] Requesting Adobe Sign signatures for document: ${document.title}`);
    
    // Log the mock request
    await storage.logSystemEvent(
      'INFO',
      `Mock Adobe Sign request for document ${document.title}`,
      document.ownerId,
      { recipientCount: signers.length }
    );
    
    const mockRequests: SignatureRequest[] = [];
    
    // Create a mock request for each signer
    for (const signer of signers) {
      const mockId = `adobe-${Math.random().toString(36).substring(2, 15)}`;
      
      mockRequests.push({
        id: mockId,
        status: 'sent',
        documentId: document.id.toString(),
        signerId: signer.id.toString(),
        created: new Date().toISOString(),
        expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      });
    }
    
    return mockRequests;
  }

  /**
   * Request signatures via DocuSign
   * @param document Document to sign
   * @param signers Users who need to sign
   * @returns Array of signature requests
   */
  private async requestDocuSignSignatures(
    document: Document,
    signers: User[]
  ): Promise<SignatureRequest[]> {
    // This is a mock implementation
    // In a real implementation, you would use the DocuSign API
    
    console.log(`[MOCK] Requesting DocuSign signatures for document: ${document.title}`);
    
    // Log the mock request
    await storage.logSystemEvent(
      'INFO',
      `Mock DocuSign request for document ${document.title}`,
      document.ownerId,
      { recipientCount: signers.length }
    );
    
    const mockRequests: SignatureRequest[] = [];
    
    // Create a mock request for each signer
    for (const signer of signers) {
      const mockId = `docusign-${Math.random().toString(36).substring(2, 15)}`;
      
      mockRequests.push({
        id: mockId,
        status: 'sent',
        documentId: document.id.toString(),
        signerId: signer.id.toString(),
        created: new Date().toISOString(),
        expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      });
    }
    
    return mockRequests;
  }

  /**
   * Get signature status from Adobe Sign
   * @param requestId Signature request ID
   * @returns Status string
   */
  private async getAdobeSignatureStatus(requestId: string): Promise<string> {
    // Mock implementation
    console.log(`[MOCK] Getting Adobe Sign status for request: ${requestId}`);
    
    // Randomly return a status
    const statuses = ['sent', 'delivered', 'signed', 'completed', 'declined', 'expired'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  /**
   * Get signature status from DocuSign
   * @param requestId Signature request ID
   * @returns Status string
   */
  private async getDocuSignSignatureStatus(requestId: string): Promise<string> {
    // Mock implementation
    console.log(`[MOCK] Getting DocuSign status for request: ${requestId}`);
    
    // Randomly return a status
    const statuses = ['sent', 'delivered', 'signed', 'completed', 'declined', 'expired'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  /**
   * Download signed document from Adobe Sign
   * @param requestId Signature request ID
   * @param documentName Name to save the document as
   * @returns Path to downloaded document
   */
  private async downloadAdobeSignedDocument(
    requestId: string,
    documentName: string
  ): Promise<string> {
    // Mock implementation
    console.log(`[MOCK] Downloading signed document from Adobe Sign: ${requestId}`);
    
    // Create a mock PDF file
    const attachmentPath = configManager.get('ATTACHMENT_PATH') || path.join(process.cwd(), 'uploads');
    const filePath = path.join(attachmentPath, `${documentName}-signed.pdf`);
    
    // Just create an empty file for mock purposes
    fs.writeFileSync(filePath, 'MOCK SIGNED DOCUMENT');
    
    return filePath;
  }

  /**
   * Download signed document from DocuSign
   * @param requestId Signature request ID
   * @param documentName Name to save the document as
   * @returns Path to downloaded document
   */
  private async downloadDocuSignSignedDocument(
    requestId: string,
    documentName: string
  ): Promise<string> {
    // Mock implementation
    console.log(`[MOCK] Downloading signed document from DocuSign: ${requestId}`);
    
    // Create a mock PDF file
    const attachmentPath = configManager.get('ATTACHMENT_PATH') || path.join(process.cwd(), 'uploads');
    const filePath = path.join(attachmentPath, `${documentName}-signed.pdf`);
    
    // Just create an empty file for mock purposes
    fs.writeFileSync(filePath, 'MOCK SIGNED DOCUMENT');
    
    return filePath;
  }
}

export const signatureService = new SignatureService();
