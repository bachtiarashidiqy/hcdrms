import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface TopListItem {
  primary: string;
  secondary?: string;
  count: number;
  initials?: string;
}

export function TopList({
  title,
  description,
  items,
  countLabel = "request",
  Icon = Trophy,
}: {
  title: string;
  description?: string;
  items: TopListItem[];
  countLabel?: string;
  Icon?: typeof Trophy;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="size-4" />
          {title}
        </CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Data belum tersedia.</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground tabular-nums w-5">{i + 1}.</span>
              {item.initials && (
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">{item.initials}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium line-clamp-1">{item.primary}</div>
                {item.secondary && (
                  <div className="text-xs text-muted-foreground line-clamp-1">{item.secondary}</div>
                )}
              </div>
              <span className="text-xs font-medium tabular-nums">
                {item.count} <span className="text-muted-foreground font-normal">{countLabel}</span>
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
