'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/tmdb';

export default function HeroBanner({ movies = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!movies || movies.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.min(10, movies.length));
        setIsTransitioning(false);
      }, 500); // Wait for fade out before changing movie
    }, 10000);

    return () => clearInterval(interval);
  }, [movies]);

  if (!movies || movies.length === 0) return null;

  const movie = movies[currentIndex];
  const title = movie.title || movie.name;
  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');
  const year = (movie.release_date || movie.first_air_date)?.split('-')[0];
  const type = movie.media_type || 'movie';

  return (
    <section className="relative h-[55vh] sm:h-[80vh] flex items-end overflow-hidden">
      {/* Backdrop image */}
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover object-[center_15%] transition-opacity duration-1000 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 to-transparent" />

      {/* Content */}
      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-24 w-full transition-all duration-700 ${
        isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}>
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg leading-tight">
            {title}
          </h1>
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            {year && <span className="text-white/70 text-xs sm:text-sm">{year}</span>}
            {movie.vote_average > 0 && (
              <span className="text-yellow-400 text-xs sm:text-sm font-medium flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-white/80 text-xs sm:text-base leading-relaxed mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-4">
            {movie.overview}
          </p>
          <div className="flex gap-2 sm:gap-3">
            <Link
              href={`/${type}/${movie.id}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white text-black font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-md hover:bg-white/90 transition-colors text-xs sm:text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Play Now
            </Link>
            <Link
              href={`/${type}/${movie.id}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-md hover:bg-white/30 transition-colors text-xs sm:text-sm"
            >
              More Info
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
