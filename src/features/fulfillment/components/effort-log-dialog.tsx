"use client";

import { useState } from "react";
import { Clock, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useApp } from "@/components/shared/app-context";
import { logEffort } from "@/features/request/lib/queries";
import type { EffortLog } from "@/types/domain";

const PHASES: { value: EffortLog["phase"]; label: string }[] = [
  { value: "clarification", label: "Clarification" },
  { value: "extraction", label: "Extraction" },
  { value: "processing", label: "Processing" },
  { value: "review", label: "Review" },
  { value: "revision", label: "Revision" },
];

export function EffortLogDialog({
  requestId,
  trigger,
}: {
  requestId: string;
  trigger?: React.ReactNode;
}) {
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("1");
  const [phase, setPhase] = useState<EffortLog["phase"]>("processing");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!currentUser) return;
    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0) {
      toast.error("Masukkan jumlah jam yang valid");
      return;
    }
    logEffort(requestId, currentUser.id, h, phase, notes || undefined);
    toast.success(`${h} jam (${phase}) tercatat`);
    setHours("1");
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" />
          Catat effort
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Catat Effort
          </DialogTitle>
          <DialogDescription>
            Pencatatan effort membantu capacity planning dan justifikasi resource tim.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm mb-1 block">Jumlah jam</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Fase pekerjaan</Label>
              <Select value={phase} onValueChange={(v) => setPhase(v as EffortLog["phase"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm mb-1 block">Catatan (opsional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mis: ekstraksi SAP HCM PA0001 dengan filter status aktif"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
