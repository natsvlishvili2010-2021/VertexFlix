'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import MovieCard from '@/components/MovieCard';

export default function FavoritesPage() {
  const { user, loading, favorites, favoritesLoading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="h-8 bg-white/5 rounded w-1/3 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl text-white font-bold mb-4">Sign in to view your favorites</h1>
        <p className="text-white/60 mb-6">Your liked movies and TV shows are saved to your account.</p>
        <Link href="/" className="inline-flex items-center justify-center bg-accent hover:bg-accent-hover text-white font-bold px-6 py-3 rounded-lg transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">My Favorites</h1>
          <p className="text-white/50 mt-1">Saved to {user.email}</p>
        </div>
        <div className="text-white/50 text-sm">{favorites.length} items</div>
      </div>

      {favoritesLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-white mb-2">No favorites yet</h2>
          <p className="text-white/60">Like a movie or TV show to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4">
          {favorites.map((f) => {
            const item = {
              id: f.item_id,
              title: f.media_type === 'movie' ? f.title : undefined,
              name: f.media_type === 'tv' ? f.title : undefined,
              poster_path: f.poster_path,
              vote_average: f.vote_average,
              release_date: f.release_date,
              first_air_date: f.release_date,
              media_type: f.media_type,
            };

            return (
              <MovieCard key={`${f.media_type}:${f.item_id}`} item={item} mediaType={f.media_type} />
            );
          })}
        </div>
      )}
    </div>
  );
}
