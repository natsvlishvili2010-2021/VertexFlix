'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthModal from './AuthModal';
import { useAuth } from '@/context/AuthContext';
import { searchMovies, searchTV, getImageUrl } from '@/lib/tmdb';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Real-time search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const qRaw = searchQuery.trim();
          const [movieData, tvData] = await Promise.all([searchMovies(qRaw, 1), searchTV(qRaw, 1)]);
          const data = {
            results: [
              ...((movieData?.results || []).map((i) => ({ ...i, media_type: 'movie' }))),
              ...((tvData?.results || []).map((i) => ({ ...i, media_type: 'tv' }))),
            ],
          };
          const q = searchQuery.trim().toLowerCase();
          const isVeryShortQuery = q.length <= 2;

          const getDisplayTitle = (item) => (item.title || item.name || '').toString();

          const getRelevanceScore = (item) => {
            const title = getDisplayTitle(item).toLowerCase();
            if (!title) return 0;
            if (title === q) return 100;
            if (title.startsWith(q)) return 80;
            // Prefer matches at word boundaries (e.g. "park" in "Jurassic Park")
            if (title.includes(` ${q}`) || title.includes(`${q} `)) return 65;
            if (title.includes(q)) return 50;
            return 0;
          };

          // Filter to only show movies and tv shows with posters in the preview.
          // Sort by relevance first, popularity second.
          const deduped = (() => {
            const seen = new Set();
            const out = [];
            for (const it of data.results || []) {
              const key = `${it.media_type}:${it.id}`;
              if (seen.has(key)) continue;
              seen.add(key);
              out.push(it);
            }
            return out;
          })();

          const filteredResults = deduped
            .filter(
              (item) =>
                (item.media_type === 'movie' || item.media_type === 'tv') &&
                item.poster_path &&
                (item.vote_average || 0) > 0,
            )
            .map((item) => {
              const score = getRelevanceScore(item);
              const isExact = getDisplayTitle(item).toLowerCase() === q;
              return {
                item,
                score,
                isExact,
                popularity: typeof item.popularity === 'number' ? item.popularity : 0,
                voteCount: typeof item.vote_count === 'number' ? item.vote_count : 0,
              };
            })
            .filter((x) => {
              if (isVeryShortQuery) {
                // For very short queries, rely on popularity and "proof" (vote_count)
                // to avoid obscure matches dominating the list.
                return x.voteCount >= 200;
              }
              // For longer queries, rely on TMDB's search + our ordering.
              // Avoid over-filtering here; otherwise valid prefix matches can disappear.
              return true;
            })
            .sort((a, b) => {
              if (!isVeryShortQuery) return 0;
              if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
              return b.popularity - a.popularity;
            });

          const hasAnyExactMatch = filteredResults.some((x) => x.isExact);
          const orderedResults = (isVeryShortQuery
            ? filteredResults
            : hasAnyExactMatch
              ? (() => {
                  const exact = filteredResults
                    .filter((x) => x.isExact)
                    .sort((a, b) => b.popularity - a.popularity);
                  const rest = filteredResults
                    .filter((x) => !x.isExact)
                    .sort((a, b) => b.popularity - a.popularity);
                  return [...exact, ...rest];
                })()
              : filteredResults.slice().sort((a, b) => {
                  if (b.score !== a.score) return b.score - a.score;
                  return b.popularity - a.popularity;
                })
          )
            .map((x) => x.item)
            .slice(0, 6); // Show top 6 matches
          setSearchResults(orderedResults);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Lock body scroll when mobile menu or search overlay is open
  useEffect(() => {
    if (mobileMenuOpen || isSearchOverlayOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen, isSearchOverlayOpen]);

  // Handle ESC key to close search
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsSearchOverlayOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?media_type=all&q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
      setIsSearchOverlayOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/browse', label: 'Movies', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
    { href: '/browse?media_type=tv', label: 'TV Shows', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { href: '/people', label: 'People', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-bg-primary/95 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 group mr-8 sm:mr-24 max-h-full overflow-hidden">
              <img src="/logo.png" alt="VertexFlix" className="h-24 sm:h-32 md:h-40 w-auto object-contain transition-transform group-hover:scale-105 pointer-events-none" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-white/80 hover:text-white transition-colors text-sm font-medium tracking-wide">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Search + mobile menu toggle */}
            <div className="flex-1 flex items-center justify-end gap-3 sm:gap-6 ml-4">
              {/* Desktop Search Trigger */}
              <div className="hidden md:block">
                <button
                  onClick={() => setIsSearchOverlayOpen(true)}
                  className="p-2 text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* Mobile Search Icon (opens full screen search) */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsSearchOverlayOpen(true)}
                  className="text-white/80 hover:text-white p-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu Toggle button is handled separately below */}

              {/* Auth Buttons */}
              <div className="hidden md:flex items-center gap-3 ml-2">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 group focus:outline-none"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border ${userDropdownOpen ? 'bg-white/20 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                        <span className="text-white font-bold text-sm tracking-tighter">
                          {user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-white/30 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180 text-white' : 'group-hover:text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {userDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setUserDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-4 w-64 bg-bg-secondary/95 border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] z-20 overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-top-3 duration-300 ease-out">
                          <div className="px-5 py-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0">
                              {user.email[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <p className="text-sm text-white font-bold truncate">Account Settings</p>
                              <p className="text-[11px] text-white/40 truncate font-medium">{user.email}</p>
                            </div>
                          </div>
                          
                          <div className="p-2">
                            <Link 
                              href="/favorites" 
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-3.5 px-4 py-3 text-[13px] text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/40 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </div>
                              <span className="font-medium">My Favorites</span>
                            </Link>

                            <div className="h-px bg-white/5 my-1 mx-2"></div>

                            <button
                              onClick={async () => {
                                try {
                                  await signOut();
                                  setUserDropdownOpen(false);
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="w-full flex items-center gap-3.5 px-4 py-3 text-[13px] text-white/50 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                              </div>
                              <span className="font-medium">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
                      className="text-white/80 hover:text-white transition-colors text-sm font-medium px-3 py-1.5"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}
                      className="bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-accent/20"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white/80 hover:text-white p-1 relative w-10 h-10 flex items-center justify-center"
                aria-label="Menu"
              >
                <div className="w-6 h-5 relative flex flex-col justify-between">
                  <span className={`block h-0.5 w-full bg-current transition-all duration-300 origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-[9px]' : ''}`} />
                  <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                  <span className={`block h-0.5 w-full bg-current transition-all duration-300 origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Slide-in panel */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-bg-secondary/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-white/10">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <img src="/logo.png" alt="VertexFlix" className="h-8 w-auto object-contain" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/60 hover:text-white p-1 transition-colors"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="py-2">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 px-5 py-3.5 text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                style={{
                  animationDelay: mobileMenuOpen ? `${index * 50}ms` : '0ms',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent/70 group-hover:text-accent transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                <span className="text-sm font-medium">{link.label}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto text-white/20 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </nav>

          {/* Mobile Auth */}
          <div className="px-5 py-6 space-y-3">
            {user ? (
              <>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Account</p>
                    <p className="text-sm text-white/70 truncate">{user.email}</p>
                  </div>
                  
                  <Link 
                    href="/favorites" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    My Favorites
                  </Link>

                  <button
                    onClick={async () => {
                      try {
                        await signOut();
                        setMobileMenuOpen(false);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors border-t border-white/5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthMode('login'); setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl transition-all border border-white/10"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-accent/20"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Panel footer */}
          <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-white/10">
            <p className="text-white/30 text-xs">Powered by TMDB API</p>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode={authMode} 
      />

      {/* Full Screen Search Overlay */}
      <div 
        className={`fixed inset-0 z-[100] transition-all duration-500 flex items-start justify-center pt-[7vh] sm:pt-[8vh] px-4 ${
          isSearchOverlayOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}
      >
        {/* Darkened backdrop without blur */}
        <div 
          className="absolute inset-0 bg-black/80 transition-opacity duration-500"
          onClick={() => setIsSearchOverlayOpen(false)}
        />

        {/* Search Container */}
        <div className={`relative w-full max-w-2xl transform transition-all duration-500 ease-out ${isSearchOverlayOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}>
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-[#121212] rounded-2xl border border-white/10 shadow-2xl" />
            
            <div className={`absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors duration-300 z-10 ${isSearchFocused ? 'text-accent' : 'text-white/20'}`}>
              {isSearching ? (
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            
            <input
              type="text"
              autoFocus={isSearchOverlayOpen}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search movies, TV shows, actors..."
              className="relative w-full bg-transparent py-5 pl-14 pr-12 text-lg sm:text-xl text-white placeholder:text-white/10 focus:outline-none transition-all duration-300 font-medium z-10"
            />
            
            {/* Clear Action */}
            <div className="absolute inset-y-0 right-3 flex items-center z-10">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-2 text-white/20 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* Real-time Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-3 bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-3">
                {searchResults.map((item) => (
                  <Link
                    key={`${item.id}-${item.media_type}`}
                    href={`/${item.media_type}/${item.id}`}
                    onClick={() => {
                      setIsSearchOverlayOpen(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex items-center gap-5 p-3 hover:bg-white/5 rounded-xl transition-all group"
                  >
                    <div className="w-14 h-20 bg-white/5 rounded-lg overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={getImageUrl(item.poster_path, 'w185')}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-accent transition-colors truncate">
                        {item.title || item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white/30">
                          {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="text-xs font-semibold text-white/20">
                          {(item.release_date || item.first_air_date)?.split('-')[0]}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-bold text-white/40">{item.vote_average?.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 pr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
              <button
                onClick={handleSearch}
                className="w-full py-3 bg-white/[0.02] border-t border-white/5 text-[11px] font-bold text-white/40 hover:text-white hover:bg-white/[0.05] transition-all uppercase tracking-widest"
              >
                View all results for "{searchQuery}"
              </button>
            </div>
          )}

          {/* Quick Info/Tips */}
          {!searchResults.length && searchQuery.length < 2 && (
            <div className="mt-4 flex items-center justify-center gap-4 text-white/10">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded border border-white/5 text-[9px] font-bold tracking-tighter uppercase">Esc</span>
                <span className="text-[11px] font-medium">to close</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Close Button (Top Right) */}
        <button
          onClick={() => setIsSearchOverlayOpen(false)}
          className="absolute top-6 right-6 p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}
