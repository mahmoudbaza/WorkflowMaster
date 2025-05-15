import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

interface ConfigurationSettings {
  APP_PORT: string;
  ATTACHMENT_PATH: string;
  LOG_PATH: string;
  SIGNATURE_PROVIDER: 'adobe' | 'docusign';
  ENABLE_EMAIL_APPROVALS: boolean;
  USE_SSO: boolean;
  MAX_ATTACHMENT_SIZE_MB: string;
  DB_CONNECTION_STRING: string;
  DEPLOY_ENV: 'production' | 'development' | 'staging';
  
  // Microsoft Integration
  MS_TENANT_ID?: string;
  MS_CLIENT_ID?: string;
  MS_CLIENT_SECRET?: string; 
  MS_REDIRECT_URI?: string;
  
  // Email Settings
  EMAIL_SENDER?: string;
  EMAIL_SENDER_NAME?: string;
  
  // Signature Settings
  SIGNATURE_API_KEY?: string;
  SIGNATURE_ACCOUNT_ID?: string;
  SIGNATURE_USER_ID?: string;
  SIGNATURE_BASE_URI?: string;
  STORE_SIGNATURES_DB?: boolean;
  STORE_SIGNATURES_FILE?: boolean;

  [key: string]: any;
}

class ConfigManager {
  private config: ConfigurationSettings;
  private readonly configPath: string;
  private readonly defaultConfigValues: ConfigurationSettings;

  constructor() {
    // Default values
    this.defaultConfigValues = {
      APP_PORT: '7001',
      ATTACHMENT_PATH: path.join(process.cwd(), 'uploads'),
      LOG_PATH: path.join(process.cwd(), 'logs'),
      SIGNATURE_PROVIDER: 'docusign',
      ENABLE_EMAIL_APPROVALS: true,
      USE_SSO: false,
      MAX_ATTACHMENT_SIZE_MB: '10',
      DB_CONNECTION_STRING: process.env.DATABASE_URL || 'Server=localhost;Database=PortalDB;User Id=dbuser;Password=dbpassword;',
      DEPLOY_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      EMAIL_SENDER: 'portal@company.com',
      EMAIL_SENDER_NAME: 'Internal Portal System'
    };

    // Set config path - either from env var or default location
    this.configPath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config.yaml');
    
    // Initialize config with default values
    this.config = { ...this.defaultConfigValues };
    
    // Load configuration from file or database
    this.loadConfig();
  }

