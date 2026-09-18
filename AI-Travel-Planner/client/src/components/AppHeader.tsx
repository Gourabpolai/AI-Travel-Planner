import { Link } from 'react-router-dom';
import { Compass, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { initialsFromEmail } from '@/lib/utils';

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Compass className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg text-slate-800">TripSync</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
              <div className="w-7 h-7 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {user ? initialsFromEmail(user.email ?? '') : '?'}
              </div>
              <span className="text-sm font-medium text-slate-600 hidden sm:inline">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="btn-ghost flex items-center gap-2 text-sm"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
