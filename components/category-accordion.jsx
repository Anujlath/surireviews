"use client";

import Link from 'next/link';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {
  PawPrint,
  Sparkles,
  Briefcase,
  Factory,
  GraduationCap,
  Cpu,
  PartyPopper,
  Utensils,
  HeartPulse,
  Palette,
  Home,
  Wrench,
  Scale,
  Newspaper,
  Landmark,
  Building2,
  ChefHat,
  Shirt,
  Trophy,
  Plane,
  Zap,
  Car,
  Plus,
  Minus,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const ICONS_BY_GROUP = {
  animals_pets: PawPrint,
  beauty_wellbeing: Sparkles,
  business_services: Briefcase,
  construction_manufactoring: Factory,
  education_training: GraduationCap,
  electronics_technology: Cpu,
  events_entertainment: PartyPopper,
  food_beverages_tobacco: Utensils,
  health_medical: HeartPulse,
  hobbies_crafts: Palette,
  home_garden: Home,
  home_services: Wrench,
  legal_services_government: Scale,
  media_publishing: Newspaper,
  money_insurance: Landmark,
  public_local_services: Building2,
  restaurants_bars: ChefHat,
  shopping_fashion: Shirt,
  sports: Trophy,
  travel_vacation: Plane,
  utilities: Zap,
  vehicles_transportation: Car,
};

const HEADER_STYLES = [
  'bg-amber-100',
  'bg-rose-200',
  'bg-emerald-200',
  'bg-pink-200',
  'bg-lime-200',
  'bg-sky-200',
  'bg-orange-200',
  'bg-emerald-100',
];

function CategoryRow({ group, subcategories, totalCount }) {
  const Icon = ICONS_BY_GROUP[group.id] || Building2;
  return (
    <AccordionPrimitive.Item value={group.id} className="border-b">
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            "flex flex-1 items-center justify-between py-4 text-left text-base font-semibold",
            "transition-colors hover:text-foreground/80",
            "[&[data-state=open] .sr-accordion-plus]:hidden",
            "[&[data-state=closed] .sr-accordion-minus]:hidden"
          )}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-foreground/80 shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex flex-col">
              <span>{group.name}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {totalCount} companies
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <Plus className="sr-accordion-plus h-4 w-4 text-muted-foreground" />
            <Minus className="sr-accordion-minus h-4 w-4 text-muted-foreground" />
          </span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="pb-4 text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="grid gap-3 px-1 pb-2 pt-1 sm:grid-cols-2">
          {subcategories.map((item) => (
            <Link
              key={item.slug}
              href={`/categories/${item.slug}`}
              className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition hover:border-foreground/20 hover:shadow-sm"
            >
              <span>{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </Link>
          ))}
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

function CategoryCard({ group, subcategories, totalCount, headerClass }) {
  const Icon = ICONS_BY_GROUP[group.id] || Building2;
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className={cn('flex items-center justify-center gap-3 px-4 py-6 text-center', headerClass)}>
        <Icon className="h-6 w-6" />
        <div className="font-semibold">{group.name}</div>
      </div>
      <div className="divide-y">
        {subcategories.map((item) => (
          <Link
            key={item.slug}
            href={`/categories/${item.slug}`}
            className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-muted/30"
          >
            <span>{item.name}</span>
            <span className="text-xs text-muted-foreground">{item.count}</span>
          </Link>
        ))}
      </div>
      <div className="px-4 py-3 text-xs text-muted-foreground">Total companies: {totalCount}</div>
    </div>
  );
}

export default function CategoryAccordion({ groups }) {
  return (
    <div className="space-y-6">
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        {groups.map((group, index) => (
          <CategoryCard
            key={group.id}
            group={group}
            subcategories={group.subcategories}
            totalCount={group.totalCount}
            headerClass={HEADER_STYLES[index % HEADER_STYLES.length]}
          />
        ))}
      </div>

      <div className="md:hidden">
        <AccordionPrimitive.Root type="multiple" className="rounded-2xl border bg-white">
          {groups.map((group) => (
            <CategoryRow
              key={group.id}
              group={group}
              subcategories={group.subcategories}
              totalCount={group.totalCount}
            />
          ))}
        </AccordionPrimitive.Root>
      </div>
    </div>
  );
}
