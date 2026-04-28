'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getMovieDetails, getImageUrl } from '@/lib/tmdb';
import VideoPlayer from '@/components/VideoPlayer';
import MovieCarousel from '@/components/MovieCarousel';
import PersonCard from '@/components/PersonCard';
import { useAuth } from '@/context/AuthContext';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerOpen, setPlayerOpen] = useState(false);
  const castRef = useRef(null);
  const { isFavorited, toggleFavorite } = useAuth();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getMovieDetails(id)
      .then(setMovie)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-[60vh] bg-white/5" />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl text-white font-bold mb-4">Movie not found</h1>
        <Link href="/" className="text-accent hover:underline">Go Home</Link>
      </div>
    );
  }

  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = getImageUrl(movie.poster_path, 'w500');
  const year = movie.release_date?.split('-')[0];
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const trailer = movie.videos?.results?.find((v) => v.type === 'Trailer' && v.site === 'YouTube');
  const cast = movie.credits?.cast?.slice(0, 15) || [];
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');
  const liked = isFavorited('movie', movie.id);

  return (
    <div className="bg-[#050505] min-h-screen text-white">
      <VideoPlayer
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
        tmdbId={id}
        mediaType="movie"
        backdropUrl={backdropUrl}
        posterUrl={posterUrl}
      />

      {/* Hero section */}
      <section className={`relative transition-all duration-500 ${playerOpen ? 'pt-8 pb-12' : 'min-h-[85vh] flex items-center'}`}>
        {backdropUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src={backdropUrl} 
              alt={movie.title} 
              className={`w-full h-full object-cover scale-105 animate-slow-zoom ${playerOpen ? 'opacity-25' : 'opacity-40'} transition-opacity duration-700`} 
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-[#050505] ${playerOpen ? 'via-[#050505]/90' : 'via-[#050505]/80'} to-transparent`} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent" />
          </div>
        )}

        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full`}>
          <div className={`flex flex-col md:flex-row gap-8 lg:gap-12 ${playerOpen ? 'items-start' : 'items-center'}`}>
            {/* Poster - Cinematic styling */}
            {posterUrl && (
              <div className={`shrink-0 transition-all duration-500 ${playerOpen ? 'w-48 sm:w-56 lg:w-64 mt-0' : 'w-56 sm:w-72 lg:w-80 mt-0'}`}>
                <div className="relative group">
                  <img 
                    src={posterUrl} 
                    alt={movie.title} 
                    className="block w-full h-auto rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 transition-transform duration-500 group-hover:scale-[1.02] object-contain" 
                  />
                  {!playerOpen && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
                      <button 
                        onClick={() => {
                          setPlayerOpen(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Stats below poster */}
                <div className="mt-6 space-y-3">
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-accent">{movie.vote_average.toFixed(1)}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter leading-none">Rating</span>
                        <div className="flex text-yellow-500 text-[10px]">
                          {'★'.repeat(Math.round(movie.vote_average / 2))}
                          {'☆'.repeat(5 - Math.round(movie.vote_average / 2))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/30 font-medium">{movie.vote_count.toLocaleString()} votes</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#2ecc71]/10 hover:bg-[#2ecc71] border border-[#2ecc71]/20 text-[#2ecc71] hover:text-white transition-all py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 group/btn">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 10.133a1.5 1.5 0 00-.8.2z" /></svg>
                      Like
                    </button>
                    <button className="flex-1 bg-[#e74c3c]/10 hover:bg-[#e74c3c] border border-[#e74c3c]/20 text-[#e74c3c] hover:text-white transition-all py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 group/btn">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover/btn:translate-y-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.867a1.5 1.5 0 00.8-.2z" /></svg>
                      Dislike
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info Section */}
            <div className="flex-1 min-w-0 py-4">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {movie.genres?.slice(0, 3).map(g => (
                  <span key={g.id} className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                    {g.name}
                  </span>
                ))}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-4 leading-[1.1] tracking-tight">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm font-medium">
                <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                  <span className="font-black">IMDb</span>
                  <span className="text-white font-bold">{movie.vote_average.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {runtime}
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {year}
                </div>
                <span className="bg-white/10 text-white/80 text-[10px] font-black px-2 py-1 rounded border border-white/10 uppercase tracking-tighter">HD</span>
              </div>

              <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-3xl font-medium">
                {movie.overview}
              </p>

              <div className="flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => {
                    setPlayerOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group relative flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-lg uppercase tracking-tight">Watch Now</span>
                </button>

                {trailer && (
                  <button 
                    onClick={() => {
                      const trailerSection = document.getElementById('trailer-section');
                      trailerSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-all backdrop-blur-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Trailer
                  </button>
                )}

                <button 
                  onClick={() => {
                    toggleFavorite({ mediaType: 'movie', item: movie }).catch((err) => {
                      if (err?.message === 'NOT_AUTHENTICATED') {
                        alert('Please sign in to save favorites');
                        return;
                      }
                      console.error(err);
                    });
                  }}
                  className={`group flex items-center justify-center w-[56px] h-[56px] rounded-xl transition-all duration-300 border ${
                    liked 
                      ? 'bg-accent border-accent text-white shadow-[0_0_20px_rgba(229,9,20,0.3)]' 
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                  title={liked ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-7 w-7 transition-transform duration-300 ${liked ? 'scale-110' : 'group-hover:scale-110'}`}
                    fill={liked ? 'currentColor' : 'none'} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cast */}
      {cast.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h2 className="text-white text-lg sm:text-xl font-bold mb-4">Cast</h2>
          <div className="relative group/cast">
            <button
              onClick={() => castRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/cast:opacity-100 transition-opacity"
            >
              ‹
            </button>
            <div ref={castRef} className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {cast.map((person) => (
                <PersonCard key={person.id} person={person} subtitle={person.character} />
              ))}
            </div>
            <button
              onClick={() => castRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/cast:opacity-100 transition-opacity"
            >
              ›
            </button>
          </div>
        </section>
      )}

      {/* Trailer embed */}
      {trailer && (
        <section id="trailer-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-white/5">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-1.5 h-8 bg-accent rounded-full"></div>
            <h2 className="text-white text-2xl sm:text-3xl font-black uppercase tracking-tight">Official Trailer</h2>
          </div>
          <div className="relative w-full overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?rel=0&showinfo=0&autoplay=0`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Similar movies */}
      {movie.similar?.results?.length > 0 && (
        <MovieCarousel title="Similar Movies" items={movie.similar.results} mediaType="movie" />
      )}

      {/* Recommendations */}
      {movie.recommendations?.results?.length > 0 && (
        <MovieCarousel title="Recommended" items={movie.recommendations.results} mediaType="movie" />
      )}
    </div>
  );
}
