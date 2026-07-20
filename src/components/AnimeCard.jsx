import React from 'react';
import { Ic } from './Icons';
import { imgSrc, getDayName } from '../lib/utils';

export function AnimeCard({ anime, onClick }) {
  return (
    <div className="anime-card" onClick={() => onClick(anime.id)}>
      <div className="card-thumb">
        <img
          src={imgSrc(anime.image_path)}
          alt={anime.judul}
          loading="lazy"
          onError={(e) => { e.target.src = 'https://placehold.co/155x220/1f293d/38bdf8?text=No+Cover'; }}
        />
        {anime.total_episode && anime.total_episode !== 'Unknown' && (
          <span className="card-ep-badge">Ep {anime.total_episode}</span>
        )}
        {anime.status === 'Ongoing' && (
          <span className="card-day-badge">{getDayName()}</span>
        )}
        {anime.skor && anime.skor !== 'N/A' && (
          <span className="card-score-badge">
            {Ic.star} {anime.skor}
          </span>
        )}
        <div className="card-overlay">
          <div className="card-play-btn">{Ic.play}</div>
        </div>
      </div>
      <div className="card-body">
        <div className="card-title" title={anime.judul}>{anime.judul}</div>
        <div className="card-sub">{anime.studio || 'Unknown Studio'}</div>
      </div>
    </div>
  );
}
