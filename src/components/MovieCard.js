import Link from 'next/link';
import { getImageUrl } from '@/lib/tmdb';

export default function MovieCard({ item, mediaType }) {
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;
  const year = date ? new Date(date).getFullYear() : '';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  const posterUrl = getImageUrl(item.poster_path, 'w342');
  const type = mediaType || item.media_type || 'movie';
  const href = `/${type}/${item.id}`;

  return (
    <Link href={href} className="group block shrink-0 w-32 sm:w-44">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-card">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center p-2">
            {title}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            {year && <span className="text-white/60 text-xs">{year}</span>}
            <span className="text-yellow-400 text-xs font-medium flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
