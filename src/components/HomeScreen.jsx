import React from 'react';
import { Ic } from './Icons';
import { AnimeCard } from './AnimeCard';
import { NetflixJumbotronHero } from './NetflixJumbotronHero';

export function Shelf({ title, list, openDetail, setScreen, targetScreen = 'catalog' }) {
  if (list.length === 0) return null;
  return (
    <div className="section-block">
      <div className="section-header">
        <div className="section-title">
          <div className="section-title-bar" />
          {title}
        </div>
        <div className="section-see-all" onClick={() => { setScreen(targetScreen); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Lihat Semua {Ic.chevronRight}
        </div>
      </div>
      <div className="cards-row">
        {list.map(a => <AnimeCard key={a.id} anime={a} onClick={openDetail} />)}
      </div>
    </div>
  );
}

export function HomeScreen({ ongoingList, topList, exploreItems, exploreLoading, exploreHasMore, loadNextExplorePage, heroIndex, setHeroIndex, heroTimer, openDetail, toggleBookmark, isBookmarked, setScreen }) {
  return (
    <div>
      <NetflixJumbotronHero 
        ongoingList={ongoingList} 
        heroIndex={heroIndex} 
        setHeroIndex={setHeroIndex} 
        heroTimer={heroTimer} 
        openDetail={openDetail} 
        toggleBookmark={toggleBookmark} 
        isBookmarked={isBookmarked} 
      />
      <Shelf title="Ongoing Anime" list={ongoingList} openDetail={openDetail} setScreen={setScreen} targetScreen="ongoing" />
      <Shelf title="Koleksi Terpopuler" list={topList} openDetail={openDetail} setScreen={setScreen} targetScreen="popular" />

      <section className="section-block" style={{ marginTop: '1.5rem' }}>
        <div className="section-header">
          <div className="section-title">
            <div className="section-title-bar" />
            Jelajahi Anime
          </div>
        </div>

        <div className="anime-grid" style={{ padding: '12px 0' }}>
          {exploreItems.map((anime, idx) => (
            <AnimeCard key={`${anime.id}-${idx}`} anime={anime} onClick={openDetail} />
          ))}
        </div>

        <div className="lazy-loading-spinner-row">
          {exploreLoading && (
            <>
              <div className="spinner" />
              <p>Memuat anime lainnya...</p>
            </>
          )}

          {!exploreLoading && exploreHasMore && (
            <button className="hero-btn-secondary" type="button" onClick={loadNextExplorePage} style={{ marginTop: '8px' }}>
              Muat Lebih Banyak Anime ({exploreItems.length} ditampilkan)
            </button>
          )}

          {!exploreHasMore && exploreItems.length > 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              ✓ Semua koleksi anime ({exploreItems.length}) telah ditampilkan.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
