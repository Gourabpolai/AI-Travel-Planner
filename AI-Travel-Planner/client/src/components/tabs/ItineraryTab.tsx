import { useState } from 'react';
import { Plus, Clock, Trash2, Utensils, Car, BedDouble, Camera, Sparkles, Loader2 } from 'lucide-react';
import { deleteItineraryItem, addItineraryItem, generateItinerary, regenerateItinerary } from '@/api/itineraryApi';
import type { ItineraryItem, ItineraryItemType, Trip } from '@/lib/types';
import { formatDate, tripDuration, cn } from '@/lib/utils';

const typeConfig: Record<ItineraryItemType, { icon: any; label: string; color: string }> = {
  activity: { icon: Camera, label: 'Activity', color: 'bg-brand-100 text-brand-700' },
  meal: { icon: Utensils, label: 'Meal', color: 'bg-sand-100 text-sand-700' },
  transport: { icon: Car, label: 'Transport', color: 'bg-blue-100 text-blue-700' },
  accommodation: { icon: BedDouble, label: 'Stay', color: 'bg-purple-100 text-purple-700' },
};

const ITEM_TYPES: ItineraryItemType[] = ['activity', 'meal', 'transport', 'accommodation'];

interface ItineraryTabProps {
  trip: Trip;
  items: ItineraryItem[];
  onChange: () => void;
}

export function ItineraryTab({ trip, items, onChange }: ItineraryTabProps) {
  const [showAdd, setShowAdd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const totalDays = tripDuration(trip.start_date, trip.end_date);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const itemsByDay = days.map(day => items.filter(i => i.day === day).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')));

  const handleDelete = async (id: string) => {
    try {
      await deleteItineraryItem(id);
      onChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (day: number, data: { title: string; time: string; type: ItineraryItemType; description: string }) => {
    setLoading(true);
    try {
      await addItineraryItem(trip.id, {
        day,
        title: data.title,
        time: data.time || null,
        type: data.type,
        description: data.description || null,
      });
      setShowAdd(null);
      onChange();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const generateAIItinerary = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      if (items && items.length > 0) {
        await regenerateItinerary(trip.id);
      } else {
        await generateItinerary(trip.id);
      }
      onChange();
    } catch (err: any) {
      setAiError(err.response?.data?.message || err.message || 'Failed to generate itinerary. You can still add activities manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const hasItems = items.length > 0;

  return (
    <div>
      {/* AI generate bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-sand-50 border border-brand-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-slate-800">AI Itinerary Generator</p>
            <p className="text-sm text-slate-500">
              {hasItems ? 'Regenerate a day-by-day plan' : `Let AI plan your ${totalDays}-day trip to ${trip.destination}`}
            </p>
          </div>
        </div>
        <button
          onClick={generateAIItinerary}
          disabled={aiLoading}
          className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
        >
          {aiLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {hasItems ? 'Regenerate' : 'Generate Plan'}</>
          )}
        </button>
      </div>

      {aiError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {aiError}
        </div>
      )}

      {/* Day-by-day timeline */}
      <div className="space-y-6">
        {days.map((day, idx) => {
          const dayDate = new Date(trip.start_date + 'T00:00:00');
          dayDate.setDate(dayDate.getDate() + day - 1);
          const dayItems = itemsByDay[idx];

          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm shadow-sm">
                    {day}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-slate-800">Day {day}</p>
                    <p className="text-xs text-slate-400">{formatDate(dayDate.toISOString().slice(0, 10), { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdd(showAdd === day ? null : day)}
                  className="btn-ghost text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="p-5">
                {showAdd === day && (
                  <AddItemForm
                    onAdd={(data) => handleAdd(day, data)}
                    onCancel={() => setShowAdd(null)}
                    loading={loading}
                  />
                )}

                {dayItems.length === 0 && showAdd !== day ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No activities yet. Add one or use the AI generator.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayItems.map(item => {
                      const config = typeConfig[item.type] ?? typeConfig.activity;
                      return (
                        <div
                          key={item.id}
                          className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors animate-fade-in"
                        >
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
                            <config.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {item.time && (
                                <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                                  <Clock className="w-3 h-3" /> {item.time}
                                </span>
                              )}
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
                                {config.label}
                              </span>
                            </div>
                            <p className="font-medium text-slate-800 mt-0.5">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddItemForm({ onAdd, onCancel, loading }: {
  onAdd: (data: { title: string; time: string; type: ItineraryItemType; description: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<ItineraryItemType>('activity');
  const [description, setDescription] = useState('');

  return (
    <div className="mb-3 p-4 rounded-xl border border-brand-200 bg-brand-50/50 animate-scale-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Activity title"
          className="input-field"
          autoFocus
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="input-field"
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {ITEM_TYPES.map(t => {
          const config = typeConfig[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5',
                type === t ? config.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white text-slate-500 hover:bg-slate-100'
              )}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          );
        })}
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="input-field mb-3 resize-none"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm py-2">Cancel</button>
        <button
          type="button"
          onClick={() => title.trim() && onAdd({ title: title.trim(), time, type, description: description.trim() })}
          disabled={loading || !title.trim()}
          className="btn-primary text-sm py-2 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Activity
        </button>
      </div>
    </div>
  );
}
