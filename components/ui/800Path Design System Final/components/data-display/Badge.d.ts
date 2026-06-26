import React from "react";

export type BadgeTone =
  | "lilac" | "mint" | "sky" | "rose" | "butter" | "peach"
  | "neutral" | "success" | "warning" | "danger";

export interface BadgeProps {
  children?: React.ReactNode;
  /** @default "lilac" */
  tone?: BadgeTone;
  /** @default "md" */
  size?: "sm" | "md";
  /** Leading filled dot. @default false */
  dot?: boolean;
  style?: React.CSSProperties;
}

/** Small pastel pill label for domains, skills, difficulty, status. */
export function Badge(props: BadgeProps): JSX.Element;
