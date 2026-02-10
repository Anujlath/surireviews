"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, LayoutDashboard, Shield, Menu, PenSquare } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { MobileSearchOverlay } from '@/components/mobile-search-overlay';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [country, setCountry] = useState('UK');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncCountry = (nextValue) => {
      if (nextValue) {
        setCountry(nextValue);
        return;
      }

      const stored = window.localStorage.getItem('sr:search-country');
      if (stored) {
        setCountry(stored);
        return;
      }

      const cookieCountry = document.cookie
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith('sr_country='))
        ?.split('=')[1];

      if (cookieCountry) {
        setCountry(decodeURIComponent(cookieCountry));
      }
    };

    syncCountry();

    const onStorage = (event) => {
      if (event.key === 'sr:search-country') {
        syncCountry(event.newValue || undefined);
      }
    };
    const onCountryChanged = (event) => {
      syncCountry(event?.detail?.country);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('sr:country-changed', onCountryChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sr:country-changed', onCountryChanged);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between sm:h-16">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo />
          </Link>
          <span className="hidden sm:inline-flex rounded-full border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
            Country: {country}
          </span>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/write-review"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Write a review
            </Link>
            <Link
              href="/companies"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Companies
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Categories
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <MobileSearchOverlay />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/write-review" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  Write a review
                </Link>
                <Link href="/companies" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  Companies
                </Link>
                <Link href="/categories" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  Categories
                </Link>
                <Link href="/about" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  About us
                </Link>
                <Link href="/how-it-works" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                  How it works
                </Link>
                {user ? (
                  <>
                    {user.role === 'ADMIN' && (
                      <Link href="/admin" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                        Admin Panel
                      </Link>
                    )}
                    {user.role === 'BUSINESS' && (
                      <Link href="/dashboard" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                    )}
                    <Link href="/profile" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="text-left text-sm font-medium text-red-600"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                      Log in
                    </Link>
                    <Link href="/login?mode=signup" className="text-sm font-medium hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden md:block">
          {status === 'loading' ? (
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.name && (
                      <p className="font-medium">{user.name}</p>
                    )}
                    {user.email && (
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Role: {user.role}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === 'BUSINESS' && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" asChild size="sm" className="px-2 sm:px-3">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="px-2 sm:px-3">
                <Link href="/login?mode=signup">Sign up</Link>
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>
      <div className="border-t md:hidden">
        <div className="container flex h-11 items-center text-sm">
          <Link
            href="/write-review"
            className="group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-full border border-primary/30 bg-[linear-gradient(90deg,rgba(13,34,74,0.08)_0%,rgba(13,34,74,0.03)_45%,rgba(16,185,129,0.16)_100%)] px-4 text-[13px] font-semibold tracking-tight text-primary shadow-[0_4px_14px_rgba(13,34,74,0.18)] ring-1 ring-white/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(13,34,74,0.22)] active:translate-y-0"
          >
            <PenSquare className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-[-8deg]" />
            Write a review
          </Link>
        </div>
      </div>
    </header>
  );
}
