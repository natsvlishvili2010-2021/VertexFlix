'use client';

import { useState, useEffect, useRef } from 'react';
import { getGenres } from '@/lib/tmdb';

export default function FilterBar({ filters, onFilterChange, mediaType = 'movie' }) {
  const [genres, setGenres] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [yearMode, setYearMode] = useState('single'); // 'single' or 'range'
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (mediaType === 'all') {
      Promise.all([getGenres('movie'), getGenres('tv')])
        .then(([movieData, tvData]) => {
          const map = new Map();
          (movieData?.genres || []).forEach((g) => map.set(g.id, g));
          (tvData?.genres || []).forEach((g) => {
            if (!map.has(g.id)) map.set(g.id, g);
          });
          setGenres(Array.from(map.values()));
        })
        .catch(() => {});
      return;
    }
    getGenres(mediaType).then((data) => setGenres(data.genres || [])).catch(() => {});
  }, [mediaType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'release_date.desc', label: 'Newest' },
    { value: 'release_date.asc', label: 'Oldest' },
    { value: 'revenue.desc', label: 'Highest Revenue' },
  ];

  const toggleDropdown = (name) => {
    const isOpening = activeDropdown !== name;

    if (name === 'year' && isOpening) {
      const initialMode =
        filters.year_from && filters.year_to && filters.year_from !== filters.year_to
          ? 'range'
          : 'single';
      setYearMode(initialMode);
    }

    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleGenreToggle = (id) => {
    const currentGenres = filters.genre ? filters.genre.split(',') : [];
    const idStr = id.toString();
    let newGenres;
    if (currentGenres.includes(idStr)) {
      newGenres = currentGenres.filter(g => g !== idStr);
    } else {
      newGenres = [...currentGenres, idStr];
    }
    onFilterChange({ ...filters, genre: newGenres.join(',') });
  };

  const activeGenreIds = filters.genre ? filters.genre.split(',') : [];
  const activeSortLabel = sortOptions.find(opt => opt.value === filters.sort_by)?.label || 'Most Popular';

  return (
    <div className="mb-8 sm:mb-10 space-y-4 sm:space-y-6">
      {/* Filter Selectors */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4" ref={dropdownRef}>
        {/* Genre Dropdown (Multi-select) */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => toggleDropdown('genre')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border transition-all duration-300 ${
              activeGenreIds.length > 0 
                ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-xs sm:text-sm font-bold tracking-tight">
              {activeGenreIds.length > 0 
                ? `${activeGenreIds.length} Genre${activeGenreIds.length > 1 ? 's' : ''}`
                : 'Genres'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 sm:h-4 w-3 sm:w-4 transition-transform duration-300 ${activeDropdown === 'genre' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {activeDropdown === 'genre' && (
            <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 max-h-[60vh] sm:max-h-80 overflow-y-auto z-[100] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-3 backdrop-blur-xl scrollbar-hide">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Select Genres</span>
                {activeGenreIds.length > 0 && (
                  <button 
                    onClick={() => onFilterChange({ ...filters, genre: '' })}
                    className="text-[10px] font-bold text-accent hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1">
                {genres.map((g) => {
                  const isActive = activeGenreIds.includes(g.id.toString());
                  return (
                    <button
                      key={g.id}
                      onClick={() => handleGenreToggle(g.id)}
                      className={`flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive ? 'bg-accent/10 text-accent' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {g.name}
                      {isActive && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Year Dropdown (Single or Range) */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => toggleDropdown('year')}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border transition-all duration-300 ${
              filters.year_from || filters.year_to
                ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-xs sm:text-sm font-bold tracking-tight">
              {filters.year_from && filters.year_to && filters.year_from === filters.year_to
                ? filters.year_from
                : filters.year_from || filters.year_to
                ? `${filters.year_from || 'Any'} - ${filters.year_to || 'Any'}`
                : 'Year'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 sm:h-4 w-3 sm:w-4 transition-transform duration-300 ${activeDropdown === 'year' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {activeDropdown === 'year' && (
            <div className="absolute top-full left-0 mt-2 w-64 z-[100] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4 backdrop-blur-xl">
              <div className="flex bg-white/5 p-1 rounded-lg mb-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setYearMode('single'); }}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${yearMode === 'single' ? 'bg-accent text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  Single
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setYearMode('range'); }}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${yearMode === 'range' ? 'bg-accent text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  Range
                </button>
              </div>

              {yearMode === 'single' ? (
                /* Single Year Selection */
                <div className="max-h-60 overflow-y-auto pr-1 space-y-1 scrollbar-hide">
                  <button
                    onClick={() => { onFilterChange({ ...filters, year_from: '', year_to: '' }); setActiveDropdown(null); }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${!filters.year_from ? 'bg-accent text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                  >
                    All Years
                  </button>
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => { onFilterChange({ ...filters, year_from: y.toString(), year_to: y.toString() }); setActiveDropdown(null); }}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.year_from === y.toString() ? 'bg-accent text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              ) : (
                /* Year Range Selection */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <span className="block text-[10px] text-white/40 mb-1 uppercase font-bold tracking-tighter">From</span>
                      <select
                        value={filters.year_from || ''}
                        onChange={(e) => onFilterChange({ ...filters, year_from: e.target.value })}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent appearance-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="" className="bg-[#121212]">Any</option>
                        {years.map(y => <option key={y} value={y} className="bg-[#121212]">{y}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <span className="block text-[10px] text-white/40 mb-1 uppercase font-bold tracking-tighter">To</span>
                      <select
                        value={filters.year_to || ''}
                        onChange={(e) => onFilterChange({ ...filters, year_to: e.target.value })}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent appearance-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="" className="bg-[#121212]">Any</option>
                        {years.map(y => <option key={y} value={y} className="bg-[#121212]">{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveDropdown(null)}
                    className="w-full bg-accent hover:bg-accent-hover text-white text-[10px] font-black uppercase py-2.5 rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Apply Range
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative ml-0 sm:ml-auto flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-white/30 text-[10px] sm:text-xs font-black uppercase tracking-tighter hidden xs:block">Sort By</span>
            <button
              onClick={() => toggleDropdown('sort')}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <span className="text-xs sm:text-sm font-bold tracking-tight">
                {activeSortLabel}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 sm:h-4 w-3 sm:w-4 transition-transform duration-300 ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {activeDropdown === 'sort' && (
            <div className="absolute top-full right-0 mt-2 w-48 sm:w-56 z-[100] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-2 backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onFilterChange({ ...filters, sort_by: opt.value }); setActiveDropdown(null); }}
                    className={`text-left px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors ${filters.sort_by === opt.value ? 'bg-accent text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Bar */}
      {(activeGenreIds.length > 0 || filters.year_from || filters.year_to) && (
        <div className="flex items-center gap-2 sm:gap-3 py-3 border-t border-white/5 overflow-x-auto scrollbar-hide no-scrollbar">
          <span className="text-white/30 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mr-1 shrink-0">Active:</span>
          
          <div className="flex gap-2 items-center">
            {activeGenreIds.map(id => {
              const g = genres.find(genre => genre.id === Number(id));
              if (!g) return null;
              return (
                <div key={id} className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all shrink-0">
                  <span className="text-white text-[9px] sm:text-[10px] font-bold">{g.name}</span>
                  <button 
                    onClick={() => handleGenreToggle(id)}
                    className="text-white/20 group-hover:text-accent transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {(filters.year_from || filters.year_to) && (
              <div className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all shrink-0">
                <span className="text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter">Year:</span>
                <span className="text-white text-[9px] sm:text-[10px] font-bold">
                  {filters.year_from === filters.year_to ? filters.year_from : `${filters.year_from || 'Any'}-${filters.year_to || 'Any'}`}
                </span>
                <button 
                  onClick={() => onFilterChange({ ...filters, year_from: '', year_to: '' })}
                  className="text-white/20 group-hover:text-accent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onFilterChange({ sort_by: 'popularity.desc', genre: '', year_from: '', year_to: '' })}
            className="ml-auto text-white/40 hover:text-accent text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 sm:gap-2 shrink-0 pl-2"
          >
            Clear
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

