"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const STATUS_LABEL: Record<string, string> = {
  funded: "Open",
  pending_recipient: "Awaiting wallet",
  released: "Paid out",
  refunded: "Refunded",
};
const STATUS_COLOR: Record<string, string> = {
  funded: "#2775ca",
  pending_recipient: "#d98c0f",
  released: "#0f9d58",
  refunded: "#b3bac3",
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink-900">{title}</h2>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

export function AnalyticsCharts({
  weeklyActivity,
  statusCounts,
  topRepos,
}: {
  weeklyActivity: { week: string; bounties: number }[];
  statusCounts: { status: string; count: number }[];
  topRepos: { name: string; stars: number }[];
}) {
  const pieData = statusCounts.filter((s) => s.count > 0).map((s) => ({ name: STATUS_LABEL[s.status] ?? s.status, value: s.count, key: s.status }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Bounties funded per week">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyActivity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bountyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2775ca" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2775ca" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#8992a0" }} axisLine={{ stroke: "#d7dbe0" }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8992a0" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #d7dbe0" }} />
            <Area type="monotone" dataKey="bounties" stroke="#2775ca" strokeWidth={2} fill="url(#bountyFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Bounty status breakdown">
        {pieData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-400">No bounties yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLOR[entry.key] ?? "#8992a0"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #d7dbe0" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Top repos by stars">
        {topRepos.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-400">No projects listed yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRepos} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#8992a0" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#4d5566" }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #d7dbe0" }} />
              <Bar dataKey="stars" fill="#d98c0f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
