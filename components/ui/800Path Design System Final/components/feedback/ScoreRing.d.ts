import React from "react";

/** Circular score dial with centered percentage. */
export interface ScoreRingProps {
  /** Score 0–100; auto-colors mint/butter/rose. */
  score?: number;
  /** Diameter px. @default 132 */
  size?: number;
  /** Ring thickness px. @default 12 */
  stroke?: number;
  /** Caption under the ring. */
  caption?: string;
  style?: React.CSSProperties;
}

export function ScoreRing(props: ScoreRingProps): JSX.Element;
