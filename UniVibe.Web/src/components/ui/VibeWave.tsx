import { useId } from "react";

// Flowing brand ribbons with a light "network" of nodes on top, echoing the mobile app's login artwork.

type Point = [number, number];

const RIBBONS = [
  { offset: -120, width: 86, from: "#7dd3fc", to: "#1f62d6", opacity: 0.95 },
  { offset: -36, width: 64, from: "#6a5cff", to: "#a78bfa", opacity: 0.9 },
  { offset: 36, width: 80, from: "#ef3653", to: "#ff8a4c", opacity: 0.95 },
  { offset: 110, width: 58, from: "#1559ac", to: "#3d8bff", opacity: 0.95 },
  { offset: 166, width: 30, from: "#10b981", to: "#5eead4", opacity: 0.9 },
];

const curve = (o: number) =>
  `M-120 ${520 + o} C 100 ${400 + o}, 250 ${600 + o}, 440 ${380 + o} S 720 ${80 + o}, 940 ${40 + o}`;

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

function pointOn(o: number, s: number): Point {
  if (s < 0.5) return cubic([-120, 520 + o], [100, 400 + o], [250, 600 + o], [440, 380 + o], s * 2);
  return cubic([440, 380 + o], [630, 160 + o], [720, 80 + o], [940, 40 + o], (s - 0.5) * 2);
}

const STEPS = [0.14, 0.27, 0.4, 0.53, 0.66, 0.79, 0.9];
const LAYERS = [-120, 36, 110].map((o, layer) =>
  STEPS.map((s, index) => pointOn(o, s + (layer % 2 ? 0.05 : 0) + (index % 2 ? 0.015 : 0))),
);

const NODES = LAYERS.flat();
const LINKS: [Point, Point][] = [];
LAYERS.forEach((layer, li) => {
  layer.forEach((point, pi) => {
    if (layer[pi + 1]) LINKS.push([point, layer[pi + 1]]);
    const next = LAYERS[li + 1];
    if (next && pi % 2 === 0 && next[pi]) LINKS.push([point, next[pi]]);
  });
});

interface VibeWaveProps {
  className?: string;
  tone?: "light" | "dark";
  network?: boolean;
}

export default function VibeWave({ className = "", tone = "dark", network = true }: VibeWaveProps) {
  const id = useId().replace(/:/g, "");
  const lineColor = tone === "dark" ? "#ffffff" : "#1f62d6";

  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        {RIBBONS.map((ribbon, index) => (
          <linearGradient key={index} id={`${id}-r${index}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={ribbon.from} />
            <stop offset="1" stopColor={ribbon.to} />
          </linearGradient>
        ))}
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      <g className="animate-drift" style={{ transformOrigin: "center", transformBox: "fill-box" }}>
        <path d={curve(20)} stroke="#3d8bff" strokeOpacity="0.45" strokeWidth="260" fill="none" filter={`url(#${id}-soft)`} />
        {RIBBONS.map((ribbon, index) => (
          <path
            key={index}
            d={curve(ribbon.offset)}
            stroke={`url(#${id}-r${index})`}
            strokeOpacity={ribbon.opacity}
            strokeWidth={ribbon.width}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {network && (
          <g>
            {LINKS.map(([a, b], index) => (
              <line
                key={index}
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={lineColor}
                strokeOpacity={tone === "dark" ? 0.55 : 0.4}
                strokeWidth="1.4"
              />
            ))}
            {NODES.map(([x, y], index) => (
              <g key={index}>
                <circle cx={x} cy={y} r="9" fill="#ffffff" opacity="0.55" filter={`url(#${id}-glow)`} />
                <circle cx={x} cy={y} r={index % 3 === 0 ? 5 : 3.6} fill="#ffffff" />
              </g>
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
