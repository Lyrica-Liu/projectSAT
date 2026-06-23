import React from "react";

export interface AvatarProps {
  /** Full name; initials are derived from it. */
  name?: string;
  /** Explicit initials (use when mounting without a name, e.g. via x-import). */
  initials?: string;
  /** Pixel diameter. @default 36 */
  size?: number;
  /** Force a palette index 0–4; otherwise hashed from name. */
  tone?: number;
  style?: React.CSSProperties;
}

/** Circular initials chip in a deterministic pastel tone. */
export function Avatar(props: AvatarProps): JSX.Element;
