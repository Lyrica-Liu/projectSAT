"use client";

import { ArrowRight, ArrowLeft, Sparkles, Target, Zap } from "lucide-react";

const ICONS = {
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  sparkles: Sparkles,
  target: Target,
  zap: Zap,
} as const;

type IconName = keyof typeof ICONS;

export function Icon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const Comp = ICONS[name as IconName];
  if (!Comp) return null;
  return <Comp size={size} color={color} />;
}
