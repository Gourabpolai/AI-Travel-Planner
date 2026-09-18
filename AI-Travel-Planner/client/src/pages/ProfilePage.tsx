import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Calendar, Compass, Wallet, MapPin, TrendingUp, Award, Clock,
} from 'lucide-react';
import { getAllTrips } from '@/api/tripApi';
import { getExpenses } from '@/api/expenseApi';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { formatCurrency, formatDate, initialsFromEmail } from '@/lib/utils';

export function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalBudget: 0,
    totalSpent: 0,
    countries: 0,
    daysPlanned: 0,
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const trips = await getAllTrips();
      
      const allExpensesList = await Promise.all(
        trips.map((t: any) => getExpenses(t._id).catch(() => []))
      );
      const expenses = allExpensesList.flat();

      if (trips) {
        const totalBudget = trips.reduce((s: number, t: any) => s + (Number(t.budget) || 0), 0);
        const totalSpent = (expenses ?? []).reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        const destinations = new Set(trips.map((t: any) => t.destination?.split(',').pop()?.trim()));
        const daysPlanned = trips.reduce((s: number, t: any) => {
          const start = new Date(t.startDate || t.start_date);
          const end = new Date(t.endDate || t.end_date);
          return s + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }, 0);

        setStats({
          totalTrips: trips.length,
          activeTrips: trips.filter((t: any) => t.status === 'active' || !t.status).length,
          completedTrips: trips.filter((t: any) => t.status === 'completed').length,
          totalBudget,
          totalSpent,
          countries: destinations.size,
          daysPlanned,
        });
        
        // Map to expected UI format
        setRecentTrips(trips.slice(0, 4).map((t: any) => ({
          ...t,
          id: t._id,
          title: t.destination,
          start_date: t.startDate,
          end_date: t.endDate
        })));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-br from-brand-500 to-brand-800 relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </div>
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12">
              <div className="w-24 h-24 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl font-display font-bold border-4 border-white shadow-lg">
                {user ? initialsFromEmail(user.email ?? '') : '?'}
              </div>
              <div className="pb-2">
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  {user?.email?.split('@')[0] ?? 'Traveler'}
                </h1>
                <p className="text-slate-500 flex items-center gap-1.5 text-sm">
                  <Mail className="w-4 h-4" /> {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Compass} label="Total Trips" value={String(stats.totalTrips)} color="brand" />
            <StatCard icon={MapPin} label="Destinations" value={String(stats.countries)} color="sand" />
            <StatCard icon={Clock} label="Days Planned" value={String(stats.daysPlanned)} color="brand" />
            <StatCard icon={Award} label="Completed" value={String(stats.completedTrips)} color="sand" />
            <StatCard icon={Wallet} label="Total Budget" value={formatCurrency(stats.totalBudget)} color="brand" />
            <StatCard icon={TrendingUp} label="Total Spent" value={formatCurrency(stats.totalSpent)} color="sand" />
            <StatCard icon={Calendar} label="Active Now" value={String(stats.activeTrips)} color="brand" />
            <StatCard
              icon={TrendingUp}
              label="Avg / Trip"
              value={stats.totalTrips > 0 ? formatCurrency(stats.totalBudget / stats.totalTrips) : '$0'}
              color="sand"
            />
          </div>
        )}

        {/* Recent trips */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-slate-900">Recent Trips</h2>
            <Link to="/dashboard" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {recentTrips.length === 0 ? (
            <div className="text-center py-8">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No trips yet.</p>
              <Link to="/dashboard" className="btn-primary text-sm mt-4 inline-flex">Plan your first trip</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrips.map((t: any) => (
                <Link
                  key={t.id}
                  to={`/trips/${t.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">
                    {t.cover_image && <img src={t.cover_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{t.title}</p>
                    <p className="text-sm text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {t.destination} · {formatDate(t.start_date)}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    t.status === 'active' ? 'bg-brand-100 text-brand-700' :
                    t.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                    'bg-sand-100 text-sand-700'
                  }`}>
                    {t.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: 'brand' | 'sand' }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
        color === 'brand' ? 'bg-brand-100' : 'bg-sand-100'
      }`}>
        <Icon className={`w-5 h-5 ${color === 'brand' ? 'text-brand-600' : 'text-sand-600'}`} />
      </div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-display font-bold text-xl text-slate-800 truncate">{value}</p>
    </div>
  );
}
