"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/shared/app-context";
import type { Role } from "@/lib/constants";

const ROLES_CAN_CREATE_REQUEST: Role[] = [
  "requestor",
  "requestor_manager",
  "engineer",
  "reviewer",
  "hcis_manager",
];

export function NewRequestAction() {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  if (!ROLES_CAN_CREATE_REQUEST.includes(currentUser.role)) return null;
  return (
    <Button nativeButton={false} render={<Link href="/requests/new" />}>
      <Plus className="size-4" />
      Request Baru
    </Button>
  );
}
