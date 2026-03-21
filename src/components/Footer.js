import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-white/10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Browse</h3>
            <ul className="space-y-2">
              <li><Link href="/browse" className="text-white/50 hover:text-white/80 text-sm transition-colors">Movies</Link></li>
              <li><Link href="/browse?media_type=tv" className="text-white/50 hover:text-white/80 text-sm transition-colors">TV Shows</Link></li>
              <li><Link href="/browse?sort_by=vote_average.desc" className="text-white/50 hover:text-white/80 text-sm transition-colors">Top Rated</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Genres</h3>
            <ul className="space-y-2">
              <li><Link href="/browse?genre=28" className="text-white/50 hover:text-white/80 text-sm transition-colors">Action</Link></li>
              <li><Link href="/browse?genre=35" className="text-white/50 hover:text-white/80 text-sm transition-colors">Comedy</Link></li>
              <li><Link href="/browse?genre=27" className="text-white/50 hover:text-white/80 text-sm transition-colors">Horror</Link></li>
              <li><Link href="/browse?genre=10749" className="text-white/50 hover:text-white/80 text-sm transition-colors">Romance</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Information</h3>
            <ul className="space-y-2">
              <li><span className="text-white/50 text-sm">About</span></li>
              <li><span className="text-white/50 text-sm">Contact</span></li>
              <li><span className="text-white/50 text-sm">FAQ</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-white/50 text-sm">Privacy Policy</span></li>
              <li><span className="text-white/50 text-sm">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <div className="flex flex-col items-center mb-4">
            <img src="/logo.png" alt="VertexFlix" className="h-10 w-auto opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all" />
          </div>
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} VertexFlix. This site uses TMDB API and 2Embed for movie data and playback. All content belongs to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
