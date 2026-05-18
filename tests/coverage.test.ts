import { describe, it, expect } from "vitest";
import { generateCoverageReport } from "../lib/coverage/coverage";

describe("generateCoverageReport", () => {
  it("returns coverage data for single source", () => {
    const report = generateCoverageReport(
      [{ source_id: "overpass", count: 100 }],
      80
    );
    expect(report.total_unique).toBe(80);
    expect(report.coverage_percentage).toBe(80);
  });

  it("returns coverage data for multiple sources", () => {
    const report = generateCoverageReport(
      [
        { source_id: "overpass", count: 100 },
        { source_id: "places", count: 80 }
      ],
      70
    );
    expect(report.total_unique).toBe(70);
    expect(report.sources.length).toBe(2);
    expect(report.source_overlap.length).toBe(1);
  });

  it("handles empty coverage", () => {
    const report = generateCoverageReport([], 0);
    expect(report.total_unique).toBe(0);
    expect(report.coverage_percentage).toBe(0);
  });

  it("computes source overlap", () => {
    const report = generateCoverageReport(
      [
        { source_id: "overpass", count: 100 },
        { source_id: "places", count: 80 },
        { source_id: "directory", count: 50 }
      ],
      60
    );
    expect(report.source_overlap.length).toBe(3); // C(3,2) = 3 pairs
  });

  it("excludes zero-count sources from overlap", () => {
    const report = generateCoverageReport(
      [
        { source_id: "overpass", count: 100 },
        { source_id: "places", count: 0 }
      ],
      50
    );
    expect(report.source_overlap.length).toBe(1);
  });
});
