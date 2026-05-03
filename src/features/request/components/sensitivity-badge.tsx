import { Badge } from "@/components/ui/badge";
import { SENSITIVITY_LABELS, type SensitivityLevel } from "@/lib/constants";
import { Lock, ShieldAlert, Shield, Globe } from "lucide-react";

const COLORS: Record<SensitivityLevel, string> = {
  public: "bg-emerald-50 text-emerald-700 border-emerald-200",
  internal: "bg-blue-50 text-blue-700 border-blue-200",
  confidential: "bg-amber-50 text-amber-700 border-amber-200",
  restricted: "bg-red-50 text-red-700 border-red-200",
};

const ICONS: Record<SensitivityLevel, typeof Lock> = {
  public: Globe,
  internal: Shield,
  confidential: Lock,
  restricted: ShieldAlert,
};

export function SensitivityBadge({ level }: { level: SensitivityLevel }) {
  const Icon = ICONS[level];
  return (
    <Badge variant="outline" className={`font-normal gap-1 ${COLORS[level]}`}>
      <Icon className="size-3" />
      {SENSITIVITY_LABELS[level]}
    </Badge>
  );
}
