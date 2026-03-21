'use client';

import { useEffect, useState } from 'react';

const MOVIE_SOURCES = [
  (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
  (id) => `https://vidsrc.to/embed/movie/${id}`,
  (id) => `https://www.2embed.online/embed/movie/${id}`,
];

const TV_SOURCES = [
  (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  (id, s, e) => `https://www.2embed.online/embed/tv/${id}/${s}/${e}`,
];

function getSources(mediaType, tmdbId, season, episode) {
  if (mediaType === 'tv' && season && episode) {
    return TV_SOURCES.map((fn) => fn(tmdbId, season, episode));
  }
  return MOVIE_SOURCES.map((fn) => fn(tmdbId));
}

function getHostName(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function VideoPlayer({ isOpen, onClose, tmdbId, mediaType = 'movie', season, episode, title, backdropUrl, posterUrl }) {
  const [urlIndex, setUrlIndex] = useState(0);
  const sources = getSources(mediaType, tmdbId, season, episode);

  useEffect(() => {
    setUrlIndex(0);
  }, [tmdbId, mediaType, season, episode]);

  if (!isOpen) return null;

  const playerUrl = sources[urlIndex] || sources[0];
  const backgroundUrl = backdropUrl || posterUrl;

  return (
    <div className="relative w-full bg-transparent pt-4 pb-12 border-b border-white/5 overflow-hidden">
      {backgroundUrl && (
        <div className="absolute inset-0">
          <img
            src={backgroundUrl}
            alt=""
            className="w-full h-full object-cover object-center scale-125 blur-[6px] opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-transparent to-transparent" />
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5 relative group">
          <iframe
            key={urlIndex}
            src={playerUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            frameBorder="0"
          />
        </div>

        {/* Controls Section */}
        <div className="mt-8 flex flex-col items-center gap-8">
          {/* Server Switcher - Modern Cards */}
          <div className="w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Select Server</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {sources.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setUrlIndex(idx)}
                  className={`relative flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 border ${
                    idx === urlIndex
                      ? 'bg-accent/20 border-accent text-white shadow-[0_0_20px_rgba(108,92,231,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${idx === urlIndex ? 'bg-accent text-white' : 'bg-white/10 text-white/40'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 2a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 4a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">Server {idx + 1}</span>
                    <span className="text-sm font-bold truncate max-w-[120px]">{getHostName(url)}</span>
                  </div>
                  {idx === urlIndex && (
                    <div className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
