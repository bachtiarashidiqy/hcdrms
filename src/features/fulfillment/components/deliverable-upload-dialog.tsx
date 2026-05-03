"use client";

import { useState, useMemo } from "react";
import { Upload, X, Plus, AlertTriangle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceInputButton } from "@/components/shared/voice-input";
import { toast } from "sonner";
import { faker } from "@faker-js/faker";
import { useApp } from "@/components/shared/app-context";
import { getDB } from "@/lib/store";
import {
  createDeliverable,
  detectCutOffInconsistency,
} from "@/features/fulfillment/lib/queries";
import type { DeliverableSource } from "@/types/domain";

interface FilePending {
  filename: string;
  size: number;
  mimeType: string;
}

interface SourceDraft {
  id: string;
  dataSourceId: string;
  cutOffDate: string;
  refreshFrequency: string;
  formulaInline: string;
  notes: string;
}

const MIME_BY_EXT: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  pdf: "application/pdf",
  pbix: "application/octet-stream",
};

export function DeliverableUploadDialog({
  requestId,
  open,
  onOpenChange,
}: {
  requestId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { currentUser } = useApp();
  const dataSources = getDB().dataSources.filter((d) => d.status === "active");

  const [files, setFiles] = useState<FilePending[]>([]);
  const [extractionDate, setExtractionDate] = useState(new Date().toISOString().slice(0, 10));
  const [caveats, setCaveats] = useState("");
  const [scopeIncluded, setScopeIncluded] = useState("");
  const [scopeExcluded, setScopeExcluded] = useState("");
  const [sources, setSources] = useState<SourceDraft[]>([
    {
      id: crypto.randomUUID(),
      dataSourceId: "",
      cutOffDate: "",
      refreshFrequency: "",
      formulaInline: "",
      notes: "",
    },
  ]);

  const cutOffWarning = useMemo(() => {
    const valid: DeliverableSource[] = sources
      .filter((s) => s.dataSourceId && s.cutOffDate)
      .map((s) => ({
        dataSourceId: s.dataSourceId,
        cutOffDate: s.cutOffDate,
        refreshFrequency: s.refreshFrequency,
        formulaInline: s.formulaInline || undefined,
        notes: s.notes || undefined,
      }));
    return detectCutOffInconsistency(valid);
  }, [sources]);

  const addMockFile = () => {
    const ext = faker.helpers.arrayElement(["xlsx", "csv", "pdf"]);
    const filename = `${faker.lorem.slug(3)}.${ext}`;
    setFiles((f) => [
      ...f,
      {
        filename,
        size: faker.number.int({ min: 12_000, max: 4_500_000 }),
        mimeType: MIME_BY_EXT[ext],
      },
    ]);
  };

  const addSource = () => {
    setSources((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        dataSourceId: "",
        cutOffDate: "",
        refreshFrequency: "",
        formulaInline: "",
        notes: "",
      },
    ]);
  };

  const updateSource = (id: string, patch: Partial<SourceDraft>) => {
    setSources((s) => s.map((src) => (src.id === id ? { ...src, ...patch } : src)));
  };

  const removeSource = (id: string) => {
    setSources((s) => s.filter((src) => src.id !== id));
  };

  const reset = () => {
    setFiles([]);
    setSources([
      {
        id: crypto.randomUUID(),
        dataSourceId: "",
        cutOffDate: "",
        refreshFrequency: "",
        formulaInline: "",
        notes: "",
      },
    ]);
    setExtractionDate(new Date().toISOString().slice(0, 10));
    setCaveats("");
    setScopeIncluded("");
    setScopeExcluded("");
  };

  const submit = () => {
    if (!currentUser) return;
    if (files.length === 0) {
      toast.error("Upload minimal 1 file deliverable");
      return;
    }
    const validSources = sources.filter((s) => s.dataSourceId && s.cutOffDate);
    if (validSources.length === 0) {
      toast.error("Daftarkan minimal 1 sumber data dengan cut-off");
      return;
    }
    if (!extractionDate) {
      toast.error("Tanggal ekstraksi wajib diisi");
      return;
    }

    createDeliverable({
      requestId,
      files,
      sources: validSources.map((s) => ({
        dataSourceId: s.dataSourceId,
        cutOffDate: s.cutOffDate,
        refreshFrequency: s.refreshFrequency || "ad-hoc",
        formulaInline: s.formulaInline || undefined,
        notes: s.notes || undefined,
      })),
      extractionDate,
      caveats: caveats || undefined,
      scopeIncluded: scopeIncluded || undefined,
      scopeExcluded: scopeExcluded || undefined,
      createdById: currentUser.id,
    });
    toast.success("Deliverable berhasil disubmit untuk review");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Deliverable</DialogTitle>
          <DialogDescription>
            Setelah submit, request akan masuk fase review. Lengkapi metadata sumber data agar reviewer dapat verifikasi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-2">
            <Label className="text-sm">File deliverable</Label>
            <div className="rounded-md border border-dashed p-4 space-y-2">
              {files.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center">
                  Belum ada file. Klik tombol di bawah untuk simulasi upload.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm rounded bg-muted px-3 py-2"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        {f.filename}
                        <span className="text-xs text-muted-foreground">
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setFiles((arr) => arr.filter((_, idx) => idx !== i))}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="outline" size="sm" onClick={addMockFile} className="w-full">
                <Upload className="size-3.5" />
                Simulasi upload file (demo)
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Sumber data ({sources.length})</Label>
              <Button variant="outline" size="sm" onClick={addSource}>
                <Plus className="size-3.5" />
                Tambah sumber
              </Button>
            </div>
            {cutOffWarning && (
              <Alert>
                <AlertTriangle className="size-4 text-amber-600" />
                <AlertDescription className="text-xs">{cutOffWarning}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              {sources.map((s, idx) => (
                <div key={s.id} className="rounded-md border p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Sumber #{idx + 1}</span>
                    {sources.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeSource(s.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs mb-1 block">Data source</Label>
                      <Select
                        value={s.dataSourceId}
                        onValueChange={(v) => updateSource(s.id, { dataSourceId: v ?? "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih sumber..." />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSources.map((ds) => (
                            <SelectItem key={ds.id} value={ds.id}>
                              {ds.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Cut-off date</Label>
                      <Input
                        type="date"
                        value={s.cutOffDate}
                        onChange={(e) => updateSource(s.id, { cutOffDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Formula / query (opsional)</Label>
                    <Textarea
                      rows={2}
                      placeholder="SQL, DAX, atau referensi ke KB Article"
                      value={s.formulaInline}
                      onChange={(e) => updateSource(s.id, { formulaInline: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm mb-1 block">Tanggal ekstraksi</Label>
              <Input
                type="date"
                value={extractionDate}
                onChange={(e) => setExtractionDate(e.target.value)}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <Label className="text-sm mb-1 block">Caveats / known limitations</Label>
              <div className="relative">
                <Textarea
                  rows={2}
                  className="pr-10"
                  placeholder="Hal yang perlu diketahui requestor (mis: data exclude expat, cut-off tidak align)"
                  value={caveats}
                  onChange={(e) => setCaveats(e.target.value)}
                />
                <VoiceInputButton
                  onTranscript={(t) => setCaveats((prev) => (prev ? `${prev} ${t}` : t))}
                  className="absolute top-2 right-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">Scope dicover</Label>
                <Textarea
                  rows={2}
                  placeholder="Apa yang termasuk"
                  value={scopeIncluded}
                  onChange={(e) => setScopeIncluded(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">Scope tidak dicover</Label>
                <Textarea
                  rows={2}
                  placeholder="Apa yang tidak termasuk"
                  value={scopeExcluded}
                  onChange={(e) => setScopeExcluded(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit}>Submit untuk review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
