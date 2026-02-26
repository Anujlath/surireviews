"use client";

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';
import { getRatingColorClasses } from '@/lib/rating-colors';

export function RatingDistribution({
  distribution,
  total,
  className,
  onSelectRating,
  selectedRating,
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const isSelected = String(selectedRating) === String(rating);
        const isInteractive = typeof onSelectRating === 'function';
        const colors = getRatingColorClasses(rating);

        return (
          <button
            key={rating}
            type="button"
            onClick={() => {
              if (isInteractive) onSelectRating(rating);
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-1 py-1 text-left',
              isInteractive && 'cursor-pointer transition-colors hover:bg-muted/50',
              isSelected && 'bg-muted/60'
            )}
            aria-pressed={isSelected}
            disabled={!isInteractive}
          >
            <div className="flex items-center gap-1 w-16">
              <span className="text-sm font-medium">{rating}</span>
              <Star className={cn('w-4 h-4', colors.solid)} />
            </div>
            <Progress value={percentage} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
