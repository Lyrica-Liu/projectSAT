export const REPORT_REASONS = [
  { value: "wrong_answer", label: "The answer key is wrong" },
  { value: "multiple_answers", label: "More than one answer works" },
  { value: "unclear", label: "The question is unclear" },
  { value: "typo", label: "Typo or formatting problem" },
  { value: "other", label: "Something else" },
] as const;

export type ReportReason = typeof REPORT_REASONS[number]["value"];

export function isReportReason(v: unknown): v is ReportReason {
  return REPORT_REASONS.some((r) => r.value === v);
}
