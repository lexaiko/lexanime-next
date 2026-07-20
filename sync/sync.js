/**
 * LEXANIME DATABASE STANDALONE UPDATER
 * Ported from backup_scraper.py — uses Cheerio for reliable HTML parsing
 * (equivalent to BeautifulSoup in Python).
 * Run: node sync/sync.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');

const BASE_URL = 'https://otakudesu.blog';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest'
};

// public/images — where cover images are served from
const IMAGE_DIR = path.resolve(__dirname, '../public/images');

const dbPath = path.resolve(__dirname, '../db_anime.db');
console.log('Opening database at:', dbPath);
const db = new Database(dbPath, { readonly: false });
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

/**
 * Downloads a cover image and saves it to public/images/
 * Returns the filename (used as image_path in DB), or null on failure.
 * Ported from download_image() in backup_scraper.py
 */
async function downloadImage(imageUrl, filename) {
  if (!imageUrl || !filename) return null;
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const localPath = path.join(IMAGE_DIR, filename);
  // Skip if already downloaded
  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
    return filename;
  }

  try {
    const res = await fetch(imageUrl, { headers: HEADERS });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(localPath, buffer);
    return filename;
  } catch (e) {
    console.warn(`      [IMAGE] Failed to download ${filename}: ${e.message}`);
    return null;
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} calling ${url}`);
  return res.text();
}

/**
 * Resolves dynamic video embeds for a single episode.
 * Logic ported 1:1 from resolve_embeds() in backup_scraper.py
 */
async function resolveEmbeds(episodeUrl) {
  const epHeaders = { ...HEADERS, 'Referer': episodeUrl };
  const embeds = [];

  let html;
  try {
    const res = await fetch(episodeUrl, { headers: epHeaders });
    if (!res.ok) return [];
    html = await res.text();
  } catch (e) {
    return [];
  }

  const $ = cheerio.load(html);

  // 1. Get default iframe
  const defaultIframe = $('iframe').first();
  if (defaultIframe.length && defaultIframe.attr('src')) {
    embeds.push({ quality: 'default', mirror: 'default', link: defaultIframe.attr('src') });
  }

  // 2. Find nonce script block
  let scriptText = '';
  $('script').each((_, el) => {
    const txt = $(el).html() || '';
    if (txt.includes('window.__x__nonce')) {
      scriptText = txt;
      return false; // break
    }
  });
  if (!scriptText) return embeds;

  // 3. Extract action hashes
  let nonceAction = null;
  const nonceActionMatch = scriptText.match(/data:\s*\{\s*action:\s*["']([a-f0-9]{32})["']\s*\}/i);
  if (nonceActionMatch) nonceAction = nonceActionMatch[1];

  let embedAction = null;
  const embedActionMatch = scriptText.match(/\.\.\.e\s*,\s*nonce:\s*\w+\s*,\s*action:\s*["']([a-f0-9]{32})["']/i);
  if (embedActionMatch) embedAction = embedActionMatch[1];

  if (!nonceAction || !embedAction) {
    const actions = [...scriptText.matchAll(/action:\s*["']([a-f0-9]{32})["']/gi)].map(m => m[1]);
    if (actions.length >= 2) {
      embedAction = actions[0];
      nonceAction = actions[1];
    }
  }

  if (!nonceAction || !embedAction) return embeds;

  const urlObj = new URL(episodeUrl);
  const ajaxUrl = `${urlObj.protocol}//${urlObj.host}/wp-admin/admin-ajax.php`;

  // 4. Request nonce from admin-ajax
  let nonce = null;
  try {
    const body = new URLSearchParams({ action: nonceAction });
    const nonceRes = await fetch(ajaxUrl, {
      method: 'POST',
      body,
      headers: { ...epHeaders, 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (nonceRes.ok) {
      const data = await nonceRes.json();
      nonce = data.data;
    }
  } catch (e) {
    return embeds;
  }

  if (!nonce) return embeds;

  // 5. Find mirrorstream div and iterate all <ul> quality blocks
  //    Mirrors backup_scraper.py: mirrorstream.find_all('ul')
  const mirrorstream = $('.mirrorstream');
  if (!mirrorstream.length) return embeds;

  const ulList = mirrorstream.find('ul');
  for (let i = 0; i < ulList.length; i++) {
    const ul = ulList.eq(i);
    const classes = ul.attr('class') || '';
    let quality = classes.trim().split(/\s+/)[0] || 'unknown';

    // Strip leading 'm' from class names like m360p, m480p, m720p
    if (quality.startsWith('m') && /^\d+p?$/.test(quality.slice(1))) {
      quality = quality.slice(1);
    }

    // Iterate all <li><a data-content="..."> in this quality block
    const liTags = ul.find('li a[data-content]');
    for (let j = 0; j < liTags.length; j++) {
      const a = liTags.eq(j);
      const mirrorName = a.text().trim();
      const dataContent = a.attr('data-content');
      if (!dataContent) continue;

      try {
        const decoded = Buffer.from(dataContent, 'base64').toString('utf-8');
        const paramData = JSON.parse(decoded);

        const embedPayload = new URLSearchParams({ ...paramData, nonce, action: embedAction });
        const embedRes = await fetch(ajaxUrl, {
          method: 'POST',
          body: embedPayload,
          headers: { ...epHeaders, 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (embedRes.ok) {
          const resJson = await embedRes.json();
          const encData = resJson.data;
          if (encData) {
            const decHtml = Buffer.from(encData, 'base64').toString('utf-8');
            const $dec = cheerio.load(decHtml);
            const iframeSrc = $dec('iframe').attr('src');
            if (iframeSrc) {
              embeds.push({ quality, mirror: mirrorName, link: iframeSrc });
            }
          }
        }
      } catch (err) {
        // Skip individual mirror failures silently
      }
    }
  }

  return embeds;
}

async function run() {
  console.log('==================================================');
  console.log('       LEXANIME DATABASE STANDALONE UPDATER');
  console.log('==================================================');

  try {
    console.log('[1/4] Fetching ongoing anime list from Otakudesu...');
    const homeHtml = await fetchHtml(`${BASE_URL}/ongoing-anime/`);
    const $home = cheerio.load(homeHtml);

    const ongoingItems = [];
    $home('.detpost').each((_, el) => {
      const $el = $home(el);
      const link = $el.find('a').attr('href') || '';
      const judul = $el.find('h2.jdlflm').text().trim();
      const latestEp = $el.find('.epz').text().replace(/\s+/g, ' ').trim();
      if (link && judul) {
        ongoingItems.push({ link, judul, latestEp });
      }
    });

    console.log(`[2/4] Found ${ongoingItems.length} ongoing anime listed on Otakudesu.`);

    let checkedCount = 0;
    let newAnimeCount = 0;
    let newEpCount = 0;
    let newEmbedCount = 0;

    for (const item of ongoingItems) {
      checkedCount++;
      const slugSegment = item.link.replace(/\/$/, '').split('/').pop();
      const decodedSlug = decodeURIComponent(slugSegment);

      // Check if anime already exists in SQLite
      let anime = db.prepare('SELECT id, judul, link FROM anime WHERE link LIKE ? OR link LIKE ?').get(
        `%/${slugSegment}/%`,
        `%/${decodedSlug}/%`
      );

      let animeId = anime ? anime.id : null;

      if (!anime) {
        console.log(`   [NEW ANIME] Creating record for: "${item.judul}"`);
        const insertRes = db.prepare("INSERT INTO anime (judul, link, status) VALUES (?, ?, 'Ongoing')").run(
          item.judul,
          item.link
        );
        animeId = insertRes.lastInsertRowid;
        newAnimeCount++;
      }

      if (!animeId) continue;

      // Check if we already scraped this latest episode
      const cleanEpNum = item.latestEp.match(/\d+/)?.[0] || '';
      let alreadyScraped = false;
      if (cleanEpNum) {
        const epCheck = db.prepare('SELECT id FROM episodes WHERE anime_id = ? AND judul LIKE ?').get(
          animeId,
          `%Episode ${cleanEpNum}%`
        );
        if (epCheck) alreadyScraped = true;
      }

      if (alreadyScraped) continue;

      console.log(`\n👉 Updating "${item.judul}" (${item.latestEp})...`);
      const animeHtml = await fetchHtml(item.link);
      const $anime = cheerio.load(animeHtml);

      // --- Parse metadata from div.infozingle (ported from backup_scraper.py) ---
      const meta = {};
      $anime('.infozingle p').each((_, p) => {
        const text = $anime(p).text();
        if (text.includes(':')) {
          const [rawKey, ...rest] = text.split(':');
          const key = rawKey.trim().toLowerCase().replace(/\s+/g, '_');
          const val = rest.join(':').trim();
          meta[key] = val;
        }
      });

      // --- Parse synopsis ---
      const synopsis = $anime('.sinopc').text().trim();

      // --- Parse cover image from div.fotoanime img (primary) or og:image (fallback) ---
      // Ported from backup_scraper.py: foto_div -> img_tag -> image_url -> download_image()
      const fotoDiv = $anime('.fotoanime img').first();
      let imageUrl = fotoDiv.attr('src') || fotoDiv.attr('data-lazy-src') || fotoDiv.attr('data-src') || '';
      if (!imageUrl) {
        imageUrl = $anime('meta[property="og:image"]').attr('content') || '';
      }
      // Download to public/images/ and save just the filename in DB
      let imageFilename = null;
      if (imageUrl) {
        const rawFilename = imageUrl.split('/').pop();
        console.log(`      [IMAGE] Downloading cover: ${rawFilename}`);
        imageFilename = await downloadImage(imageUrl, rawFilename);
      }

      // --- Update anime metadata ---
      db.prepare(`
        UPDATE anime
        SET judul_japanese = ?, skor = ?, produser = ?, tipe = ?, status = ?,
            total_episode = ?, durasi = ?, tanggal_rilis = ?, studio = ?,
            genres = ?, sinopsis = ?, image_path = ?
        WHERE id = ?
      `).run(
        meta.japanese || null,
        meta.skor || null,
        meta.produser || null,
        meta.tipe || null,
        meta.status || 'Ongoing',
        meta.total_episode || null,
        meta.durasi || null,
        meta.tanggal_rilis || null,
        meta.studio || null,
        meta.genre || meta.genres || null,
        synopsis || null,
        imageFilename || null,
        animeId
      );

      // --- Extract episodes (ported from backup_scraper.py) ---
      // Python: episodelists = soup.find_all("div", class_="episodelist")
      //         for a in ep_section.find_all("a") if "/episode/" in a.href
      const episodes = [];
      $anime('.episodelist').each((_, section) => {
        $anime(section).find('a').each((_, a) => {
          const epLink = $anime(a).attr('href') || '';
          const epTitle = $anime(a).text().trim();
          if (epLink.includes('/episode/')) {
            episodes.push({ judul: epTitle, link: epLink });
          }
        });
      });

      // Reverse to ascending order (Ep1, Ep2, ...) like Python's reversed(episodes)
      episodes.reverse();

      // --- Insert new episodes and resolve embeds ---
      for (const ep of episodes) {
        const epRow = db.prepare('SELECT id FROM episodes WHERE link = ?').get(ep.link);
        let epId = epRow ? epRow.id : null;

        if (!epId) {
          console.log(`      + Inserting Episode: "${ep.judul}"`);
          const insertEpRes = db.prepare('INSERT INTO episodes (anime_id, judul, link) VALUES (?, ?, ?)').run(
            animeId,
            ep.judul,
            ep.link
          );
          epId = insertEpRes.lastInsertRowid;
          newEpCount++;

          if (epId) {
            console.log(`         -> Resolving mirrors...`);
            const embeds = await resolveEmbeds(ep.link);

            db.prepare('DELETE FROM embeds WHERE episode_id = ?').run(epId);

            for (const emb of embeds) {
              db.prepare('INSERT INTO embeds (episode_id, quality, mirror, link) VALUES (?, ?, ?, ?)').run(
                epId,
                emb.quality,
                emb.mirror,
                emb.link
              );
              newEmbedCount++;
            }
            console.log(`            -> ${embeds.length} embeds resolved (${[...new Set(embeds.map(e => e.quality))].join(', ')})`);
          }
        }
      }
    }

    console.log('\n==================================================');
    console.log('🎉 SINKRONISASI DATABASE SELESAI!');
    console.log(`   - Anime Dicek      : ${checkedCount}`);
    console.log(`   - Anime Baru Dibuat: ${newAnimeCount}`);
    console.log(`   - Episode Ditambah : ${newEpCount}`);
    console.log(`   - Cermin Embed Baru: ${newEmbedCount}`);
    console.log('==================================================');

  } catch (err) {
    console.error('\n❌ Gagal sinkronisasi:', err.message);
  } finally {
    db.close();
  }
}

run();

