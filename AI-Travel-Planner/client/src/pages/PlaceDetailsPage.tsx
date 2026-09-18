import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Clock, Globe, Phone, ExternalLink,
  Plus, Check, Sparkles, Compass, Calendar, AlertCircle, Loader2,
  Share2, Navigation, CheckCircle2, ChevronRight, X, Send, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPlaceDetails } from '@/api/placeApi';
import { getAllTrips } from '@/api/tripApi';
import { addItineraryItem } from '@/api/itineraryApi';
import { useAuth } from '@/context/AuthContext';
import { PlaceSearchBar } from '@/components/PlaceSearchBar';
import {
  getPlaceReviews,
  createPlaceReview,
  deletePlaceReview,
  type PlaceReviewItem,
  type PlaceReviewSummary
} from '@/api/reviewApi';
import type { PlaceDetails, PlacePhoto, Trip } from '@/lib/types';

export function PlaceDetailsPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Route state prefill (for instant render while authoritative details load)
  const statePlace = location.state?.place;

  const [place, setPlace] = useState<PlaceDetails | null>(() => {
    if (statePlace?.name && (statePlace?.placeId || statePlace?.id)) {
      return {
        id: statePlace.placeId || statePlace.id,
        placeId: statePlace.placeId || statePlace.id,
        name: statePlace.name,
        formattedAddress: statePlace.formattedAddress || '',
        shortAddress: statePlace.formattedAddress || '',
        rating: statePlace.rating || null,
        userRatingCount: statePlace.userRatingCount || null,
        types: statePlace.types || ['point_of_interest'],
        photos: statePlace.photos || [],
        imageUrl: statePlace.imageUrl || null,
      };
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!statePlace?.name);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Add to Trip Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [addingToTrip, setAddingToTrip] = useState<boolean>(false);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Persistent Community Reviews State (MongoDB-backed)
  const [reviews, setReviews] = useState<PlaceReviewItem[]>([]);
  const [reviewSummary, setReviewSummary] = useState<PlaceReviewSummary>({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Review Form State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  // Fetch authoritative place details on mount or placeId change
  useEffect(() => {
    if (!placeId) {
      setError("No place identifier provided.");
      setLoading(false);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    const controller = new AbortController();

    // If navigation provided prefilled place state, set it immediately for instant responsiveness
    const currentPrefill = location.state?.place;
    if (currentPrefill?.name && (currentPrefill?.placeId === placeId || currentPrefill?.id === placeId || !currentPrefill?.placeId)) {
      setPlace({
        id: currentPrefill.placeId || currentPrefill.id || placeId,
        placeId: currentPrefill.placeId || currentPrefill.id || placeId,
        name: currentPrefill.name,
        formattedAddress: currentPrefill.formattedAddress || currentPrefill.country || '',
        shortAddress: currentPrefill.formattedAddress || currentPrefill.country || '',
        rating: currentPrefill.rating || null,
        userRatingCount: currentPrefill.userRatingCount || null,
        types: currentPrefill.types || (currentPrefill.tag ? [currentPrefill.tag] : ['point_of_interest']),
        photos: currentPrefill.photos || (currentPrefill.image ? [{ photoReference: currentPrefill.image, authorAttributions: [] }] : []),
        imageUrl: currentPrefill.imageUrl || currentPrefill.image || null,
      });
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function fetchAuthoritativeDetails() {
      try {
        setError(null);
        const data = await getPlaceDetails(placeId, controller.signal);
        if (data) {
          setPlace(data);
          setActivePhotoIndex(0);
        } else if (!currentPrefill?.name) {
          setError("Unable to load details for this place.");
        }
      } catch (err: any) {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
          console.error("Failed to load place details:", err);
          if (!currentPrefill?.name) {
            setError(err?.response?.data?.message || err?.message || "Failed to load place details.");
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAuthoritativeDetails();

    return () => {
      controller.abort();
    };
  }, [placeId, location.state]);

  // Load user trips when Add Modal opens
  useEffect(() => {
    if (showAddModal && user) {
      getAllTrips()
        .then((trips) => {
          const list = Array.isArray(trips) ? trips : [];
          setUserTrips(list);
          if (list.length > 0 && !selectedTripId) {
            setSelectedTripId(list[0].id || (list[0] as any)._id);
          }
        })
        .catch((err) => console.error("Could not fetch user trips:", err));
    }
  }, [showAddModal, user]);

  // Calculate authoritative review summary from a list of reviews
  const calculateSummaryFromReviews = (reviewList: PlaceReviewItem[]): PlaceReviewSummary => {
    const total = reviewList.length;
    if (total === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }
    const sum = reviewList.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = Number((sum / total).toFixed(1));
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewList.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 0))) as 1 | 2 | 3 | 4 | 5;
      dist[star] = (dist[star] || 0) + 1;
    });
    return {
      totalReviews: total,
      averageRating: avg,
      distribution: dist,
    };
  };

  // Load MongoDB-backed community reviews for this Google Place ID
  const loadReviews = async (pid: string) => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const data = await getPlaceReviews(pid);
      setReviews(data.reviews || []);
      setReviewSummary(data.summary || calculateSummaryFromReviews(data.reviews || []));
    } catch (err: any) {
      console.error("Failed to load place reviews:", err);
      setReviewsError(err?.message || "We couldn't load reviews right now.");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!placeId) return;
    loadReviews(placeId);
  }, [placeId]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeId) return;

    // Clear previous errors before submission
    setReviewError(null);
    setIsSessionExpired(false);

    if (!user) {
      setReviewError("Please sign in to write a review.");
      navigate('/signin', { state: { from: location.pathname } });
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("Rating must be between 1 and 5 stars.");
      toast.error("Rating must be between 1 and 5 stars.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please enter a review comment.");
      toast.error("Please enter a review comment.");
      return;
    }

    setSubmittingReview(true);
    try {
      const createdReview = await createPlaceReview(
        placeId,
        reviewRating,
        reviewComment.trim(),
        place?.shortAddress || place?.name
      );

      // Authoritative immediate update: insert created review returned by backend
      setReviews((prev) => {
        const existingIdx = prev.findIndex(
          (r) => r._id === createdReview._id || (createdReview.userId && String(r.userId) === String(createdReview.userId))
        );
        let updatedList: PlaceReviewItem[];
        if (existingIdx >= 0) {
          updatedList = [...prev];
          updatedList[existingIdx] = createdReview;
        } else {
          updatedList = [createdReview, ...prev];
        }
        setReviewSummary(calculateSummaryFromReviews(updatedList));
        return updatedList;
      });

      // Reset form fields and clear errors
      setReviewComment('');
      setReviewRating(5);
      setReviewError(null);
      setIsSessionExpired(false);
      setSubmitSuccess(true);
      toast.success("Review posted successfully!");

      // Refresh from backend to ensure full DB sync
      await loadReviews(placeId);
      setTimeout(() => setSubmitSuccess(false), 3500);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.message;

      if (status === 401 || serverMsg?.toLowerCase().includes("not authorized") || serverMsg?.toLowerCase().includes("token")) {
        setIsSessionExpired(true);
        setReviewError("Your session has expired. Please sign in again.");
        toast.error("Your session has expired. Please sign in again.");
      } else {
        setReviewError(serverMsg || "Unable to post your review. Please try again.");
        toast.error(serverMsg || "Unable to post your review. Please try again.");
      }
      // Note: do not erase reviewComment so user's typed input is preserved!
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!placeId) return;
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    setDeletingReviewId(reviewId);
    try {
      await deletePlaceReview(placeId, reviewId);
      // Immediately remove deleted review from frontend state and update summary
      setReviews((prev) => {
        const filtered = prev.filter((r) => r._id !== reviewId);
        setReviewSummary(calculateSummaryFromReviews(filtered));
        return filtered;
      });
      toast.success("Review deleted");
      await loadReviews(placeId);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "We couldn't delete your review.";
      toast.error(msg);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const ratingBreakdown = useMemo(() => {
    const dist = reviewSummary.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const total = reviewSummary.totalReviews || 1;
    return [5, 4, 3, 2, 1].map((star) => {
      const count = (dist as any)[star] || 0;
      const pct = reviewSummary.totalReviews > 0 ? (count / total) * 100 : 0;
      return { star, count, pct };
    });
  }, [reviewSummary]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: place?.name || 'TripSync Place',
          text: `Check out ${place?.name} on TripSync!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }
    } catch {
      // User cancelled share
    }
  };

  const handleOpenAddModal = () => {
    if (!user) {
      navigate('/signin', { state: { from: location.pathname } });
      return;
    }
    setAddedSuccess(false);
    setShowAddModal(true);
  };

  const handleConfirmAddToTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId || !place) return;

    setAddingToTrip(true);
    try {
      await addItineraryItem(selectedTripId, {
        day: selectedDay,
        title: place.name,
        description: place.formattedAddress || place.shortAddress || 'Visited attraction',
        type: 'activity',
        time: '10:00 AM',
      });
      setAddedSuccess(true);
      setTimeout(() => {
        setShowAddModal(false);
        setAddedSuccess(false);
      }, 1600);
    } catch (err) {
      console.error("Failed to add place to trip itinerary:", err);
      alert("Failed to add this place to your trip. Please try again.");
    } finally {
      setAddingToTrip(false);
    }
  };

  // Safe photos array
  const photos = useMemo(() => {
    if (!place?.photos || !Array.isArray(place.photos)) return [];
    return place.photos;
  }, [place?.photos]);

  const currentPhotoUrl = useMemo(() => {
    if (photos.length > 0 && photos[activePhotoIndex]?.url) {
      return photos[activePhotoIndex].url;
    }
    return place?.imageUrl || null;
  }, [photos, activePhotoIndex, place?.imageUrl]);

  // Format type name for header badge
  const categoryBadge = useMemo(() => {
    if (place?.primaryTypeDisplayName) return place.primaryTypeDisplayName.toUpperCase();
    if (place?.primaryType) return place.primaryType.replace(/_/g, ' ').toUpperCase();
    if (place?.types && place.types.length > 0) return place.types[0].replace(/_/g, ' ').toUpperCase();
    return 'ATTRACTION';
  }, [place?.primaryTypeDisplayName, place?.primaryType, place?.types]);

  // Loading Skeleton State
  if (loading && !place) {
    return (
      <div className="pd-shell animate-fade-in">
        <header className="pd-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button className="pd-back" onClick={handleBack} type="button">
              <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
            </button>
            <div className="pd-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              <span className="brand-mark"><Compass size={18} strokeWidth={2.4} /></span>
              <span className="hidden md:inline">tripsync</span>
            </div>
          </div>

          <div style={{ flex: 1, maxWidth: '560px', margin: '0 12px', minWidth: '160px' }}>
            <PlaceSearchBar
              compact
              placeholder="Search any destination or place (e.g. Manali, Goa)..."
              onCreateTripForPlace={(placeName) => navigate('/dashboard', { state: { prefillDestination: placeName } })}
            />
          </div>

          <div style={{ width: 80, flexShrink: 0 }} />
        </header>

        <section className="pd-hero" style={{ background: '#202618', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#c2d64d' }}>
            <Loader2 size={36} className="spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '15px', color: '#eef1da' }}>Loading place details...</p>
          </div>
        </section>

        <div className="pd-body">
          <div className="pd-info-grid">
            {[1, 2, 3, 4].map((i) => (
              <div className="pd-info-card" key={i} style={{ opacity: 0.6 }}>
                <div className="pd-info-icon"><Compass size={16} /></div>
                <div><small>Loading...</small><strong>···</strong></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !place) {
    return (
      <div className="pd-shell animate-fade-in">
        <header className="pd-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button className="pd-back" onClick={handleBack} type="button">
              <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
            </button>
            <div className="pd-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              <span className="brand-mark"><Compass size={18} strokeWidth={2.4} /></span>
              <span className="hidden md:inline">tripsync</span>
            </div>
          </div>

          <div style={{ flex: 1, maxWidth: '560px', margin: '0 12px', minWidth: '160px' }}>
            <PlaceSearchBar
              compact
              placeholder="Search any destination or place (e.g. Manali, Goa)..."
              onCreateTripForPlace={(placeName) => navigate('/dashboard', { state: { prefillDestination: placeName } })}
            />
          </div>

          <div style={{ width: 80, flexShrink: 0 }} />
        </header>

        <div style={{ maxWidth: '640px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '48px 32px',
            border: '1px solid #e3e5d7',
            boxShadow: '0 12px 36px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fdf2f2',
              color: '#dc2626',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px'
            }}>
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#1a2412', marginBottom: '10px' }}>
              We couldn't load this place
            </h2>
            <p style={{ color: '#7d826a', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
              <button
                type="button"
                className="pd-back"
                style={{ background: '#f7f7f1', border: '1px solid #e3e5d7' }}
                onClick={() => navigate('/dashboard')}
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!place) return null;

  return (
    <div className="pd-shell animate-fade-in">
      {/* Top bar */}
      <header className="pd-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button className="pd-back" onClick={handleBack} type="button">
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
          </button>
          <div className="pd-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }} title="TripSync Dashboard">
            <span className="brand-mark"><Compass size={18} strokeWidth={2.4} /></span>
            <span className="hidden md:inline">tripsync</span>
          </div>
        </div>

        {/* Global Place Search Bar */}
        <div style={{ flex: 1, maxWidth: '560px', margin: '0 12px', minWidth: '160px' }}>
          <PlaceSearchBar
            compact
            placeholder="Search another destination or place in India..."
            onCreateTripForPlace={(placeName) => navigate('/dashboard', { state: { prefillDestination: placeName } })}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            className="pd-back"
            onClick={handleShare}
            title="Share place"
            style={{ padding: '8px 12px' }}
          >
            {copySuccess ? <Check size={16} color="#4ade80" /> : <Share2 size={16} />}
            <span className="hidden sm:inline" style={{ marginLeft: '4px' }}>{copySuccess ? 'Copied!' : 'Share'}</span>
          </button>
          <button
            className="btn-primary"
            onClick={handleOpenAddModal}
            type="button"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add to trip</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pd-hero">
        <div className="pd-hero-main">
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt={place.name}
              onError={(e) => {
                // Graceful fallback to SVG placeholder on load failure
                (e.target as HTMLImageElement).src = '/placeholder-travel.svg';
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #2b3319 0%, #171d0e 100%)',
              display: 'grid',
              placeItems: 'center',
              color: '#d4de95'
            }}>
              <Compass size={64} opacity={0.3} />
            </div>
          )}
          <div className="pd-hero-overlay">
            <span className="pd-category">{categoryBadge}</span>
            <h1>{place.name}</h1>
            <div className="pd-hero-loc">
              <MapPin size={16} /> {place.shortAddress || place.formattedAddress}
            </div>
            {place.rating !== null && place.rating !== undefined && (
              <div className="pd-hero-rating">
                <Star size={18} fill="currentColor" /> <strong>{place.rating.toFixed(1)}</strong>
                {place.userRatingCount ? (
                  <span>({place.userRatingCount.toLocaleString('en-IN')} Google reviews)</span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Gallery Thumbnails */}
        {photos.length > 1 && (
          <div className="pd-gallery-thumbs">
            {photos.slice(0, 6).map((p, i) => (
              <button
                key={p.name || i}
                type="button"
                className={`pd-thumb ${activePhotoIndex === i ? 'active' : ''}`}
                onClick={() => setActivePhotoIndex(i)}
                aria-label={`View photo ${i + 1}`}
              >
                <img src={p.thumbnailUrl || p.url} alt={`${place.name} photo ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Content Body */}
      <div className="pd-body">
        {/* Quick Facts Grid */}
        <div className="pd-info-grid">
          {/* Rating */}
          <div className="pd-info-card">
            <div className="pd-info-icon"><Star size={16} /></div>
            <div>
              <small>Google Rating</small>
              <strong>{place.rating ? `${place.rating.toFixed(1)} ★` : 'Not rated yet'}</strong>
            </div>
          </div>

          {/* Category */}
          <div className="pd-info-card">
            <div className="pd-info-icon"><Compass size={16} /></div>
            <div>
              <small>Category</small>
              <strong style={{ textTransform: 'capitalize' }}>
                {place.primaryTypeDisplayName || place.primaryType?.replace(/_/g, ' ') || 'Attraction'}
              </strong>
            </div>
          </div>

          {/* Business Status */}
          <div className="pd-info-card">
            <div className="pd-info-icon"><Clock size={16} /></div>
            <div>
              <small>Status</small>
              <strong>
                {place.currentOpeningHours?.openNow !== undefined
                  ? (place.currentOpeningHours.openNow ? 'Open Now' : 'Closed Now')
                  : (place.businessStatus === 'OPERATIONAL' ? 'Operational' : (place.businessStatus || 'Open'))}
              </strong>
            </div>
          </div>

          {/* Location / Destination */}
          <div className="pd-info-card">
            <div className="pd-info-icon"><MapPin size={16} /></div>
            <div>
              <small>Location</small>
              <strong className="truncate" style={{ maxWidth: '180px', display: 'inline-block' }}>
                {place.shortAddress || 'India'}
              </strong>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="pd-layout">
          {/* Main Left Column */}
          <div className="pd-main-col">
            {/* About / Editorial Summary */}
            <section className="pd-section">
              <h2>About {place.name}</h2>
              {place.editorialSummary ? (
                <p className="pd-description" style={{ fontSize: '16px', lineHeight: '1.7', color: '#3d4127' }}>
                  {place.editorialSummary}
                </p>
              ) : (
                <p className="pd-description" style={{ fontSize: '15px', color: '#7d826a', fontStyle: 'italic' }}>
                  Detailed visitor recommendations and official descriptions for this landmark are available via Google Maps.
                </p>
              )}

              {/* Types / Badges */}
              {place.types && place.types.length > 0 && (
                <div className="pd-tags" style={{ marginTop: '16px' }}>
                  {place.types.slice(0, 6).map((type) => (
                    <span key={type} className="pd-tag" style={{ textTransform: 'capitalize' }}>
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Opening Hours Schedule */}
            {place.weekdayDescriptions && place.weekdayDescriptions.length > 0 && (
              <section className="pd-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h2 style={{ margin: 0 }}>Opening hours</h2>
                  {place.currentOpeningHours?.openNow !== undefined && (
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: place.currentOpeningHours.openNow ? '#eef7e8' : '#fdf2f2',
                      color: place.currentOpeningHours.openNow ? '#2b7a1e' : '#b91c1c',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                      {place.currentOpeningHours.openNow ? 'Open Now' : 'Closed Now'}
                    </span>
                  )}
                </div>

                <div style={{
                  background: '#fcfcf8',
                  border: '1px solid #e3e5d7',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'grid',
                  gap: '10px'
                }}>
                  {place.weekdayDescriptions.map((desc, idx) => {
                    const [day, ...timeParts] = desc.split(': ');
                    const timeStr = timeParts.join(': ');
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: idx !== place.weekdayDescriptions!.length - 1 ? '1px solid #f0f1e8' : 'none',
                          fontSize: '14px',
                        }}
                      >
                        <strong style={{ color: '#3d4127' }}>{day}</strong>
                        <span style={{ color: '#636b2f' }}>{timeStr || 'Closed'}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Location & Maps Section */}
            <section className="pd-section">
              <h2>Location & Directions</h2>
              <div style={{
                background: '#fff',
                border: '1px solid #e3e5d7',
                borderRadius: '18px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#eef1da',
                    color: '#636b2f',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#1a2412' }}>Full Address</h3>
                    <p style={{ margin: 0, color: '#636b2f', fontSize: '14.5px', lineHeight: 1.5 }}>
                      {place.formattedAddress || 'Address details in Google Maps.'}
                    </p>
                    {place.latitude && place.longitude && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#7d826a' }}>
                        Coordinates: {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
                      </div>
                    )}
                  </div>
                </div>

                {place.googleMapsUri && (
                  <div style={{ borderTop: '1px solid #eef0e3', paddingTop: '16px' }}>
                    <a
                      href={place.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Navigation size={16} /> Open in Google Maps <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Contact Information (if available) */}
            {(place.nationalPhoneNumber || place.internationalPhoneNumber || place.websiteUri) && (
              <section className="pd-section">
                <h2>Contact & Official Channels</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {(place.nationalPhoneNumber || place.internationalPhoneNumber) && (
                    <a
                      href={`tel:${place.internationalPhoneNumber || place.nationalPhoneNumber}`}
                      className="pd-back"
                      style={{
                        background: '#fff',
                        border: '1px solid #e3e5d7',
                        padding: '10px 18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: '#3d4127',
                        fontWeight: 600
                      }}
                    >
                      <Phone size={15} color="#636b2f" />
                      <span>{place.nationalPhoneNumber || place.internationalPhoneNumber}</span>
                    </a>
                  )}

                  {place.websiteUri && (
                    <a
                      href={place.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pd-back"
                      style={{
                        background: '#fff',
                        border: '1px solid #e3e5d7',
                        padding: '10px 18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: '#3d4127',
                        fontWeight: 600
                      }}
                    >
                      <Globe size={15} color="#636b2f" />
                      <span>Visit Official Website</span>
                      <ExternalLink size={13} color="#7d826a" />
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Reviews & Ratings Section (MongoDB-backed Real Shared Reviews) */}
            <section className="pd-section" id="reviews">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ margin: 0 }}>Reviews & ratings</h2>
                {place.rating && (
                  <span style={{ fontSize: '13px', color: '#7d826a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Google rating:</span>
                    <Star size={13} fill="#d19a28" color="#d19a28" />
                    <strong style={{ color: '#3d4127' }}>{place.rating}</strong>
                    {place.userRatingCount && <span>({place.userRatingCount.toLocaleString()} on Google)</span>}
                  </span>
                )}
              </div>

              {/* TripSync Community Rating Summary */}
              <div className="pd-review-summary">
                <div className="pd-rating-big">
                  <strong>{reviewSummary.totalReviews > 0 ? reviewSummary.averageRating : '—'}</strong>
                  <div className="pd-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        fill={reviewSummary.totalReviews > 0 && s <= Math.round(reviewSummary.averageRating) ? '#d19a28' : 'none'}
                        color="#d19a28"
                      />
                    ))}
                  </div>
                  <small>
                    {reviewSummary.totalReviews === 0
                      ? 'No TripSync reviews yet'
                      : `${reviewSummary.totalReviews} TripSync traveler ${reviewSummary.totalReviews === 1 ? 'review' : 'reviews'}`}
                  </small>
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

              {/* Share your experience: Form (if authenticated) or Login CTA (if unauthenticated) */}
              {user ? (
                <form className="pd-review-form" onSubmit={handlePostReview}>
                  <h3>Share your experience of {place.name}</h3>
                  <div className="pd-star-input">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        title={`${s} star${s > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={24}
                          fill={s <= (hoverRating || reviewRating) ? '#d19a28' : 'none'}
                          color="#d19a28"
                        />
                      </button>
                    ))}
                    <span className="pd-star-label">{reviewRating} / 5 stars</span>
                  </div>

                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={`What did you love about ${place.name}? Tips for fellow explorers...`}
                    rows={3}
                    maxLength={1000}
                    required
                  />

                  {submitSuccess && (
                    <div className="pd-form-success">
                      <CheckCircle2 size={16} /> Review posted successfully to TripSync!
                    </div>
                  )}

                  {reviewError && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      fontSize: '14px',
                      marginTop: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} color="#dc2626" />
                        <span>{reviewError}</span>
                      </div>
                      {isSessionExpired && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ margin: 0, padding: '6px 14px', fontSize: '13px' }}
                          onClick={() => navigate('/signin', { state: { from: location.pathname } })}
                        >
                          Sign in
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                    <small style={{ color: '#7d826a' }}>{1000 - reviewComment.length} characters left</small>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingReview || !reviewComment.trim()}
                      style={{ margin: 0 }}
                    >
                      {submittingReview ? <Loader2 size={16} className="spin" /> : <Send size={15} />}
                      {submittingReview ? 'Posting...' : 'Post review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{
                  background: '#fff',
                  border: '1px solid #e3e5d7',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  marginBottom: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 2px 8px rgba(61, 65, 39, .03)'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '17px', color: '#1a2412' }}>Want to share your experience?</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#7d826a' }}>
                      Log in to TripSync to rate {place.name} and share helpful tips with fellow travelers.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => navigate('/signin', { state: { from: location.pathname } })}
                  >
                    Log in to write a review
                  </button>
                </div>
              )}

              {/* Visitor Reviews List */}
              {reviewsLoading ? (
                <div className="pd-review-list">
                  {[1, 2].map((i) => (
                    <div key={i} className="pd-review-card" style={{ opacity: 0.6 }}>
                      <div className="pd-review-head">
                        <div className="pd-review-avatar" style={{ background: '#eef0e3' }}>···</div>
                        <div className="pd-review-meta">
                          <strong style={{ background: '#eef0e3', width: '120px', height: '14px', borderRadius: '4px', display: 'block' }}>&nbsp;</strong>
                          <small style={{ background: '#f5f5f0', width: '70px', height: '10px', borderRadius: '4px', marginTop: '4px', display: 'block' }}>&nbsp;</small>
                        </div>
                      </div>
                      <p className="pd-review-text" style={{ background: '#f5f5f0', height: '24px', borderRadius: '4px' }}>&nbsp;</p>
                    </div>
                  ))}
                </div>
              ) : reviewsError ? (
                <div className="pd-no-reviews" style={{ borderStyle: 'solid', borderColor: '#fecaca', background: '#fef2f2' }}>
                  <AlertCircle size={28} color="#dc2626" />
                  <h3 style={{ color: '#991b1b' }}>We couldn't load reviews right now</h3>
                  <p style={{ color: '#b91c1c', marginBottom: '14px' }}>{reviewsError}</p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => loadReviews(placeId!)}
                  >
                    Retry
                  </button>
                </div>
              ) : reviews.length === 0 ? (
                <div className="pd-no-reviews">
                  <Star size={28} />
                  <h3>No reviews yet</h3>
                  <p>Be the first TripSync traveler to share your experience of {place.name}.</p>
                </div>
              ) : (
                <div className="pd-review-list">
                  {reviews.map((r) => {
                    const currentUserId = user?.id || (user as any)?._id;
                    const isOwner = currentUserId && r.userId && String(r.userId) === String(currentUserId);
                    const initials = (r.userName || 'T').charAt(0).toUpperCase();

                    return (
                      <article className="pd-review-card" key={r._id}>
                        <div className="pd-review-head">
                          <div className="pd-review-avatar">
                            {initials}
                          </div>
                          <div className="pd-review-meta">
                            <strong>{r.userName}</strong>
                            <small>{formatDate(r.createdAt)}</small>
                          </div>
                          <div className="pd-review-stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={13}
                                fill={s <= r.rating ? '#d19a28' : 'none'}
                                color="#d19a28"
                              />
                            ))}
                          </div>
                          {isOwner && (
                            <button
                              type="button"
                              className="pd-review-delete"
                              onClick={() => handleDeleteReview(r._id)}
                              disabled={deletingReviewId === r._id}
                              title="Delete your review"
                            >
                              {deletingReviewId === r._id ? (
                                <Loader2 size={14} className="spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="pd-review-text">{r.comment || r.content}</p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Sidebar Column */}
          <aside className="pd-sidebar-col">
            {/* Primary Action Card */}
            <div className="pd-cta-card">
              <div className="pd-cta-icon"><Sparkles size={22} /></div>
              <h3>Plan with {place.name}</h3>
              <p>Add this place to an existing itinerary, or craft a new AI travel plan around it.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleOpenAddModal}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Plus size={16} /> Add to trip
              </button>
            </div>

            {/* Quick Place Facts */}
            <div className="pd-facts-card">
              <h3>Place Information</h3>
              <div className="pd-fact-row">
                <Compass size={15} />
                <span>Primary Category</span>
                <strong style={{ textTransform: 'capitalize' }}>
                  {place.primaryTypeDisplayName || place.primaryType?.replace(/_/g, ' ') || 'Point of Interest'}
                </strong>
              </div>

              {place.rating !== null && place.rating !== undefined && (
                <div className="pd-fact-row">
                  <Star size={15} />
                  <span>Rating</span>
                  <strong>{place.rating.toFixed(1)} / 5.0</strong>
                </div>
              )}

              {place.userRatingCount ? (
                <div className="pd-fact-row">
                  <Calendar size={15} />
                  <span>Google Reviews</span>
                  <strong>{place.userRatingCount.toLocaleString('en-IN')}</strong>
                </div>
              ) : null}

              {place.businessStatus && (
                <div className="pd-fact-row">
                  <Clock size={15} />
                  <span>Status</span>
                  <strong>{place.businessStatus}</strong>
                </div>
              )}

              {place.shortAddress && (
                <div className="pd-fact-row">
                  <MapPin size={15} />
                  <span>Location</span>
                  <strong className="truncate" style={{ maxWidth: '140px' }}>{place.shortAddress}</strong>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Add to Trip Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAddModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'rgba(26,36,18,0.5)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '32px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
              border: '1px solid #e3e5d7'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef1da', color: '#636b2f', display: 'grid', placeItems: 'center' }}>
                  <Plus size={18} />
                </div>
                <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#1a2412' }}>
                  Add to your trip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7d826a' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#636b2f', marginBottom: '20px' }}>
              Add <strong>{place.name}</strong> as an activity in your trip itinerary.
            </p>

            {addedSuccess ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#2b7a1e' }}>
                <CheckCircle2 size={40} style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '18px' }}>Successfully added!</h4>
                <p style={{ fontSize: '14px', color: '#636b2f' }}>Updating itinerary...</p>
              </div>
            ) : userTrips.length > 0 ? (
              <form onSubmit={handleConfirmAddToTrip} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3d4127', marginBottom: '6px' }}>
                    Select trip:
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cfd3be',
                      fontSize: '14px',
                      background: '#fcfcf8',
                      color: '#1a2412'
                    }}
                    required
                  >
                    {userTrips.map((t) => (
                      <option key={t.id || (t as any)._id} value={t.id || (t as any)._id}>
                        {t.title} ({t.destination})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#3d4127', marginBottom: '6px' }}>
                    Itinerary Day:
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cfd3be',
                      fontSize: '14px',
                      background: '#fcfcf8',
                      color: '#1a2412'
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <option key={d} value={d}>
                        Day {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={addingToTrip}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {addingToTrip ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                    {addingToTrip ? 'Adding...' : 'Add to itinerary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      navigate('/dashboard', { state: { prefillDestination: place.shortAddress || place.name } });
                    }}
                    style={{
                      background: '#f7f7f1',
                      border: '1px solid #e3e5d7',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#505726',
                      cursor: 'pointer'
                    }}
                  >
                    New trip
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: '14px', color: '#7d826a', marginBottom: '20px' }}>
                  You don't have any active trips yet. Start planning a new trip to this destination!
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setShowAddModal(false);
                    navigate('/dashboard', { state: { prefillDestination: place.shortAddress || place.name } });
                  }}
                >
                  <Sparkles size={16} /> Create a trip with this place
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaceDetailsPage;
