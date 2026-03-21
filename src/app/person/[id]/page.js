'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMovieCredits, getPersonDetails, getTVCredits, getImageUrl } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';

const EXCLUDED_TV_GENRES = [10762, 10763, 10764, 10766, 10767]; // Kids, News, Reality, Soap, Talk

export default function PersonDetailPage() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [filmographyFilter, setFilmographyFilter] = useState('all');
  const [verifiedCredits, setVerifiedCredits] = useState([]);
  const [verifyingCredits, setVerifyingCredits] = useState(false);
  const photosRef = useRef(null);

  const scrollPhotos = (direction) => {
    if (photosRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      photosRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPersonDetails(id)
      .then(setPerson)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const credits = person?.combined_credits?.cast || [];

  const filteredCredits = useMemo(() => {
    return credits
      .filter((c) => c.media_type === 'movie' || c.media_type === 'tv')
      .filter((c) => c.poster_path && (c.vote_count || 0) > 5)
      .filter((c) => {
        if (c.media_type === 'tv') {
          const genres = c.genre_ids || [];
          if (genres.some((g) => EXCLUDED_TV_GENRES.includes(g))) return false;
        }
        return true;
      })
      .filter((c) => {
        if (filmographyFilter === 'movie') return c.media_type === 'movie';
        if (filmographyFilter === 'tv') return c.media_type === 'tv';
        return true;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [credits, filmographyFilter]);

  useEffect(() => {
    if (!person?.id) return;

    let cancelled = false;

    const topCastLimit = 12;

    const run = async () => {
      setVerifyingCredits(true);
      try {
        const candidates = filteredCredits;

        const results = [];
        const concurrency = 6;

        let i = 0;
        const worker = async () => {
          while (i < candidates.length) {
            const idx = i;
            i += 1;
            const credit = candidates[idx];
            try {
              const data =
                credit.media_type === 'tv'
                  ? await getTVCredits(credit.id)
                  : await getMovieCredits(credit.id);
              const topCast = (data?.cast || []).slice(0, topCastLimit);
              const isInTopCast = topCast.some((p) => p.id === person.id);
              if (isInTopCast) results.push(credit);
            } catch {
            }
          }
        };

        await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, worker));

        if (!cancelled) {
          setVerifiedCredits(results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)));
        }
      } finally {
        if (!cancelled) setVerifyingCredits(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [person?.id, filteredCredits]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-8">
          <div className="w-48 sm:w-64 h-72 sm:h-96 bg-white/5 rounded-lg shrink-0 mx-auto sm:mx-0" />
          <div className="flex-1 space-y-4">
            <div className="h-10 bg-white/5 rounded w-1/2" />
            <div className="h-4 bg-white/5 rounded w-1/3" />
            <div className="h-4 bg-white/5 rounded w-1/4" />
            <div className="space-y-2 mt-6">
              <div className="h-3 bg-white/5 rounded" />
              <div className="h-3 bg-white/5 rounded" />
              <div className="h-3 bg-white/5 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl text-white font-bold mb-4">Person not found</h1>
        <Link href="/" className="text-accent hover:underline">Go Home</Link>
      </div>
    );
  }

  const profileUrl = getImageUrl(person.profile_path, 'w500');
  const birthday = person.birthday;
  const age = birthday ? new Date().getFullYear() - new Date(birthday).getFullYear() : null;

  const photos = person.images?.profiles || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 sm:pt-24">
      {/* Top section */}
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* Profile photo */}
        <div className="shrink-0 w-48 sm:w-64 mx-auto sm:mx-0">
          {profileUrl ? (
            <img src={profileUrl} alt={person.name} className="w-full rounded-lg shadow-2xl" />
          ) : (
            <div className="w-full aspect-[2/3] bg-bg-card rounded-lg flex items-center justify-center text-white/30 text-4xl sm:text-6xl font-bold">
              {person.name?.[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">{person.name}</h1>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {person.known_for_department && (
              <div>
                <span className="text-white/40 text-xs sm:text-sm">Known for: </span>
                <span className="text-white text-xs sm:text-sm">{person.known_for_department}</span>
              </div>
            )}
            {birthday && (
              <div>
                <span className="text-white/40 text-xs sm:text-sm">Birthday: </span>
                <span className="text-white text-xs sm:text-sm">
                  {birthday}{age ? ` (${age} years old)` : ''}
                </span>
              </div>
            )}
            {person.place_of_birth && (
              <div className="col-span-2">
                <span className="text-white/40 text-xs sm:text-sm">Place of birth: </span>
                <span className="text-white text-xs sm:text-sm">{person.place_of_birth}</span>
              </div>
            )}
          </div>

          {/* Biography */}
          {person.biography && (
            <div className="mb-6">
              <h2 className="text-white text-base sm:text-lg font-semibold mb-2">Biography</h2>
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {bioExpanded || person.biography.length <= 500
                  ? person.biography
                  : person.biography.slice(0, 500) + '...'}
              </p>
              {person.biography.length > 500 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-accent text-xs sm:text-sm mt-2 hover:underline"
                >
                  {bioExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filmography */}
      {filteredCredits.length > 0 && (
        <section className="mt-10 sm:mt-12">
          <div className="flex flex-row items-center justify-between gap-3 mb-6 flex-wrap">
            <h2 className="text-white text-lg sm:text-xl font-bold">Filmography</h2>
            <div className="flex gap-1 bg-bg-secondary rounded-lg p-1 self-start">
              {['all', 'movie', 'tv'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilmographyFilter(f)}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filmographyFilter === f ? 'bg-accent text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV'}
                </button>
              ))}
            </div>
          </div>
          {verifyingCredits && (
            <div className="text-white/40 text-xs sm:text-sm mb-4">Loading cast matches...</div>
          )}
          {verifyingCredits && verifiedCredits.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-white/5 rounded-lg" />
                  <div className="h-3 bg-white/5 rounded mt-2 w-3/4" />
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {verifiedCredits.map((credit) => (
              <MovieCard key={`${credit.id}-${credit.media_type}`} item={credit} mediaType={credit.media_type} />
            ))}
          </div>
        </section>
      )}

      {/* Photos */}
      {photos.length > 1 && (
        <section className="mt-10 sm:mt-12">
          <h2 className="text-white text-lg sm:text-xl font-bold mb-4">Photos</h2>
          <div className="relative group/photos">
            <button
              onClick={() => scrollPhotos('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/photos:opacity-100 transition-opacity"
            >
              ‹
            </button>
            <div 
              ref={photosRef}
              className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth" 
              style={{ scrollbarWidth: 'none' }}
            >
              {photos.slice(0, 12).map((photo, idx) => (
                <div key={idx} className="shrink-0 w-28 sm:w-40 rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(photo.file_path, 'w185')}
                    alt={`${person.name} photo ${idx + 1}`}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => scrollPhotos('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/photos:opacity-100 transition-opacity"
            >
              ›
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
