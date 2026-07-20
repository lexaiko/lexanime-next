import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const episode_id = parseInt(id, 10);

    if (isNaN(episode_id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Get embeds
    const rows = await queryAll("SELECT * FROM embeds WHERE episode_id = ? ORDER BY id ASC", [episode_id]);

    const embeds = rows.map(row => ({
      id: row.id,
      quality: row.quality,
      mirror: row.mirror,
      link: row.link
    }));

    return NextResponse.json(embeds);
  } catch (error) {
    console.error('Error fetching episode embeds:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
