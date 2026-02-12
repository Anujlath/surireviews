"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Landmark, Plane, Car, Sofa, Gem, Shirt, Laptop, Dumbbell } from 'lucide-react';

const quickCategories = [
  { label: 'Bank', icon: Landmark, category: 'Bank' },
  { label: 'Travel Insurance Company', icon: Plane, category: 'Travel Insurance Company' },
  { label: 'Car Dealer', icon: Car, category: 'Car Dealer' },
  { label: 'Furniture Store', icon: Sofa, category: 'Furniture Store' },
  { label: 'Jewelry Store', icon: Gem, category: 'Jewelry Store' },
  { label: 'Clothing Store', icon: Shirt, category: 'Clothing Store' },
  { label: 'Electronics & Technology', icon: Laptop, category: 'Electronics & Technology' },
  { label: 'Fitness and Nutrition Service', icon: Dumbbell, category: 'Fitness and Nutrition Service' },
];

export function HomeCategoriesCarousel() {
  const [api, setApi] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!api || isHovered) return;

    const timer = setInterval(() => {
      if (document.hidden) return;
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [api, isHovered]);

  return (
    <Carousel
      opts={{ align: 'start', loop: false }}
      className="space-y-5"
      setApi={setApi}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How can we help you today?</h2>
        <div className="flex items-center gap-3">
          <CarouselPrevious className="static hidden translate-y-0 rounded-full border border-border bg-background text-foreground hover:bg-muted sm:inline-flex" />
          <CarouselNext className="static hidden translate-y-0 rounded-full border border-primary/60 bg-background text-primary hover:bg-primary/5 sm:inline-flex" />
          <Button asChild variant="outline" className="rounded-full px-4 sm:px-6">
            <Link href="/categories">See more</Link>
          </Button>
        </div>
      </div>

      <CarouselContent className="pb-0">
        {quickCategories.map((item) => {
          const Icon = item.icon;
          return (
            <CarouselItem key={item.label} className="basis-[70%] sm:basis-1/2 lg:basis-1/4 xl:basis-1/5">
              <Link
                href={`/companies?category=${encodeURIComponent(item.category)}`}
                className="group block h-full px-1.5 py-1.5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-slate-300/80 group-hover:shadow-md">
                    <Icon className="h-5 w-5 text-slate-700 transition-colors group-hover:text-slate-950" />
                  </span>
                  <p className="text-base font-semibold leading-snug text-foreground/90 group-hover:text-foreground">
                    {item.label}
                  </p>
                </div>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}
