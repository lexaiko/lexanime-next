import { NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/db';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const anime_id = parseInt(id, 10);

    if (isNaN(anime_id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Get anime details
    const anime_row = await queryOne("SELECT * FROM anime WHERE id = ?", [anime_id]);

    if (!anime_row) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    // Get episodes
    const episode_rows = await queryAll("SELECT * FROM episodes WHERE anime_id = ? ORDER BY id ASC", [anime_id]);

    const episodes = episode_rows.map(ep => ({
      id: ep.id,
      judul: ep.judul,
      link: ep.link
    }));

    const anime_data = {
      id: anime_row.id,
      judul: anime_row.judul,
      judul_japanese: anime_row.judul_japanese,
      skor: anime_row.skor,
      produser: anime_row.produser,
      tipe: anime_row.tipe,
      status: anime_row.status,
      total_episode: anime_row.total_episode,
      durasi: anime_row.durasi,
      tanggal_rilis: anime_row.tanggal_rilis,
      studio: anime_row.studio,
      genres: anime_row.genres,
      sinopsis: anime_row.sinopsis,
      image_path: anime_row.image_path ? path.basename(anime_row.image_path) : null,
      episodes
    };

    return NextResponse.json(anime_data);
  } catch (error) {
    console.error('Error fetching anime details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
