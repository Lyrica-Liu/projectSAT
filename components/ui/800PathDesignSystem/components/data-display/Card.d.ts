import React from "react";

/** Core rounded surface. */
export interface CardProps {
  children?: React.ReactNode;
  /** Fill tone. @default "surface" */
  tone?: "surface" | "sunken" | "brand" | "lilac" | "mint" | "sky" | "rose";
  /** @default "lg" */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  /** @default "lg" */
  radius?: "md" | "lg" | "xl" | "2xl";
  /** @default "sm" */
  shadow?: "none" | "xs" | "sm" | "md" | "lg";
  /** Lift + shadow on hover. @default false */
  interactive?: boolean;
  style?: React.CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
