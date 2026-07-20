import React from 'react';
import { Ic } from './Icons';

export function Header({ searchInput, setSearchInput, handleSearchSubmit, handleSearchClear, theme, toggleTheme, toggleMobileSidebar }) {
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
            placeholder="Cari anime di Lexanime..."
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
      </div>
    </header>
  );
}
