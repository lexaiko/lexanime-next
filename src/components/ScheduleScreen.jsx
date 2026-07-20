import React, { useState, useEffect } from 'react';
import { Ic } from './Icons';
import { API_BASE, imgSrc } from '../lib/utils';

export function ScheduleScreen({ openDetail }) {
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/anime?status=Ongoing&limit=150`);
        const result = await res.json();
        const items = result.data || [];
        
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Random'];
        const grouped = {};
        days.forEach(d => { grouped[d] = []; });
        
        items.forEach(anime => {
          const day = anime.hari_tayang || 'Random';
          if (grouped[day]) {
            grouped[day].push(anime);
          }
        });
        
        setScheduleData(grouped);
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Random'];

  if (loading) {
    return (
      <div className="status-center" style={{ paddingTop: 80 }}>
        <div className="spinner" />
        <div className="status-text">Memuat jadwal tayang anime...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
          <span style={{ fontSize: '1.4rem' }}>📅</span> Jadwal Tayang Mingguan
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Daftar jadwal update episode terbaru anime ongoing yang rilis setiap harinya.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        paddingBottom: '40px'
      }}>
        {days.map(day => {
          const list = scheduleData[day] || [];
          if (day === 'Random' && list.length === 0) return null;
          
          return (
            <div 
              key={day} 
              className="schedule-day-card"
              style={{
                background: 'var(--liquid-glass-bg)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(16px)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--glass-shadow)',
                borderTop: day === 'Random' ? '3px solid var(--text-muted)' : '3px solid var(--red)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {day}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                  {list.length} Anime
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {list.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Tidak ada jadwal tayang
                  </div>
                ) : (
                  list.map(anime => (
                    <div 
                      key={anime.id} 
                      className="schedule-anime-row"
                      style={{
                        display: 'flex',
                        gap: '10px',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => openDetail(anime.id)}
                    >
                      <img 
                        src={imgSrc(anime.image_path)} 
                        alt={anime.judul}
                        style={{
                          width: '40px',
                          height: '55px',
                          borderRadius: '4px',
                          objectFit: 'cover'
                        }}
                        onError={e => { e.target.src = 'https://placehold.co/40x55/1f293d/38bdf8?text=No+Cover'; }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1 }}>
                        <div 
                          className="schedule-anime-title"
                          style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 600, 
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={anime.judul.replace('On-Going', '')}
                        >
                          {anime.judul.replace('On-Going', '')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {anime.studio || 'Unknown'}
                        </div>
                        {anime.skor && anime.skor !== 'N/A' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#fbbf24', marginTop: '2px' }}>
                            {Ic.star} {anime.skor}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
