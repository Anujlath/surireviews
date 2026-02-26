"use client";

import Link from 'next/link';

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.5A4.5 4.5 0 1 1 7.5 13 4.5 4.5 0 0 1 12 8.5zm0 2a2.5 2.5 0 1 0 2.5 2.5A2.5 2.5 0 0 0 12 10.5zm6-3.2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M4.98 3.5A2.5 2.5 0 1 1 2.5 6a2.5 2.5 0 0 1 2.48-2.5zM3 9h4v12H3zm7 0h3.8v1.7h.06a4.2 4.2 0 0 1 3.84-2.1c4.1 0 4.86 2.7 4.86 6.2V21h-4v-5.7c0-1.36 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21h-4z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M13.5 9H16V6h-2.5A3.5 3.5 0 0 0 10 9.5V12H8v3h2v6h3v-6h2.2l.3-3H13v-2.2A.8.8 0 0 1 13.8 9z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export default function Footer({ variant = 'site', embedded = false, transparent = false }) {
  const isReview = variant === 'review';
  const wrapClass = transparent
    ? 'bg-transparent text-white'
    : isReview
      ? 'bg-slate-900 text-white'
      : 'border-t bg-white';
  const contentClass = embedded
    ? isReview
      ? 'w-full flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between'
      : 'w-full flex flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between'
    : isReview
      ? 'container mx-auto flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between'
      : 'container mx-auto flex flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between';
  return (
    <footer className={wrapClass}>
      <div className={contentClass}>
        <div className={isReview ? 'flex flex-col gap-2 text-sm text-slate-200' : 'flex flex-col gap-2 text-sm text-muted-foreground'}>
          <span className={isReview ? 'font-semibold text-white' : 'font-semibold text-foreground'}>
            SuriReviews
          </span>
          <span className={isReview ? 'text-slate-200' : ''}>Trusted reviews for real businesses.</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/about" className={isReview ? 'text-slate-200 transition hover:text-white' : 'text-muted-foreground transition hover:text-foreground'}>
            About us
          </Link>
          <Link href="/how-it-works" className={isReview ? 'text-slate-200 transition hover:text-white' : 'text-muted-foreground transition hover:text-foreground'}>
            How it works
          </Link>
          <Link href="/contact" className={isReview ? 'text-slate-200 transition hover:text-white' : 'text-muted-foreground transition hover:text-foreground'}>
            Contact
          </Link>
          <Link href="/blog" className={isReview ? 'text-slate-200 transition hover:text-white' : 'text-muted-foreground transition hover:text-foreground'}>
            Blog
          </Link>
          <Link href="/privacy" className={isReview ? 'text-slate-200 transition hover:text-white' : 'text-muted-foreground transition hover:text-foreground'}>
            Privacy
          </Link>
          <Link href="/terms" className={isReview ? 'text-slate-200 transition hover:text-white' : 'text-muted-foreground transition hover:text-foreground'}>
            Terms
          </Link>
          <Link href="/cookies" className={isReview ? 'text-slate-200 transition hover:text-white' : 'text-muted-foreground transition hover:text-foreground'}>
            Cookies
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {socialLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={isReview ? 'text-slate-200 transition hover:text-white' : 'text-muted-foreground transition hover:text-foreground'}
              aria-label={item.name}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
