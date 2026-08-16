import React from "react";

export interface ProgressBarProps {
  /** 0–100. */
  value?: number;
  /** @default "brand" */
  tone?: "brand" | "success" | "warning" | "danger";
  /** Track height in px. @default 8 */
  height?: number;
  /** Trailing % label. @default false */
  showLabel?: boolean;
  style?: React.CSSProperties;
}

/** Slim rounded progress / completion track. */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
