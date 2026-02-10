"use client";

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';

export function RatingDistribution({ distribution, total, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-16">
              <span className="text-sm font-medium">{rating}</span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
            <Progress value={percentage} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
