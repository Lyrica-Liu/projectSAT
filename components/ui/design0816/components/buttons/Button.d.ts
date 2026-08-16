import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "soft";
export type ButtonSize = "sm" | "md" | "lg";

/** Pill-rounded brand button. */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. @default "primary" */
  variant?: ButtonVariant;
  /** @default "md" */
  size?: ButtonSize;
  /** Stretch to container width. @default false */
  full?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
