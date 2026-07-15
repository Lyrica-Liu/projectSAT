import React from "react";

export interface ChoiceCardProps {
  label: string;
  desc?: string;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** Large selectable option row with a radio dot (practice setup). */
export function ChoiceCard(props: ChoiceCardProps): JSX.Element;
