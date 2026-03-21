'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MovieCard from '@/components/MovieCard';
import FilterBar from '@/components/FilterBar';
import { discoverMovies, discoverTV, searchMulti } from '@/lib/tmdb';

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialMediaType = searchParams.get('media_type') || 'movie';
  const initialGenre = searchParams.get('genre') || '';
  const initialSort = searchParams.get('sort_by') || 'popularity.desc';

  const [mediaType, setMediaType] = useState(initialMediaType);
  const [filters, setFilters] = useState({
    genre: initialGenre,
    year: '',
    sort_by: initialSort,
  });
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchItems = useCallback(async (pageNum, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let data;
      if (searchQuery) {
        data = await searchMulti(searchQuery, pageNum);
        const filtered = (data.results || []).filter((item) => {
          if (mediaType === 'all') return item.media_type === 'movie' || item.media_type === 'tv';
          return item.media_type === mediaType || (!item.media_type && mediaType === 'movie');
        });
        setItems((prev) => reset ? filtered : [...prev, ...filtered]);
        setTotalPages(data.total_pages || 1);
      } else {
        const apiFilters = {};
        if (filters.genre) apiFilters.with_genres = filters.genre;
        if (filters.year) {
          if (mediaType === 'movie') {
            apiFilters.primary_release_year = filters.year;
          } else if (mediaType === 'tv') {
            apiFilters.first_air_date_year = filters.year;
          }
        }
        if (filters.sort_by) apiFilters.sort_by = filters.sort_by;

        if (mediaType === 'all') {
          const [movieData, tvData] = await Promise.all([
            discoverMovies(
              {
                ...apiFilters,
                ...(filters.year ? { primary_release_year: filters.year } : {}),
              },
              pageNum
            ),
            discoverTV(
              {
                ...apiFilters,
                ...(filters.year ? { first_air_date_year: filters.year } : {}),
              },
              pageNum
            ),
          ]);

          const merged = [
            ...((movieData?.results || []).map((it) => ({ ...it, media_type: 'movie' }))),
            ...((tvData?.results || []).map((it) => ({ ...it, media_type: 'tv' }))),
          ];

          const sortBy = filters.sort_by || 'popularity.desc';
          const sorted = merged.sort((a, b) => {
            switch (sortBy) {
              case 'vote_average.desc':
                return (b.vote_average || 0) - (a.vote_average || 0);
              case 'release_date.asc':
                return (new Date(a.release_date || a.first_air_date || 0)).getTime() - (new Date(b.release_date || b.first_air_date || 0)).getTime();
              case 'release_date.desc':
                return (new Date(b.release_date || b.first_air_date || 0)).getTime() - (new Date(a.release_date || a.first_air_date || 0)).getTime();
              case 'revenue.desc':
                return (b.revenue || 0) - (a.revenue || 0);
              case 'popularity.desc':
              default:
                return (b.popularity || 0) - (a.popularity || 0);
            }
          });

          setItems((prev) => (reset ? sorted : [...prev, ...sorted]));
          setTotalPages(Math.max(movieData?.total_pages || 1, tvData?.total_pages || 1));
        } else if (mediaType === 'tv') {
          data = await discoverTV(apiFilters, pageNum);
          setItems((prev) => reset ? (data.results || []) : [...prev, ...(data.results || [])]);
          setTotalPages(data.total_pages || 1);
        } else {
          data = await discoverMovies(apiFilters, pageNum);
          setItems((prev) => reset ? (data.results || []) : [...prev, ...(data.results || [])]);
          setTotalPages(data.total_pages || 1);
        }
      }
    } catch (err) {
      console.error('Browse fetch error:', err);
      if (reset) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, mediaType, filters]);

  useEffect(() => {
    setPage(1);
    fetchItems(1, true);
  }, [fetchItems]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage, false);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {searchQuery
            ? `Results for "${searchQuery}"`
            : mediaType === 'tv'
            ? 'Browse TV Shows'
            : mediaType === 'all'
            ? 'Browse All'
            : 'Browse Movies'}
        </h1>

        {/* Media type toggle */}
        <div className="flex gap-1 bg-bg-secondary rounded-lg p-1">
          <button
            onClick={() => handleMediaTypeChange('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mediaType === 'all' ? 'bg-accent text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleMediaTypeChange('movie')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mediaType === 'movie' ? 'bg-accent text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => handleMediaTypeChange('tv')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mediaType === 'tv' ? 'bg-accent text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            TV Shows
          </button>
        </div>
      </div>

      {/* Search query clear */}
      {searchQuery && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-white/50 text-sm">Searching: {searchQuery}</span>
          <button
            onClick={handleSearchClear}
            className="text-accent text-sm hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Filters (hide when searching) */}
      {!searchQuery && (
        <FilterBar filters={filters} onFilterChange={handleFilterChange} mediaType={mediaType} />
      )}

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-white/5 rounded-lg" />
              <div className="h-4 bg-white/5 rounded mt-2 w-3/4" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <MovieCard
                key={`${item.id}-${item.media_type || mediaType}`}
                item={item}
                mediaType={item.media_type || mediaType}
              />
            ))}
          </div>

          {/* Load more */}
          {page < totalPages && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3 rounded-md transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-white/50 text-lg">No results found</p>
          <p className="text-white/30 text-sm mt-2">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 bg-white/5 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-white/5 rounded-lg" />
              <div className="h-4 bg-white/5 rounded mt-2 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
