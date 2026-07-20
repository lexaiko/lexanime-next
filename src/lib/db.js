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
      const fs = require('fs');
      
      // Path resolver to locate db_anime.db in serverless/Vercel structures
      const findDbPath = () => {
        const root = /*turbopackIgnore: true*/ process.cwd();
        const candidatePaths = [
          path.join(root, 'db_anime.db'),
          path.join(root, 'experiment/python/web_anime/db_anime.db'),
          path.join(root, '.next/standalone/db_anime.db'),
          path.join(root, '.next/standalone/experiment/python/web_anime/db_anime.db')
        ];

        // Also check parent directories relative to this file's output directory
        try {
          let curr = __dirname;
          for (let i = 0; i < 5; i++) {
            candidatePaths.push(path.join(curr, 'db_anime.db'));
            curr = path.dirname(curr);
          }
        } catch (e) {}

        for (const p of candidatePaths) {
          if (fs.existsSync(p)) {
            return p;
          }
        }

        // Default fallback
        return path.join(process.cwd(), 'db_anime.db');
      };

      const dbPath = findDbPath();
      
      console.log('--- DB CONNECTION DEBUG ---');
      console.log('process.cwd():', process.cwd());
      console.log('dbPath resolved:', dbPath);
      console.log('dbPath exists:', fs.existsSync(dbPath));
      console.log('---------------------------');
      
      const isVercel = process.env.VERCEL === '1' || process.env.NOW_BUILDER === '1';

      localDb = new Database(dbPath, { 
        readonly: true
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
