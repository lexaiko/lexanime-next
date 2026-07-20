import os
import re
import sqlite3
import base64
import json
import time
import urllib3
import requests
import threading
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
from urllib.parse import urlparse

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Threading Lock for safe SQLite writes
DB_LOCK = threading.Lock()

# Initialize Session (using Session is critical for HTTP Keep-Alive connection pooling to make requests 10x faster)
try:
    # pyrefly: ignore [missing-import]
    from curl_cffi import requests as curl_requests
    class CurlCffiSession:
        def __init__(self):
            self.session = curl_requests.Session()
        def get(self, url, **kwargs):
            kwargs.setdefault('impersonate', 'chrome120')
            if 'headers' in kwargs and kwargs['headers']:
                headers = kwargs['headers'].copy()
                headers.pop('User-Agent', None)
                headers.pop('Accept', None)
                headers.pop('Accept-Language', None)
                kwargs['headers'] = headers
            return self.session.get(url, **kwargs)
        def post(self, url, **kwargs):
            kwargs.setdefault('impersonate', 'chrome120')
            if 'headers' in kwargs and kwargs['headers']:
                headers = kwargs['headers'].copy()
                headers.pop('User-Agent', None)
                headers.pop('Accept', None)
                kwargs['headers'] = headers
            return self.session.post(url, **kwargs)
    SCRAPER = CurlCffiSession()
    print("[INIT] Using curl_cffi session for fast connection pooling.")
except ImportError:
    SCRAPER = requests.Session()
    print("[INIT] Using standard requests.Session() for fast connection pooling.")

# Configurations
BASE_URL = "https://otakudesu.blog"
DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "web_anime", "db_anime.db"))
IMAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "web_anime", "images"))
DELAY_BETWEEN_ANIME = 0.3  # seconds

# Headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
}

