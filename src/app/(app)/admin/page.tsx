import Link from "next/link";
import { ShieldCheck, Settings, Users, Tag, Database, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Tile {
  title: string;
  description: string;
  href: string;
  Icon: typeof ShieldCheck;
  status: "live" | "phase2";
}

const TILES: Tile[] = [
  {
    title: "Audit Log",
    description: "Immutable log akses dan perubahan data",
    href: "/admin/audit",
    Icon: ShieldCheck,
    status: "live",
  },
  {
    title: "User & Roles",
    description: "Manage user dan role assignment",
    href: "/admin",
    Icon: Users,
    status: "phase2",
  },
  {
    title: "Categories & SLA",
    description: "Konfigurasi kategori request, SLA per prioritas",
    href: "/admin",
    Icon: Tag,
    status: "phase2",
  },
  {
    title: "Approval Matrix",
    description: "Matrix approval level berdasarkan kategori × sensitivitas",
    href: "/admin",
    Icon: Activity,
    status: "phase2",
  },
  {
    title: "Data Source Master",
    description: "Manage master data source",
    href: "/data-sources",
    Icon: Database,
    status: "live",
  },
  {
    title: "System Settings",
    description: "Pengaturan umum platform",
    href: "/admin",
    Icon: Settings,
    status: "phase2",
  },
];

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Master Data & Administration"
        description="Konfigurasi platform — kategori, SLA, approval matrix, dan user management."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((t) => (
          <Link key={t.title} href={t.status === "live" ? t.href : "#"}>
            <Card className={`p-5 hover:shadow-md transition-shadow h-full flex flex-col gap-3 ${t.status === "phase2" ? "opacity-60" : "cursor-pointer"}`}>
              <CardContent className="p-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <t.Icon className="size-4" />
                  </div>
                  {t.status === "phase2" && (
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      Phase 2
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{t.title}</h3>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
