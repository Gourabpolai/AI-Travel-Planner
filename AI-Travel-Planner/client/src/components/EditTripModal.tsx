import { useState, useEffect, useRef } from 'react';
import { X, Check, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateTrip } from '@/api/tripApi';
import { searchPlaces } from '@/api/placeApi';
import type { Trip, TripStatus } from '@/lib/types';
import { randomCoverImage } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface EditTripModalProps {
  trip: Trip;
  onClose: () => void;
  onSaved: () => void;
}

export function EditTripModal({ trip, onClose, onSaved }: EditTripModalProps) {
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.end_date);
  const [budget, setBudget] = useState(String(trip.budget));
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const [coverImage, setCoverImage] = useState(trip.cover_image ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [destOptions, setDestOptions] = useState<any[]>([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const destRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = destination.trim();
    if (!trimmed || trimmed.length < 2 || trimmed === trip.destination) {
      setDestOptions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(trimmed, controller.signal);
        if (results !== null) {
          setDestOptions(Array.isArray(results) ? results : []);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && err?.name !== 'CanceledError') {
          console.error('Error fetching places:', err);
        }
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, trip.destination]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date.');
      return;
    }
    setLoading(true);
    try {
      await updateTrip(trip.id, {
        title,
        destination,
        start_date: startDate,
        end_date: endDate,
        budget: budget ? parseFloat(budget) : 0,
        status,
        cover_image: coverImage || null,
      });
      toast.success("Trip updated successfully!");
      setLoading(false);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update trip.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/80">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">Edit Trip</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Trip title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field" />
          </div>
          <div ref={destRef} className="relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Destination</label>
            <input 
              type="text" 
              value={destination} 
              onChange={(e) => {
                setDestination(e.target.value);
                setShowDestDropdown(true);
              }}
              onFocus={() => {
                if (destination.trim()) setShowDestDropdown(true);
              }}
              required 
              className="input-field" 
              autoComplete="off"
            />
            
            <AnimatePresence>
              {showDestDropdown && destOptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-auto"
                >
                  {destOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                      onClick={() => {
                        setDestination(opt.name || opt.formattedAddress);
                        setShowDestDropdown(false);
                      }}
                    >
                      <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{opt.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{opt.formattedAddress}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Budget (₹)</label>
              <input type="number" min="0" step="500" value={budget} onChange={(e) => setBudget(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as TripStatus)} className="input-field">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cover image URL</label>
            <div className="flex gap-2">
              <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." className="input-field" />
              <button type="button" onClick={() => setCoverImage(randomCoverImage())} className="btn-secondary text-sm whitespace-nowrap cursor-pointer">Random</button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 cursor-pointer">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
