import type { SensitivityLevel } from "@/lib/constants";
import type { RequestFormValues } from "@/features/request/schemas/request-form";

export function classifySensitivity(values: Partial<RequestFormValues>): SensitivityLevel {
  if (values.granularity === "individual") {
    if (values.category === "compensation_analytics") return "restricted";
    return "confidential";
  }
  if (values.category === "compensation_analytics") return "confidential";
  if (values.category === "talent_performance") return "confidential";
  if (values.category === "attrition_movement" || values.category === "headcount_demografi") return "internal";
  return "internal";
}

export function sensitivityRationale(values: Partial<RequestFormValues>): string {
  if (values.granularity === "individual" && values.category === "compensation_analytics") {
    return "Data kompensasi pada level individual diklasifikasikan Restricted. Wajib approval Data Owner Payroll dan HCIS Manager.";
  }
  if (values.granularity === "individual") {
    return "Data pada level individual diklasifikasikan Confidential. Wajib approval Requestor Manager dan Data Owner.";
  }
  if (values.category === "compensation_analytics") {
    return "Data kompensasi (aggregate) diklasifikasikan Confidential. Wajib approval Data Owner.";
  }
  return "Data aggregate non-sensitif diklasifikasikan Internal. Cukup notifikasi ke Requestor Manager.";
}
