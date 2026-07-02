import React from "react";

export interface IconButtonProps {
  /** The icon node (e.g. a Lucide <i data-lucide> or SVG). */
  children?: React.ReactNode;
  /** @default "ghost" */
  variant?: "ghost" | "surface" | "soft";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Accessible label (required for icon-only). */
  label?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/** Square rounded icon-only button. */
export function IconButton(props: IconButtonProps): JSX.Element;
