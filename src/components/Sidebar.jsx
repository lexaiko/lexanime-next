import React from 'react';
import { Ic } from './Icons';

export function Sidebar({ screen, setScreen, jelajahiOpen, setJelajahiOpen, jadwalOpen, setJadwalOpen, filterGenre, setFilterGenre, filterDay, setFilterDay, setSearchQ, setFilterStatus, setFilterType, mobileOpen, closeMobileSidebar }) {
  const handleNav = (action) => {
    action();
    closeMobileSidebar();
  };

  return (
    <>
      <div className={`sidebar-backdrop ${mobileOpen ? 'mobile-open' : ''}`} onClick={closeMobileSidebar} />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo" onClick={() => handleNav(() => { setScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}>
          <div className="sidebar-logo-icon">🍿</div>
          <div className="sidebar-logo-text">Lex<em>anime</em></div>
        </div>

        <div className="sidebar-section-label">Menu Utama</div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${screen === 'home' ? 'active' : ''}`} onClick={() => handleNav(() => { setScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}>
            {Ic.home} <span>Beranda</span>
          </div>

          <div className={`nav-item ${screen === 'ongoing' ? 'active' : ''}`} onClick={() => handleNav(() => { setScreen('ongoing'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}>
            <span style={{ color: 'var(--red)', display: 'flex', alignItems: 'center' }}>{Ic.ongoing}</span> <span>Anime Ongoing</span>
          </div>

          <div className={`nav-item ${screen === 'popular' ? 'active' : ''}`} onClick={() => handleNav(() => { setScreen('popular'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}>
            <span style={{ color: 'var(--yellow)', display: 'flex', alignItems: 'center' }}>{Ic.starOutline}</span> <span>Terpopuler</span>
          </div>

          <div
            className={`nav-item ${jelajahiOpen || (screen === 'catalog' && filterGenre) ? 'expanded' : ''}`}
            onClick={() => setJelajahiOpen(o => !o)}
          >
            {Ic.compass} <span style={{ flex: 1 }}>Jelajahi Genre</span>
            <span className="nav-item-arrow">{Ic.chevronDown}</span>
          </div>
          {jelajahiOpen && (
            <div className="nav-sub">
              {['Action','Comedy','Fantasy','Romance','Isekai','Sci-Fi'].map(g => (
                <div
                  key={g}
                  className={`nav-sub-item ${filterGenre === g && screen === 'catalog' ? 'active' : ''}`}
                  onClick={() => handleNav(() => { setFilterGenre(g); setFilterDay(''); setSearchQ(''); setFilterStatus(''); setFilterType(''); setScreen('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}
                >
                  {g}
                </div>
              ))}
            </div>
          )}

          <div
            className={`nav-item ${screen === 'schedule' ? 'active' : jadwalOpen ? 'expanded' : ''}`}
            onClick={() => handleNav(() => { setScreen('schedule'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}
          >
            {Ic.calendar} <span style={{ flex: 1 }}>Jadwal Tayang</span>
            <span 
              className="nav-item-arrow"
              style={{ padding: '2px 6px', display: 'flex', alignItems: 'center' }}
              onClick={(e) => {
                e.stopPropagation();
                setJadwalOpen(o => !o);
              }}
            >
              {Ic.chevronDown}
            </span>
          </div>
          {jadwalOpen && (
            <div className="nav-sub">
              {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(d => (
                <div 
                  key={d} 
                  className={`nav-sub-item ${filterDay === d && screen === 'catalog' ? 'active' : ''}`} 
                  onClick={() => handleNav(() => { 
                    setFilterDay(d); 
                    setFilterGenre(''); 
                    setSearchQ(''); 
                    setFilterStatus('Ongoing'); 
                    setFilterType(''); 
                    setScreen('catalog'); 
                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                  })}
                >
                  {d}
                </div>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-section-label">Koleksi Saya</div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${screen === 'bookmarks' ? 'active' : ''}`}
            onClick={() => handleNav(() => { setScreen('bookmarks'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}
          >
            {Ic.bookmark(screen === 'bookmarks')} <span>Bookmark</span>
          </div>
          <div
            className={`nav-item ${screen === 'history' ? 'active' : ''}`}
            onClick={() => handleNav(() => { setScreen('history'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}
          >
            {Ic.clock} <span>Riwayat Tonton</span>
          </div>
        </nav>
      </aside>
    </>
  );
}
