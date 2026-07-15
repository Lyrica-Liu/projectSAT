import React from "react";

export type SegmentOption = string | { value: string; label: string };

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange?: (value: string) => void;
  /** @default "md" */
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

/** Pill toggle group on a sunken track (2–3 options). */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
