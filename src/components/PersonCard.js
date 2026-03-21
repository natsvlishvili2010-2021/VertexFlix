import Link from 'next/link';
import { getImageUrl } from '@/lib/tmdb';

export default function PersonCard({ person, subtitle }) {
  const profileUrl = getImageUrl(person.profile_path, 'w185');

  return (
    <Link href={`/person/${person.id}`} className="group block shrink-0 w-28 text-center">
      <div className="w-28 h-28 rounded-full overflow-hidden bg-bg-card mx-auto mb-2 ring-2 ring-transparent group-hover:ring-accent transition-all duration-300">
        {profileUrl ? (
          <img
            src={profileUrl}
            alt={person.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-3xl font-bold">
            {person.name?.[0]}
          </div>
        )}
      </div>
      <p className="text-white text-xs font-medium truncate">{person.name}</p>
      {subtitle && (
        <p className="text-white/40 text-xs truncate">{subtitle}</p>
      )}
    </Link>
  );
}
