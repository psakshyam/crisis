// Per-question colors from the design system (Q1–Q5 tabs / option cards).
export const QUESTION_COLORS = [
  "#EFCDB8",
  "#EFEBB8",
  "#B8EAEF",
  "#D5B8EF",
  "#C2EEB9",
];

export function questionColor(questionNumber) {
  return QUESTION_COLORS[
    (Math.max(1, questionNumber) - 1) % QUESTION_COLORS.length
  ];
}

// Seated-character expression for an outcome, from how good the choice was.
export function expressionForPoints(points, maxPoints = 4) {
  const ratio = maxPoints ? points / maxPoints : 0;
  if (ratio >= 1) return "smile";
  if (ratio >= 0.75) return "neutral";
  if (ratio >= 0.5) return "sidelook";
  return "frown";
}
