'use client';

import { useState, useEffect } from 'react';
import { getTVSeason, getImageUrl } from '@/lib/tmdb';

export default function EpisodeGrid({ showId, seasons, onPlayEpisode }) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const availableSeasons = seasons?.filter((s) => s.season_number > 0) || [];

  useEffect(() => {
    if (!showId) return;
    setLoading(true);
    getTVSeason(showId, selectedSeason)
      .then((data) => setEpisodes(data.episodes || []))
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, [showId, selectedSeason]);

  return (
    <div>
      {/* Season selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-white/70 text-sm">Season:</label>
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          className="bg-bg-card border border-white/10 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-accent"
        >
          {availableSeasons.map((s) => (
            <option key={s.id || s.season_number} value={s.season_number}>
              {s.name || `Season ${s.season_number}`}
            </option>
          ))}
        </select>
      </div>

      {/* Episode grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-bg-card rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-video bg-white/5" />
              <div className="p-3">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => onPlayEpisode(selectedSeason, ep.episode_number)}
              className="group text-left bg-bg-card rounded-lg overflow-hidden hover:bg-white/5 transition-colors"
            >
              <div className="relative aspect-video bg-white/5">
                {ep.still_path ? (
                  <img
                    src={getImageUrl(ep.still_path, 'w300')}
                    alt={ep.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl font-bold">
                    {ep.episode_number}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="p-3">
                <p className="text-white font-medium text-sm">
                  {ep.episode_number}. {ep.name}
                </p>
                {ep.overview && (
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{ep.overview}</p>
                )}
                {ep.vote_average > 0 && (
                  <span className="text-yellow-400 text-xs mt-1 inline-block">
                    ★ {ep.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
