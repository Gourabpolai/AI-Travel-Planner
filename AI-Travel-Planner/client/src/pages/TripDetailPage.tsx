import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, MapPin, Clock, Trash2, Edit3,
  CalendarDays, Wallet, Backpack, CloudSun, Map as MapIcon,
} from 'lucide-react';
import { getTripById, deleteTrip } from '@/api/tripApi';
import { getItinerary } from '@/api/itineraryApi';
import { getExpenses } from '@/api/expenseApi';
import { getPackingItems } from '@/api/packingApi';
import type { Trip, ItineraryItem, Expense, PackingItem } from '@/lib/types';
import { formatDate, tripDuration, formatCurrency, cn } from '@/lib/utils';
import { AppHeader } from '@/components/AppHeader';
import { EditTripModal } from '@/components/EditTripModal';
import { SeoHead } from '@/components/SeoHead';
import { ItineraryTab } from '@/components/tabs/ItineraryTab';
import { BudgetTab } from '@/components/tabs/BudgetTab';
import { PackingTab } from '@/components/tabs/PackingTab';
import { WeatherTab } from '@/components/tabs/WeatherTab';
import { MapTab } from '@/components/tabs/MapTab';

type TabId = 'itinerary' | 'budget' | 'packing' | 'weather' | 'map';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'packing', label: 'Packing', icon: Backpack },
  { id: 'weather', label: 'Weather', icon: CloudSun },
  { id: 'map', label: 'Map', icon: MapIcon },
];

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [packing, setPacking] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('itinerary');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (tripId) loadAll(tripId);
  }, [tripId]);

  const loadAll = async (id: string) => {
    setLoading(true);
    try {
      const [tripRes, itinRes, expRes, packRes] = await Promise.all([
        getTripById(id).catch(() => null),
        getItinerary(id).catch(() => []),
        getExpenses(id).catch(() => []),
        getPackingItems(id).catch(() => []),
      ]);
      
      if (tripRes) {
        setTrip({
          ...tripRes,
          id: tripRes._id,
          title: tripRes.destination,
          start_date: tripRes.startDate,
          end_date: tripRes.endDate,
        } as Trip);
      }
      
      if (itinRes) {
        setItinerary(itinRes.map((i: any) => ({ ...i, id: i._id })));
      }
      if (expRes) {
        setExpenses(expRes.map((e: any) => ({ ...e, id: e._id })));
      }
      if (packRes) {
        setPacking(packRes.map((p: any) => ({ ...p, id: p._id })));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!trip) return;
    try {
      await deleteTrip(trip.id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete trip:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="h-64 skeleton rounded-2xl mb-6" />
          <div className="h-12 skeleton rounded-xl mb-6" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="text-center py-20">
          <p className="text-slate-500">Trip not found.</p>
          <Link to="/dashboard" className="btn-primary mt-4 inline-flex">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const duration = tripDuration(trip.start_date, trip.end_date);

  return (
    <div className="min-h-screen bg-slate-50">
      <SeoHead
        title={`${trip.title || 'Trip Details'} | TripSync`}
        description="Trip itinerary and travel planning workspace."
        canonicalPath={`/trips/${tripId}`}
        noindex={true}
        nofollow={true}
      />
      <AppHeader />

      {/* Trip header / cover */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        {trip.cover_image ? (
          <img src={trip.cover_image} alt={trip.destination} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to trips
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">{trip.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-white/90 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {trip.destination}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {duration} {duration === 1 ? 'day' : 'days'}
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> {formatCurrency(trip.budget, trip.currency)}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/90 text-slate-700 text-sm font-medium backdrop-blur-sm hover:bg-white transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/90 text-red-600 text-sm font-medium backdrop-blur-sm hover:bg-white transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'itinerary' && (
            <ItineraryTab trip={trip} items={itinerary} onChange={() => tripId && loadAll(tripId)} />
          )}
          {activeTab === 'budget' && (
            <BudgetTab trip={trip} expenses={expenses} onChange={() => tripId && loadAll(tripId)} />
          )}
          {activeTab === 'packing' && (
            <PackingTab trip={trip} items={packing} onChange={() => tripId && loadAll(tripId)} />
          )}
          {activeTab === 'weather' && <WeatherTab trip={trip} />}
          {activeTab === 'map' && <MapTab trip={trip} />}
        </div>
      </main>

      {/* Edit modal */}
      {showEdit && trip && (
        <EditTripModal
          trip={trip}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            if (tripId) loadAll(tripId);
          }}
        />
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowDelete(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Delete this trip?</h3>
                <p className="text-sm text-slate-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              All itinerary items, expenses, and packing lists for "{trip.title}" will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white font-semibold rounded-xl px-5 py-3 transition-all hover:bg-red-700 active:scale-95 flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
