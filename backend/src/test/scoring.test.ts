import { describe, expect, it } from "vitest";
import { computeDomainScores, computeOverallScore, computePriority } from "../services/scoring";

describe("scoring service", () => {
  it("computes domain scores from maturity values", () => {
    const scores = computeDomainScores([
      { domainCode: "PR", domainName: "Protect", value: 3 },
      { domainCode: "PR", domainName: "Protect", value: 2 },
      { domainCode: "DE", domainName: "Detect", value: 0 },
    ]);

    expect(scores.PR.score).toBe(84);
    expect(scores.DE.score).toBe(0);
  });

  it("returns overall score 0 for empty input", () => {
    expect(computeOverallScore({})).toBe(0);
  });

  it("computes expected priority ranking", () => {
    expect(computePriority("LOW", "HIGH")).toBe(1);
    expect(computePriority("HIGH", "LOW")).toBe(3);
    expect(computePriority("MEDIUM", "MEDIUM")).toBe(2);
  });
});
