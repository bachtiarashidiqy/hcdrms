"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  ListChecks,
  BookOpen,
  Database,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/components/shared/app-context";
import type { Role } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const NAV_MAIN: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Requests", href: "/requests", icon: Inbox },
  {
    label: "Worklist",
    href: "/worklist",
    icon: ListChecks,
    roles: ["engineer", "reviewer", "hcis_manager"],
  },
];

const NAV_KNOWLEDGE: NavItem[] = [
  { label: "Knowledge Base", href: "/kb", icon: BookOpen },
  { label: "Data Source Catalog", href: "/data-sources", icon: Database },
];

const NAV_ADMIN: NavItem[] = [
  {
    label: "Audit Log",
    href: "/admin/audit",
    icon: ShieldCheck,
    roles: ["auditor", "admin", "hcis_manager"],
  },
  {
    label: "Master Data",
    href: "/admin",
    icon: Settings,
    roles: ["admin", "hcis_manager"],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const role = user?.role;

  const visible = (item: NavItem) => !item.roles || (role && item.roles.includes(role));
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={isActive(item.href)}
        tooltip={item.label}
      >
        <item.icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">HC-DRMS</span>
            <span className="text-xs text-muted-foreground">Energi Nusantara HCIS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{NAV_MAIN.filter(visible).map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Knowledge</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{NAV_KNOWLEDGE.filter(visible).map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {NAV_ADMIN.some(visible) && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{NAV_ADMIN.filter(visible).map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          PoC Demo · Phase 1
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
