"use client";

import { useState } from "react";
import { Star, CheckCircle2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApp } from "@/components/shared/app-context";
import { recordCsat } from "@/features/fulfillment/lib/queries";
import { cn } from "@/lib/utils";

export function CsatDialog({
  requestId,
  open,
  onOpenChange,
  mode,
}: {
  requestId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "confirm" | "revision";
}) {
  const { currentUser } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submit = () => {
    if (!currentUser) return;
    if (mode === "revision" && !comment.trim()) {
      toast.error("Mohon jelaskan alasan revisi yang dibutuhkan");
      return;
    }
    recordCsat(requestId, currentUser.id, rating, comment.trim() || undefined, mode);
    toast.success(
      mode === "confirm"
        ? "Terima kasih! Request ditutup dengan rating Anda."
        : "Request akan dibuka kembali untuk revisi.",
    );
    setRating(5);
    setComment("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "confirm" ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-600" />
                Konfirmasi Penerimaan
              </>
            ) : (
              <>
                <RotateCcw className="size-4 text-amber-600" />
                Minta Revisi
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "confirm"
              ? "Berikan rating kepuasan singkat. Membantu tim untuk continuous improvement."
              : "Jelaskan apa yang perlu direvisi. Request akan kembali ke engineer."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "confirm" && (
            <div>
              <Label className="text-sm mb-2 block">Rating kepuasan (1–5)</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      n <= rating ? "text-amber-500" : "text-muted-foreground hover:text-amber-300",
                    )}
                  >
                    <Star className={cn("size-7", n <= rating && "fill-current")} />
                  </button>
                ))}
                <span className="ml-3 text-sm font-medium">{rating} / 5</span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm mb-1 block">
              {mode === "confirm" ? "Komentar (opsional)" : "Alasan revisi (wajib)"}
            </Label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                mode === "confirm"
                  ? "Apa yang sudah baik atau bisa ditingkatkan?"
                  : "Apa yang perlu direvisi pada hasil?"
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={submit}
            variant={mode === "revision" ? "outline" : "default"}
          >
            {mode === "confirm" ? "Konfirmasi & Tutup" : "Kirim Revisi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
