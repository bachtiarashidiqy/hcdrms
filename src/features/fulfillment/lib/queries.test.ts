import { describe, it, expect } from "vitest";
import { detectCutOffInconsistency } from "./queries";
import type { DeliverableSource } from "@/types/domain";

const baseSource = (cutOffDate: string): DeliverableSource => ({
  dataSourceId: "ds_" + cutOffDate,
  cutOffDate,
  refreshFrequency: "daily",
});

describe("detectCutOffInconsistency", () => {
  it("0 atau 1 sumber = null", () => {
    expect(detectCutOffInconsistency([])).toBeNull();
    expect(detectCutOffInconsistency([baseSource("2025-12-31")])).toBeNull();
  });

  it("2 sumber dengan cut-off sama = null", () => {
    expect(
      detectCutOffInconsistency([baseSource("2025-12-31"), baseSource("2025-12-31")]),
    ).toBeNull();
  });

  it("gap 5 hari masih dalam batas (≤ 7) = null", () => {
    expect(
      detectCutOffInconsistency([baseSource("2025-12-26"), baseSource("2025-12-31")]),
    ).toBeNull();
  });

  it("gap 7 hari pas (boundary) = null", () => {
    expect(
      detectCutOffInconsistency([baseSource("2025-12-24"), baseSource("2025-12-31")]),
    ).toBeNull();
  });

  it("gap 8 hari = warning", () => {
    const w = detectCutOffInconsistency([
      baseSource("2025-12-23"),
      baseSource("2025-12-31"),
    ]);
    expect(w).not.toBeNull();
    expect(w).toContain("8 hari");
  });

  it("gap 16 hari (case demo) = warning dengan angka benar", () => {
    const w = detectCutOffInconsistency([
      baseSource("2025-12-15"),
      baseSource("2025-12-31"),
    ]);
    expect(w).toContain("16 hari");
  });

  it("3+ sumber, hitung spread max-min", () => {
    const w = detectCutOffInconsistency([
      baseSource("2025-12-15"),
      baseSource("2025-12-25"),
      baseSource("2025-12-31"),
    ]);
    expect(w).toContain("16 hari");
  });
});