def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()
    
    # Create anime table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS anime (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            judul TEXT,
            link TEXT UNIQUE,
            judul_japanese TEXT,
            skor TEXT,
            produser TEXT,
            tipe TEXT,
            status TEXT,
            total_episode TEXT,
            durasi TEXT,
            tanggal_rilis TEXT,
            studio TEXT,
            genres TEXT,
            sinopsis TEXT,
            image_path TEXT,
            backup_status TEXT DEFAULT 'pending',
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create episodes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            anime_id INTEGER,
            judul TEXT,
            link TEXT UNIQUE,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (anime_id) REFERENCES anime (id) ON DELETE CASCADE
        )
    ''')
    
    # Create embeds table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS embeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            episode_id INTEGER,
            quality TEXT,
            mirror TEXT,
            link TEXT,
            FOREIGN KEY (episode_id) REFERENCES episodes (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def get_all_anime_list():
    """Fetches list of all anime from the index page and saves them to the DB as pending if not already present."""
    url = f"{BASE_URL}/anime-list/"
    print(f"[INDEX] Fetching all anime list from {url}...")
    try:
        res = SCRAPER.get(url, headers=HEADERS, verify=False)
        if res.status_code != 200:
            print(f"[INDEX] Failed to fetch index page: status {res.status_code}")
            return 0
    except Exception as e:
        print(f"[INDEX] Error fetching index page: {e}")
        return 0
        
    soup = BeautifulSoup(res.text, 'html.parser')
    container = soup.find('div', id='abtext')
    if not container:
        print("[INDEX] Could not find #abtext container.")
        return 0
        
    with DB_LOCK:
        conn = sqlite3.connect(DB_FILE)
        conn.execute("PRAGMA journal_mode=WAL;")
        cursor = conn.cursor()
        
        added_count = 0
        skipped_count = 0
        
        for a_tag in container.select('ul li a'):
            judul = a_tag.get_text(strip=True)
            link = a_tag.get('href')
            if judul and link:
                # Check if already exists in DB
                cursor.execute("SELECT id FROM anime WHERE link = ?", (link,))
                row = cursor.fetchone()
                if not row:
                    cursor.execute(
                        "INSERT INTO anime (judul, link, backup_status) VALUES (?, ?, 'pending')",
                        (judul, link)
                    )
                    added_count += 1
                else:
                    skipped_count += 1
                    
        conn.commit()
        conn.close()
    print(f"[INDEX] Seeding completed: Added {added_count} new entries, skipped {skipped_count} existing entries.")
    return added_count

def download_image(url, filename_title):
    """Downloads cover image to IMAGE_DIR and returns the local path."""
    if not os.path.exists(IMAGE_DIR):
        os.makedirs(IMAGE_DIR)
        
    local_path = os.path.join(IMAGE_DIR, f"{filename_title}.jpg")
    
    # Speed Optimization: Skip download if image already exists
    if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
        return local_path
        
    try:
        res = SCRAPER.get(url, headers=HEADERS, verify=False, timeout=10)
        if res.status_code == 200:
            with open(local_path, "wb") as f:
                f.write(res.content)
            return local_path
    except Exception as e:
        print(f"      [IMAGE] Failed to download image for {filename_title}: {e}")
    return None

def resolve_embeds(episode_url):
    """Fetches the dynamic video embeds for a single episode."""
    ep_headers = {**HEADERS, 'Referer': episode_url}
    try:
        res = SCRAPER.get(episode_url, headers=ep_headers, verify=False, timeout=10)
        if res.status_code != 200:
            return []
    except Exception:
        return []

    soup = BeautifulSoup(res.text, 'html.parser')
    embeds = []

    # Get default iframe
    default_iframe = soup.find('iframe')
    if default_iframe and 'src' in default_iframe.attrs:
        embeds.append({
            'quality': 'default',
            'mirror': 'default',
            'link': default_iframe['src']
        })

    # Find nonce script
    script_text = ""
    for s in soup.find_all('script'):
        if 'window.__x__nonce' in s.text:
            script_text = s.text
            break

    if not script_text:
        return embeds

    # Actions
    nonce_action = None
    nonce_action_match = re.search(r'data:\s*\{\s*action:\s*["\']([a-f0-9]{32})["\']\s*\}', script_text)
    if nonce_action_match:
        nonce_action = nonce_action_match.group(1)

    embed_action = None
    embed_action_match = re.search(r'\.\.\.e\s*,\s*nonce:\s*\w+\s*,\s*action:\s*["\']([a-f0-9]{32})["\']', script_text)
    if embed_action_match:
        embed_action = embed_action_match.group(1)

    if not nonce_action or not embed_action:
        actions = re.findall(r'action:\s*["\']([a-f0-9]{32})["\']', script_text)
        if len(actions) >= 2:
            embed_action = actions[0]
            nonce_action = actions[1]

    if not nonce_action or not embed_action:
        return embeds

    parsed_url = urlparse(episode_url)
    base_domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
    ajax_url = f"{base_domain}/wp-admin/admin-ajax.php"

    # Get nonce
    try:
        nonce_res = SCRAPER.post(ajax_url, data={'action': nonce_action}, headers=ep_headers, verify=False, timeout=10)
        if nonce_res.status_code == 200:
            nonce = nonce_res.json().get('data')
        else:
            return embeds
    except Exception:
        return embeds

    if not nonce:
        return embeds

    # Find mirror containers
    mirrorstream = soup.find('div', class_='mirrorstream')
    if not mirrorstream:
        return embeds

    for ul in mirrorstream.find_all('ul'):
        quality_class = ul.get('class')
        quality = quality_class[0] if quality_class else "unknown"
        if quality.startswith('m') and quality[1:].replace('p', '').isdigit():
            quality = quality[1:]

        for li in ul.find_all('li'):
            a = li.find('a')
            if not a or 'data-content' not in a.attrs:
                continue

            mirror_name = a.text.strip()
            data_content = a['data-content']

            try:
                decoded_bytes = base64.b64decode(data_content)
                param_data = json.loads(decoded_bytes.decode('utf-8'))
            except Exception:
                continue

            embed_payload = {
                **param_data,
                'nonce': nonce,
                'action': embed_action
            }

            try:
                embed_res = SCRAPER.post(ajax_url, data=embed_payload, headers=ep_headers, verify=False, timeout=10)
                if embed_res.status_code == 200:
                    enc_data = embed_res.json().get('data')
                    if enc_data:
                        dec_html = base64.b64decode(enc_data).decode('utf-8')
                        iframe_soup = BeautifulSoup(dec_html, 'html.parser')
                        iframe = iframe_soup.find('iframe')
                        if iframe and 'src' in iframe.attrs:
                            embeds.append({
                                'quality': quality,
                                'mirror': mirror_name,
                                'link': iframe['src']
                            })
            except Exception:
                continue

    return embeds

def backup_single_anime(anime_id, judul, url):
    """Scrapes all details, synopsis, episodes, and embeds for a single anime."""
    print(f"\n[BACKUP] Processing anime ID {anime_id}: {judul}...")
    try:
        res = SCRAPER.get(url, headers=HEADERS, verify=False, timeout=10)
        if res.status_code != 200:
            print(f"  [ERROR] Failed to fetch page: status {res.status_code}")
            return False
    except Exception as e:
        print(f"  [ERROR] Network error fetching page: {e}")
        return False
        
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # 1. Parse cover image
    image_url = None
    foto_div = soup.find('div', class_='fotoanime')
    img_tag = foto_div.find('img') if foto_div else None
    if not img_tag:
        img_tag = soup.find('img', class_='wp-post-image')
    if img_tag and 'src' in img_tag.attrs:
        image_url = img_tag['src']
        
    # Sanitized title for cover image filename (avoid invalid FS characters)
    sanitized_title = re.sub(r'[\\/*?:"<>|]', "", judul)
    sanitized_title = re.sub(r'\s+', ' ', sanitized_title).strip()

    local_image_path = None
    if image_url:
        print(f"  [IMAGE] Downloading cover image from: {image_url}")
        local_image_path = download_image(image_url, sanitized_title)
        
    # 2. Parse metadata from div.infozingle
    meta = {}
    infozingle = soup.find('div', class_='infozingle')
    if infozingle:
        for p in infozingle.find_all('p'):
            t = p.get_text(strip=True)
            if ':' in t:
                parts = t.split(':', 1)
                k = parts[0].strip().lower().replace(' ', '_')
                v = parts[1].strip()
                meta[k] = v
                
    # 3. Parse synopsis
    sinopsis = ""
    sinop_div = soup.find('div', class_='sinopc')
    if sinop_div:
        sinopsis = sinop_div.get_text('\n', strip=True)
        
    # 4. Extract episodes list
    episodes = []
    episodelists = soup.find_all("div", class_="episodelist")
    for ep_section in episodelists:
        for a in ep_section.find_all("a"):
            ep_link = a.get("href", "")
            if "/episode/" in ep_link:
                ep_title = a.text.strip()
                if (ep_title, ep_link) not in episodes:
                    episodes.append((ep_title, ep_link))
            
    print(f"  [METADATA] Studio: {meta.get('studio', 'N/A')}, Status: {meta.get('status', 'N/A')}")
    print(f"  [EPISODES] Found {len(episodes)} episodes to process.")
    
    # Process episodes and dynamic embeds in parallel first (no DB connection/lock)
    print(f"    [EPISODES] Resolving embeds for all {len(episodes)} episodes concurrently...")
    
    reversed_episodes = list(reversed(episodes))
    
    # Task to fetch embeds for an episode
    def fetch_embeds_task(item):
        idx, (ep_title, ep_link) = item
        try:
            embed_links = resolve_embeds(ep_link)
            return idx, ep_title, ep_link, embed_links
        except Exception:
            return idx, ep_title, ep_link, []
            
    # Resolve all episodes of this anime in parallel using 8 workers
    indexed_episodes = list(enumerate(reversed_episodes, 1))
    with ThreadPoolExecutor(max_workers=8) as executor:
        resolved_results = list(executor.map(fetch_embeds_task, indexed_episodes))
        
    # Open database and write everything in a single, fast locked transaction
    with DB_LOCK:
        conn = sqlite3.connect(DB_FILE)
        conn.execute("PRAGMA journal_mode=WAL;")
        cursor = conn.cursor()
        
        # Update anime record metadata
        cursor.execute('''
            UPDATE anime 
            SET judul_japanese = ?, skor = ?, produser = ?, tipe = ?, status = ?, 
                total_episode = ?, durasi = ?, tanggal_rilis = ?, studio = ?, 
                genres = ?, sinopsis = ?, image_path = ?
            WHERE id = ?
        ''', (
            meta.get('japanese'),
            meta.get('skor'),
            meta.get('produser'),
            meta.get('tipe'),
            meta.get('status'),
            meta.get('total_episode'),
            meta.get('durasi'),
            meta.get('tanggal_rilis'),
            meta.get('studio'),
            meta.get('genre'),
            sinopsis,
            local_image_path,
            anime_id
        ))
        
        # Save the results sequentially
        for idx, ep_title, ep_link, embed_links in resolved_results:
            # Check if episode already exists in DB
            cursor.execute("SELECT id FROM episodes WHERE link = ?", (ep_link,))
            ep_row = cursor.fetchone()
            
            if not ep_row:
                cursor.execute(
                    "INSERT INTO episodes (anime_id, judul, link) VALUES (?, ?, ?)",
                    (anime_id, ep_title, ep_link)
                )
                ep_id = cursor.lastrowid
            else:
                ep_id = ep_row[0]
                # Clear old embeds for this episode to refresh cleanly
                cursor.execute("DELETE FROM embeds WHERE episode_id = ?", (ep_id,))
                
            # Insert embeds
            embed_count = 0
            for item in embed_links:
                cursor.execute(
                    "INSERT INTO embeds (episode_id, quality, mirror, link) VALUES (?, ?, ?, ?)",
                    (ep_id, item['quality'], item['mirror'], item['link'])
                )
                embed_count += 1
                
            print(f"    -> [EP {idx}/{len(episodes)}] {ep_title}: Resolved {embed_count} embed links.")
            
        # Mark anime as completed
        cursor.execute("UPDATE anime SET backup_status = 'completed' WHERE id = ?", (anime_id,))
        
        conn.commit()
        conn.close()
        
    print(f"  [SUCCESS] Completed backup of anime: {judul}")
    return True

def run_backup():
    print("="*60)
    print("      OTAKUDESU FULL DATABASE BACKUP SCRAPER")
    print("="*60)
    
    init_db()
    
    # Seed initially from the index list
    get_all_anime_list()
    
    # Fetch pending list
    with DB_LOCK:
        conn = sqlite3.connect(DB_FILE)
        conn.execute("PRAGMA journal_mode=WAL;")
        cursor = conn.cursor()
        cursor.execute("SELECT id, judul, link FROM anime WHERE backup_status = 'pending'")
        pending_anime = cursor.fetchall()
        cursor.execute("SELECT COUNT(*) FROM anime")
        total_total = cursor.fetchone()[0]
        conn.close()
    
    total_pending = len(pending_anime)
    print(f"\n[STATS] Total anime in index: {total_total}. Remaining to scrape: {total_pending}.\n")
    
    if total_pending == 0:
        print("[INFO] All anime records are already scraped and backed up successfully!")
        return

    print(f"[START] Scraping {total_pending} anime in parallel using 3 workers...")
    
    scraped_count = 0
    scraped_lock = threading.Lock()
    
    # Worker task to backup a single anime in a separate thread
    def anime_worker_task(item):
        nonlocal scraped_count
        idx, (anime_id, judul, link) = item
        print(f"[THREAD] Starting [{idx}/{total_pending}]: {judul}...")
        
        success = backup_single_anime(anime_id, judul, link)
        if success:
            with scraped_lock:
                scraped_count += 1
        
        # Polite delay before releasing this thread worker for the next anime
        time.sleep(DELAY_BETWEEN_ANIME)
        return success
        
    # Execute the anime workers in parallel (3 concurrent anime is extremely fast and very safe)
    indexed_pending = list(enumerate(pending_anime, 1))
    with ThreadPoolExecutor(max_workers=3) as executor:
        list(executor.map(anime_worker_task, indexed_pending))
            
    print("\n" + "="*60)
    print(f"   BACKUP PROCESS COMPLETE! Scraped {scraped_count} anime.")
    print("="*60)

if __name__ == "__main__":
    try:
        run_backup()
    except KeyboardInterrupt:
        print("\n\n[ABORTED] Backup scraper stopped by user. Database integrity is preserved. Run the script again to resume!")
