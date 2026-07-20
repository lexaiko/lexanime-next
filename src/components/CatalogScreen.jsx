import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ic } from './Icons';
import { AnimeCard } from './AnimeCard';
import { API_BASE, allGenres } from '../lib/utils';

export function CatalogScreen({ searchQ, setSearchQ, setSearchInput, filterGenre, setFilterGenre, filterStatus, setFilterStatus, filterType, setFilterType, filterSort, setFilterSort, filterDay, setFilterDay, openDetail, mode = '' }) {
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
      
      if (mode === 'ongoing') {
        p.set('status', 'Ongoing');
      } else if (filterStatus) {
        p.set('status', filterStatus);
      }
      
      if (filterType) p.set('type', filterType);
      if (filterDay) p.set('hari', filterDay);
      
      if (mode === 'popular') {
        p.set('sort', 'rating');
      } else if (filterSort) {
        p.set('sort', filterSort);
      }

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
  }, [searchQ, filterGenre, filterStatus, filterType, filterDay, filterSort, mode]);

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
      
      if (mode === 'ongoing') {
        p.set('status', 'Ongoing');
      } else if (filterStatus) {
        p.set('status', filterStatus);
      }
      
      if (filterType) p.set('type', filterType);
      if (filterDay) p.set('hari', filterDay);
      
      if (mode === 'popular') {
        p.set('sort', 'rating');
      } else if (filterSort) {
        p.set('sort', filterSort);
      }

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
  }, [searchQ, filterGenre, filterStatus, filterType, filterDay, filterSort, mode]);

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

  const hasFilters = searchQ || filterGenre || filterStatus || filterType || filterDay || filterSort !== 'latest';

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
              {mode !== 'ongoing' && filterStatus && <span className="filter-active-pill">{filterStatus}</span>}
              {filterType && <span className="filter-active-pill">{filterType}</span>}
              {filterDay && <span className="filter-active-pill">Hari: {filterDay}</span>}
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
            {mode !== 'ongoing' && (
              <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Drop">Drop</option>
              </select>
            )}

            <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Semua Tipe</option>
              <option value="TV">TV Series</option>
              <option value="Movie">Movie</option>
              <option value="OVA">OVA</option>
              <option value="ONA">ONA</option>
              <option value="BD">BD</option>
              <option value="Special">Special</option>
            </select>

            {mode !== 'popular' && (
              <select className="filter-select" value={filterSort} onChange={e => setFilterSort(e.target.value)}>
                <option value="latest">Urutkan: Terbaru</option>
                <option value="rating">Urutkan: Rating Tertinggi</option>
                <option value="title">Urutkan: Judul (A-Z)</option>
              </select>
            )}

            {hasFilters && (
              <button className="clear-filters-btn" type="button" onClick={() => {
                setFilterGenre(''); setFilterStatus(''); setFilterType(''); setFilterDay(''); setFilterSort('latest'); setSearchQ(''); setSearchInput('');
              }}>
                Hapus Filter
              </button>
            )}
          </div>
        </div>
      )}

      <div className="catalog-title" style={{ padding: '8px 0 4px 0', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="section-title-bar" />
        {searchQ 
          ? `Pencarian: "${searchQ}"` 
          : mode === 'ongoing' 
            ? 'Katalog Anime Ongoing 🔴' 
            : mode === 'popular' 
              ? 'Anime Terpopuler ★' 
              : filterDay 
                ? `Jadwal Tayang: Hari ${filterDay}` 
                : 'Katalog Anime Complete'}
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
              <div key={`${a.id}-${idx}`} style={{ position: 'relative' }}>
                {mode === 'popular' && (
                  <div className={`rank-badge rank-${idx + 1}`}>
                    #{idx + 1}
                  </div>
                )}
                <AnimeCard anime={a} onClick={openDetail} />
              </div>
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
