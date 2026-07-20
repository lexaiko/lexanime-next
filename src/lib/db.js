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
      localDb = new Database(dbPath, { readonly: true });
      localDb.pragma('journal_mode = WAL');
      localDb.pragma('synchronous = NORMAL');
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
