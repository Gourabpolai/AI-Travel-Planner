import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Sparkles, Star, Plus, Compass, Loader, Globe } from 'lucide-react';
import { POPULAR_PLACES, type PopularPlace } from '@/data/popularPlaces';
import { searchPlaces } from '@/api/placeApi';

interface PlaceSearchBarProps {
  onSelectPlace?: (place: PopularPlace) => void;
  onCreateTripForPlace?: (placeName: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function PlaceSearchBar({
  onSelectPlace,
  onCreateTripForPlace,
  placeholder = "Search any city or destination in India (e.g. Vizag, Goa, Mumbai, Kerala)...",
  className = "",
  compact = false,
}: PlaceSearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState<PopularPlace[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search with in-flight request cancellation (AbortController)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setApiResults([]);
      setLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(trimmed, controller.signal);
        
        if (results === null) {
          // Request was aborted silently
          return;
        }

        if (Array.isArray(results) && results.length > 0) {
          // Map backend destination objects cleanly to PopularPlace schema
          const formatted: PopularPlace[] = results.map((item: any, idx: number) => ({
            id: item.placeId || item.id || `dest-${idx}`,
            placeId: item.placeId || item.id,
            name: item.name || trimmed,
            country: item.formattedAddress || 'Destination',
            description: item.formattedAddress || `Destination in ${item.name || trimmed}`,
            image: null,
            rating: item.rating || 4.8,
            tag: 'Destination',
            bestTime: 'Year-round',
            duration: '3-5 days',
            budget: '$800 - $1,500',
            attractions: [item.name],
          }));
          setApiResults(formatted);
          setSelectedIndex(-1);
        } else {
          setApiResults([]);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Failed to search places:', err);
        setApiResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Combine static frontend matches with live backend API results
  const trimmedQuery = query.trim().toLowerCase();
  
  const frontendMatches = trimmedQuery
    ? POPULAR_PLACES.filter((place) => {
        const nameMatch = place.name.toLowerCase().includes(trimmedQuery);
        const countryMatch = place.country.toLowerCase().includes(trimmedQuery);
        return nameMatch || countryMatch;
      })
    : POPULAR_PLACES.slice(0, 4);

  // Merge results, removing duplicate names
  const mergedPlaces = [...apiResults];
  frontendMatches.forEach((fPlace) => {
    if (!mergedPlaces.some((m) => m.name.toLowerCase() === fPlace.name.toLowerCase())) {
      mergedPlaces.push(fPlace);
    }
  });

  const displayPlaces = trimmedQuery ? mergedPlaces : POPULAR_PLACES.slice(0, 4);

  const handleSelectPlace = (place: PopularPlace) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery('');
    if (onSelectPlace) {
      onSelectPlace(place);
    }
    const placeId = (place as any).placeId || (place as any).id;
    if (placeId && typeof placeId === 'string' && (placeId.startsWith('ChIJ') || placeId.length > 15)) {
      navigate(`/place/${encodeURIComponent(placeId)}`, { state: { place } });
    } else {
      navigate(`/destination/${encodeURIComponent(place.name)}`, { state: { place } });
    }
  };

  const handleCreateTrip = (e: React.MouseEvent, placeName: string) => {
    e.stopPropagation();
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery('');
    if (onCreateTripForPlace) {
      onCreateTripForPlace(placeName);
    }
  };

  // Full Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayPlaces.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < displayPlaces.length) {
        handleSelectPlace(displayPlaces[selectedIndex]);
      } else if (displayPlaces.length > 0) {
        handleSelectPlace(displayPlaces[0]);
      } else if (trimmedQuery && onCreateTripForPlace) {
        onCreateTripForPlace(query);
        setIsOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Prominent High-Visibility Search Input Box */}
      <div
        className={`relative flex items-center transition-all duration-300 rounded-2xl border-2 ${
          isOpen
            ? 'border-brand-500 ring-4 ring-brand-500/20 shadow-2xl bg-white dark:bg-slate-900'
            : 'border-slate-300/90 dark:border-slate-700/90 hover:border-brand-400 bg-white dark:bg-slate-850 shadow-lg hover:shadow-xl'
        }`}
      >
        <div className="pl-4 pr-2.5 text-brand-600 dark:text-brand-400 flex items-center pointer-events-none">
          <Search className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} stroke-[2.5] text-brand-600 dark:text-brand-400`} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 font-semibold focus:outline-none ${
            compact ? 'py-2.5 text-xs sm:text-sm' : 'py-4 text-base sm:text-lg'
          }`}
        />

        {/* Loading Spinner or Clear Button */}
        <div className="flex items-center gap-1 pr-3">
          {loading && (
            <div className="p-1.5 text-brand-600 dark:text-brand-400">
              <Loader className="w-5 h-5 animate-spin" />
            </div>
          )}

          {query && !loading && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(true);
                setSelectedIndex(-1);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}


        </div>
      </div>

      {/* Autocomplete Recommendations Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden z-50 backdrop-blur-xl"
          >
            {/* Header / Recommendation Label */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 text-brand-600 animate-spin" />
                    Searching destinations...
                  </>
                ) : trimmedQuery ? (
                  <>
                    <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Matching Destinations ({displayPlaces.length})
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Popular Destinations
                  </>
                )}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Use ↑ ↓ keys & Enter to select
              </span>
            </div>

            {/* Recommendations List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1.5">
              {displayPlaces.length > 0 ? (
                displayPlaces.map((place, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      className={`p-3.5 rounded-xl transition-all duration-100 cursor-pointer flex items-center justify-between group border ${
                        isSelected
                          ? 'bg-brand-50/90 dark:bg-slate-800 border-brand-300 dark:border-brand-600 ring-2 ring-brand-500/30'
                          : 'hover:bg-brand-50/60 dark:hover:bg-slate-800 border-transparent hover:border-brand-200/60 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Map Pin Icon Badge */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white'
                        }`}>
                          <MapPin className="w-5 h-5 stroke-[2.2]" />
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-display font-extrabold text-base transition-colors ${
                              isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400'
                            }`}>
                              {place.name}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {place.country}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-2 flex-shrink-0">
                        <button
                          onClick={(e) => handleCreateTrip(e, place.name)}
                          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" /> Plan Trip
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : !loading ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/60 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-600 dark:text-brand-400">
                    <Compass className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Search custom destination "{query}"
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    You can create a personalized AI travel itinerary for any city or location in India!
                  </p>
                  {onCreateTripForPlace && (
                    <button
                      onClick={(e) => handleCreateTrip(e, query)}
                      className="mt-4 btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-1.5 cursor-pointer shadow-lg font-bold"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" /> Create Trip for "{query}"
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Quick Action Footer */}
            {trimmedQuery && onCreateTripForPlace && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between px-4">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Want to plan for <strong className="text-slate-900 dark:text-white">"{query}"</strong> directly?
                </span>
                <button
                  onClick={(e) => handleCreateTrip(e, query)}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Start Planning <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

