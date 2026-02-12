"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ rating, maxRating = 5, size = 'md', showNumber = false, className }) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[...Array(maxRating)].map((_, index) => {
        const isFilled = index < Math.floor(rating);
        const isHalf = index < rating && index >= Math.floor(rating);

        return (
          <Star
            key={index}
            className={cn(
              sizes[size],
              isFilled
                ? 'fill-violet-500 text-violet-500'
                : isHalf
                ? 'fill-violet-500/50 text-violet-500'
                : 'fill-gray-200 text-gray-200'
            )}
          />
        );
      })}
      {showNumber && (
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function RatingInput({ value, onChange, size = 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={cn(
              sizes[size],
              rating <= value
                ? 'fill-violet-500 text-violet-500'
                : 'fill-gray-200 text-gray-200 hover:text-violet-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}