  /**
   * Load configuration from file and/or database
   */
  private async loadConfig(): Promise<void> {
    try {
      // First try to load from file
      if (fs.existsSync(this.configPath)) {
        const fileContents = fs.readFileSync(this.configPath, 'utf8');
        const fileConfig = yaml.load(fileContents) as ConfigurationSettings;
        
        // Merge with default config
        this.config = { ...this.defaultConfigValues, ...fileConfig };
        console.log(`Configuration loaded from ${this.configPath}`);
      } else {
        console.log(`Configuration file not found at ${this.configPath}. Using default values.`);
      }
      
      // Then try to load from environment variables
      this.loadFromEnv();
      
      // Then try to load from database
      try {
        await this.loadFromDatabase();
      } catch (err) {
        console.warn('Could not load configuration from database:', err);
      }
      
      // Create necessary directories
      this.createDirectories();
      
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Fall back to default values
      this.config = { ...this.defaultConfigValues };
      // Load from environment variables as backup
      this.loadFromEnv();
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnv(): void {
    // Override config with environment variables
    for (const key in this.config) {
      const envValue = process.env[key];
      if (envValue !== undefined) {
        // Convert strings to appropriate types
        if (typeof this.config[key] === 'boolean') {
          this.config[key] = envValue.toLowerCase() === 'true';
        } else if (typeof this.config[key] === 'number') {
          this.config[key] = Number(envValue);
        } else {
          this.config[key] = envValue;
        }
      }
    }
  }

  /**
   * Load configuration from database
   */
  private async loadFromDatabase(): Promise<void> {
    // In memory mode - no database to load from
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping database config in development mode');
      return;
    }
    
    // In production, we would load settings from the database
    // This will be implemented when connecting to a real database
    console.log('Loading configuration from database is not implemented yet');
  }

  /**
   * Create necessary directories
   */
  private createDirectories(): void {
    // Create attachment directory if it doesn't exist
    const attachmentPath = this.config.ATTACHMENT_PATH;
    if (!fs.existsSync(attachmentPath)) {
      try {
        fs.mkdirSync(attachmentPath, { recursive: true });
        console.log(`Created attachment directory: ${attachmentPath}`);
      } catch (error) {
        console.error(`Error creating attachment directory: ${error}`);
      }
    }

    // Create log directory if it doesn't exist
    const logPath = this.config.LOG_PATH;
    if (!fs.existsSync(logPath)) {
      try {
        fs.mkdirSync(logPath, { recursive: true });
        console.log(`Created log directory: ${logPath}`);
      } catch (error) {
        console.error(`Error creating log directory: ${error}`);
      }
    }
  }

  /**
   * Get a configuration value
   * @param key Configuration key
   * @returns Configuration value
   */
  public get(key: string): any {
    return this.config[key] ?? process.env[key];
  }

  /**
   * Update configuration
   * @param newConfig New configuration values
   * @param userId User ID of the user making the change
   */
  public async updateConfig(newConfig: Partial<ConfigurationSettings>, userId: number): Promise<void> {
    // Update memory config
    this.config = { ...this.config, ...newConfig };
    
    // Update file config
    try {
      // Only update if file exists
      if (fs.existsSync(this.configPath)) {
        const yamlStr = yaml.dump(this.config);
        fs.writeFileSync(this.configPath, yamlStr, 'utf8');
        console.log(`Configuration file updated at ${this.configPath}`);
      }
    } catch (error) {
      console.error('Error updating configuration file:', error);
      throw new Error('Failed to update configuration file');
    }
    
    // Re-create directories in case paths changed
    this.createDirectories();
    
    console.log(`Configuration updated with keys: ${Object.keys(newConfig).join(', ')}`);
    
    // Note: In production mode, we would also update database and log events
    // This functionality is stubbed out for development mode
  }

  /**
   * Save current configuration to file
   */
  public async saveToFile(): Promise<void> {
    try {
      const yamlStr = yaml.dump(this.config);
      fs.writeFileSync(this.configPath, yamlStr, 'utf8');
      console.log(`Configuration saved to ${this.configPath}`);
    } catch (error) {
      console.error('Error saving configuration to file:', error);
      throw new Error('Failed to save configuration to file');
    }
  }

  /**
   * Get a subset of configuration for public consumption
   * @returns Public configuration
   */
  public getPublicConfig(): Partial<ConfigurationSettings> {
    // Return a subset of configuration that is safe to expose to clients
    const { 
      DB_CONNECTION_STRING, MS_CLIENT_SECRET, SIGNATURE_API_KEY, 
      ...publicConfig 
    } = this.config;
    
    // Mask sensitive values
    if (publicConfig.MS_TENANT_ID) publicConfig.MS_TENANT_ID = this.maskString(publicConfig.MS_TENANT_ID);
    if (publicConfig.MS_CLIENT_ID) publicConfig.MS_CLIENT_ID = this.maskString(publicConfig.MS_CLIENT_ID);
    if (publicConfig.SIGNATURE_ACCOUNT_ID) publicConfig.SIGNATURE_ACCOUNT_ID = this.maskString(publicConfig.SIGNATURE_ACCOUNT_ID);
    
    return publicConfig;
  }

  /**
   * Mask a string for security
   * @param str String to mask
   * @returns Masked string
   */
  private maskString(str: string): string {
    if (!str) return '';
    const visibleChars = 4;
    const maskChar = '*';
    
    if (str.length <= visibleChars * 2) {
      return str.charAt(0) + maskChar.repeat(str.length - 2) + str.charAt(str.length - 1);
    }
    
    return str.substring(0, visibleChars) + maskChar.repeat(str.length - visibleChars * 2) + str.substring(str.length - visibleChars);
  }
}

export const configManager = new ConfigManager();
