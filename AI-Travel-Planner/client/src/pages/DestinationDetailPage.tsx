import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Calendar, Clock, IndianRupee, Thermometer,
  Users, Loader2, Send, Trash2, CheckCircle2, Compass, ArrowRight, Sparkles, Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SeoHead } from '@/components/SeoHead';
import { PlaceSearchBar } from '@/components/PlaceSearchBar';
import { type Place, findPlaceByName, findPlaceById, getOrCreatePlace, PLACES } from '@/data/placesData';

export interface VisitorReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export function DestinationDetailPage() {
  const { placeName } = useParams<{ placeName: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Resolve place
  const statePlace = location.state?.place;
  const decodedName = placeName ? decodeURIComponent(placeName) : 'Destination';

  const [place, setPlace] = useState<Place>(() => {
    if (statePlace?.name) {
      return getOrCreatePlace(statePlace.name, statePlace.formattedAddress);
    }
    return findPlaceByName(decodedName) || findPlaceById(decodedName) || getOrCreatePlace(decodedName);
  });

  const [activeImage, setActiveImage] = useState(0);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reviews from localStorage
  const [reviews, setReviews] = useState<VisitorReview[]>(() => {
    const key = `tripsync_reviews_${place.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing stored reviews:', e);
      }
    }
    // Default initial mock reviews for visual richness
    return [
      {
        id: '1',
        author: 'Priya Sharma',
        rating: 5,
        comment: `Absolutely loved visiting ${place.name}! The atmosphere, culture, and views were even better than expected. Highly recommended for any traveler.`,
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: '2',
        author: 'Arun Patel',
        rating: 4,
        comment: `Wonderful experience. Make sure to visit early in the morning for the best lighting and fewer crowds. The local cuisine is outstanding.`,
        date: new Date(Date.now() - 86400000 * 12).toISOString(),
      }
    ];
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const resolved = statePlace?.name
      ? getOrCreatePlace(statePlace.name, statePlace.formattedAddress)
      : findPlaceByName(decodedName) || findPlaceById(decodedName) || getOrCreatePlace(decodedName);

    setPlace(resolved);
    setActiveImage(0);

    // Load reviews for this place
    const key = `tripsync_reviews_${resolved.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setReviews(JSON.parse(stored));
      } catch {
        setReviews([]);
      }
    } else {
      setReviews([
        {
          id: '1',
          author: 'Priya Sharma',
          rating: 5,
          comment: `Absolutely loved visiting ${resolved.name}! The atmosphere, culture, and views were breathtaking. Highly recommended for any traveler.`,
          date: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
        {
          id: '2',
          author: 'Arun Patel',
          rating: 4,
          comment: `Wonderful experience. Make sure to visit early in the morning for the best lighting and fewer crowds. The local cuisine is outstanding.`,
          date: new Date(Date.now() - 86400000 * 12).toISOString(),
        }
      ]);
    }
  }, [placeName, statePlace, decodedName]);

  const userName = user?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveller';
  
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : place.rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);

