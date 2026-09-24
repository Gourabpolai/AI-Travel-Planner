import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Compass, Plus, Map, CalendarDays, IndianRupee, Users, MoreHorizontal,
  Loader2, Trash2, X, ListChecks, Plane, Search, Star, MapPin, ArrowRight
} from 'lucide-react';
import { getAllTrips, createTrip, deleteTrip } from '@/api/tripApi';
import { useAuth } from '@/context/AuthContext';
import { searchPlaces } from '@/api/placeApi';
import { getDestinationThumbnail } from '@/data/destinationImages';
import { SeoHead } from '@/components/SeoHead';

const SearchInput = ({
  searchQuery,
  setSearchQuery,
  onEnter,
}: {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onEnter?: () => void;
}) => {
  return (
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) {
          onEnter();
        }
      }}
      placeholder="Search places or destinations..."
      aria-label="Search places or destinations"
      autoComplete="off"
    />
  );
};

const ModalDestInput = ({ destination, setDestination, setState }: any) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = destination.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(q, controller.signal);
        if (results !== null) {
          setSuggestions(results || []);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && err?.name !== 'CanceledError') {
          console.error('Error fetching place suggestions:', err);
        }
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination]);

  const handleSelect = (place: any) => {
    setDestination(place.name || '');
    const parts = (place.formattedAddress || '').split(',').map((s: string) => s.trim());
    if (parts.length >= 3) {
      setState(parts[parts.length - 2]);
    } else if (parts.length === 2) {
      setState(parts[0]);
    }
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={destination}
        onChange={(e) => {
          setDestination(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (destination.trim().length >= 2) setShowDropdown(true);
        }}
        placeholder="Search destinations (e.g. Koraput, Kerala, Paris)..."
        required
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="dest-suggestions">
          {suggestions.map((item: any) => (
            <button
              key={item.id || item.placeId}
              type="button"
              onClick={() => handleSelect(item)}
            >
              <MapPin size={14} />
              <span>
                <strong>{item.name}</strong>
                <small>{item.formattedAddress}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DESTINATION_IMAGES: Record<string, string> = {
  Kerala: 'https://images.pexels.com/photos/30778230/pexels-photo-30778230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Goa: 'https://images.pexels.com/photos/28368719/pexels-photo-28368719.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Manali: 'https://images.pexels.com/photos/29494184/pexels-photo-29494184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Jaipur: 'https://images.pexels.com/photos/32261804/pexels-photo-32261804.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Agra: 'https://images.pexels.com/photos/11948442/pexels-photo-11948442.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Varanasi: 'https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Munnar: 'https://images.pexels.com/photos/17928231/pexels-photo-17928231.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Rishikesh: 'https://images.pexels.com/photos/5205541/pexels-photo-5205541.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  Udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=940&q=80',
  Darjeeling: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=940&q=80',
  Pondicherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=940&q=80',
  Ladakh: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=940&q=80',
};

const POPULAR_PLACES = [
  { name: 'Kerala Backwaters', location: 'Kerala', image: getDestinationThumbnail('Kerala', DESTINATION_IMAGES.Kerala), category: 'Nature escape', rating: '4.9' },
  { name: 'Taj Mahal', location: 'Agra', image: getDestinationThumbnail('Agra', DESTINATION_IMAGES.Agra), category: 'Heritage', rating: '5.0' },
  { name: 'Goa Beaches', location: 'Goa', image: getDestinationThumbnail('Goa', DESTINATION_IMAGES.Goa), category: 'Beach getaway', rating: '4.7' },
  { name: 'Manali Hills', location: 'Himachal Pradesh', image: getDestinationThumbnail('Manali', DESTINATION_IMAGES.Manali), category: 'Mountain escape', rating: '4.8' },
  { name: 'Jaipur Palaces', location: 'Rajasthan', image: getDestinationThumbnail('Jaipur', DESTINATION_IMAGES.Jaipur), category: 'Culture & history', rating: '4.8' },
  { name: 'Varanasi Ghats', location: 'Uttar Pradesh', image: getDestinationThumbnail('Varanasi', DESTINATION_IMAGES.Varanasi), category: 'Soulful escape', rating: '4.6' },
  { name: 'Munnar Tea Gardens', location: 'Kerala', image: getDestinationThumbnail('Munnar', DESTINATION_IMAGES.Munnar), category: 'Scenic viewpoint', rating: '4.9' },
  { name: 'Rishikesh', location: 'Uttarakhand', image: getDestinationThumbnail('Rishikesh', DESTINATION_IMAGES.Rishikesh), category: 'Adventure', rating: '4.7' },
];

const INDIAN_DESTINATIONS = [
  { destination: 'Kerala', state: 'Kerala' },
  { destination: 'Goa', state: 'Goa' },
  { destination: 'Manali', state: 'Himachal Pradesh' },
  { destination: 'Jaipur', state: 'Rajasthan' },
  { destination: 'Agra', state: 'Uttar Pradesh' },
  { destination: 'Varanasi', state: 'Uttar Pradesh' },
  { destination: 'Munnar', state: 'Kerala' },
  { destination: 'Rishikesh', state: 'Uttarakhand' },
  { destination: 'Udaipur', state: 'Rajasthan' },
  { destination: 'Darjeeling', state: 'West Bengal' },
  { destination: 'Pondicherry', state: 'Puducherry' },
  { destination: 'Ladakh', state: 'Ladakh' },
];

interface DashboardTrip {
  id: string;
  _id?: string;
  title: string;
  destination: string;
  state?: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  status: string;
  image_url?: string;
  cover_image?: string;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefillDestination;
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [livePlaces, setLivePlaces] = useState<any[]>([]);

  useEffect(() => {
    if (prefill) {
      setShowCreate(true);
    }
  }, [prefill]);

  const handleOpenPlace = (name: string, placeObj?: any) => {
    setSearchQuery('');
    const placeId = placeObj?.placeId || placeObj?.id;
    if (placeId && typeof placeId === 'string' && (placeId.startsWith('ChIJ') || placeId.length > 15)) {
      navigate(`/place/${encodeURIComponent(placeId)}`, { state: { place: placeObj } });
    } else {
      navigate(`/destination/${encodeURIComponent(name)}`, { state: { place: placeObj } });
    }
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setLivePlaces([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(q, controller.signal);
        if (results !== null) {
          setLivePlaces(results || []);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && err?.name !== 'CanceledError') {
          console.error('Failed to search places:', err);
        }
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const fetchTrips = useCallback(async () => {
    try {
      const data = await getAllTrips();
      const mapped: DashboardTrip[] = (data || []).map((t: any) => {
        const destData = INDIAN_DESTINATIONS.find(
          (d) => d.destination.toLowerCase() === (t.destination || '').toLowerCase()
        );
        const resolvedState = t.state || destData?.state || 'India';
        const rawDest = t.destination || 'Kerala';
        const fallbackImg = DESTINATION_IMAGES[rawDest] || DESTINATION_IMAGES['Kerala'];

        return {
          id: t._id || t.id,
          _id: t._id || t.id,
          title: t.title || t.destination,
          destination: t.destination,
          state: resolvedState,
          start_date: t.startDate || t.start_date,
          end_date: t.endDate || t.end_date,
          budget: Number(t.budget) || 0,
          travelers: Number(t.travelers) || 1,
          status: (t.status || 'planning').toLowerCase(),
          image_url: t.cover_image || fallbackImg,
        };
      });
      setTrips(mapped);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpenId(null);
    try {
      await deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSignOut = () => {
    if (signOut) signOut();
    navigate('/');
  };

  const stats = {
    total: trips.length,
    planning: trips.filter((t) => t.status === 'planning').length,
    completed: trips.filter((t) => t.status === 'completed').length,
    totalBudget: trips.reduce((sum, t) => sum + Number(t.budget || 0), 0),
  };

  const userName = user?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorer';
  const searchText = searchQuery.trim().toLowerCase();
  const filteredTrips = searchText
    ? trips.filter((trip) => `${trip.destination} ${trip.state || ''} ${trip.title}`.toLowerCase().includes(searchText))
    : trips;
  const filteredPopularPlaces = searchText
    ? POPULAR_PLACES.filter((place) => `${place.name} ${place.location} ${place.category}`.toLowerCase().includes(searchText))
    : POPULAR_PLACES;
  const popularCarousel = [...filteredPopularPlaces, ...filteredPopularPlaces];

  return (
    <div className="dash-shell">
      <SeoHead
        title="My Dashboard | TripSync"
        description="Manage your trips and itineraries."
        canonicalPath="/dashboard"
        noindex={true}
        nofollow={true}
      />
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="brand-mark"><Compass size={20} strokeWidth={2.4} /></span>
          <span>tripsync</span>
        </div>

        <div className="dash-profile">
          <div className="dash-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{userName}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <nav className="dash-nav">
          <span className="nav-caption">Workspace</span>
          <button className="nav-item active">
            <Compass size={18} /><span>My trips</span>
            <span className="nav-count">{stats.total}</span>
          </button>
          <button
            className="nav-item"
            onClick={() => {
              const el = document.getElementById('popular-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Map size={18} /><span>Explore spots</span>
          </button>
          <button
            className="nav-item"
            onClick={() => {
              if (trips.length > 0) {
                navigate(`/trips/${trips[0].id}`);
              } else {
                setShowCreate(true);
              }
            }}
          >
            <IndianRupee size={18} /><span>Budget & expenses</span>
          </button>
          <button
            className="nav-item"
            onClick={() => {
              if (trips.length > 0) {
                navigate(`/trips/${trips[0].id}`);
              } else {
                setShowCreate(true);
              }
            }}
          >
            <ListChecks size={18} /><span>Packing list</span>
          </button>
        </nav>

        <div className="dash-sidebar-bottom">
          <div className="dash-help-card">
            <div className="help-icon"><Plane size={16} /></div>
            <strong>Plan it your way</strong>
            <p>Tell our AI what you're looking for and get a personalized plan.</p>
            <button onClick={() => setShowCreate(true)}>Try AI planner</button>
          </div>
          <button className="nav-item" onClick={handleSignOut}>
            <span style={{ marginLeft: 0 }}>Sign out</span>
          </button>
          <div className="dash-sidebar-footer">© 2026 TripSync · Made for explorers</div>
        </div>
      </aside>

      {/* Main content */}
      <section className="dash-main">
        <header className="dash-topbar">
          <div className="dash-breadcrumb">
            <span>Workspace</span>
            <span className="sep">/</span>
            <strong>My trips</strong>
          </div>

          <div className="dash-search-center">
            <div className="dash-search-wrap">
              <Search size={17} />
              <SearchInput 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                onEnter={() => {
                  if (livePlaces.length > 0) {
                    handleOpenPlace(livePlaces[0].name, livePlaces[0]);
                  } else if (filteredPopularPlaces.length > 0) {
                    handleOpenPlace(filteredPopularPlaces[0].name);
                  } else if (searchQuery.trim()) {
                    handleOpenPlace(searchQuery.trim());
                  }
                }}
              />
              {searchQuery && (
                <button
                  className="dash-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
              {searchQuery.trim() && (
                <div className="dash-search-results">
                  {/* Matching User Trips */}
                  {filteredTrips.slice(0, 2).map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        navigate(`/trips/${trip.id}`);
                      }}
                    >
                      <Compass size={14} />
                      <span>
                        <strong>{trip.destination}</strong>
                        <small>Your trip · {trip.title}</small>
                      </span>
                    </button>
                  ))}

                  {/* Live Google Places API Results */}
                  {livePlaces.slice(0, 5).map((place: any) => (
                    <button
                      key={place.id || place.placeId || place.name}
                      type="button"
                      onClick={() => handleOpenPlace(place.name, place)}
                    >
                      <MapPin size={14} />
                      <span>
                        <strong>{place.name}</strong>
                        <small>{place.formattedAddress}</small>
                      </span>
                    </button>
                  ))}

                  {/* Predefined Popular Places */}
                  {filteredPopularPlaces.slice(0, 4).map((place) => (
                    <button
                      key={place.name}
                      type="button"
                      onClick={() => handleOpenPlace(place.name)}
                    >
                      <Map size={14} />
                      <span>
                        <strong>{place.name}</strong>
                        <small>{place.location} · {place.category}</small>
                      </span>
                    </button>
                  ))}

                  {/* Instant Exploration Fallback */}
                  {livePlaces.length === 0 && filteredPopularPlaces.length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenPlace(searchQuery.trim())}
                    >
                      <MapPin size={14} />
                      <span>
                        <strong>Explore “{searchQuery.trim()}”</strong>
                        <small>Open place details & travel guide</small>
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="dash-top-actions">
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={17} /> New trip
            </button>
          </div>
        </header>

        <div className="dash-content">
          {/* Trips */}
          <div className="dash-trips-head">
            <h2>Your trips</h2>
            <p>{stats.total} {stats.total === 1 ? 'trip' : 'trips'} created</p>
          </div>

          {loading ? (
            <div className="dash-loading">
              <Loader2 size={28} className="spin" /> Loading your trips...
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="dash-empty">
              <div className="empty-icon"><Compass size={32} /></div>
              <h3>{searchQuery ? 'No matching trips' : 'No trips yet'}</h3>
              <p>
                {searchQuery
                  ? 'Try another trip or destination name.'
                  : 'Create your first trip and let AI help you plan an amazing journey across India.'}
              </p>
              {!searchQuery && (
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                  <Plus size={17} /> Create your first trip
                </button>
              )}
            </div>
          ) : (
            <div className="trip-grid">
              {filteredTrips.map((trip) => (
                <article
                  className="trip-card"
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <div className="trip-card-img">
                    <img
                      src={trip.image_url ? (trip.image_url.startsWith('/destination-images/') ? trip.image_url.replace(/\.webp$/, '-thumb.webp') : trip.image_url) : DESTINATION_IMAGES['Kerala']}
                      alt={trip.destination}
                      loading="lazy"
                    />
                    <span className={`trip-status ${trip.status}`}>{trip.status}</span>
                    <div
                      className="trip-menu-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="trip-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === trip.id ? null : trip.id);
                        }}
                        aria-label="Trip options"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuOpenId === trip.id && (
                        <div className="trip-menu">
                          <button onClick={(e) => handleDelete(e, trip.id)}>
                            <Trash2 size={14} /> Delete trip
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="trip-card-body">
                    <h3>{trip.destination}</h3>
                    <div className="trip-card-loc">
                      <Map size={13} /> {trip.state || 'India'}
                    </div>
                    <div className="trip-card-meta">
                      <div className="meta-item">
                        <CalendarDays size={14} /> {formatDate(trip.start_date)}
                      </div>
                      <div className="meta-item">
                        <Users size={14} /> {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
                      </div>
                    </div>
                    <div className="trip-card-footer">
                      <span className="trip-budget">{formatINR(Number(trip.budget))}</span>
                      <span className="trip-dates">
                        {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Popular Places Marquee */}
          <section className="popular-section" id="popular-section">
            <div className="popular-heading">
              <div>
                <p className="eyebrow">{searchQuery ? 'Search results' : 'Get inspired'}</p>
                <h2>{searchQuery ? 'Places matching your search' : 'Popular places to explore'}</h2>
              </div>
              {!searchQuery && (
                <span className="popular-live">
                  <i /> Moving inspiration
                </span>
              )}
            </div>
            {filteredPopularPlaces.length > 0 ? (
              <div className="popular-viewport">
                <div className="popular-track">
                  {popularCarousel.map((place, index) => (
                    <article
                      className="popular-card"
                      key={`${place.name}-${index}`}
                      onClick={() => handleOpenPlace(place.name)}
                      title={`View ${place.name} details`}
                    >
                      <div className="popular-image">
                        <img src={place.image} alt={place.name} loading="lazy" />
                        <span className="popular-rating">
                          <Star size={11} fill="currentColor" /> {place.rating}
                        </span>
                      </div>
                      <div className="popular-card-body">
                        <div>
                          <h3>{place.name}</h3>
                          <p><Map size={12} /> {place.location}, India</p>
                        </div>
                        <span className="popular-category">{place.category}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="popular-empty">
                No popular places match “{searchQuery}”. Try Kerala, Goa, or Jaipur.
              </div>
            )}
          </section>
        </div>
      </section>

      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onCreated={(newId?: string) => {
            setShowCreate(false);
            fetchTrips();
            if (newId) navigate(`/trips/${newId}`);
          }}
          initialDestination={prefill || ''}
        />
      )}
    </div>
  );
}

function CreateTripModal({
  onClose,
  onCreated,
  initialDestination = '',
}: {
  onClose: () => void;
  onCreated: (newId?: string) => void;
  initialDestination?: string;
}) {
  const [destination, setDestination] = useState(initialDestination);
  const [state, setState] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setLoading(true);

    try {
      const destData = INDIAN_DESTINATIONS.find(
        (d) => d.destination.toLowerCase() === destination.trim().toLowerCase()
      );
      const finalState = state || destData?.state || 'India';
      const imageUrl =
        DESTINATION_IMAGES[destination.trim()] ||
        DESTINATION_IMAGES[destData?.destination || ''] ||
        DESTINATION_IMAGES['Kerala'];

      const newTrip = await createTrip({
        title: `${destination.trim()} Trip`,
        destination: destination.trim(),
        startDate,
        endDate,
        start_date: startDate,
        end_date: endDate,
        budget: Number(budget) || 0,
        travelers: Number(travelers) || 1,
        status: 'Planning',
        cover_image: imageUrl,
        state: finalState,
      });

      onCreated(newTrip?._id || newTrip?.id);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Create a new trip</h2>
            <p>Plan your next adventure across India</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label>Destination</label>
            <ModalDestInput destination={destination} setDestination={setDestination} setState={setState} />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Budget (₹)</label>
              <div className="input-with-icon">
                <IndianRupee size={16} />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="50000"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="form-field">
              <label>Travelers</label>
              <input
                type="number"
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                min="1"
                max="20"
                required
              />
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <Loader2 size={17} className="spin" />
              ) : (
                <>
                  <Plus size={16} /> Create trip
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
