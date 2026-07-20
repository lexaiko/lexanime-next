import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = "http://localhost:5000";

/* ── Inline SVG Icons ─────────────────────────────────── */
const Ic = {
  home: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  compass: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  calendar: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  bookmark: (filled) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  ),
  clock: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 16 14"/>
    </svg>
  ),
  download: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  shield: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  play: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  star: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  chevronDown: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronRight: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  list: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  share: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  trash: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
  filter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
};

/* ── Helpers ──────────────────────────────────────────── */
const imgSrc = (path) =>
  path ? `${API_BASE}/images/${path}` : 'https://placehold.co/155x220/1f293d/38bdf8?text=No+Cover';

const getDayName = () => {
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  return days[new Date().getDay()];
};

/* Expanded 30+ Genres List */
const allGenres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Harem', 
  'Historical', 'Horror', 'Isekai', 'Josei', 'Martial Arts', 'Mecha', 'Military', 
  'Music', 'Mystery', 'Parody', 'Psychological', 'Romance', 'School', 'Sci-Fi', 
  'Seinen', 'Shoujo', 'Shounen', 'Slice of Life', 'Sports', 'Super Power', 
  'Supernatural', 'Thriller', 'Vampire'
];

/* ── AnimeCard Component (Top-Level) ──────────────────── */
function AnimeCard({ anime, onClick }) {
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

/* ── Top Header Component (With Mobile Menu Button) ── */
function Header({ searchInput, setSearchInput, handleSearchSubmit, handleSearchClear, theme, toggleTheme, toggleMobileSidebar }) {
  return (
    <header className="top-header">
      <button className="mobile-menu-btn" type="button" onClick={toggleMobileSidebar} title="Menu Navigasi">
        {Ic.menu}
      </button>

      <div className="search-bar">
        <span className="search-bar-icon">{Ic.search}</span>
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Cari anime di LexAnime..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </form>
        {searchInput && (
          <button className="search-clear-btn" type="button" onClick={handleSearchClear}>
            {Ic.close}
          </button>
        )}
      </div>

      <div className="header-actions">
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
          type="button"
        >
          {theme === 'dark' ? Ic.sun : Ic.moon}
        </button>

        <button className="btn-header btn-ghost" type="button">Log in</button>
        <button className="btn-header btn-primary" type="button">Register</button>
      </div>
    </header>
  );
}

/* ── Sidebar Component (Clean & Redesigned) ────────────── */
function Sidebar({ screen, setScreen, jelajahiOpen, setJelajahiOpen, jadwalOpen, setJadwalOpen, filterGenre, setFilterGenre, setSearchQ, setFilterStatus, setFilterType, mobileOpen, closeMobileSidebar }) {
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

          <div
            className={`nav-item ${jelajahiOpen || screen === 'catalog' ? 'expanded' : ''}`}
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
                  onClick={() => handleNav(() => { setFilterGenre(g); setSearchQ(''); setFilterStatus(''); setFilterType(''); setScreen('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}
                >
                  {g}
                </div>
              ))}
            </div>
          )}

          <div
            className={`nav-item ${jadwalOpen ? 'expanded' : ''}`}
            onClick={() => setJadwalOpen(o => !o)}
          >
            {Ic.calendar} <span style={{ flex: 1 }}>Jadwal Tayang</span>
            <span className="nav-item-arrow">{Ic.chevronDown}</span>
          </div>
          {jadwalOpen && (
            <div className="nav-sub">
              {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(d => (
                <div key={d} className="nav-sub-item" onClick={() => handleNav(() => { setFilterStatus('Ongoing'); setScreen('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); })}>
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

/* ── Compact Netflix Billboard Jumbotron Hero Component ── */
function NetflixJumbotronHero({ ongoingList, heroIndex, setHeroIndex, heroTimer, openDetail, toggleBookmark, isBookmarked }) {
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

/* ── Shelf Component (Top-Level) ───────────────────────── */
function Shelf({ title, list, openDetail, setScreen }) {
  if (list.length === 0) return null;
  return (
    <div className="section-block">
      <div className="section-header">
        <div className="section-title">
          <div className="section-title-bar" />
          {title}
        </div>
        <div className="section-see-all" onClick={() => { setScreen('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Lihat Semua {Ic.chevronRight}
        </div>
      </div>
      <div className="cards-row">
        {list.map(a => <AnimeCard key={a.id} anime={a} onClick={openDetail} />)}
      </div>
    </div>
  );
}

/* ── HomeScreen Component (Top-Level) ─────────────────── */
function HomeScreen({ ongoingList, topList, exploreItems, exploreLoading, exploreHasMore, loadNextExplorePage, heroIndex, setHeroIndex, heroTimer, openDetail, toggleBookmark, isBookmarked, setScreen }) {
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
      <Shelf title="Ongoing Anime" list={ongoingList} openDetail={openDetail} setScreen={setScreen} />
      <Shelf title="Koleksi Terpopuler" list={topList} openDetail={openDetail} setScreen={setScreen} />

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

/* ── CatalogScreen Component (With Toggle Drawer Filterization & Infinite Scroll) ── */
function CatalogScreen({ searchQ, setSearchQ, setSearchInput, filterGenre, setFilterGenre, filterStatus, setFilterStatus, filterType, setFilterType, filterSort, setFilterSort, openDetail }) {
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [catalogItems, setCatalogItems]         = useState([]);
  const [catalogPage, setCatalogPage]           = useState(1);
  const [catalogHasMore, setCatalogHasMore]     = useState(true);
  const [catalogLoading, setCatalogLoading]     = useState(false);

  const isCatalogLoadingRef = useRef(false);
  const catalogHasMoreRef   = useRef(true);
  const catalogPageRef      = useRef(1);

  useEffect(() => { isCatalogLoadingRef.current = catalogLoading; }, [catalogLoading]);
  useEffect(() => { catalogHasMoreRef.current = catalogHasMore; }, [catalogHasMore]);
  useEffect(() => { catalogPageRef.current = catalogPage; }, [catalogPage]);

  const fetchInitialCatalog = useCallback(async () => {
    setCatalogLoading(true);
    isCatalogLoadingRef.current = true;
    try {
      const p = new URLSearchParams({ page: 1, limit: 24 });
      if (searchQ) p.set('q', searchQ);
      if (filterGenre) p.set('genre', filterGenre);
      if (filterStatus) p.set('status', filterStatus);
      if (filterType) p.set('type', filterType);
      if (filterSort) p.set('sort', filterSort);

      const res = await fetch(`${API_BASE}/api/anime?${p}`);
      const data = await res.json();
      const items = data.data || [];
      
      setCatalogItems(items);
      setCatalogPage(1);
      catalogPageRef.current = 1;

      const hasMore = 1 < (data.total_pages || 1);
      setCatalogHasMore(hasMore);
      catalogHasMoreRef.current = hasMore;
    } catch (e) {
      console.error("Error fetching initial catalog:", e);
    } finally {
      setCatalogLoading(false);
      isCatalogLoadingRef.current = false;
    }
  }, [searchQ, filterGenre, filterStatus, filterType, filterSort]);

  useEffect(() => {
    fetchInitialCatalog();
  }, [fetchInitialCatalog]);

  const loadNextCatalogPage = useCallback(async () => {
    if (isCatalogLoadingRef.current || !catalogHasMoreRef.current) return;

    isCatalogLoadingRef.current = true;
    setCatalogLoading(true);

    try {
      const nextPage = catalogPageRef.current + 1;
      const p = new URLSearchParams({ page: nextPage, limit: 24 });
      if (searchQ) p.set('q', searchQ);
      if (filterGenre) p.set('genre', filterGenre);
      if (filterStatus) p.set('status', filterStatus);
      if (filterType) p.set('type', filterType);
      if (filterSort) p.set('sort', filterSort);

      const res = await fetch(`${API_BASE}/api/anime?${p}`);
      const data = await res.json();
      const newItems = data.data || [];

      if (newItems.length > 0) {
        setCatalogItems(prev => [...prev, ...newItems]);
        setCatalogPage(nextPage);
        catalogPageRef.current = nextPage;

        const hasMore = nextPage < (data.total_pages || 1);
        setCatalogHasMore(hasMore);
        catalogHasMoreRef.current = hasMore;
      } else {
        setCatalogHasMore(false);
        catalogHasMoreRef.current = false;
      }
    } catch (e) {
      console.error("Error loading next catalog page:", e);
    } finally {
      setCatalogLoading(false);
      isCatalogLoadingRef.current = false;
    }
  }, [searchQ, filterGenre, filterStatus, filterType, filterSort]);

  useEffect(() => {
    const onScroll = () => {
      if (isCatalogLoadingRef.current || !catalogHasMoreRef.current) return;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      const bodyHeight = document.documentElement.scrollHeight;

      if (windowHeight + scrollY >= bodyHeight - 600) {
        loadNextCatalogPage();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadNextCatalogPage]);

  const hasFilters = searchQ || filterGenre || filterStatus || filterType || filterSort !== 'latest';

  return (
    <div className="filter-container">
      <div 
        className="filter-toggle-bar" 
        onClick={() => setShowFilterDrawer(o => !o)}
      >
        <div className="filter-toggle-title">
          {Ic.filter} Filter & Genre
          {hasFilters && (
            <div className="filter-active-pills">
              {filterGenre && <span className="filter-active-pill">{filterGenre}</span>}
              {filterStatus && <span className="filter-active-pill">{filterStatus}</span>}
              {filterType && <span className="filter-active-pill">{filterType}</span>}
            </div>
          )}
        </div>
        <span style={{ transform: showFilterDrawer ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
          {Ic.chevronDown}
        </span>
      </div>

      {showFilterDrawer && (
        <div className="filter-panel-glass">
          <div className="filter-row">
            <span className="filter-label">Genre:</span>
            <div className="genre-pills-scroll">
              <div 
                className={`filter-pill ${filterGenre === '' ? 'active' : ''}`} 
                onClick={() => setFilterGenre('')}
              >
                Semua
              </div>
              {allGenres.map(g => (
                <div 
                  key={g} 
                  className={`filter-pill ${filterGenre === g ? 'active' : ''}`} 
                  onClick={() => setFilterGenre(g)}
                >
                  {g}
                </div>
              ))}
            </div>
          </div>

          <div className="filter-row filter-selects-row">
            <span className="filter-label">Status & Tipe:</span>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Drop">Drop</option>
            </select>

            <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Semua Tipe</option>
              <option value="TV">TV Series</option>
              <option value="Movie">Movie</option>
              <option value="OVA">OVA</option>
              <option value="ONA">ONA</option>
              <option value="BD">BD</option>
              <option value="Special">Special</option>
            </select>

            <select className="filter-select" value={filterSort} onChange={e => setFilterSort(e.target.value)}>
              <option value="latest">Urutkan: Terbaru</option>
              <option value="rating">Urutkan: Rating Tertinggi</option>
              <option value="title">Urutkan: Judul (A-Z)</option>
            </select>

            {hasFilters && (
              <button className="clear-filters-btn" type="button" onClick={() => {
                setFilterGenre(''); setFilterStatus(''); setFilterType(''); setFilterSort('latest'); setSearchQ(''); setSearchInput('');
              }}>
                Hapus Filter
              </button>
            )}
          </div>
        </div>
      )}

      <div className="catalog-title" style={{ padding: '8px 0 4px 0', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="section-title-bar" />
        {searchQ ? `Pencarian: "${searchQ}"` : 'Katalog Anime Complete'}
      </div>

      {catalogItems.length === 0 && catalogLoading ? (
        <div className="status-center"><div className="spinner" /><div className="status-text">Memuat katalog anime...</div></div>
      ) : catalogItems.length === 0 && !catalogLoading ? (
        <div className="status-center">
          <div className="status-icon">📭</div>
          <div className="status-text">Tidak ada anime yang cocok dengan filter pencarian ini.</div>
        </div>
      ) : (
        <>
          <div className="anime-grid" style={{ padding: '12px 0' }}>
            {catalogItems.map((a, idx) => (
              <AnimeCard key={`${a.id}-${idx}`} anime={a} onClick={openDetail} />
            ))}
          </div>

          <div className="lazy-loading-spinner-row">
            {catalogLoading && (
              <>
                <div className="spinner" />
                <p>Memuat anime lainnya...</p>
              </>
            )}

            {!catalogLoading && catalogHasMore && (
              <button className="hero-btn-secondary" type="button" onClick={loadNextCatalogPage} style={{ marginTop: '8px' }}>
                Muat Lebih Banyak Anime ({catalogItems.length} ditampilkan)
              </button>
            )}

            {!catalogHasMore && catalogItems.length > 0 && (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                ✓ Semua hasil pencarian ({catalogItems.length}) telah ditampilkan.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main App Container Component ─────────────────────── */
export default function App() {
  /* Theme State */
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('lex_theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lex_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  /* Navigation & Mobile Sidebar */
  const [screen, setScreen]                   = useState('home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => setMobileSidebarOpen(o => !o);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  /* Search */
  const [searchQ, setSearchQ]     = useState('');
  const [searchInput, setSearchInput] = useState('');

  /* Filters */
  const [filterGenre, setFilterGenre]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterSort, setFilterSort]     = useState('latest');

  /* Sidebar collapse states */
  const [jelajahiOpen, setJelajahiOpen] = useState(false);
  const [jadwalOpen, setJadwalOpen]     = useState(false);

  /* Bulletproof Infinite Scroll State for Home Explore */
  const [exploreItems, setExploreItems]     = useState([]);
  const [explorePage, setExplorePage]       = useState(1);
  const [exploreHasMore, setExploreHasMore] = useState(true);
  const [exploreLoading, setExploreLoading] = useState(false);

  const isExploreLoadingRef = useRef(false);
  const exploreHasMoreRef   = useRef(true);
  const explorePageRef      = useRef(1);

  useEffect(() => { isExploreLoadingRef.current = exploreLoading; }, [exploreLoading]);
  useEffect(() => { exploreHasMoreRef.current = exploreHasMore; }, [exploreHasMore]);
  useEffect(() => { explorePageRef.current = explorePage; }, [explorePage]);

  /* Hero shelves */
  const [ongoingList, setOngoingList]   = useState([]);
  const [topList, setTopList]           = useState([]);
  const [heroIndex, setHeroIndex]       = useState(0);
  const heroTimer = useRef(null);

  /* Detail */
  const [detailAnime, setDetailAnime]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [episodes, setEpisodes]           = useState([]);

  /* Player */
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [embeds, setEmbeds]               = useState([]);
  const [activeEmbed, setActiveEmbed]     = useState(null);
  const [embedLoading, setEmbedLoading]   = useState(false);

  /* Local storage state */
  const [bookmarks, setBookmarks]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('lex_bookmarks') || '[]'); } catch { return []; }
  });
  const [history, setHistory]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('lex_history') || '[]'); } catch { return []; }
  });

  /* Toast */
  const [toast, setToast]             = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => { localStorage.setItem('lex_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { localStorage.setItem('lex_history', JSON.stringify(history)); }, [history]);

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch(`${API_BASE}/api/anime?limit=12&status=Ongoing`),
          fetch(`${API_BASE}/api/anime?limit=15&sort=rating`),
          fetch(`${API_BASE}/api/anime?page=1&limit=20`),
        ]);
        const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
        setOngoingList(d1.data || []);
        setTopList(d2.data || []);
        setExploreItems(d3.data || []);
        
        const hasMore = 1 < (d3.total_pages || 1);
        setExploreHasMore(hasMore);
        exploreHasMoreRef.current = hasMore;
        explorePageRef.current = 1;
      } catch (e) {
        console.error("Error fetching shelf data:", e);
      }
    })();
  }, []);

  const loadNextExplorePage = useCallback(async () => {
    if (isExploreLoadingRef.current || !exploreHasMoreRef.current) return;
    
    isExploreLoadingRef.current = true;
    setExploreLoading(true);

    try {
      const nextPage = explorePageRef.current + 1;
      const res = await fetch(`${API_BASE}/api/anime?page=${nextPage}&limit=20`);
      const data = await res.json();
      const newItems = data.data || [];
      
      if (newItems.length > 0) {
        setExploreItems(prev => [...prev, ...newItems]);
        setExplorePage(nextPage);
        explorePageRef.current = nextPage;

        const hasMore = nextPage < (data.total_pages || 1);
        setExploreHasMore(hasMore);
        exploreHasMoreRef.current = hasMore;
      } else {
        setExploreHasMore(false);
        exploreHasMoreRef.current = false;
      }
    } catch (e) {
      console.error("Error loading next explore page:", e);
    } finally {
      setExploreLoading(false);
      isExploreLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (screen !== 'home') return;

    const onScroll = () => {
      if (isExploreLoadingRef.current || !exploreHasMoreRef.current) return;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      const bodyHeight = document.documentElement.scrollHeight;

      if (windowHeight + scrollY >= bodyHeight - 600) {
        loadNextExplorePage();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [screen, loadNextExplorePage]);

  useEffect(() => {
    const heroes = ongoingList.slice(0, 5);
    if (heroes.length < 2) return;
    heroTimer.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroes.length);
    }, 4500);
    return () => clearInterval(heroTimer.current);
  }, [ongoingList]);

  const openDetail = useCallback(async (animeId) => {
    setDetailLoading(true);
    setScreen('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveEpisode(null);
    setEmbeds([]);
    setActiveEmbed(null);
    try {
      const res = await fetch(`${API_BASE}/api/anime/${animeId}`);
      const data = await res.json();
      setDetailAnime(data);
      setEpisodes(data.episodes || []);
    } catch (e) {
      console.error("Error loading anime detail:", e);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openPlayer = useCallback(async (ep) => {
    setActiveEpisode(ep);
    setEmbedLoading(true);
    setEmbeds([]);
    setActiveEmbed(null);
    setScreen('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (detailAnime) {
      const item = {
        animeId: detailAnime.id,
        animeTitle: detailAnime.judul,
        animeImage: detailAnime.image_path,
        episodeId: ep.id,
        episodeTitle: ep.judul,
        watchedAt: new Date().toISOString(),
      };
      setHistory(prev => {
        const filtered = prev.filter(h => !(h.animeId === detailAnime.id && h.episodeId === ep.id));
        return [item, ...filtered].slice(0, 50);
      });
    }

    try {
      const res = await fetch(`${API_BASE}/api/episodes/${ep.id}/embeds`);
      const data = await res.json();
      setEmbeds(data || []);
      if (data && data.length > 0) setActiveEmbed(data[0]);
    } catch (e) {
      console.error("Error loading embeds:", e);
    } finally {
      setEmbedLoading(false);
    }
  }, [detailAnime]);

  /* Prev/Next Episode Helper */
  const playAdjacentEpisode = (dir) => {
    if (!activeEpisode || episodes.length === 0) return;
    const currIdx = episodes.findIndex(e => e.id === activeEpisode.id);
    if (currIdx === -1) return;
    const targetIdx = currIdx + dir;
    if (targetIdx >= 0 && targetIdx < episodes.length) {
      openPlayer(episodes[targetIdx]);
    }
  };

  const toggleBookmark = useCallback((anime) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === anime.id);
      if (exists) {
        showToast('Dihapus dari Bookmark');
        return prev.filter(b => b.id !== anime.id);
      } else {
        showToast('Ditambahkan ke Bookmark ✓');
        return [{ id: anime.id, judul: anime.judul, image_path: anime.image_path, skor: anime.skor, studio: anime.studio, status: anime.status }, ...prev];
      }
    });
  }, [showToast]);

  const isBookmarked = (id) => bookmarks.some(b => b.id === id);

  /* Search Submit */
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchQ(searchInput.trim());
    setScreen('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearchQ('');
  };

  const statusClass = (s) => {
    if (!s) return '';
    if (s.toLowerCase() === 'ongoing') return 'ongoing';
    if (s.toLowerCase() === 'completed') return 'completed';
    return 'drop';
  };

  const currEpIndex = episodes.findIndex(e => e.id === activeEpisode?.id);

  return (
    <div className="shell">
      <Sidebar 
        screen={screen}
        setScreen={setScreen}
        jelajahiOpen={jelajahiOpen}
        setJelajahiOpen={setJelajahiOpen}
        jadwalOpen={jadwalOpen}
        setJadwalOpen={setJadwalOpen}
        filterGenre={filterGenre}
        setFilterGenre={setFilterGenre}
        setSearchQ={setSearchQ}
        setFilterStatus={setFilterStatus}
        setFilterType={setFilterType}
        mobileOpen={mobileSidebarOpen}
        closeMobileSidebar={closeMobileSidebar}
      />

      <div className="main">
        <Header 
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearchSubmit={handleSearchSubmit}
          handleSearchClear={handleSearchClear}
          theme={theme}
          toggleTheme={toggleTheme}
          toggleMobileSidebar={toggleMobileSidebar}
        />

        <div className="page-content">
          {screen === 'home' && (
            <HomeScreen 
              ongoingList={ongoingList}
              topList={topList}
              exploreItems={exploreItems}
              exploreLoading={exploreLoading}
              exploreHasMore={exploreHasMore}
              loadNextExplorePage={loadNextExplorePage}
              heroIndex={heroIndex}
              setHeroIndex={setHeroIndex}
              heroTimer={heroTimer}
              openDetail={openDetail}
              toggleBookmark={toggleBookmark}
              isBookmarked={isBookmarked}
              setScreen={setScreen}
            />
          )}

          {screen === 'catalog' && (
            <CatalogScreen 
              searchQ={searchQ}
              setSearchQ={setSearchQ}
              setSearchInput={setSearchInput}
              filterGenre={filterGenre}
              setFilterGenre={setFilterGenre}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterType={filterType}
              setFilterType={setFilterType}
              filterSort={filterSort}
              setFilterSort={setFilterSort}
              openDetail={openDetail}
            />
          )}

          {screen === 'detail' && detailLoading && (
            <div className="status-center" style={{ paddingTop: 80 }}>
              <div className="spinner" />
              <div className="status-text">Memuat detail anime...</div>
            </div>
          )}

          {screen === 'detail' && !detailLoading && detailAnime && (
            <div className="detail-page">
              <div className="detail-hero-card">
                <div className="detail-cover-col">
                  <div className="detail-poster-wrap">
                    <img
                      className="detail-cover-img"
                      src={imgSrc(detailAnime.image_path)}
                      alt={detailAnime.judul}
                      onError={e => { e.target.src = 'https://placehold.co/200x280/1f293d/38bdf8?text=No+Cover'; }}
                    />
                    <span className={`status-badge-overlay ${statusClass(detailAnime.status)}`}>{detailAnime.status}</span>
                  </div>

                  <div className="cover-actions">
                    {episodes.length > 0 && (
                      <button
                        className="hero-btn detail-play-cta"
                        type="button"
                        onClick={() => openPlayer(episodes[0])}
                      >
                        {Ic.play} Tonton Ep 1
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                      <button
                        className={`cover-action-btn ${isBookmarked(detailAnime.id) ? 'bookmarked' : ''}`}
                        type="button"
                        onClick={() => toggleBookmark(detailAnime)}
                      >
                        {Ic.bookmark(isBookmarked(detailAnime.id))} {isBookmarked(detailAnime.id) ? 'Disimpan' : 'Bookmark'}
                      </button>
                      <button
                        className="cover-action-btn"
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Link disalin ke clipboard!'); }}
                      >
                        {Ic.share} Share
                      </button>
                    </div>
                  </div>
                </div>

                <div className="detail-info-col">
                  {detailAnime.judul_japanese && (
                    <p className="detail-jp-title">{detailAnime.judul_japanese}</p>
                  )}
                  <h1 className="detail-title">{detailAnime.judul}</h1>

                  {/* Unified Single Glass Meta Grid */}
                  <div className="detail-unified-meta">
                    <div className="meta-pill">
                      <span className="meta-pill-label">Skor</span>
                      <span className="meta-pill-val score">{Ic.star} {detailAnime.skor || 'N/A'}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-label">Tipe</span>
                      <span className="meta-pill-val">{detailAnime.tipe || 'N/A'}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-label">Total Ep</span>
                      <span className="meta-pill-val">{detailAnime.total_episode || 'Unknown'}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-label">Rilis</span>
                      <span className="meta-pill-val">{detailAnime.tanggal_rilis || 'N/A'}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-label">Durasi</span>
                      <span className="meta-pill-val">{detailAnime.durasi || 'N/A'}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-pill-label">Studio</span>
                      <span className="meta-pill-val">{detailAnime.studio || 'N/A'}</span>
                    </div>
                  </div>

                  {detailAnime.genres && (
                    <div className="detail-genre-block">
                      <span className="detail-section-label">Genre:</span>
                      <div className="genre-tags">
                        {detailAnime.genres.split(',').map(s => s.trim()).filter(Boolean).map(g => (
                          <span key={g} className="genre-tag">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailAnime.sinopsis && (
                    <div className="synopsis-block">
                      <span className="detail-section-label">Sinopsis:</span>
                      <p className="synopsis-text">{detailAnime.sinopsis}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="episode-section">
                <div className="episode-section-header">
                  <div className="episode-section-title">
                    {Ic.list} Daftar Episode ({episodes.length})
                  </div>
                </div>
                {episodes.length === 0 ? (
                  <div className="status-center" style={{ padding: '24px 0' }}>
                    <div className="status-text">Tidak ada episode yang tersedia dalam database.</div>
                  </div>
                ) : (
                  <div className="episode-list">
                    {episodes.map((ep, idx) => (
                      <div
                        key={ep.id}
                        className={`episode-row ${activeEpisode?.id === ep.id ? 'active' : ''}`}
                        onClick={() => openPlayer(ep)}
                      >
                        <div className="episode-num-badge">Ep {idx + 1}</div>
                        <div className="episode-play-icon">{Ic.play}</div>
                        <div className="episode-title">{ep.judul}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Player Screen Guard: Renders seamlessly even if detailAnime isn't loaded */}
          {screen === 'player' && activeEpisode && (
            <div className="player-page">
              <div className="breadcrumb">
                <span className="breadcrumb-link" onClick={() => { setScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Beranda</span>
                <span className="breadcrumb-sep">›</span>
                {detailAnime && (
                  <>
                    <span className="breadcrumb-link" onClick={() => { setScreen('detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      {detailAnime.judul.length > 35 ? detailAnime.judul.slice(0, 35) + '…' : detailAnime.judul}
                    </span>
                    <span className="breadcrumb-sep">›</span>
                  </>
                )}
                <span className="breadcrumb-current">{activeEpisode.judul}</span>
              </div>

              <h1 className="player-title">{activeEpisode.judul}</h1>

              <div className="player-layout">
                <div className="player-main">
                  {/* Clean Player Box */}
                  <div className="player-video-box">
                    {embedLoading ? (
                      <div className="player-empty">
                        <div className="spinner" />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Menghubungkan ke server mirror LexAnime...</p>
                      </div>
                    ) : activeEmbed ? (
                      <iframe
                        key={activeEmbed.id}
                        className="player-iframe"
                        src={activeEmbed.link}
                        allowFullScreen
                        title="LexAnime Player"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      />
                    ) : (
                      <div className="player-empty">
                        <div className="player-empty-icon">▶</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pilih episode untuk memutar video</p>
                      </div>
                    )}
                  </div>

                  {/* Player Quick Controls (Prev/Next Episode + Server Switcher) */}
                  <div className="embed-selector-card">
                    <div className="embed-selector-header">
                      <span>📺 Server Mirror & Kualitas Video:</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="hero-btn-secondary" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }} 
                          disabled={currEpIndex <= 0} 
                          onClick={() => playAdjacentEpisode(-1)}
                        >
                          ← Prev Ep
                        </button>
                        <button 
                          className="hero-btn-secondary" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }} 
                          disabled={currEpIndex === -1 || currEpIndex >= episodes.length - 1} 
                          onClick={() => playAdjacentEpisode(1)}
                        >
                          Next Ep →
                        </button>
                      </div>
                    </div>

                    {embeds.length > 0 ? (
                      <div className="quality-tabs-scroll">
                        {embeds.map(emb => (
                          <button
                            key={emb.id}
                            className={`quality-tab ${activeEmbed?.id === emb.id ? 'active' : ''}`}
                            type="button"
                            onClick={() => setActiveEmbed(emb)}
                          >
                            [{emb.quality?.toUpperCase()}] {emb.mirror?.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    ) : !embedLoading && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Tidak ada server mirror tambahan untuk episode ini.
                      </p>
                    )}
                  </div>
                </div>

                <div className="player-sidebar-list">
                  <div className="player-sidebar-title">{Ic.list} Daftar Episode ({episodes.length})</div>
                  {episodes.map(ep => (
                    <div
                      key={ep.id}
                      className={`episode-row ${activeEpisode?.id === ep.id ? 'active' : ''}`}
                      onClick={() => openPlayer(ep)}
                    >
                      <div className="episode-play-icon">{Ic.play}</div>
                      <div className="episode-title" style={{ fontSize: '0.8rem' }}>{ep.judul}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {screen === 'bookmarks' && (
            <div>
              <div className="screen-header">
                <span>Bookmark LexAnime</span>
              </div>
              <div className="screen-sub">Anime favorit yang tersimpan</div>
              {bookmarks.length === 0 ? (
                <div className="status-center">
                  <div className="status-icon">🔖</div>
                  <div className="status-text">Belum ada bookmark. Klik ikon bookmark di halaman detail anime.</div>
                </div>
              ) : (
                <div className="anime-grid">
                  {bookmarks.map(a => <AnimeCard key={a.id} anime={a} onClick={openDetail} />)}
                </div>
              )}
            </div>
          )}

          {screen === 'history' && (
            <div>
              <div className="screen-header">
                <span>Riwayat Tonton LexAnime</span>
                {history.length > 0 && (
                  <button
                    className="clear-filters-btn"
                    type="button"
                    onClick={() => { setHistory([]); showToast('Riwayat dihapus'); }}
                  >
                    {Ic.trash} Bersihkan
                  </button>
                )}
              </div>
              <div className="screen-sub">Lanjutkan menonton dari episode terakhir</div>
              {history.length === 0 ? (
                <div className="status-center">
                  <div className="status-icon">🕐</div>
                  <div className="status-text">Belum ada riwayat. Mulai tonton episode anime untuk melihatnya di sini.</div>
                </div>
              ) : (
                <div className="anime-grid">
                  {history.map((item, idx) => (
                    <div
                      key={`${item.animeId}-${idx}`}
                      className="anime-card"
                      onClick={() => openDetail(item.animeId)}
                    >
                      <div className="card-thumb">
                        <img src={imgSrc(item.animeImage)} alt={item.animeTitle} loading="lazy" onError={e => { e.target.src = 'https://placehold.co/155x220/1f293d/38bdf8?text=No+Cover'; }} />
                        <span className="card-ep-badge" style={{ left: 'auto', right: 7, background: 'var(--accent-blue)', color: '#ffffff' }}>
                          {item.episodeTitle.match(/\d+/)?.[0] ?? '?'}
                        </span>
                        <div className="card-overlay"><div className="card-play-btn">{Ic.play}</div></div>
                      </div>
                      <div className="card-body">
                        <div className="card-title" title={item.animeTitle}>{item.animeTitle}</div>
                        <div className="card-sub" style={{ color: 'var(--accent-blue-light)', fontSize: '0.68rem' }}>{item.episodeTitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation (Icon Only Ultra-Clean iOS Dock) */}
      <nav className="mobile-nav">
        <div 
          className={`mobile-nav-item ${screen === 'home' ? 'active' : ''}`} 
          onClick={() => { setScreen('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          title="Beranda"
        >
          <span className="mobile-nav-icon">{Ic.home}</span>
        </div>
        <div 
          className={`mobile-nav-item ${screen === 'catalog' ? 'active' : ''}`} 
          onClick={() => { setScreen('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          title="Cari"
        >
          <span className="mobile-nav-icon">{Ic.search}</span>
        </div>
        <div 
          className={`mobile-nav-item ${screen === 'bookmarks' ? 'active' : ''}`} 
          onClick={() => { setScreen('bookmarks'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          title="Bookmark"
        >
          <span className="mobile-nav-icon">{Ic.bookmark(screen === 'bookmarks')}</span>
        </div>
        <div 
          className={`mobile-nav-item ${screen === 'history' ? 'active' : ''}`} 
          onClick={() => { setScreen('history'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          title="Riwayat Tonton"
        >
          <span className="mobile-nav-icon">{Ic.clock}</span>
        </div>
      </nav>

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
