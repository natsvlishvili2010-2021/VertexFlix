'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PersonCard from '@/components/PersonCard';
import { getPopularPeople, searchPeople } from '@/lib/tmdb';

function PeopleContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const fetchPeople = useCallback(async (pageNum, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = searchQuery
        ? await searchPeople(searchQuery, pageNum)
        : await getPopularPeople(pageNum);

      const results = data.results || [];
      setPeople((prev) => reset ? results : [...prev, ...results]);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('People fetch error:', err);
      if (reset) setPeople([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchPeople(1, true);
  }, [fetchPeople]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPeople(nextPage, false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSearchQuery(formData.get('q') || '');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {searchQuery ? `Results for "${searchQuery}"` : 'Popular People'}
        </h1>

        <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
          <input
            name="q"
            type="text"
            defaultValue={searchQuery}
            placeholder="Search people..."
            className="bg-bg-card border border-white/10 text-white text-sm rounded-l-md px-3 py-2 flex-1 sm:flex-none sm:w-48 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover text-white px-3 sm:px-4 py-2 rounded-r-md text-sm transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {searchQuery && (
        <div className="mb-4">
          <button
            onClick={() => setSearchQuery('')}
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
                  subtitle={person.known_for_department}
                />
              </div>
            ))}
          </div>

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