    const newReview: VisitorReview = {
      id: `rev-${Date.now()}`,
      author: userName,
      rating,
      comment: comment.trim(),
      date: new Date().toISOString(),
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem(`tripsync_reviews_${place.id}`, JSON.stringify(updated));

    setComment('');
    setRating(5);
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    localStorage.setItem(`tripsync_reviews_${place.id}`, JSON.stringify(updated));
  };

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const otherPlaces = PLACES.filter((p) => p.id !== place.id).slice(0, 4);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user ? '/dashboard' : '/');
    }
  };

  return (
    <div className="pd-shell">
      <SeoHead
        title={`${place.name} Travel Guide — Places to Visit & Trip Planning | TripSync`}
        description={`Plan your trip to ${place.name}, ${place.state}. Discover attractions, ideal duration (${place.idealDuration}), best time to visit (${place.bestTime}), budget in ₹ (${place.avgBudget}), and travel highlights.`}
        canonicalPath={`/destination/${place.slug || place.id || encodeURIComponent(place.name.toLowerCase())}`}
        image={place.heroImage}
        type="article"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            "name": place.name,
            "description": place.description,
            "image": [place.heroImage, ...(place.gallery || [])],
            "touristType": place.category,
            "containedInPlace": {
              "@type": "AdministrativeArea",
              "name": place.state,
              "addressCountry": "IN"
            },
            ...(reviews.length > 0
              ? {
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": avgRating,
                    "reviewCount": reviews.length,
                    "bestRating": "5",
                    "worstRating": "1"
                  }
                }
              : {})
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Destinations",
                "item": "/#destinations"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": place.name,
                "item": `/destination/${place.slug || place.id || encodeURIComponent(place.name.toLowerCase())}`
              }
            ]
          }
        ]}
      />

      {/* Top bar */}
      <header className="pd-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button className="pd-back" onClick={handleBack} type="button">
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
          </button>
          <div className="pd-brand" onClick={() => navigate(user ? '/dashboard' : '/')} style={{ cursor: 'pointer' }} title="TripSync">
            <span className="brand-mark"><Compass size={18} strokeWidth={2.4} /></span>
            <span className="hidden md:inline">tripsync</span>
          </div>
        </div>

        {/* Prominent Global Place Search Bar */}
        <div style={{ flex: 1, maxWidth: '560px', margin: '0 12px', minWidth: '160px' }}>
          <PlaceSearchBar
            compact
            placeholder="Search another destination or place in India..."
            onCreateTripForPlace={(dest) => navigate('/dashboard', { state: { prefillDestination: dest } })}
          />
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard', { state: { prefillDestination: place.name } })}
          type="button"
          style={{ flexShrink: 0 }}
        >
          <Plus size={16} /> <span className="hidden sm:inline">Plan a trip</span>
        </button>
      </header>

      {/* Hero gallery */}
      <section className="pd-hero">
        <div className="pd-hero-main">
          <img
            src={place.gallery[activeImage] || place.heroImage}
            alt={`${place.name}, ${place.state} - Scenic View & Travel Destination`}
            loading="eager"
          />
          <div className="pd-hero-overlay">
            <span className="pd-category">{place.category}</span>
            <h1>{place.name}</h1>
            <div className="pd-hero-loc">
              <MapPin size={15} /> {place.location}, {place.state}
            </div>
            <div className="pd-hero-rating">
              <Star size={18} fill="currentColor" /> <strong>{avgRating}</strong>
              <span>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          </div>
        </div>
        <div className="pd-gallery-thumbs">
          {place.gallery.map((img, i) => (
            <button
              key={i}
              type="button"
              className={`pd-thumb ${activeImage === i ? 'active' : ''}`}
              onClick={() => setActiveImage(i)}
              aria-label={`View photo ${i + 1}`}
            >
              <img src={img} alt={`${place.name}, ${place.state} - Photo ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      </section>

      {/* Content body */}
      <div className="pd-body">
        {/* Quick info cards */}
        <div className="pd-info-grid">
          <div className="pd-info-card">
            <div className="pd-info-icon"><Calendar size={16} /></div>
            <div>
              <small>Best time to visit</small>
              <strong>{place.bestTime}</strong>
            </div>
          </div>
          <div className="pd-info-card">
            <div className="pd-info-icon"><Clock size={16} /></div>
            <div>
              <small>Ideal duration</small>
              <strong>{place.idealDuration}</strong>
            </div>
          </div>
          <div className="pd-info-card">
            <div className="pd-info-icon"><IndianRupee size={16} /></div>
            <div>
              <small>Avg. budget / person</small>
              <strong>{place.avgBudget}</strong>
            </div>
          </div>
          <div className="pd-info-card">
            <div className="pd-info-icon"><Thermometer size={16} /></div>
            <div>
              <small>Temperature / Climate</small>
              <strong>{place.temperature}</strong>
            </div>
          </div>
        </div>

        <div className="pd-layout">
          {/* Left column: description + highlights */}
          <div className="pd-main-col">
            <section className="pd-section">
              <h2>About {place.name}</h2>
              <p className="pd-description">{place.description}</p>
              <div className="pd-tags">
                {place.tags.map((tag) => (
                  <span key={tag} className="pd-tag">{tag}</span>
                ))}
              </div>
            </section>

            <section className="pd-section">
              <h2>Key Highlights & Sights</h2>
              <div className="pd-highlights">
                {place.highlights.map((h, i) => (
                  <div className="pd-highlight" key={i}>
                    <span className="pd-highlight-dot" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews section */}
            <section className="pd-section">
              <h2>Visitor reviews & ratings</h2>

              {/* Rating summary */}
              <div className="pd-review-summary">
                <div className="pd-rating-big">
                  <strong>{avgRating}</strong>
                  <div className="pd-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} fill={s <= Math.round(Number(avgRating)) ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <small>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</small>
                </div>
                <div className="pd-rating-breakdown">
                  {ratingBreakdown.map((rb) => (
                    <div className="pd-bar-row" key={rb.star}>
                      <span>{rb.star}<Star size={10} fill="currentColor" /></span>
                      <div className="pd-bar-track">
                        <div className="pd-bar-fill" style={{ width: `${rb.pct}%` }} />
                      </div>
                      <small>{rb.count}</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Write a review */}
              <form className="pd-review-form" onSubmit={handleSubmit}>
                <h3>Share your experience of {place.name}</h3>
                <div className="pd-star-input">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        size={22}
                        fill={s <= (hoverRating || rating) ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  <span className="pd-star-label">{rating} / 5 stars</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={`What did you love about ${place.name}? Tips for fellow explorers...`}
                  rows={3}
                  required
                />
                {success && (
                  <div className="pd-form-success">
                    <CheckCircle2 size={16} /> Review posted successfully!
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={submitting || !comment.trim()}>
                  {submitting ? <Loader2 size={16} className="spin" /> : <Send size={15} />}
                  {submitting ? 'Posting...' : 'Post review'}
                </button>
              </form>

              {/* Review list */}
              {reviews.length === 0 ? (
                <div className="pd-no-reviews">
                  <Star size={28} />
                  <h3>No reviews yet</h3>
                  <p>Be the first to share your experience of {place.name}.</p>
                </div>
              ) : (
                <div className="pd-review-list">
                  {reviews.map((review) => (
                    <article className="pd-review-card" key={review.id}>
                      <div className="pd-review-head">
                        <div className="pd-review-avatar">
                          {review.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="pd-review-meta">
                          <strong>{review.author}</strong>
                          <small>{formatDate(review.date)}</small>
                        </div>
                        <div className="pd-review-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={13} fill={s <= review.rating ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                        {review.author === userName && (
                          <button
                            type="button"
                            className="pd-review-delete"
                            onClick={() => handleDelete(review.id)}
                            title="Delete review"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="pd-review-text">{review.comment}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column: sidebar */}
          <aside className="pd-sidebar-col">
            <div className="pd-cta-card">
              <div className="pd-cta-icon"><Compass size={22} /></div>
              <h3>Plan your trip to {place.name}</h3>
              <p>Create an AI-powered itinerary, track your budget in INR, and organize packing lists.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/dashboard', { state: { prefillDestination: place.name } })}
              >
                <Sparkles size={15} /> Plan this trip
              </button>
            </div>

            <div className="pd-facts-card">
              <h3>Quick facts</h3>
              <div className="pd-fact-row"><Users size={15} /><span>Best for</span><strong>{place.category}</strong></div>
              <div className="pd-fact-row"><MapPin size={15} /><span>State</span><strong>{place.state}</strong></div>
              <div className="pd-fact-row"><Calendar size={15} /><span>Best season</span><strong>{place.bestTime}</strong></div>
              <div className="pd-fact-row"><Clock size={15} /><span>Stay duration</span><strong>{place.idealDuration}</strong></div>
              <div className="pd-fact-row"><IndianRupee size={15} /><span>Est. Budget</span><strong>{place.avgBudget}</strong></div>
              <div className="pd-fact-row"><Thermometer size={15} /><span>Climate</span><strong>{place.temperature}</strong></div>
            </div>
          </aside>
        </div>
      </div>

      {/* Popular places to visit */}
      <section className="pd-nearby">
        <div className="pd-nearby-head">
          <div>
            <p className="eyebrow">Keep exploring</p>
            <h2>More popular places to visit</h2>
          </div>
          <button className="pd-nearby-all" onClick={() => navigate('/dashboard')} type="button">
            View all destinations <ArrowRight size={14} />
          </button>
        </div>
        <div className="pd-nearby-grid">
          {otherPlaces.map((p) => (
            <Link
              to={`/destination/${p.slug || p.id || encodeURIComponent(p.name)}`}
              className="pd-nearby-card"
              key={p.id}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="pd-nearby-img">
                <img
                  src={p.thumbnailImage || p.heroImage}
                  alt={`${p.name}, ${p.state} - Popular travel destination in India`}
                  loading="lazy"
                />
                <span className="pd-nearby-rating"><Star size={11} fill="currentColor" /> {p.rating}</span>
              </div>
              <div className="pd-nearby-body">
                <h3>{p.name}</h3>
                <p><MapPin size={12} /> {p.location}, {p.state}</p>
                <span className="pd-nearby-cat">{p.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DestinationDetailPage;
