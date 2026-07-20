import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "db_anime.db"))
IMAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "images"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Returns dictionaries instead of tuples
    return conn

@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serves cover images from the images directory."""
    # Get just the base filename if it contains a path prefix
    base_filename = os.path.basename(filename)
    return send_from_directory(IMAGE_DIR, base_filename)

@app.route('/api/anime', methods=['GET'])
def get_anime():
    """Gets list of anime from database with pagination and optional search."""
    search_query = request.args.get('q', '').strip()
    status_filter = request.args.get('status', '').strip()
    genre_filter = request.args.get('genre', '').strip()
    type_filter = request.args.get('type', '').strip()
    sort_filter = request.args.get('sort', 'latest').strip()
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    conn = get_db_connection()
    cursor = conn.cursor()

    conditions = ["backup_status = 'completed'"]
    params = []

    if search_query:
        conditions.append("judul LIKE ?")
        params.append(f'%{search_query}%')
    if status_filter:
        conditions.append("status = ?")
        params.append(status_filter)
    if genre_filter:
        conditions.append("genres LIKE ?")
        params.append(f'%{genre_filter}%')
    if type_filter:
        conditions.append("tipe = ?")
        params.append(type_filter)

    where_clause = " WHERE " + " AND ".join(conditions)

    # Determine ORDER BY clause
    order_by = "id DESC"
    if sort_filter == 'rating':
        order_by = "CAST(skor AS FLOAT) DESC, id DESC"
    elif sort_filter == 'title':
        order_by = "judul ASC"

    # Count total items
    count_sql = f"SELECT COUNT(*) FROM anime{where_clause}"
    cursor.execute(count_sql, params)
    total_items = cursor.fetchone()[0]

    # Get items
    select_sql = f"SELECT * FROM anime{where_clause} ORDER BY {order_by} LIMIT ? OFFSET ?"
    cursor.execute(select_sql, params + [limit, offset])
    rows = cursor.fetchall()
    conn.close()

    anime_list = []
    for row in rows:
        anime_list.append({
            'id': row['id'],
            'judul': row['judul'],
            'link': row['link'],
            'judul_japanese': row['judul_japanese'],
            'skor': row['skor'],
            'produser': row['produser'],
            'tipe': row['tipe'],
            'status': row['status'],
            'total_episode': row['total_episode'],
            'durasi': row['durasi'],
            'tanggal_rilis': row['tanggal_rilis'],
            'studio': row['studio'],
            'genres': row['genres'],
            'sinopsis': row['sinopsis'],
            'image_path': os.path.basename(row['image_path']) if row['image_path'] else None,
            'scraped_at': row['scraped_at']
        })

    total_pages = (total_items + limit - 1) // limit

    return jsonify({
        'page': page,
        'limit': limit,
        'total_items': total_items,
        'total_pages': total_pages,
        'data': anime_list
    })

@app.route('/api/anime/<int:anime_id>', methods=['GET'])
def get_anime_details(anime_id):
    """Gets complete metadata and episode list for a single anime."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get anime details
    cursor.execute("SELECT * FROM anime WHERE id = ?", (anime_id,))
    anime_row = cursor.fetchone()

    if not anime_row:
        conn.close()
        return jsonify({'error': 'Anime not found'}), 404

    # Get episodes
    cursor.execute("SELECT * FROM episodes WHERE anime_id = ? ORDER BY id ASC", (anime_id,))
    episode_rows = cursor.fetchall()
    conn.close()

    episodes = []
    for ep in episode_rows:
        episodes.append({
            'id': ep['id'],
            'judul': ep['judul'],
            'link': ep['link']
        })

    anime_data = {
        'id': anime_row['id'],
        'judul': anime_row['judul'],
        'judul_japanese': anime_row['judul_japanese'],
        'skor': anime_row['skor'],
        'produser': anime_row['produser'],
        'tipe': anime_row['tipe'],
        'status': anime_row['status'],
        'total_episode': anime_row['total_episode'],
        'durasi': anime_row['durasi'],
        'tanggal_rilis': anime_row['tanggal_rilis'],
        'studio': anime_row['studio'],
        'genres': anime_row['genres'],
        'sinopsis': anime_row['sinopsis'],
        'image_path': os.path.basename(anime_row['image_path']) if anime_row['image_path'] else None,
        'episodes': episodes
    }

    return jsonify(anime_data)

@app.route('/api/episodes/<int:episode_id>/embeds', methods=['GET'])
def get_episode_embeds(episode_id):
    """Gets resolved quality mirror embeds for an episode."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM embeds WHERE episode_id = ? ORDER BY id ASC", (episode_id,))
    rows = cursor.fetchall()
    conn.close()

    embeds = []
    for row in rows:
        embeds.append({
            'id': row['id'],
            'quality': row['quality'],
            'mirror': row['mirror'],
            'link': row['link']
        })

    return jsonify(embeds)

if __name__ == '__main__':
    print(f"Loading database from: {DB_PATH}")
    print(f"Loading images from: {IMAGE_DIR}")
    is_debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host='0.0.0.0', port=5000, debug=is_debug)
