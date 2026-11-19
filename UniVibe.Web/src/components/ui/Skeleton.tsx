export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-200/70 ${className}`} aria-hidden="true" />;
}
