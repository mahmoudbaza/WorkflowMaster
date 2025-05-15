import * as mssql from 'mssql';
import { drizzle } from 'drizzle-orm/mssql-js';
import { configManager } from '../server/config';

// MS SQL Server connection configuration
const sqlConfig = {
  user: process.env.DB_USER || 'portaluser',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
  database: process.env.DB_NAME || 'PortalDB',
  server: process.env.DB_SERVER || 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: true // change to false for production
  }
};

// Initialize SQL connection
let pool: mssql.ConnectionPool | null = null;
let db: any;

/**
 * Initialize the database connection
 */
export async function initDb() {
  try {
    // Connect to SQL Server
    pool = await mssql.connect(sqlConfig);
    console.log('Connected to MS SQL Server');
    
    // Create drizzle ORM instance
    db = drizzle(pool);
    
    return db;
  } catch (err) {
    console.error('Error connecting to MS SQL Server', err);
    throw err;
  }
}

/**
 * Close the database connection
 */
export async function closeDb() {
  try {
    if (pool) {
      await pool.close();
      console.log('Disconnected from MS SQL Server');
    }
  } catch (err) {
    console.error('Error closing the database connection', err);
    throw err;
  }
}

export { db };