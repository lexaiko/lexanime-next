import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search_query = (searchParams.get('q') || '').trim();
    const status_filter = (searchParams.get('status') || '').trim();
    const genre_filter = (searchParams.get('genre') || '').trim();
    const type_filter = (searchParams.get('type') || '').trim();
    const sort_filter = (searchParams.get('sort') || 'latest').trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const db = getDb();

    const conditions = ["backup_status = 'completed'"];
    const params = [];

    if (search_query) {
      conditions.push("judul LIKE ?");
      params.push(`%${search_query}%`);
    }
    if (status_filter) {
      conditions.push("status = ?");
      params.push(status_filter);
    }
    if (genre_filter) {
      conditions.push("genres LIKE ?");
      params.push(`%${genre_filter}%`);
    }
    if (type_filter) {
      conditions.push("tipe = ?");
      params.push(type_filter);
    }

    const where_clause = " WHERE " + conditions.join(" AND ");

    // Determine ORDER BY clause
    let order_by = "id DESC";
    if (sort_filter === 'rating') {
      order_by = "CAST(skor AS FLOAT) DESC, id DESC";
    } else if (sort_filter === 'title') {
      order_by = "judul ASC";
    }

    // Count total items
    const count_sql = `SELECT COUNT(*) as count FROM anime ${where_clause}`;
    const countResult = db.prepare(count_sql).get(...params);
    const total_items = countResult ? countResult.count : 0;

    // Get items
    const select_sql = `SELECT * FROM anime ${where_clause} ORDER BY ${order_by} LIMIT ? OFFSET ?`;
    const rows = db.prepare(select_sql).all(...params, limit, offset);

    const anime_list = rows.map(row => ({
      id: row.id,
      judul: row.judul,
      link: row.link,
      judul_japanese: row.judul_japanese,
      skor: row.skor,
      produser: row.produser,
      tipe: row.tipe,
      status: row.status,
      total_episode: row.total_episode,
      durasi: row.durasi,
      tanggal_rilis: row.tanggal_rilis,
      studio: row.studio,
      genres: row.genres,
      sinopsis: row.sinopsis,
      image_path: row.image_path ? path.basename(row.image_path) : null,
      scraped_at: row.scraped_at
    }));

    const total_pages = Math.ceil(total_items / limit);

    return NextResponse.json({
      page,
      limit,
      total_items,
      total_pages,
      data: anime_list
    });
  } catch (error) {
    console.error('Error fetching anime list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
