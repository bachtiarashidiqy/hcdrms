"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { MessageCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VoiceInputButton } from "@/components/shared/voice-input";
import { useApp } from "@/components/shared/app-context";
import { addClarification, getUser } from "@/features/request/lib/queries";
import { ROLE_LABELS } from "@/lib/constants";
import type { ClarificationMessage } from "@/types/domain";

export function ClarificationThread({
  requestId,
  clarifications,
}: {
  requestId: string;
  clarifications: ClarificationMessage[];
}) {
  const { currentUser } = useApp();
  const [content, setContent] = useState("");

  const submit = () => {
    if (!currentUser || !content.trim()) return;
    addClarification(requestId, currentUser.id, content.trim());
    setContent("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="size-4" />
          Klarifikasi & Diskusi ({clarifications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {clarifications.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
            Belum ada klarifikasi. Mulai diskusi di bawah.
          </div>
        ) : (
          <div className="space-y-4">
            {clarifications.map((msg) => {
              const author = getUser(msg.authorId);
              return (
                <div key={msg.id} className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-xs">{author?.initials ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium">{author?.name ?? "Unknown"}</span>
                      {author && (
                        <span className="text-[10px] text-muted-foreground">
                          {ROLE_LABELS[author.role]}
                        </span>
                      )}
                      <span
                        className="text-[10px] text-muted-foreground"
                        title={format(new Date(msg.createdAt), "d MMM yyyy HH:mm", { locale: localeID })}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), { locale: localeID, addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentUser && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="relative">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tulis klarifikasi atau pertanyaan..."
                    rows={3}
                    className="pr-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                  />
                  <VoiceInputButton
                    onTranscript={(t) => setContent((prev) => (prev ? `${prev} ${t}` : t))}
                    className="absolute top-2 right-2"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    Ctrl/Cmd + Enter untuk kirim · Klik mic untuk voice input
                  </span>
                  <Button size="sm" disabled={!content.trim()} onClick={submit}>
                    <Send className="size-3.5" />
                    Kirim
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
