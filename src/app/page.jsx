'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ic } from '../components/Icons';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { HomeScreen } from '../components/HomeScreen';
import { CatalogScreen } from '../components/CatalogScreen';
import { ScheduleScreen } from '../components/ScheduleScreen';
import { AnimeCard } from '../components/AnimeCard';
import { API_BASE, imgSrc, makeSlug } from '../lib/utils';


/* ── Main App Container Component ─────────────────────── */
export default function App() {
  /* Theme State */
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Hydrate theme from localStorage on client mount
    try {
      const saved = localStorage.getItem('lex_theme');
      if (saved) setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('lex_theme', theme); } catch {}
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
  const [filterDay, setFilterDay]       = useState('');

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
  const [forceIframe, setForceIframe]     = useState(false);
  const [hasHydratedUrl, setHasHydratedUrl] = useState(false);

  /* Local storage state */
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory]     = useState([]);

  useEffect(() => {
    // Hydrate bookmarks and history from localStorage on client mount
    try {
      const savedBookmarks = JSON.parse(localStorage.getItem('lex_bookmarks') || '[]');
      const savedHistory   = JSON.parse(localStorage.getItem('lex_history')   || '[]');
      if (savedBookmarks.length) setBookmarks(savedBookmarks);
      if (savedHistory.length)   setHistory(savedHistory);
    } catch {}
  }, []);

  /* Toast */
  const [toast, setToast]             = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => { try { localStorage.setItem('lex_bookmarks', JSON.stringify(bookmarks)); } catch {} }, [bookmarks]);
  useEffect(() => { try { localStorage.setItem('lex_history',   JSON.stringify(history));   } catch {} }, [history]);

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

  // URL parameters hydration on mount / pathname change
  const hydrateFromUrl = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname; // e.g. "/anime/12-high-school-dxd"
    if (!pathname || pathname === '/') {
      setScreen('home');
      setHasHydratedUrl(true);
      return;
    }

    const parts = pathname.replace(/^\//, '').split('/');
    const mainRoute = parts[0]; // "anime", "watch", "bookmarks", "history", "catalog", "ongoing", "popular", "schedule"

    if (mainRoute === 'bookmarks') {
      setScreen('bookmarks');
    } else if (mainRoute === 'history') {
      setScreen('history');
    } else if (mainRoute === 'ongoing') {
      setScreen('ongoing');
    } else if (mainRoute === 'popular') {
      setScreen('popular');
    } else if (mainRoute === 'schedule') {
      setScreen('schedule');
    } else if (mainRoute === 'catalog') {
      setScreen('catalog');
      if (parts[1]) {
        if (parts[1].startsWith('day-')) {
          const day = parts[1].replace('day-', '');
          setFilterDay(day);
          setFilterGenre('');
          setFilterStatus('Ongoing');
        } else if (parts[1].startsWith('genre-')) {
          const genre = parts[1].replace('genre-', '');
          setFilterGenre(genre);
          setFilterDay('');
          setFilterStatus('');
        }
      } else {
        setFilterDay('');
        setFilterGenre('');
        setFilterStatus('');
      }
    } else if (mainRoute === 'anime' && parts[1]) {
      // e.g. "12-high-school-dxd"
      const slugParts = parts[1].split('-');
      const animeId = slugParts[0];
      if (animeId) {
        setDetailLoading(true);
        setScreen('detail');
        setActiveEpisode(null);
        setEmbeds([]);
        setActiveEmbed(null);
        try {
          const res = await fetch(`${API_BASE}/api/anime/${animeId}`);
          if (res.ok) {
            const data = await res.json();
            setDetailAnime(data);
            setEpisodes(data.episodes || []);
          }
        } catch (e) {
          console.error("Error loading anime detail from Pathname:", e);
        } finally {
          setDetailLoading(false);
        }
      }
    } else if (mainRoute === 'watch' && parts[1] && parts[2]) {
      // e.g. parts[1] = "12-high-school-dxd", parts[2] = "ep-2"
      const animeSlugParts = parts[1].split('-');
      const animeId = animeSlugParts[0];
      
      const epSlugParts = parts[2].split('-');
      const epId = epSlugParts[1] || epSlugParts[0]; // handles "ep-2" -> "2" or just "2"
      
      if (animeId && epId) {
        setDetailLoading(true);
        setEmbedLoading(true);
        setScreen('player');
        try {
          const animeRes = await fetch(`${API_BASE}/api/anime/${animeId}`);
          if (animeRes.ok) {
            const animeData = await animeRes.json();
            setDetailAnime(animeData);
            const eps = animeData.episodes || [];
            setEpisodes(eps);
            
            // Try to find by index first (e.g. ep-2 -> index 1)
            const parsedIdx = parseInt(epId, 10);
            let epObj = null;
            if (!isNaN(parsedIdx) && parsedIdx > 0 && parsedIdx <= eps.length) {
              epObj = eps[parsedIdx - 1];
            } else {
              // Fallback to database ID
              epObj = eps.find(e => String(e.id) === String(epId));
            }

            if (epObj) {
              setActiveEpisode(epObj);
              const embRes = await fetch(`${API_BASE}/api/episodes/${epObj.id}/embeds`);
              if (embRes.ok) {
                const embData = await embRes.json();
                setEmbeds(embData || []);
                if (embData && embData.length > 0) {
                  setActiveEmbed(embData[0]);
                }
              }
            }
          }
        } catch (e) {
          console.error("Error loading player from Pathname:", e);
        } finally {
          setDetailLoading(false);
          setEmbedLoading(false);
        }
      }
    }
    setHasHydratedUrl(true);
  }, [hasHydratedUrl]);

  useEffect(() => {
    if (!hasHydratedUrl) {
      hydrateFromUrl();
    }
  }, [hasHydratedUrl, hydrateFromUrl]);

  // Update URL pathname when screen state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydratedUrl) return;

    let newPath = '/';
    if (screen && screen !== 'home') {
      if (screen === 'detail' && detailAnime) {
        newPath = `/anime/${detailAnime.id}-${makeSlug(detailAnime.judul)}`;
      } else if (screen === 'player' && activeEpisode && detailAnime) {
        const epIdx = episodes.findIndex(e => e.id === activeEpisode.id);
        const epSlugSegment = epIdx !== -1 ? `ep-${epIdx + 1}` : `ep-${activeEpisode.id}`;
        newPath = `/watch/${detailAnime.id}-${makeSlug(detailAnime.judul)}/${epSlugSegment}`;
      } else if (screen === 'catalog') {
        if (filterDay) {
          newPath = `/catalog/day-${filterDay}`;
        } else if (filterGenre) {
          newPath = `/catalog/genre-${filterGenre}`;
        } else {
          newPath = `/catalog`;
        }
      } else {
        newPath = `/${screen}`;
      }
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  }, [screen, detailAnime, activeEpisode, filterDay, filterGenre, hasHydratedUrl]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handlePopState = () => {
      setHasHydratedUrl(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
        filterDay={filterDay}
        setFilterDay={setFilterDay}
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
              filterDay={filterDay}
              setFilterDay={setFilterDay}
              openDetail={openDetail}
            />
          )}

          {screen === 'ongoing' && (
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
              filterDay={filterDay}
              setFilterDay={setFilterDay}
              openDetail={openDetail}
              mode="ongoing"
            />
          )}

          {screen === 'popular' && (
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
              filterDay={filterDay}
              setFilterDay={setFilterDay}
              openDetail={openDetail}
              mode="popular"
            />
          )}

          {screen === 'schedule' && (
            <ScheduleScreen openDetail={openDetail} />
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
                      (() => {
                        const isVercelHost = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
                        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                        if (isVercelHost && !forceIframe && !isMobile) {
                          return (
                            <div 
                              className="player-empty" 
                              style={{ 
                                cursor: 'pointer', 
                                background: 'radial-gradient(circle, #1e293b 0%, #0b0f19 100%)', 
                                border: '2px dashed #38bdf8',
                                padding: '40px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={() => window.open(activeEmbed.link, '_blank')}
                            >
                              <div className="player-empty-icon" style={{ color: '#38bdf8', transform: 'scale(1.2)', textShadow: '0 0 15px rgba(56, 189, 248, 0.6)' }}>▶</div>
                              <p style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.95rem', marginTop: 12, textAlign: 'center' }}>
                                Klik di Sini untuk Menonton (Rekomendasi)
                              </p>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8, padding: '0 20px', textAlign: 'center', lineHeight: '1.4' }}>
                                Server video kami memblokir pemutaran langsung di web ini jika di-hosting di Vercel. Silakan klik tombol di bawah atau ketuk layar ini untuk menonton di tab baru secara lancar.
                              </p>
                              
                              <div style={{ display: 'flex', gap: 10, marginTop: 15, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button 
                                  className="hero-btn" 
                                  style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', borderRadius: '4px', border: 'none' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(activeEmbed.link, '_blank');
                                  }}
                                >
                                  Tonton di Tab Baru ↗
                                </button>
                                <button
                                  className="hero-btn-secondary"
                                  style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #475569', color: '#cbd5e1', background: 'transparent' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setForceIframe(true);
                                  }}
                                >
                                  Coba Putar di Web
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <iframe
                            key={activeEmbed.id}
                            className="player-iframe"
                            src={activeEmbed.link}
                            allowFullScreen
                            title="LexAnime Player"
                            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                            referrerPolicy="no-referrer"
                          />
                        );
                      })()
                    ) : (
                      <div className="player-empty">
                        <div className="player-empty-icon">▶</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pilih episode untuk memutar video</p>
                      </div>
                    )}
                  </div>
 
                  {/* Tips jika error */}
                  {activeEmbed && (
                    <div style={{ 
                      marginTop: '12px', 
                      marginBottom: '12px', 
                      padding: '10px 14px', 
                      background: 'var(--liquid-glass-bg)', 
                      border: '1px solid var(--glass-border)',
                      borderLeft: '4px solid var(--red)', 
                      borderRadius: '8px', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-main)', 
                      lineHeight: '1.5' 
                    }}>
                      <p><strong>💡 TIPS PEMUTARAN VIDEO:</strong></p>
                      <p style={{ marginTop: '4px' }}>1. <strong>Layar Hitam/Error di Web:</strong> Klik tombol <strong>Tonton Sekarang ↗</strong> di bawah untuk memutar video langsung di tab baru secara lancar.</p>
                    </div>
                  )}
 
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
 
                    {activeEmbed && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid #2e3b4e', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && (
                            <button
                              type="button"
                              className="hero-btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #475569', color: '#cbd5e1' }}
                              onClick={() => setForceIframe(!forceIframe)}
                            >
                              {forceIframe ? 'Ganti ke Tab Baru' : 'Coba Putar di Web'}
                            </button>
                          )}
                          <a
                            href={activeEmbed.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hero-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', textDecoration: 'none', borderRadius: '4px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                          >
                            Tonton Sekarang ↗
                          </a>
                        </div>
                      </div>
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
            <div className="section-block">
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
            <div className="section-block">
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
