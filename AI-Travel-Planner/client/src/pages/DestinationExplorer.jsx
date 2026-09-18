import { searchPlaces, getPopularPlaces } from "../api/placeApi";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTripById, saveSelectedPlaces } from "../api/tripApi";
import { addItineraryItem } from "../api/itineraryApi";
import { AppHeader } from "@/components/AppHeader";
import { ArrowLeft, Search, Check, Plus, MapPin, Clock, Loader2, ChevronDown, CalendarPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, tripDuration } from "@/lib/utils";

function DestinationExplorer() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [trip, setTrip] = useState(null);
  
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [addedItems, setAddedItems] = useState({});
  
  const { tripId } = useParams();
  
  const totalDays = trip ? tripDuration(trip.start_date, trip.end_date) : 0;

  const handleAddToDay = async (place, day) => {
    try {
      await addItineraryItem(tripId, {
        day,
        title: place.name,
        description: place.description,
        type: 'activity',
        time: "10:00 AM" // Default time
      });
      setAddedItems(prev => ({ ...prev, [place.id]: day }));
      setDropdownOpen(null);
      
      const exists = selectedPlaces.some((p) => p.id === place.id);
      if (!exists) setSelectedPlaces([...selectedPlaces, place]);
      
      alert(`✅ Added ${place.name} to Day ${day}!`);
    } catch (error) {
      console.error(error);
      alert("Failed to add to itinerary");
    }
  };

  const togglePlace = (place) => {
    const exists = selectedPlaces.some((p) => p.id === place.id);
    if (exists) {
      setSelectedPlaces(selectedPlaces.filter((p) => p.id !== place.id));
    } else {
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };



  useEffect(() => {
    const loadTripPlaces = async () => {
      try {
        setLoading(true);
        const tripData = await getTripById(tripId);
        setTrip(tripData);
        if (tripData.selectedPlaces) {
          setSelectedPlaces(tripData.selectedPlaces);
        }
        const placesData = await getPopularPlaces(tripData.destination);
        setPlaces(placesData || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadTripPlaces();
  }, [tripId]);

  const handleSavePlaces = async () => {
    try {
      await saveSelectedPlaces(tripId, selectedPlaces);
      alert("✅ Places saved successfully! You can now generate your AI itinerary including these places.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to save places");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
        <Link
          to={`/trips/${tripId}`}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to trip details
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900 flex items-center gap-2">
            🌍 {trip ? `Explore ${trip.destination}` : "Destination Explorer"}
          </h1>
          <p className="mt-1 text-slate-500">
            {trip
              ? `Select and save tourist spots for your trip. AI will integrate these into your itinerary.`
              : "Discover amazing spots and select them for your travel plan."}
          </p>
        </div>

        {/* Search Bar with Local Autocomplete */}
        <div className="relative mb-8 z-50">
          <div className="relative flex items-center transition-all duration-300 rounded-2xl border-2 border-slate-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/20 focus-within:shadow-md">
            <div className="pl-4 pr-2.5 text-slate-400 flex items-center pointer-events-none">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <input
              type="text"
              placeholder={`Search beaches, temples, waterfalls in ${trip?.destination || 'this destination'}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-500 font-medium focus:outline-none py-3.5 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-2 mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
          
          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {query.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Suggested Spots in {trip?.destination}
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {places.filter(p => 
                    p.name.toLowerCase().includes(query.toLowerCase()) || 
                    (p.types && p.types.some(t => t.toLowerCase().includes(query.toLowerCase()))) ||
                    (p.formattedAddress && p.formattedAddress.toLowerCase().includes(query.toLowerCase()))
                  ).map(place => (
                    <div
                      key={`suggest-${place.id}`}
                      onClick={() => {
                        setQuery(place.name);
                        // Optional: you could auto-scroll to the place here
                      }}
                      className="p-3 hover:bg-brand-50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{place.name}</p>
                        <p className="text-xs text-slate-500 truncate">{place.formattedAddress}</p>
                      </div>
                    </div>
                  ))}
                  {places.filter(p => 
                    p.name.toLowerCase().includes(query.toLowerCase()) || 
                    (p.types && p.types.some(t => t.toLowerCase().includes(query.toLowerCase()))) ||
                    (p.formattedAddress && p.formattedAddress.toLowerCase().includes(query.toLowerCase()))
                  ).length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No spots found matching "{query}" in {trip?.destination}.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
            <p className="text-slate-500">Loading amazing places...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.filter(p => 
              query.trim() === "" || 
              p.name.toLowerCase().includes(query.toLowerCase()) || 
              (p.types && p.types.some(t => t.toLowerCase().includes(query.toLowerCase()))) ||
              (p.formattedAddress && p.formattedAddress.toLowerCase().includes(query.toLowerCase()))
            ).map((place) => {
              const isSelected = selectedPlaces.some((p) => p.id === place.id);
              return (
                <div
                  key={place.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col justify-between cursor-pointer hover:-translate-y-1.5"
                >
                  {/* Top Image or Gradient Placeholder */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-brand-600 to-indigo-600 overflow-hidden">
                    {place.imageUrl ? (
                      <img 
                        src={place.imageUrl} 
                        alt={place.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                      />
                    ) : (
                       <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:scale-110 transition-transform duration-700 ease-in-out">
                          <MapPin className="w-24 h-24 text-white" />
                       </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent z-10" />
                    
                    {place.category && (
                       <div className="absolute top-4 left-4 z-20">
                         <span className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                           {place.category}
                         </span>
                       </div>
                    )}
                    
                    <h3 className="absolute bottom-4 left-4 right-4 z-20 font-display font-extrabold text-xl sm:text-2xl text-white line-clamp-2 drop-shadow-md">
                      {place.name}
                    </h3>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    {place.description ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 flex-1">
                        {place.description}
                      </p>
                    ) : (
                      <div className="flex-1" />
                    )}
                    
                    <div className="mt-auto space-y-4">
                      <div className="flex flex-col xl:flex-row gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                          </div>
                          <span className="line-clamp-1">
                            <span className="text-slate-400 font-medium">Best Time:</span> {place.bestTime || "Anytime"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="line-clamp-1">
                            <span className="text-slate-400 font-medium">Duration:</span> {place.estimatedVisitHours || 1} hrs
                          </span>
                        </div>
                      </div>

                      <div className="relative pt-1">
                        {dropdownOpen === place.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={(e) => { e.stopPropagation(); setDropdownOpen(null); }}
                            />
                            <div className="absolute bottom-full left-0 w-full mb-3 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-20">
                              <div className="max-h-56 overflow-y-auto">
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePlace(place); setDropdownOpen(null); }}
                                  className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-slate-50 text-slate-700 border-b border-slate-100 transition-colors flex items-center justify-between"
                                >
                                  {isSelected ? "Remove from Idea List" : "Save to Idea List"}
                                  {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                                </button>
                                {Array.from({ length: totalDays }).map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); handleAddToDay(place, i + 1); }}
                                    className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-brand-50 text-brand-700 transition-colors flex justify-between items-center group/btn"
                                  >
                                    Day {i + 1}
                                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center group-hover/btn:bg-brand-200 transition-colors">
                                      <Plus className="w-3 h-3 text-brand-600" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); dropdownOpen === place.id ? setDropdownOpen(null) : setDropdownOpen(place.id); }}
                          className={cn(
                            "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                            addedItems[place.id]
                              ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700"
                              : isSelected
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                          )}
                        >
                          {addedItems[place.id] ? (
                            <><Check className="w-4 h-4 stroke-[3]" /> Added to Day {addedItems[place.id]}</>
                          ) : isSelected ? (
                            <><Check className="w-4 h-4 stroke-[3]" /> Idea Saved <ChevronDown className="w-4 h-4 opacity-70" /></>
                          ) : (
                            <><CalendarPlus className="w-4 h-4 stroke-[2.5]" /> Add to Trip <ChevronDown className="w-4 h-4 opacity-70" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Float bar / Save button */}
        {selectedPlaces.length > 0 && (
          <div className="sticky bottom-6 mt-8 p-4 rounded-2xl bg-white/95 border border-slate-100 shadow-xl backdrop-blur-sm flex items-center justify-between animate-fade-in z-40">
            <div>
              <p className="font-semibold text-slate-800">
                {selectedPlaces.length} {selectedPlaces.length === 1 ? 'place' : 'places'} selected
              </p>
              <p className="text-xs text-slate-400">Save them to plan your trip.</p>
            </div>
            <button
              onClick={handleSavePlaces}
              className="bg-brand-600 text-white font-semibold rounded-xl px-5 py-3 transition-all hover:bg-brand-700 active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Places
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DestinationExplorer;