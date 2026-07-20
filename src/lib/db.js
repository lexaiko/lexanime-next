import Database from 'better-sqlite3';
import path from 'path';

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), 'db_anime.db');
    dbInstance = new Database(dbPath, { readonly: true });
    
    // Optimize SQLite performance for concurrent read-only queries
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
  }
  return dbInstance;
}
