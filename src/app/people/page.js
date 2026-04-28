'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import PersonCard from '@/components/PersonCard';
import Pagination from '@/components/Pagination';
import { getTrendingPeople, searchPeople } from '@/lib/tmdb';

function PeopleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQuery = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page')) || 1;

  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Sync state with URL params
  const updateUrlParams = useCallback((newPage, query) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    if (query) params.set('q', query);
    else params.delete('q');
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const fetchPeople = useCallback(async (pageNum) => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // 7 rows * 6 columns = 42 people
      const siteItemsPerPage = 42;
      const tmdbItemsPerPage = 20;
      const tmdbPagesToFetch = Math.ceil(siteItemsPerPage / tmdbItemsPerPage) + 1; // 4 pages -> 80 items
      const tmdbPageStart = (pageNum - 1) * tmdbPagesToFetch + 1;

      const pageNums = Array.from({ length: tmdbPagesToFetch }, (_, i) => tmdbPageStart + i);
      
      const responses = await Promise.all(
        pageNums.map(p => 
          searchQuery ? searchPeople(searchQuery, p) : getTrendingPeople(p, 'week')
        )
      );

      const isEnglishActor = (p) => {
        const knownFor = Array.isArray(p?.known_for) ? p.known_for : [];
        const langs = knownFor
          .map((k) => k?.original_language)
          .filter((l) => typeof l === 'string');
        if (langs.length === 0) return false;
        const enCount = langs.filter((l) => l === 'en').length;
        return enCount / langs.length >= 0.5;
      };

      const allResults = responses
        .flatMap((r) => r.results || [])
        .filter((p) => p.known_for_department === 'Acting');
      
      // Deduplicate
      const seen = new Set();
      const unique = allResults.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      unique.sort((a, b) => {
        const aEn = isEnglishActor(a) ? 1 : 0;
        const bEn = isEnglishActor(b) ? 1 : 0;
        if (bEn !== aEn) return bEn - aEn;
        return (b.popularity || 0) - (a.popularity || 0);
      });

      setPeople(unique.slice(0, 42));
      const firstTotalPages = responses[0]?.total_pages || 1;
      setTotalPages(Math.max(1, Math.ceil(firstTotalPages / tmdbPagesToFetch)));
    } catch (err) {
      console.error('People fetch error:', err);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPeople(page);
  }, [searchQuery, page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    updateUrlParams(newPage, searchQuery);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('q') || '';
    setSearchQuery(query);
    setPage(1);
    updateUrlParams(1, query);
  };

  const handleBackToPopular = () => {
    setSearchQuery('');
    setPage(1);
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {searchQuery ? `Results for "${searchQuery}"` : 'Popular People'}
        </h1>

        <form onSubmit={handleSearch} className="relative group w-full sm:w-80">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-white/20 group-focus-within:text-accent transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            name="q"
            type="text"
            defaultValue={searchQuery}
            placeholder="Search actors..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-accent/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-accent/10 transition-all duration-300 placeholder:text-white/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleBackToPopular}
              className="absolute inset-y-0 right-3 flex items-center text-white/20 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </form>
      </div>

      {searchQuery && (
        <div className="mb-4">
          <button
            onClick={handleBackToPopular}
            className="text-accent text-sm hover:underline"
          >
            ← Back to popular people
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              <div className="w-28 h-28 rounded-full bg-white/5 mb-2" />
              <div className="h-3 bg-white/5 rounded w-20" />
            </div>
          ))}
        </div>
      ) : people.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {people.map((person) => (
              <div key={person.id} className="flex justify-center">
                <PersonCard
                  person={person}
                />
              </div>
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
        </div>
      )}
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 bg-white/5 rounded w-48 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              <div className="w-28 h-28 rounded-full bg-white/5 mb-2" />
              <div className="h-3 bg-white/5 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    }>
      <PeopleContent />
    </Suspense>
  );
}
