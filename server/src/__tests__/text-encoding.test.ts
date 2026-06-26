import { describe, expect, it } from "vitest";
import { detectLikelyTextEncodingCorruption } from "../lib/text-encoding.js";

describe("detectLikelyTextEncodingCorruption", () => {
  it("does not flag ordinary question marks", () => {
    expect(detectLikelyTextEncodingCorruption("Can we ship this? What about QA?")).toBeNull();
    expect(detectLikelyTextEncodingCorruption("????")).toBeNull();
  });

  it("flags replacement characters and long question-mark runs", () => {
    expect(detectLikelyTextEncodingCorruption("�?结论：本次需要继续推进")).toMatchObject({
      reason: "replacement_character",
    });
    expect(detectLikelyTextEncodingCorruption("???????????? agent, ?????????????????????")).toMatchObject({
      reason: "question_mark_runs",
    });
  });
});
