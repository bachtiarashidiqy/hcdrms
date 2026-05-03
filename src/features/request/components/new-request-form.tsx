"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useApp } from "@/components/shared/app-context";
import { createRequest } from "@/features/request/lib/queries";
import { classifySensitivity, sensitivityRationale } from "@/features/request/lib/sensitivity";
import { CATEGORY_TEMPLATES } from "@/features/request/components/category-templates";
import {
  requestFormSchema,
  type RequestFormValues,
} from "@/features/request/schemas/request-form";
import {
  REQUEST_CATEGORIES,
  CATEGORY_LABELS,
  PERTAMINA_ENTITIES,
  OUTPUT_FORMATS,
  OUTPUT_FORMAT_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  type RequestCategory,
  type OutputFormat,
} from "@/lib/constants";
import { SensitivityBadge } from "@/features/request/components/sensitivity-badge";
import { VoiceInputButton } from "@/components/shared/voice-input";

const ROLES_CAN_CREATE = ["requestor", "requestor_manager", "engineer", "reviewer", "hcis_manager"] as const;

export function NewRequestForm() {
  const router = useRouter();
  const { currentUser } = useApp();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser && !ROLES_CAN_CREATE.includes(currentUser.role as typeof ROLES_CAN_CREATE[number])) {
      toast.error("Role Anda tidak memiliki akses untuk membuat request data.");
      router.replace("/requests");
    }
  }, [currentUser, router]);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      category: "headcount_demografi",
      title: "",
      purpose: "",
      periodType: "point-in-time",
      periodDate: "",
      periodStart: "",
      periodEnd: "",
      scopeEntities: [],
      scopeOrgUnits: "",
      granularity: "aggregate",
      outputFormats: ["excel"],
      dueDate: "",
      priority: "standard",
      urgentJustification: "",
    },
  });

  const values = form.watch();
  const template = CATEGORY_TEMPLATES[values.category as RequestCategory];
  const sensitivity = useMemo(() => classifySensitivity(values), [values]);
  const rationale = useMemo(() => sensitivityRationale(values), [values]);

  const onSubmit = (data: RequestFormValues) => {
    if (!currentUser) {
      toast.error("Tidak ada user aktif");
      return;
    }
    setSubmitting(true);
    try {
      const req = createRequest({
        title: data.title,
        category: data.category as RequestCategory,
        purpose: data.purpose,
        requestorId: currentUser.id,
        requestorEntity: currentUser.entity,
        requestorFunction: currentUser.function,
        period:
          data.periodType === "point-in-time"
            ? { type: "point-in-time", date: data.periodDate }
            : { type: "range", startDate: data.periodStart, endDate: data.periodEnd },
        scopeEntities: data.scopeEntities,
        scopeOrgUnits: (data.scopeOrgUnits ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        granularity: data.granularity as "aggregate" | "individual",
        outputFormats: data.outputFormats as OutputFormat[],
        dueDate: data.dueDate,
        priority: data.priority as "standard" | "priority" | "urgent",
        sensitivity,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      });
      toast.success("Request berhasil disubmit", {
        description: `Kode: ${req.code}`,
      });
      router.push(`/requests/${req.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="xs" nativeButton={false} render={<Link href="/requests" />}>
          <ArrowLeft className="size-3.5" />
          Requests
        </Button>
        <span>·</span>
        <span>Request Baru</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buat Request Data Baru</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lengkapi detail di bawah. Form akan adaptif sesuai kategori untuk meminimalkan klarifikasi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Kategori Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Alert>
            <Sparkles className="size-4" />
            <AlertDescription>{template.helperText}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Detail Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup
            label="Judul singkat"
            error={form.formState.errors.title?.message}
            hint={template.exampleTitle ? `Contoh: ${template.exampleTitle}` : undefined}
          >
            <Input {...form.register("title")} placeholder={template.exampleTitle || "Mis: Headcount aktif Q4 2025"} />
          </FieldGroup>

          <FieldGroup
            label="Tujuan penggunaan data"
            error={form.formState.errors.purpose?.message}
            hint="Jelaskan untuk apa data ini digunakan agar tim dapat memberikan hasil yang tepat."
          >
            <div className="relative">
              <Textarea
                {...form.register("purpose")}
                rows={4}
                className="pr-10"
                placeholder={template.examplePurpose}
              />
              <VoiceInputButton
                onTranscript={(t) => {
                  const current = form.getValues("purpose") ?? "";
                  form.setValue("purpose", current ? `${current} ${t}` : t, { shouldValidate: true });
                }}
                className="absolute top-2 right-2"
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Scope & Periode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup label="Tipe periode">
            <Controller
              control={form.control}
              name="periodType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="point-in-time">Point in time (snapshot)</SelectItem>
                    <SelectItem value="range">Range periode</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FieldGroup>

          {values.periodType === "point-in-time" ? (
            <FieldGroup label="Tanggal snapshot" error={form.formState.errors.periodDate?.message}>
              <Input type="date" {...form.register("periodDate")} />
            </FieldGroup>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup label="Tanggal mulai">
                <Input type="date" {...form.register("periodStart")} />
              </FieldGroup>
              <FieldGroup label="Tanggal selesai">
                <Input type="date" {...form.register("periodEnd")} />
              </FieldGroup>
            </div>
          )}

          <FieldGroup
            label="Scope entitas"
            error={form.formState.errors.scopeEntities?.message}
          >
            <Controller
              control={form.control}
              name="scopeEntities"
              render={({ field }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-md border p-3">
                  {PERTAMINA_ENTITIES.map((entity) => {
                    const checked = field.value.includes(entity);
                    return (
                      <label key={entity} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) =>
                            field.onChange(
                              c
                                ? [...field.value, entity]
                                : field.value.filter((e: string) => e !== entity),
                            )
                          }
                        />
                        <span className="line-clamp-1">{entity}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </FieldGroup>

          <FieldGroup
            label="Unit organisasi (opsional)"
            hint="Pisahkan dengan koma. Kosongkan untuk seluruh organisasi."
          >
            <Input
              {...form.register("scopeOrgUnits")}
              placeholder="Mis: Direktorat HC, Direktorat Operasi"
            />
          </FieldGroup>

          <FieldGroup label="Level granularity">
            <Controller
              control={form.control}
              name="granularity"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aggregate">Aggregate (data agregat tanpa identifikasi individu)</SelectItem>
                    <SelectItem value="individual">Individual (data per karyawan)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Output & Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup
            label="Format output yang diharapkan"
            error={form.formState.errors.outputFormats?.message}
          >
            <Controller
              control={form.control}
              name="outputFormats"
              render={({ field }) => (
                <div className="flex flex-wrap gap-3">
                  {OUTPUT_FORMATS.map((fmt) => {
                    const checked = field.value.includes(fmt);
                    return (
                      <label key={fmt} className="flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-1.5">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) =>
                            field.onChange(
                              c
                                ? [...field.value, fmt]
                                : field.value.filter((f: string) => f !== fmt),
                            )
                          }
                        />
                        {OUTPUT_FORMAT_LABELS[fmt]}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Tanggal dibutuhkan" error={form.formState.errors.dueDate?.message}>
              <Input type="date" {...form.register("dueDate")} />
            </FieldGroup>
            <FieldGroup label="Prioritas">
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FieldGroup>
          </div>

          {values.priority === "urgent" && (
            <FieldGroup
              label="Justifikasi urgent"
              error={form.formState.errors.urgentJustification?.message}
              hint="Jelaskan alasan perlu prioritas urgent (rapat eksekutif, audit deadline, dll)."
            >
              <Textarea {...form.register("urgentJustification")} rows={3} />
            </FieldGroup>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="size-4" />
            5. Klasifikasi Sensitivitas (Otomatis)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <SensitivityBadge level={sensitivity} />
            <span className="text-xs text-muted-foreground">
              Ditentukan otomatis berdasarkan kategori dan granularity.
            </span>
          </div>
          <Alert>
            <AlertDescription className="text-xs">{rationale}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" type="button" nativeButton={false} render={<Link href="/requests" />}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting}>
          <CheckCircle2 className="size-4" />
          Submit Request
        </Button>
      </div>
    </form>
  );
}

function FieldGroup({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
