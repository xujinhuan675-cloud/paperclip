import { describe, expect, it } from "vitest";
import { detectLikelyTextEncodingCorruption } from "../lib/text-encoding.js";

describe("detectLikelyTextEncodingCorruption", () => {
  it("does not flag ordinary question marks", () => {
    expect(detectLikelyTextEncodingCorruption("Can we ship this? What about QA?")).toBeNull();
    expect(detectLikelyTextEncodingCorruption("????")).toBeNull();
  });

  it("flags replacement characters and long question-mark runs", () => {
    expect(detectLikelyTextEncodingCorruption("\uFFFD damaged text")).toMatchObject({
      reason: "replacement_character",
    });
    expect(detectLikelyTextEncodingCorruption("???????????? agent, ?????????????????????")).toMatchObject({
      reason: "question_mark_runs",
    });
  });
});
