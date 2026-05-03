"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface VoiceInputButtonProps {
  /** Dipanggil dengan teks final saat user berhenti merekam atau hasil final tiba */
  onTranscript: (finalText: string) => void;
  /** Bahasa, default Indonesia */
  lang?: string;
  className?: string;
  size?: "sm" | "default";
}

export function VoiceInputButton({
  onTranscript,
  lang = "id-ID",
  className,
  size = "sm",
}: VoiceInputButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTextRef = useRef<string>("");

  useEffect(() => {
    setSupported(getSpeechRecognition() !== null);
  }, []);

  const stop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const start = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error("Voice input tidak didukung browser ini. Gunakan Chrome atau Edge.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    finalTextRef.current = "";

    recognition.onresult = (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) chunk += r[0].transcript;
      }
      if (chunk) {
        finalTextRef.current += chunk;
      }
    };

    recognition.onerror = (event) => {
      const code = event.error;
      if (code === "not-allowed" || code === "service-not-allowed") {
        toast.error("Akses mikrofon ditolak. Berikan izin di settings browser.");
      } else if (code === "no-speech") {
        // diam saja, biarkan onend handle
      } else if (code !== "aborted") {
        toast.error(`Voice error: ${code}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      const text = finalTextRef.current.trim();
      if (text) {
        onTranscript(text);
      }
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      toast.error("Gagal memulai voice input");
    }
  };

  const toggle = () => {
    if (listening) stop();
    else start();
  };

  if (!supported) return null;

  const Icon = listening ? MicOff : Mic;
  const sizeClass = size === "sm" ? "size-7" : "size-9";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Stop merekam" : "Voice to text (Bahasa Indonesia)"}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors",
        sizeClass,
        listening
          ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {listening ? (
        <>
          <Loader2 className={cn(iconSize, "animate-spin absolute")} />
          <Icon className={cn(iconSize, "opacity-0")} />
        </>
      ) : (
        <Icon className={iconSize} />
      )}
    </button>
  );
}
