import { describe, expect, it } from "vitest";
import { planWordJustifiedLines, wordLineCompressionBudget } from "./thesisJustifyLines.js";

describe("Word line fit planning", () => {
  it("uses the terminal word advance as a separate cap, so a short ending can move the break", () => {
    const long = [
      { advancePt: 20, followingSpacePt: 5 }, { advancePt: 20, followingSpacePt: 5 }, { advancePt: 16 },
    ];
    const short = [...long.slice(0, 2), { advancePt: 3 }];
    expect(planWordJustifiedLines(long, 50, { spaceAdvancePt: 5 })[0].end).toBe(2);
    expect(planWordJustifiedLines(short, 50, { spaceAdvancePt: 5 })[0].end).toBe(1);
  });

  it("keeps a legal unbreakable group together even when it exceeds the measure", () => {
    const lines = planWordJustifiedLines([
      { advancePt: 14, followingSpacePt: 4, legalBreakAfter: false },
      { advancePt: 15, followingSpacePt: 4, legalBreakAfter: true },
      { advancePt: 12 },
    ], 30, { spaceAdvancePt: 4 });
    expect(lines[0].end).toBe(1);
    expect(lines[1].start).toBe(2);
  });

  it("bounds compression by both the gap and terminal-word budgets", () => {
    expect(wordLineCompressionBudget({ gapCount: 4, spaceAdvancePt: 5, lastWordAdvancePt: 3 })).toBeCloseTo(2.88);
    expect(wordLineCompressionBudget({ gapCount: 4, spaceAdvancePt: 5, lastWordAdvancePt: 25 })).toBeCloseTo(5);
  });
});
