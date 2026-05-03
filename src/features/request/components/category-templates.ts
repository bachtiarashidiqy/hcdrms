import type { RequestCategory } from "@/lib/constants";

export interface CategoryTemplate {
  helperText: string;
  examplePurpose: string;
  exampleTitle: string;
  suggestedFields: string[];
}

export const CATEGORY_TEMPLATES: Record<RequestCategory, CategoryTemplate> = {
  master_data: {
    helperText: "Permintaan data master karyawan: profil, demografi, struktur dasar.",
    examplePurpose: "Sinkronisasi data karyawan untuk integrasi sistem [tujuan]",
    exampleTitle: "Master data karyawan aktif Q3 2025",
    suggestedFields: ["NIK", "Nama", "Jabatan", "Unit Organisasi", "Status"],
  },
  headcount_demografi: {
    helperText: "Headcount, distribusi demografi (usia, gender, lokasi, masa kerja).",
    examplePurpose:
      "Analisis komposisi headcount untuk laporan board meeting bulan depan, fokus pada distribusi gender dan generasi.",
    exampleTitle: "Headcount aktif & demografi per entitas Q4 2025",
    suggestedFields: ["Headcount aktif", "Gender", "Generasi", "Masa kerja", "Lokasi"],
  },
  organization_structure: {
    helperText: "Struktur organisasi, span of control, hierarki.",
    examplePurpose:
      "Pemetaan struktur organisasi terkini untuk redesign reporting line di fungsi terkait.",
    exampleTitle: "Org structure & span of control Direktorat HC",
    suggestedFields: ["Hierarki", "Span of control", "Layer", "Reporting line"],
  },
  compensation_analytics: {
    helperText: "Data kompensasi: gaji, tunjangan, benefit. Sensitivitas tinggi — wajib approval.",
    examplePurpose:
      "Compensation benchmarking untuk review struktur gaji middle management vs peer industry.",
    exampleTitle: "Compensation benchmarking middle management 2025",
    suggestedFields: ["Base salary", "Total comp", "Quartile", "Compa-ratio"],
  },
  talent_performance: {
    helperText: "Performance rating, talent pool, succession candidate.",
    examplePurpose:
      "Identifikasi talent untuk program leadership development tahap 3.",
    exampleTitle: "Talent pool & performance distribution H1 2025",
    suggestedFields: ["Performance rating", "Talent category", "Successor", "9-box"],
  },
  learning: {
    helperText: "Training history, learning hour, kompetensi, sertifikasi.",
    examplePurpose:
      "Reporting training compliance untuk audit ISO tahunan.",
    exampleTitle: "Training compliance & learning hour Q3 2025",
    suggestedFields: ["Training hours", "Completion rate", "Sertifikasi"],
  },
  attrition_movement: {
    helperText: "Attrition rate, turnover, mutasi, promosi.",
    examplePurpose:
      "Analisis attrition rate engineer level 1-3 untuk strategi retensi.",
    exampleTitle: "Attrition rate engineer L1-L3 H1 2025",
    suggestedFields: ["Turnover rate", "Reason", "Tenure at exit", "Voluntary/involuntary"],
  },
  custom_analytics: {
    helperText: "Analytics custom yang tidak masuk kategori standar.",
    examplePurpose: "Jelaskan secara detail pertanyaan bisnis yang ingin dijawab.",
    exampleTitle: "Custom analytics: [topik]",
    suggestedFields: [],
  },
  lainnya: {
    helperText: "Permintaan lain yang belum masuk kategori di atas.",
    examplePurpose: "Jelaskan kebutuhan secara rinci.",
    exampleTitle: "",
    suggestedFields: [],
  },
};
