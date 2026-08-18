"use client";

import {
  ArrowRight, ArrowLeft, Sparkles, Target, Zap,
  Coffee, Compass, MessageCircleHeart, UserCheck,
  TrendingUp, CalendarCheck, Wallet,
  Lightbulb, PenTool, MessageSquare, CheckCheck, ChevronRight,
  Calculator, BarChart3, Triangle, Ban,
  Calendar, FileText, Clock, CircleCheck, Highlighter, Eraser,
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
  lightbulb:               Lightbulb,
  "pen-tool":              PenTool,
  "message-square":        MessageSquare,
  "check-check":           CheckCheck,
  "chevron-right":         ChevronRight,
  calculator:              Calculator,
  "bar-chart-3":           BarChart3,
  triangle:                Triangle,
  ban:                     Ban,
  calendar:                Calendar,
  document:                FileText,
  clock:                   Clock,
  "circle-check":          CircleCheck,
  highlighter:             Highlighter,
  eraser:                  Eraser,
} as const;

type IconName = keyof typeof ICONS;

/** Default stroke is 1.3 to match the design system's thin sans-serif chrome. */
export function Icon({ name, size = 16, color, strokeWidth = 1.3 }: { name: string; size?: number; color?: string; strokeWidth?: number }) {
  const Comp = ICONS[name as IconName];
  if (!Comp) return null;
  return <Comp size={size} color={color} strokeWidth={strokeWidth} />;
}
