/** Parses a plain decimal/integer or an "a/b" fraction into a float. */
function parseNumeric(raw: string): number | null {
  const s = raw.trim();
  const fracM = s.match(/^-?\d+(\.\d+)?\s*\/\s*-?\d+(\.\d+)?$/);
  if (fracM) {
    const [numStr, denStr] = s.split("/");
    const num = parseFloat(numStr.trim());
    const den = parseFloat(denStr.trim());
    if (den === 0 || isNaN(num) || isNaN(den)) return null;
    return num / den;
  }
  // Strict: the whole string must be a plain decimal number, not just start
  // with one — parseFloat alone would silently truncate "2√3" to 2.
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return parseFloat(s);
}

/**
 * Grades a Grid-In answer against the bank's stored correct answer.
 * Numeric values (integers, decimals, "a/b" fractions) are compared with a
 * small tolerance so equivalent forms match (e.g. "5/18" vs "0.278"). Values
 * that aren't parseable as numbers (e.g. a radical like "5√3") fall back to
 * an exact, whitespace/case-insensitive string match — this isn't full
 * DSAT-grade equivalence handling, just a reasonable default for practice.
 */
export function gradeGridAnswer(userInput: string, correctAnswer: string): boolean {
  const a = userInput.trim();
  const b = correctAnswer.trim();
  if (!a) return false;

  const numA = parseNumeric(a);
  const numB = parseNumeric(b);
  if (numA !== null && numB !== null) {
    const tolerance = Math.max(1e-6, Math.abs(numB) * 0.005);
    return Math.abs(numA - numB) <= tolerance;
  }

  return a.toLowerCase().replace(/\s+/g, "") === b.toLowerCase().replace(/\s+/g, "");
}
