import React, { useState } from 'react';
import { Star, Send, Loader } from 'lucide-react';
import { createReview } from '@/api/reviewApi';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

interface ReviewFormProps {
  destination: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ destination, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 text-center border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Leave a Review</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">Please log in to share your experience about this destination.</p>
        <Link 
          to="/signin"
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
        >
          Log in
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      setIsSubmitting(true);
      await createReview(destination, rating, content);
      toast.success('Review submitted successfully!');
      setContent('');
      setRating(0);
      onReviewSubmitted();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
        Share Your Experience
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Your Review
          </label>
          <textarea
            id="content"
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            placeholder={`What was your experience in ${destination.split(',')[0]} like?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-brand-500/25 focus:ring-2 focus:ring-brand-500/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Review
          </button>
        </div>
      </form>
    </div>
  );
}
