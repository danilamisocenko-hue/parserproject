import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import os from 'os';

let dbInstance: Database | null = null;

export async function initDb() {
  if (dbInstance) return dbInstance;
  
  const dbFile = path.resolve(os.tmpdir(), 'database.sqlite');
  
  dbInstance = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT,
      telegram_id TEXT UNIQUE,
      plan TEXT DEFAULT 'NONE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS telegram_auth_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      code TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return dbInstance;
}

export async function getDb() {
  if (!dbInstance) {
    return await initDb();
  }
  return dbInstance;
}
