import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../../database/documents.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
// Note: verbose logging disabled to avoid interfering with server logs
export const db: Database.Database = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase(): void {
  // Create documents table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      file_type VARCHAR(10) NOT NULL,
      file_size INTEGER NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      description TEXT,
      document_number VARCHAR(100),
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.exec(createTableQuery);

  // Create indexes for better query performance
  const createIndexQueries = [
    'CREATE INDEX IF NOT EXISTS idx_category ON documents(category);',
    'CREATE INDEX IF NOT EXISTS idx_upload_date ON documents(upload_date);',
    'CREATE INDEX IF NOT EXISTS idx_filename ON documents(original_filename);'
  ];

  createIndexQueries.forEach(query => db.exec(query));

  console.log('✓ Database initialized successfully');
}

// Graceful shutdown - only called when explicitly shutting down
export function closeDatabase(): void {
  try {
    if (db.open) {
      db.close();
      console.log('✓ Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database:', error);
  }
}
