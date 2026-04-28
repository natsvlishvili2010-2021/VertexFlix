import Link from 'next/link';
import { getImageUrl } from '@/lib/tmdb';

export default function PersonCard({ person, subtitle }) {
  const profileUrl = getImageUrl(person.profile_path, 'w342');

  return (
    <Link 
      href={`/person/${person.id}`} 
      className="group block w-full max-w-[150px] mx-auto text-center shrink-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl mb-3 shadow-md transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(229,9,20,0.15)]">
        {/* Profile Image */}
        {profileUrl ? (
          <img
            src={profileUrl}
            alt={person.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bg-secondary text-white/10 text-4xl font-black italic">
            {person.name?.[0]}
          </div>
        )}

        {/* Subtle Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Text Content - Simple & Compact */}
      <div className="px-1">
        <h3 className="text-white text-[13px] sm:text-sm font-semibold tracking-tight leading-tight">
          {person.name}
        </h3>
        {subtitle && (
          <p className="text-white/40 text-[11px] sm:text-[12px] mt-0.5 line-clamp-1 italic font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}




