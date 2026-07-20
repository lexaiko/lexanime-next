import React from 'react';
import { Ic } from './Icons';
import { API_BASE, imgSrc } from '../lib/utils';

export function NetflixJumbotronHero({ ongoingList, heroIndex, setHeroIndex, heroTimer, openDetail, toggleBookmark, isBookmarked }) {
  const slides = ongoingList.slice(0, 5);
  if (slides.length === 0) return null;

  const currentAnime = slides[heroIndex] || slides[0];

  return (
    <div className="jumbotron-hero-wrap">
      {slides.map((anime, i) => (
        <div
          key={anime.id}
          className={`jumbotron-slide ${i === heroIndex ? 'active' : ''}`}
          style={{
            backgroundImage: anime.image_path
              ? `url(${API_BASE}/images/${anime.image_path})`
              : 'linear-gradient(135deg, #1f293d 0%, #0b0f19 100%)'
          }}
        >
          <div className="jumbotron-gradient" />
        </div>
      ))}

      <div className="jumbotron-content">
        <div className="jumbotron-poster-row">
          <img
            src={imgSrc(currentAnime.image_path)}
            alt={currentAnime.judul}
            className="jumbotron-poster-img"
            onClick={() => openDetail(currentAnime.id)}
            onError={(e) => { e.target.src = 'https://placehold.co/155x220/1f293d/38bdf8?text=No+Cover'; }}
          />

          <div className="jumbotron-text-group">
            <div className="hero-badges">
              {currentAnime.total_episode && currentAnime.total_episode !== 'Unknown' && (
                <span className="hero-badge badge-blue">Episodes: {currentAnime.total_episode}</span>
              )}
              {currentAnime.status && (
                <span className="hero-badge badge-green">{currentAnime.status}</span>
              )}
              {currentAnime.skor && currentAnime.skor !== 'N/A' && (
                <span className="hero-badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#fbbf24' }}>
                  {Ic.star} {currentAnime.skor}
                </span>
              )}
            </div>

            <h1 className="jumbotron-title" onClick={() => openDetail(currentAnime.id)}>
              {currentAnime.judul}
            </h1>

            <p className="jumbotron-synopsis">
              {currentAnime.sinopsis || "Saksikan tayangan anime terbaru dengan subtitle Indonesia dan kualitas streaming terbaik hanya di LexAnime."}
            </p>

            <div className="jumbotron-btn-group">
              <button className="hero-btn" type="button" onClick={() => openDetail(currentAnime.id)}>
                {Ic.play} Tonton Sekarang
              </button>
              <button 
                className={`hero-btn-secondary ${isBookmarked(currentAnime.id) ? 'bookmarked' : ''}`} 
                type="button"
                onClick={() => toggleBookmark(currentAnime)}
              >
                {Ic.bookmark(isBookmarked(currentAnime.id))} 
                <span>{isBookmarked(currentAnime.id) ? 'Disimpan' : 'Bookmark'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="jumbotron-dots">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`hero-dot ${i === heroIndex ? 'active' : ''}`}
            onClick={() => { setHeroIndex(i); clearInterval(heroTimer.current); }}
          />
        ))}
      </div>
    </div>
  );
}
