import { getTrending, getPopular, getTopRated, getNowPlaying, getUpcoming } from '@/lib/tmdb';
import HeroBanner from '@/components/HeroBanner';
import MovieCarousel from '@/components/MovieCarousel';

export const revalidate = 3600;

export default async function HomePage() {
  const [trending, popular, topRated, nowPlaying, upcoming, popularTV] = await Promise.all([
    getTrending('all', 'week'),
    getPopular('movie'),
    getTopRated('movie'),
    getNowPlaying(),
    getUpcoming(),
    getPopular('tv'),
  ]).catch((err) => {
    console.error('Error fetching home data:', err);
    return [{ results: [] }, { results: [] }, { results: [] }, { results: [] }, { results: [] }, { results: [] }];
  });

  const featured = trending.results?.[Math.floor(Math.random() * Math.min(5, trending.results?.length || 1))];

  return (
    <div>
      <HeroBanner movie={featured} />
      <div className="-mt-4 sm:-mt-16 relative z-10 space-y-2 pb-8">
        <MovieCarousel title="Trending This Week" items={trending.results} mediaType={null} />
        <MovieCarousel title="Popular Movies" items={popular.results} mediaType="movie" />
        <MovieCarousel title="Top Rated Movies" items={topRated.results} mediaType="movie" />
        <MovieCarousel title="Now Playing" items={nowPlaying.results} mediaType="movie" />
        <MovieCarousel title="Upcoming" items={upcoming.results} mediaType="movie" />
        <MovieCarousel title="Popular TV Shows" items={popularTV.results} mediaType="tv" />
      </div>
    </div>
  );
}
