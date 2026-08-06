export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="logo-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4a8fe0" />
          <stop offset="55%" stopColor="#7c5ce0" />
          <stop offset="100%" stopColor="#15a870" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-grad)" />
      {/* stylized arc, referencing the Arc network */}
      <path d="M8 21.5c0-6 3.5-10 8-10s8 4 8 10" stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.95" />
      <circle cx="8" cy="21.5" r="1.8" fill="white" />
      <circle cx="24" cy="21.5" r="1.8" fill="white" />
    </svg>
  );
}
