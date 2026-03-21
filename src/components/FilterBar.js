'use client';

import { useState, useEffect } from 'react';
import { getGenres } from '@/lib/tmdb';

export default function FilterBar({ filters, onFilterChange, mediaType = 'movie' }) {
  const [genres, setGenres] = useState([]);

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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'release_date.desc', label: 'Newest' },
    { value: 'release_date.asc', label: 'Oldest' },
    { value: 'revenue.desc', label: 'Highest Revenue' },
  ];

  return (
    <div className="bg-bg-secondary rounded-lg p-4 mb-8 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Genre select */}
        <div className="flex-1">
          <label className="block text-white/60 text-xs mb-1.5">Genre</label>
          <select
            value={filters.genre || ''}
            onChange={(e) => onFilterChange({ ...filters, genre: e.target.value })}
            className="w-full bg-bg-card border border-white/10 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-accent"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Year select */}
        <div className="flex-1">
          <label className="block text-white/60 text-xs mb-1.5">Year</label>
          <select
            value={filters.year || ''}
            onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
            className="w-full bg-bg-card border border-white/10 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-accent"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Sort select */}
        <div className="flex-1">
          <label className="block text-white/60 text-xs mb-1.5">Sort By</label>
          <select
            value={filters.sort_by || 'popularity.desc'}
            onChange={(e) => onFilterChange({ ...filters, sort_by: e.target.value })}
            className="w-full bg-bg-card border border-white/10 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-accent"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters display */}
      {(filters.genre || filters.year) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white/40 text-xs">Active:</span>
          {filters.genre && (
            <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {genres.find((g) => g.id === Number(filters.genre))?.name || 'Genre'}
              <button onClick={() => onFilterChange({ ...filters, genre: '' })} className="hover:text-white">✕</button>
            </span>
          )}
          {filters.year && (
            <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {filters.year}
              <button onClick={() => onFilterChange({ ...filters, year: '' })} className="hover:text-white">✕</button>
            </span>
          )}
          <button
            onClick={() => onFilterChange({ sort_by: 'popularity.desc' })}
            className="text-white/40 hover:text-white text-xs underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
