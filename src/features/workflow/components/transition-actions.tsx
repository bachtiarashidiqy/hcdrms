"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApp } from "@/components/shared/app-context";
import { transitionRequest } from "@/features/request/lib/queries";
import { getAllowedTransitions, type Transition } from "@/features/workflow/lib/state-machine";
import type { Request } from "@/types/domain";
import { STATUS_LABELS } from "@/lib/constants";

export function TransitionActions({ request }: { request: Request }) {
  const { currentUser } = useApp();
  const [pending, setPending] = useState<Transition | null>(null);
  const [comment, setComment] = useState("");

  if (!currentUser) return null;

  const transitions = getAllowedTransitions(request.status, currentUser.role);
  if (transitions.length === 0) return null;

  const apply = (t: Transition, providedComment?: string) => {
    transitionRequest(request.id, t.to, currentUser.id, providedComment);
    toast.success(`Status berubah menjadi "${STATUS_LABELS[t.to]}"`);
    setPending(null);
    setComment("");
  };

  const onSelect = (t: Transition) => {
    if (t.requiresComment) {
      setPending(t);
      return;
    }
    apply(t);
  };

  const primary = transitions[0];
  const others = transitions.slice(1);

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => onSelect(primary)}>{primary.label}</Button>
      {others.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-background hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-muted">
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {others.map((t) => (
              <DropdownMenuItem key={t.to} onClick={() => onSelect(t)}>
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.label}</DialogTitle>
            <DialogDescription>
              Berikan alasan atau catatan untuk tindakan ini. Akan dicatat di audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="transition-comment">Catatan</Label>
            <Textarea
              id="transition-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Mis: data tidak lengkap, perlu klarifikasi periode..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Batal
            </Button>
            <Button
              disabled={!comment.trim()}
              onClick={() => pending && apply(pending, comment.trim())}
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
