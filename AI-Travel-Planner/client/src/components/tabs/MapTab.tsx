import { useEffect, useState } from 'react';
import { MapPin, Loader2, AlertCircle, ExternalLink, Navigation } from 'lucide-react';
import type { Trip } from '@/lib/types';

export function MapTab({ trip }: { trip: Trip }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number; name: string; country: string } | null>(null);

  useEffect(() => {
    geocode();
  }, [trip.id]);

  const geocode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trip.destination)}&count=1&language=en&format=json`
      );
      if (!res.ok) throw new Error('Failed to search location');
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        throw new Error(`Couldn't find "${trip.destination}" on the map.`);
      }
      const place = data.results[0];
      setCoords({
        lat: place.latitude,
        lon: place.longitude,
        name: place.name,
        country: place.country ?? '',
      });
    } catch (err: any) {
      setError(err.message ?? 'Failed to load map.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
        <p className="text-slate-500">Locating {trip.destination}...</p>
      </div>
    );
  }

  if (error || !coords) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">{error ?? 'Map unavailable.'}</p>
        <button onClick={geocode} className="btn-secondary text-sm mt-4">Try again</button>
      </div>
    );
  }

  const delta = 0.05;
  const bbox = `${coords.lon - delta},${coords.lat - delta},${coords.lon + delta},${coords.lat + delta}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lon}`;
  const externalUrl = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=12/${coords.lat}/${coords.lon}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`;

  return (
    <div>
      {/* Location info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">{coords.name}</h3>
              <p className="text-sm text-slate-500">
                {coords.country} · {coords.lat.toFixed(2)}°, {coords.lon.toFixed(2)}°
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center gap-1.5 py-2"
            >
              <ExternalLink className="w-4 h-4" /> Open
            </a>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm flex items-center gap-1.5 py-2"
            >
              <Navigation className="w-4 h-4" /> Directions
            </a>
          </div>
        </div>
      </div>

      {/* Map embed */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <iframe
          src={mapUrl}
          className="w-full h-[450px] border-0"
          title={`Map of ${trip.destination}`}
          loading="lazy"
        />
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">
        Map data © OpenStreetMap contributors
      </p>
    </div>
  );
}
