"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui";

export function LabTrendChart({
  tests,
}: {
  tests: Array<{
    testName: string;
    numericValue: number | null;
    unit: string | null;
    reportDate: string | Date | null;
    document: { filename: string };
  }>;
}) {
  const groups = new Map<string, typeof tests>();
  for (const test of tests) {
    if (test.numericValue == null || !test.reportDate) continue;
    const key = `${test.testName}|${test.unit ?? ""}`;
    const list = groups.get(key) ?? [];
    list.push(test);
    groups.set(key, list);
  }

  const series = [...groups.entries()]
    .map(([key, rows]) => ({
      key,
      name: rows[0].testName,
      unit: rows[0].unit,
      points: rows
        .slice()
        .sort((a, b) => new Date(a.reportDate as Date).getTime() - new Date(b.reportDate as Date).getTime())
        .map((r) => ({
          date: formatDate(r.reportDate),
          value: r.numericValue as number,
          source: r.document.filename,
        })),
    }))
    .filter((s) => s.points.length >= 2);

  if (!series.length) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold">Recorded values over time</h3>
        <p className="mt-2 text-sm text-slate-600">
          Charts appear when the same laboratory test is documented on more than one date with a compatible unit.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {series.map((s) => (
        <Card key={s.key} className="p-4">
          <h3 className="font-semibold text-slate-900">{s.name}</h3>
          <p className="text-xs text-slate-500">Recorded values over time{s.unit ? ` (${s.unit})` : ""}</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.points}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value} ${s.unit ?? ""}`, "Value"]}
                  labelFormatter={(label, payload) =>
                    `${label}${payload?.[0]?.payload?.source ? ` • ${payload[0].payload.source}` : ""}`
                  }
                />
                <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ))}
    </div>
  );
}
