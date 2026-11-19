import { useState } from "react";

const palette = [
  "bg-brand-100 text-brand-800",
  "bg-coral-100 text-coral-700",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-900",
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
];

function tintFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

function initialsOf(name?: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase("tr-TR");
}

interface AvatarProps {
  name?: string;
  src?: string | null;
  className?: string;
}

export default function Avatar({ name, src, className = "size-10 text-sm" }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        onError={() => setFailedSrc(src)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${tintFor(name ?? "")} ${className}`}
      aria-hidden="true"
      translate="no"
    >
      {initialsOf(name)}
    </span>
  );
}
