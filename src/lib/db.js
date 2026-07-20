import path from 'path';

let localDb = null;
let remoteClient = null;

function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    if (!remoteClient) {
      const { createClient } = require('@libsql/client');
      remoteClient = createClient({ url, authToken: token });
    }
    return { type: 'remote', client: remoteClient };
  } else {
    if (!localDb) {
      const Database = require('better-sqlite3');
      const dbPath = path.join(process.cwd(), 'db_anime.db');
      
      const isVercel = process.env.VERCEL === '1' || process.env.NOW_BUILDER === '1';
      const normalizedPath = dbPath.replace(/\\/g, '/');
      const uriPath = isVercel
        ? `file:${normalizedPath}?immutable=1`
        : `file:${normalizedPath}`;

      localDb = new Database(uriPath, { 
        readonly: true,
        uri: true
      });

      if (!isVercel) {
        try {
          localDb.pragma('journal_mode = WAL');
          localDb.pragma('synchronous = NORMAL');
        } catch (e) {
          console.warn('Failed to set WAL/synchronous pragmas:', e.message);
        }
      }
    }
    return { type: 'local', client: localDb };
  }
}

export async function queryAll(sql, params = []) {
  const { type, client } = getClient();
  if (type === 'remote') {
    const res = await client.execute({ sql, args: params });
    return res.rows;
  } else {
    return client.prepare(sql).all(...params);
  }
}

export async function queryOne(sql, params = []) {
  const { type, client } = getClient();
  if (type === 'remote') {
    const res = await client.execute({ sql, args: params });
    return res.rows[0] || null;
  } else {
    return client.prepare(sql).get(...params) || null;
  }
}
