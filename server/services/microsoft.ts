import { configManager } from '../config';
import { storage } from '../storage';
import axios from 'axios';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
  scope?: string;
}

interface UserInfo {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
}

class MicrosoftService {
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes: string[];
  private readonly tokenEndpoint: string;
  private readonly graphApiEndpoint: string;
  private readonly authUrl: string;

  constructor() {
    this.tenantId = configManager.get('MS_TENANT_ID') || '';
    this.clientId = configManager.get('MS_CLIENT_ID') || '';
    this.clientSecret = configManager.get('MS_CLIENT_SECRET') || '';
    this.redirectUri = configManager.get('MS_REDIRECT_URI') || '';
    
    this.scopes = ['openid', 'profile', 'email', 'User.Read', 'Mail.Send'];
    this.tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    this.graphApiEndpoint = 'https://graph.microsoft.com/v1.0';
    this.authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize`;
  }

  /**
   * Get the authorization URL for Microsoft login
   * @returns Auth URL
   */
  public getAuthUrl(): string {
    const queryParams = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_mode: 'query',
    });

    return `${this.authUrl}?${queryParams.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code Authorization code
   * @returns Token response
   */
  public async getTokenFromCode(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
      scope: this.scopes.join(' '),
    });

    try {
      const response = await axios.post(this.tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting token from code:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Refresh access token
   * @param refreshToken Refresh token
   * @returns New token response
   */
  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: this.scopes.join(' '),
    });

    try {
      const response = await axios.post(this.tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Get user information from Microsoft Graph API
   * @param accessToken Access token
   * @returns User info
   */
  public async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const response = await axios.get(`${this.graphApiEndpoint}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user information from Microsoft Graph API');
    }
  }

  /**
   * Send an email using Microsoft Graph API
   * @param accessToken Access token
   * @param to Recipients
   * @param subject Email subject
   * @param content Email content (HTML)
   * @param attachments Optional email attachments
   */
  public async sendEmail(
    accessToken: string,
    to: string[],
    subject: string,
    content: string,
    attachments?: Array<{
      name: string;
      contentBytes: string; // Base64 encoded content
      contentType: string;
    }>
  ): Promise<void> {
    const sender = configManager.get('EMAIL_SENDER') || 'portal@company.com';
    const senderName = configManager.get('EMAIL_SENDER_NAME') || 'Internal Portal System';

    const message = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content,
        },
        toRecipients: to.map(recipient => ({
          emailAddress: {
            address: recipient,
          },
        })),
        from: {
          emailAddress: {
            address: sender,
            name: senderName,
          },
        },
        attachments: attachments || [],
      },
      saveToSentItems: 'true',
    };

    try {
      await axios.post(`${this.graphApiEndpoint}/me/sendMail`, message, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email via Microsoft Graph API');
    }
  }

  /**
   * Send email using service account - for system notifications
   * @param to Recipients
   * @param subject Email subject
   * @param content Email content (HTML)
   * @param attachments Optional email attachments
   */
  public async sendSystemEmail(
    to: string[],
    subject: string,
    content: string,
    attachments?: Array<{
      name: string;
      contentBytes: string; // Base64 encoded content
      contentType: string;
    }>
  ): Promise<void> {
    try {
      // For system emails, we need to authenticate using client credentials
      const tokenResponse = await this.getClientCredentialsToken();
      await this.sendEmail(tokenResponse.access_token, to, subject, content, attachments);
      
      // Log successful email
      await storage.logSystemEvent(
        'INFO',
        `System email sent: ${subject} to ${to.join(', ')}`,
        undefined,
        { emailSent: true }
      );
    } catch (error) {
      console.error('Error sending system email:', error);
      
      // Log failed email
      await storage.logSystemEvent(
        'ERROR',
        `Failed to send system email: ${subject} to ${to.join(', ')}`,
        undefined,
        { emailError: String(error) }
      );
      
      throw new Error('Failed to send system email');
    }
  }

  /**
   * Get access token using client credentials flow (for system operations)
   * @returns Token response
   */
  private async getClientCredentialsToken(): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
      scope: 'https://graph.microsoft.com/.default',
    });

    try {
      const response = await axios.post(this.tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting client credentials token:', error);
      throw new Error('Failed to get token using client credentials flow');
    }
  }
}

export const microsoftService = new MicrosoftService();
