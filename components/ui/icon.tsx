"use client";

import {
  ArrowRight, ArrowLeft, Sparkles, Target, Zap,
  Coffee, Compass, MessageCircleHeart, UserCheck,
  TrendingUp, CalendarCheck, Wallet,
} from "lucide-react";

const ICONS = {
  "arrow-right":           ArrowRight,
  "arrow-left":            ArrowLeft,
  sparkles:                Sparkles,
  target:                  Target,
  zap:                     Zap,
  coffee:                  Coffee,
  compass:                 Compass,
  "message-circle-heart":  MessageCircleHeart,
  "user-check":            UserCheck,
  "trending-up":           TrendingUp,
  "calendar-check":        CalendarCheck,
  wallet:                  Wallet,
} as const;

type IconName = keyof typeof ICONS;

export function Icon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const Comp = ICONS[name as IconName];
  if (!Comp) return null;
  return <Comp size={size} color={color} />;
}
