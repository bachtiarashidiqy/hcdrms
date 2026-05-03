"use client";

import { Bell, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { RoleSwitcher } from "@/components/shared/role-switcher";
import { useApp } from "@/components/shared/app-context";
import { toast } from "sonner";

export function AppHeader() {
  const { resetData } = useApp();

  const handleReset = () => {
    if (confirm("Reset semua data demo ke kondisi awal?")) {
      resetData();
      toast.success("Data demo telah di-reset");
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sticky top-0 z-30">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="hidden sm:flex flex-1 items-center gap-2 max-w-md min-w-0">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Cari request, KB, atau data source..."
            className="h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 text-sm shadow-xs outline-hidden placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleReset}
          title="Reset data demo"
        >
          <RefreshCw className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-red-500" />
        </Button>
        <RoleSwitcher />
      </div>
    </header>
  );
}
