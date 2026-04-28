'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import MovieCard from '@/components/MovieCard';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { discoverMovies, discoverTV, searchMulti } from '@/lib/tmdb';

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQuery = searchParams.get('q') || '';
  const initialMediaType = searchParams.get('media_type') || 'movie';
  const initialGenre = searchParams.get('genre') || '';
  const initialSort = searchParams.get('sort_by') || 'popularity.desc';
  const initialYearFrom = searchParams.get('year_from') || '';
  const initialYearTo = searchParams.get('year_to') || '';
  const initialPage = parseInt(searchParams.get('page')) || 1;

  const [mediaType, setMediaType] = useState(initialMediaType);
  const [filters, setFilters] = useState({
    genre: initialGenre,
    year_from: initialYearFrom,
    year_to: initialYearTo,
    sort_by: initialSort,
  });
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Keep local state in sync with URL params (e.g. when searching from Navbar overlay while already on /browse)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const mt = searchParams.get('media_type') || 'movie';
    const genre = searchParams.get('genre') || '';
    const sort = searchParams.get('sort_by') || 'popularity.desc';
    const yearFrom = searchParams.get('year_from') || '';
    const yearTo = searchParams.get('year_to') || '';
    const p = parseInt(searchParams.get('page')) || 1;

    setSearchQuery((prev) => (prev === q ? prev : q));
    setMediaType((prev) => (prev === mt ? prev : mt));
    setPage((prev) => (prev === p ? prev : p));
    setFilters((prev) => {
      const next = { genre, year_from: yearFrom, year_to: yearTo, sort_by: sort };
      if (
        prev.genre === next.genre &&
        prev.year_from === next.year_from &&
        prev.year_to === next.year_to &&
        prev.sort_by === next.sort_by
      ) {
        return prev;
      }
      return next;
    });
  }, [searchParams]);

  // Sync state with URL params
  const updateUrlParams = useCallback((newPage, newMediaType, newFilters) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    params.set('media_type', newMediaType);
    if (newFilters.genre) params.set('genre', newFilters.genre);
    else params.delete('genre');
    if (newFilters.year_from) params.set('year_from', newFilters.year_from);
    else params.delete('year_from');
    if (newFilters.year_to) params.set('year_to', newFilters.year_to);
    else params.delete('year_to');
    if (newFilters.sort_by) params.set('sort_by', newFilters.sort_by);
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const fetchItems = useCallback(async (pageNum) => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // To get exactly 7 rows with 6 items each (42 items),
      // we fetch multiple TMDB pages (20 items per page) and then slice to exactly 42.
      // IMPORTANT: avoid overlapping TMDB pages between our site pages.
      const siteItemsPerPage = 42;
      const tmdbItemsPerPage = 20;
      const tmdbPagesToFetch = Math.ceil(siteItemsPerPage / tmdbItemsPerPage) + 1; // 4 pages -> 80 items
      const tmdbPageStart = (pageNum - 1) * tmdbPagesToFetch + 1;
      
      let allResults = [];
      let totalP = 1;

      const dedupe = (arr) => {
        const seen = new Set();
        const out = [];
        for (const it of arr) {
          const key = `${it.media_type || mediaType}:${it.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(it);
        }
        return out;
      };

      if (searchQuery) {
        const pageNums = Array.from({ length: tmdbPagesToFetch }, (_, i) => tmdbPageStart + i);
        const pages = await Promise.all(pageNums.map((p) => searchMulti(searchQuery, p)));
        const firstPage = pages[0];
        
        allResults = pages.flatMap((p) => p.results || []).filter((item) => {
          if (mediaType === 'all') return item.media_type === 'movie' || item.media_type === 'tv';
          return item.media_type === mediaType || (!item.media_type && mediaType === 'movie');
        });
        totalP = firstPage?.total_pages || 1;
      } else {
        const apiFilters = {};
        if (filters.genre) apiFilters.with_genres = filters.genre;
        
        // Handle Year Range
        if (filters.year_from) {
          if (mediaType === 'movie' || mediaType === 'all') {
            apiFilters['primary_release_date.gte'] = `${filters.year_from}-01-01`;
          }
          if (mediaType === 'tv' || mediaType === 'all') {
            apiFilters['first_air_date.gte'] = `${filters.year_from}-01-01`;
          }
        }
        if (filters.year_to) {
          if (mediaType === 'movie' || mediaType === 'all') {
            apiFilters['primary_release_date.lte'] = `${filters.year_to}-12-31`;
          }
          if (mediaType === 'tv' || mediaType === 'all') {
            apiFilters['first_air_date.lte'] = `${filters.year_to}-12-31`;
          }
        }
        
        if (filters.sort_by) apiFilters.sort_by = filters.sort_by;

        if (mediaType === 'all') {
          const pageNums = Array.from({ length: tmdbPagesToFetch }, (_, i) => tmdbPageStart + i);
          const [moviePages, tvPages] = await Promise.all([
            Promise.all(pageNums.map((p) => discoverMovies(apiFilters, p))),
            Promise.all(pageNums.map((p) => discoverTV(apiFilters, p))),
          ]);
          const mFirst = moviePages[0];
          const tFirst = tvPages[0];

          allResults = [
            ...moviePages.flatMap((p) => (p.results || []).map((i) => ({ ...i, media_type: 'movie' }))),
            ...tvPages.flatMap((p) => (p.results || []).map((i) => ({ ...i, media_type: 'tv' }))),
          ];

          const sortBy = filters.sort_by || 'popularity.desc';
          allResults.sort((a, b) => {
            switch (sortBy) {
              case 'vote_average.desc': return (b.vote_average || 0) - (a.vote_average || 0);
              case 'popularity.desc': default: return (b.popularity || 0) - (a.popularity || 0);
            }
          });
          totalP = Math.max(mFirst?.total_pages || 1, tFirst?.total_pages || 1);
        } else if (mediaType === 'tv') {
          const pageNums = Array.from({ length: tmdbPagesToFetch }, (_, i) => tmdbPageStart + i);
          const pages = await Promise.all(pageNums.map((p) => discoverTV(apiFilters, p)));
          allResults = pages.flatMap((p) => p.results || []);
          totalP = pages[0]?.total_pages || 1;
        } else {
          const pageNums = Array.from({ length: tmdbPagesToFetch }, (_, i) => tmdbPageStart + i);
          const pages = await Promise.all(pageNums.map((p) => discoverMovies(apiFilters, p)));
          allResults = pages.flatMap((p) => p.results || []);
          totalP = pages[0]?.total_pages || 1;
        }
      }

      // We want exactly 7 rows. On desktop (xl) it's 6 columns. 7 * 6 = 42.
      const unique = dedupe(allResults).filter((it) => (it.vote_average || 0) > 0);
      setItems(unique.slice(0, 42));
      setTotalPages(Math.max(1, Math.ceil(totalP / tmdbPagesToFetch)));
    } catch (err) {
      console.error('Browse fetch error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, mediaType, filters]);

  // Initial fetch and handle URL changes
  useEffect(() => {
    fetchItems(page);
  }, [searchQuery, mediaType, filters, page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    updateUrlParams(newPage, mediaType, filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    updateUrlParams(1, mediaType, newFilters);
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    setPage(1);
    updateUrlParams(1, type, filters);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setPage(1);
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
      {/* Header & Media Type Selector */}
      <div className="flex flex-col items-center sm:items-start space-y-6 mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {searchQuery
            ? `Results for "${searchQuery}"`
            : mediaType === 'movie'
            ? 'Browse Movies'
            : mediaType === 'tv'
            ? 'Browse TV Shows'
            : 'Browse All'}
        </h1>

        <div className="flex bg-white/5 p-1 rounded-xl w-fit max-w-full overflow-x-auto no-scrollbar mx-auto sm:mx-0">
          {['all', 'movie', 'tv'].map((type) => (
            <button
              key={type}
              onClick={() => handleMediaTypeChange(type)}
              className={`px-4 sm:px-8 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                mediaType === type
                  ? 'bg-accent text-white shadow-lg'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
        </div>
      </div>

      {/* Search query clear */}
      {searchQuery && (
        <div className="mb-4 flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <span className="text-white/50 text-sm">Searching: {searchQuery}</span>
          <button
            onClick={handleSearchClear}
            className="text-accent text-sm hover:underline"
          >
            Clear Search
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

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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

