import { describe, it, expect } from "vitest";
import { classifySensitivity, sensitivityRationale } from "./sensitivity";

describe("classifySensitivity", () => {
  it("compensation_analytics + individual = restricted", () => {
    expect(
      classifySensitivity({ category: "compensation_analytics", granularity: "individual" }),
    ).toBe("restricted");
  });

  it("kategori biasa + individual = confidential", () => {
    expect(
      classifySensitivity({ category: "headcount_demografi", granularity: "individual" }),
    ).toBe("confidential");
  });

  it("compensation_analytics + aggregate = confidential", () => {
    expect(
      classifySensitivity({ category: "compensation_analytics", granularity: "aggregate" }),
    ).toBe("confidential");
  });

  it("talent_performance + aggregate = confidential", () => {
    expect(
      classifySensitivity({ category: "talent_performance", granularity: "aggregate" }),
    ).toBe("confidential");
  });

  it("headcount_demografi + aggregate = internal", () => {
    expect(
      classifySensitivity({ category: "headcount_demografi", granularity: "aggregate" }),
    ).toBe("internal");
  });

  it("master_data + aggregate = internal (default)", () => {
    expect(classifySensitivity({ category: "master_data", granularity: "aggregate" })).toBe(
      "internal",
    );
  });

  it("kategori undefined dengan aggregate = internal (default safe)", () => {
    expect(classifySensitivity({ granularity: "aggregate" })).toBe("internal");
  });
});

describe("sensitivityRationale", () => {
  it("restricted case mention Data Owner Payroll", () => {
    const rationale = sensitivityRationale({
      category: "compensation_analytics",
      granularity: "individual",
    });
    expect(rationale.toLowerCase()).toContain("restricted");
    expect(rationale).toContain("Payroll");
  });

  it("individual non-comp = confidential rationale", () => {
    const rationale = sensitivityRationale({
      category: "headcount_demografi",
      granularity: "individual",
    });
    expect(rationale).toContain("Confidential");
  });

  it("aggregate default rationale = internal", () => {
    const rationale = sensitivityRationale({
      category: "headcount_demografi",
      granularity: "aggregate",
    });
    expect(rationale).toContain("Internal");
  });
});
