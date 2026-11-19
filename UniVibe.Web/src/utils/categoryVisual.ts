import { BookOpen, Cpu, Music, Palette, Sparkles, Trophy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCategoryKey } from "./categoryLabel";
import type { CategoryKey } from "./categoryLabel";

export interface CategoryVisual {
  icon: LucideIcon;
  from: string;
  to: string;
  glow: string;
}

const visuals: Record<CategoryKey, CategoryVisual> = {
  Category_ArtsCulture: { icon: Palette, from: "#ef3653", to: "#ff8a4c", glow: "#ffd166" },
  Category_Academic: { icon: BookOpen, from: "#1559ac", to: "#3d8bff", glow: "#7dd3fc" },
  Category_MusicEntertainment: { icon: Music, from: "#5b4dff", to: "#b57bff", glow: "#ef3653" },
  Category_ClubsSocial: { icon: Users, from: "#f59e0b", to: "#ef3653", glow: "#fde68a" },
  Category_Sports: { icon: Trophy, from: "#059669", to: "#34d399", glow: "#d9f99d" },
  Category_Technology: { icon: Cpu, from: "#1f62d6", to: "#06b6d4", glow: "#a5f3fc" },
};

const fallback: CategoryVisual = { icon: Sparkles, from: "#1559ac", to: "#6a5cff", glow: "#ef3653" };

export function categoryVisual(categoryName?: string): CategoryVisual {
  const key = getCategoryKey(categoryName);
  return key ? visuals[key] : fallback;
}

export function categoryVisualByKey(key: CategoryKey | ""): CategoryVisual {
  return key ? visuals[key] : fallback;
}
