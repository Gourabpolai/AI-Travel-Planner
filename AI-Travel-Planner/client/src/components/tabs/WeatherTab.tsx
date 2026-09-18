import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudFog, Wind, Droplets, Thermometer, MapPin, Loader2, AlertCircle } from 'lucide-react';
import type { Trip } from '@/lib/types';
import { formatDateShort, tripDuration, cn } from '@/lib/utils';

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  code: number;
  icon: any;
  label: string;
}

const weatherCodeMap: Record<number, { icon: any; label: string }> = {
  0: { icon: Sun, label: 'Clear' },
  1: { icon: Sun, label: 'Mostly clear' },
  2: { icon: Cloud, label: 'Partly cloudy' },
  3: { icon: Cloud, label: 'Overcast' },
  45: { icon: CloudFog, label: 'Foggy' },
  48: { icon: CloudFog, label: 'Rime fog' },
  51: { icon: CloudRain, label: 'Light drizzle' },
  53: { icon: CloudRain, label: 'Drizzle' },
  55: { icon: CloudRain, label: 'Heavy drizzle' },
  61: { icon: CloudRain, label: 'Light rain' },
  63: { icon: CloudRain, label: 'Rain' },
  65: { icon: CloudRain, label: 'Heavy rain' },
  71: { icon: CloudSnow, label: 'Light snow' },
  73: { icon: CloudSnow, label: 'Snow' },
  75: { icon: CloudSnow, label: 'Heavy snow' },
  80: { icon: CloudRain, label: 'Rain showers' },
  81: { icon: CloudRain, label: 'Rain showers' },
  82: { icon: CloudRain, label: 'Violent showers' },
  95: { icon: CloudRain, label: 'Thunderstorm' },
  96: { icon: CloudRain, label: 'Thunderstorm' },
  99: { icon: CloudRain, label: 'Thunderstorm' },
};

export function WeatherTab({ trip }: { trip: Trip }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherDay[] | null>(null);
  const [location, setLocation] = useState<string>('');

  const totalDays = tripDuration(trip.start_date, trip.end_date);

  useEffect(() => {
    fetchWeather();
  }, [trip.id]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Geocode destination via Open-Meteo
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trip.destination)}&count=1&language=en&format=json`
      );
      if (!geoRes.ok) throw new Error('Failed to find destination');
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Couldn't find "${trip.destination}" on the map.`);
      }
      const place = geoData.results[0];
      setLocation(`${place.name}${place.country ? ', ' + place.country : ''}`);

      // Step 2: Fetch forecast
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`
      );
      if (!weatherRes.ok) throw new Error('Failed to fetch weather forecast');
      const weatherData = await weatherRes.json();

      const daily = weatherData.daily;
      const days: WeatherDay[] = daily.time.map((date: string, i: number) => {
        const code = daily.weathercode[i];
        const w = weatherCodeMap[code] ?? { icon: Cloud, label: 'Unknown' };
        return {
          date,
          tempMax: Math.round(daily.temperature_2m_max[i]),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          code,
          icon: w.icon,
          label: w.label,
        };
      });

      // Filter to trip date range
      const tripDays = days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date);
      setWeather(tripDays.length > 0 ? tripDays : days.slice(0, Math.min(totalDays, 7)));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load weather data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
        <p className="text-slate-500">Fetching weather for {trip.destination}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">{error}</p>
        <button onClick={fetchWeather} className="btn-secondary text-sm mt-4">Try again</button>
      </div>
    );
  }

  if (!weather || weather.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
        <p className="text-slate-500">No forecast available for your trip dates.</p>
      </div>
    );
  }

  const avgTemp = Math.round(weather.reduce((s, d) => s + (d.tempMax + d.tempMin) / 2, 0) / weather.length);

  return (
    <div>
      {/* Summary card */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 mb-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-100 text-sm">
              <MapPin className="w-4 h-4" /> {location}
            </div>
            <p className="font-display text-4xl font-bold mt-2">{avgTemp}°C</p>
            <p className="text-brand-100 text-sm mt-1">Average during your stay</p>
          </div>
          <div className="hidden sm:block">
            <Sun className="w-20 h-20 text-white/80" strokeWidth={1.2} />
          </div>
        </div>
      </div>

      {/* Daily forecast */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {weather.map((day, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center card-hover"
          >
            <p className="text-xs text-slate-400 font-medium">{formatDateShort(day.date)}</p>
            <div className="my-3 flex justify-center">
              <day.icon className={cn(
                'w-10 h-10',
                day.code === 0 ? 'text-sand-500' : day.code >= 51 ? 'text-blue-400' : 'text-slate-400'
              )} strokeWidth={1.5} />
            </div>
            <p className="text-xs text-slate-500 mb-2">{day.label}</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-display font-bold text-slate-800">{day.tempMax}°</span>
              <span className="text-sm text-slate-400">{day.tempMin}°</span>
            </div>
          </div>
        ))}
      </div>

      {/* Packing tips */}
      <div className="mt-6 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-display font-semibold text-slate-800 mb-3">Weather Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Thermometer className="w-5 h-5 text-sand-500 flex-shrink-0" />
            <p className="text-sm text-slate-600">
              {avgTemp > 25 ? 'Pack light, breathable clothing and sunscreen.' : avgTemp > 15 ? 'Layer up — temps vary through the day.' : avgTemp > 5 ? 'Bring a warm jacket for evenings.' : 'Pack warm winter clothing.'}
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Droplets className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-slate-600">
              {weather.some(d => d.code >= 51) ? 'Rain expected — pack an umbrella or rain jacket.' : 'Dry forecast — no rain gear needed.'}
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Wind className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <p className="text-sm text-slate-600">
              Check the forecast closer to your trip for wind conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
