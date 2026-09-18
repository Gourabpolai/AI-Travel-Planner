import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { formatDate, initialsFromEmail } from '@/lib/utils';

export interface ReviewData {
  _id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
}

interface ReviewListProps {
  reviews: ReviewData[];
  isLoading: boolean;
  destination: string;
}

export function ReviewList({ reviews, isLoading, destination }: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex space-x-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
        <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No reviews yet</h3>
        <p className="text-slate-500 dark:text-slate-400">
          Be the first to share your experience in {destination.split(',')[0]}!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review._id} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {review.user?.profilePicture ? (
                <img 
                  src={review.user.profilePicture} 
                  alt={review.user.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-lg">
                  {initialsFromEmail(review.user?.name || review.user?.email || 'User')}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                  {review.user?.name || review.user?.email?.split('@')[0] || 'Traveler'}
                </h4>
                <span className="text-slate-500 dark:text-slate-400">·</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(review.createdAt, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="flex bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-amber-700 dark:text-amber-400">{review.rating}</span>
            </div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {review.content}
          </p>
        </div>
      ))}
    </div>
  );
}
