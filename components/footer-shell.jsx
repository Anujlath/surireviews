"use client";

import { usePathname } from 'next/navigation';
import Footer from '@/components/footer';

export default function FooterShell() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <Footer variant="review" />;
}
