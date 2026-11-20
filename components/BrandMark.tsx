export function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#161616" />
      <rect x="7" y="7" width="8" height="8" rx="1.5" fill="#ffffff" />
      <rect x="17" y="7" width="8" height="8" rx="1.5" fill="#7dcec0" />
      <rect x="7" y="17" width="18" height="8" rx="1.5" fill="#ffffff" />
    </svg>
  )
}
