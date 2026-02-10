import { cn } from '@/lib/utils';

export function BrandMark({ className }) {
  return (
    <svg
      viewBox="0 0 128 128"
      aria-hidden="true"
      className={cn('h-6 w-6', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="srGradient" x1="18" y1="18" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D9A7D8" />
          <stop offset="1" stopColor="#5A4D84" />
        </linearGradient>
      </defs>
      <text x="30" y="72" fill="url(#srGradient)" fontFamily="Georgia, 'Times New Roman', serif" fontSize="64" fontWeight="700">
        S
      </text>
      <text x="66" y="86" fill="url(#srGradient)" fontFamily="Georgia, 'Times New Roman', serif" fontSize="64" fontWeight="700">
        R
      </text>
      <path
        d="M18 66C8 78 9 98 24 108C45 121 66 111 82 101C94 93 103 90 112 92"
        stroke="url(#srGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 56L21 62L27 62L22 66L24 72L18 68L12 72L14 66L9 62L15 62L18 56Z"
        fill="url(#srGradient)"
      />
      <path
        d="M96 104C98 108 97 114 91 116C86 118 80 116 78 112"
        stroke="url(#srGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLogo({ className, textClassName = 'text-xl font-bold' }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-background ring-1 ring-border/70 shadow-sm">
        <BrandMark className="h-9 w-9" />
      </span>
      <span className={cn('font-[family:var(--font-brand)] font-semibold tracking-tight', textClassName)}>
        Surireviews
      </span>
    </span>
  );
}
