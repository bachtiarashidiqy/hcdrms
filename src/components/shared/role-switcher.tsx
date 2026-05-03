"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, UserCog, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/shared/app-context";
import { getDB } from "@/lib/store";
import { ROLE_LABELS, type Role } from "@/lib/constants";

const PRESENTATION_ROLES: Role[] = [
  "requestor",
  "engineer",
  "reviewer",
  "hcis_manager",
  "data_owner",
  "auditor",
];

export function RoleSwitcher() {
  const router = useRouter();
  const { currentUser, setCurrentUserId, logout, version, hydrated } = useApp();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const usersByRole = useMemo(() => {
    if (!hydrated || !currentUser) return new Map<Role, ReturnType<typeof getDB>["users"]>();
    const db = getDB();
    const map = new Map<Role, typeof db.users>();
    for (const user of db.users) {
      const list = map.get(user.role) ?? [];
      list.push(user);
      map.set(user.role, list);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, currentUser, version]);

  if (!hydrated) {
    return (
      <div className="inline-flex items-center gap-2 h-9 px-2.5 text-xs text-muted-foreground">
        <UserCog className="size-4" />
        Memuat…
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 h-9 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-muted">
        <Avatar className="size-6">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {currentUser.initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-xs font-medium">{currentUser.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {ROLE_LABELS[currentUser.role]}
          </span>
        </div>
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <UserCog className="size-4" />
            Demo Role Switcher
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PRESENTATION_ROLES.map((role) => {
            const users = usersByRole.get(role) ?? [];
            const sample = users[0];
            if (!sample) return null;
            const active = currentUser.id === sample.id;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => setCurrentUserId(sample.id)}
                className="flex items-center gap-3 py-2"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{sample.initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col leading-tight min-w-0">
                  <span className="text-sm font-medium line-clamp-1">{sample.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{sample.entity}</span>
                </div>
                <Badge variant={active ? "default" : "secondary"} className="text-[10px] shrink-0">
                  {ROLE_LABELS[role]}
                </Badge>
                {active && <Check className="size-3.5 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 focus:text-red-700">
            <LogOut className="size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
