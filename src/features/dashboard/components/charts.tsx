"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = {
  primary: "#0f172a",
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  slate: "#94a3b8",
  cyan: "#06b6d4",
};

const CHART_PALETTE = [
  COLORS.blue,
  COLORS.emerald,
  COLORS.violet,
  COLORS.amber,
  COLORS.cyan,
  COLORS.red,
  COLORS.slate,
  "#ec4899",
  "#14b8a6",
];

interface ChartCardProps {
  title: string;
  description?: string;
  height?: number;
  children: React.ReactNode;
}

export function ChartCard({ title, description, height = 280, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function VolumeChart({ data }: { data: { date: string; submitted: number; closed: number }[] }) {
  return (
    <ChartCard
      title="Volume Request"
      description="Submitted vs Closed dalam 60 hari terakhir"
      height={260}
    >
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="g-submitted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g-closed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          fontSize={10}
          tick={{ fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          interval={Math.max(1, Math.floor(data.length / 12))}
        />
        <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelStyle={{ color: "#0f172a", fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area
          type="monotone"
          dataKey="submitted"
          name="Submitted"
          stroke={COLORS.blue}
          fill="url(#g-submitted)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="closed"
          name="Closed"
          stroke={COLORS.emerald}
          fill="url(#g-closed)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartCard>
  );
}

export function CategoryBarChart({ data }: { data: { category: string; count: number }[] }) {
  return (
    <ChartCard title="Top Kategori Request" description="Volume per kategori (semua status)" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis type="number" fontSize={10} tick={{ fill: "#64748b" }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="category"
          fontSize={10}
          tick={{ fill: "#475569" }}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" fill={COLORS.blue} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function StatusDistributionChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ChartCard title="Distribusi Status" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="status"
          fontSize={9}
          tick={{ fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          angle={-30}
          textAnchor="end"
          height={50}
          interval={0}
        />
        <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartCard>
  );
}

export function WorkloadChart({
  data,
}: {
  data: { name: string; initials: string; active: number; closed: number }[];
}) {
  return (
    <ChartCard title="Beban Kerja Engineer" description="Active vs Closed per engineer" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="initials"
          fontSize={10}
          tick={{ fill: "#475569" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis fontSize={10} tick={{ fill: "#64748b" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelFormatter={(label, items) => {
            const item = items[0]?.payload;
            return item?.name ?? label;
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="active" name="Active" stackId="a" fill={COLORS.amber} radius={[0, 0, 0, 0]} />
        <Bar dataKey="closed" name="Closed" stackId="a" fill={COLORS.emerald} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function EffortByCategoryChart({ data }: { data: { category: string; hours: number }[] }) {
  return (
    <ChartCard title="Effort per Kategori" description="Total jam yang dihabiskan per kategori" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis type="number" fontSize={10} tick={{ fill: "#64748b" }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="category"
          fontSize={10}
          tick={{ fill: "#475569" }}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => [`${v} jam`, "Effort"]}
        />
        <Bar dataKey="hours" fill={COLORS.violet} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function SensitivityGrid({ data }: { data: { level: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sensitivity Heatmap</CardTitle>
        <p className="text-xs text-muted-foreground">Distribusi level sensitivitas data yang diminta</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {data.map((d) => {
            const pct = total > 0 ? (d.count / total) * 100 : 0;
            return (
              <div
                key={d.level}
                className="rounded-md p-3 border"
                style={{ borderColor: d.color, backgroundColor: `${d.color}10` }}
              >
                <div className="text-xs font-medium text-muted-foreground">{d.level}</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-semibold tabular-nums" style={{ color: d.color }}>
                    {d.count}
                  </span>
                  <span className="text-xs text-muted-foreground">({pct.toFixed(0)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
