# Lexanime Database Sync

Skrip sinkronisasi database SQLite dengan data terbaru dari Otakudesu.

## Cara Pakai

Dari root folder web_anime/:

    npm run sync

Atau langsung:

    node sync/sync.js

## Yang Dilakukan

Setiap kali dijalankan:
1. Fetch daftar anime ongoing dari otakudesu.blog/ongoing-anime/
2. Cek tiap anime - apakah episode terbarunya sudah ada di DB
3. Jika ada episode baru:
   - Download cover image ke public/images/ (skip jika sudah ada)
   - Update metadata anime (judul Japanese, studio, genre, sinopsis)
   - Insert episode baru ke tabel episodes
   - Resolve semua mirror embed (360p, 480p, 720p)
   - Insert embed ke tabel embeds
4. Skip anime yang sudah up-to-date (efisien, tidak fetch ulang)

## Kapan Dijalankan?

| Situasi                        | Aksi              |
|--------------------------------|-------------------|
| Ada episode baru di Otakudesu  | npm run sync      |
| Ada anime ongoing baru         | npm run sync      |
| Cover image tidak muncul       | npm run sync      |
| Update rutin                   | 1x per hari       |

> Catatan: Sync hanya memonitor halaman ongoing-anime/.
> Untuk anime completed/baru dari nol, gunakan backup_scraper.py.