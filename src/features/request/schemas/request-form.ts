import { z } from "zod";
import {
  REQUEST_CATEGORIES,
  GRANULARITY,
  OUTPUT_FORMATS,
  PRIORITIES,
  PERTAMINA_ENTITIES,
} from "@/lib/constants";

export const requestFormSchema = z
  .object({
    category: z.enum(REQUEST_CATEGORIES as unknown as [string, ...string[]]),
    title: z.string().min(10, "Judul minimal 10 karakter").max(120),
    purpose: z.string().min(30, "Jelaskan tujuan minimal 30 karakter agar tim bisa membantu lebih akurat"),
    periodType: z.enum(["point-in-time", "range"]),
    periodDate: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    scopeEntities: z.array(z.enum(PERTAMINA_ENTITIES as unknown as [string, ...string[]])).min(1, "Pilih minimal 1 entitas"),
    scopeOrgUnits: z.string().optional(),
    granularity: z.enum(GRANULARITY as unknown as [string, ...string[]]),
    outputFormats: z.array(z.enum(OUTPUT_FORMATS as unknown as [string, ...string[]])).min(1, "Pilih minimal 1 format output"),
    dueDate: z.string().min(1, "Tanggal dibutuhkan wajib diisi"),
    priority: z.enum(PRIORITIES as unknown as [string, ...string[]]),
    urgentJustification: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.periodType === "point-in-time") return !!data.periodDate;
      return !!data.periodStart && !!data.periodEnd;
    },
    { message: "Periode data wajib diisi", path: ["periodDate"] },
  )
  .refine((data) => data.priority !== "urgent" || (data.urgentJustification?.length ?? 0) >= 20, {
    message: "Justifikasi urgent minimal 20 karakter",
    path: ["urgentJustification"],
  });

export type RequestFormValues = z.infer<typeof requestFormSchema>;
