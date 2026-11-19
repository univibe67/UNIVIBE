import { useState } from "react";
import { categoryVisual } from "../../utils/categoryVisual";

interface EventCoverProps {
  title: string;
  imageUrl?: string | null;
  categoryName?: string;
  iconSize?: number;
}

function hashOf(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

export default function EventCover({ title, imageUrl, categoryName, iconSize = 28 }: EventCoverProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { icon: Icon, from, to, glow } = categoryVisual(categoryName);

  if (imageUrl && failedUrl !== imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        onError={() => setFailedUrl(imageUrl)}
        className="h-full w-full object-cover"
      />
    );
  }

  const variant = hashOf(title);
  const mirror = variant % 2 === 1;
  const lift = (variant % 5) * 12;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <g transform={mirror ? "translate(400 0) scale(-1 1)" : undefined}>
          <circle cx="330" cy="30" r="150" fill="#ffffff" opacity="0.13" />
          <circle cx="40" cy="300" r="130" fill={glow} opacity="0.4" />
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <path
              key={index}
              d={`M-30 ${200 - lift + index * 20} C 110 ${130 - lift + index * 20}, 230 ${260 - lift + index * 20}, 430 ${140 - lift + index * 20}`}
              stroke="#ffffff"
              strokeOpacity={0.3 - index * 0.04}
              strokeWidth="2"
              fill="none"
            />
          ))}
        </g>
      </svg>
      <span
        className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-white/20 p-3.5 text-white shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)] ring-1 ring-white/40 backdrop-blur-md"
        aria-hidden="true"
      >
        <Icon size={iconSize} strokeWidth={1.8} />
      </span>
    </div>
  );
}
