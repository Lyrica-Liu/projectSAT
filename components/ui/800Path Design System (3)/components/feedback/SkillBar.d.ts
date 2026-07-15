import React from "react";

export interface SkillBarProps {
  /** Skill name, e.g. "Words in Context". */
  label: string;
  /** Accuracy 0–100; auto-colors mint/butter/rose. */
  accuracy?: number;
  /** Optional right-side text overriding the % (e.g. "7/10 · 70%"). */
  detail?: string;
  style?: React.CSSProperties;
}

/** Labeled accuracy bar — the dashboard skill breakdown row. */
export function SkillBar(props: SkillBarProps): JSX.Element;
