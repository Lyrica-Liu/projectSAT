import React from "react";

export interface InputProps {
  label?: string;
  hint?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}

/** Labeled text input with soft border + lilac focus ring. */
export function Input(props: InputProps): JSX.Element;
