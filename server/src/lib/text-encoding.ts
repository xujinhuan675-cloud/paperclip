export type TextEncodingCorruption =
  | { reason: "replacement_character" }
  | {
      reason: "question_mark_runs";
      questionMarkCount: number;
      longestRun: number;
      ratio: number;
    };

const replacementCharacter = "\uFFFD";
const suspiciousQuestionRun = /\?{4,}/g;

export function detectLikelyTextEncodingCorruption(value: unknown): TextEncodingCorruption | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  if (text.includes(replacementCharacter)) return { reason: "replacement_character" };

  const runs = [...text.matchAll(suspiciousQuestionRun)].map((match) => match[0].length);
  if (runs.length === 0) return null;

  const questionMarkCount = runs.reduce((sum, length) => sum + length, 0);
  const visibleLength = Math.max(text.replace(/\s/g, "").length, 1);
  const longestRun = Math.max(...runs);
  const ratio = questionMarkCount / visibleLength;

  if (longestRun >= 8 || (questionMarkCount >= 12 && ratio >= 0.15)) {
    return { reason: "question_mark_runs", questionMarkCount, longestRun, ratio };
  }

  return null;
}
