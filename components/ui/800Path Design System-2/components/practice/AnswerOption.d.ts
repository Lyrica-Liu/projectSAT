import React from "react";

export type AnswerState = "default" | "selected" | "correct" | "incorrect" | "muted";

/** Multiple-choice answer row with letter chip and graded states. */
export interface AnswerOptionProps {
  /** Letter chip, "A"–"D". */
  letter: string;
  children?: React.ReactNode;
  /** Graded visual state. @default "default" */
  state?: AnswerState;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function AnswerOption(props: AnswerOptionProps): JSX.Element;
