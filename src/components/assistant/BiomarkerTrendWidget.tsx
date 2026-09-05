"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from "recharts";

export type TrendPoint = {
  date: string;
  value: number;
  label?: string;
  status?: "NORMAL" | "HIGH" | "LOW";
  source?: string;
};

export type TrendSeries = {
  name: string;
  unit: string;
  referenceLow?: number | null;
  referenceHigh?: number | null;
  points: TrendPoint[];
};

const DEFAULT_SERIES: TrendSeries[] = [
  {
    name: "Cholesterol",
    unit: "mg/dL",
    referenceLow: 120,
    referenceHigh: 200,
    points: [
      { date: "10/23", value: 120, label: "120", status: "NORMAL" },
      { date: "10/24", value: 199, label: "199", status: "NORMAL" },
      { date: "12/24", value: 185, label: "185", status: "NORMAL" },
      { date: "02/25", value: 157, label: "157", status: "NORMAL" },
      { date: "06/25", value: 215, label: "215", status: "HIGH" },
      { date: "03/26", value: 240, label: "240", status: "HIGH" },
      { date: "09/26", value: 265, label: "265", status: "HIGH" },
    ],
  },
  {
    name: "Hemoglobin",
    unit: "g/dL",
    referenceLow: 12.0,
    referenceHigh: 16.0,
    points: [
      { date: "10/23", value: 13.5, label: "13.5", status: "NORMAL" },
      { date: "06/24", value: 12.8, label: "12.8", status: "NORMAL" },
      { date: "01/25", value: 12.4, label: "12.4", status: "NORMAL" },
      { date: "06/25", value: 11.2, label: "11.2", status: "LOW" },
      { date: "03/26", value: 9.8, label: "9.8", status: "LOW" },
      { date: "09/26", value: 9.2, label: "9.2", status: "LOW" },
    ],
  },
  {
    name: "Glucose (Fasting)",
    unit: "mg/dL",
    referenceLow: 70,
    referenceHigh: 99,
    points: [
      { date: "10/23", value: 85, label: "85", status: "NORMAL" },
      { date: "01/24", value: 92, label: "92", status: "NORMAL" },
      { date: "06/24", value: 95, label: "95", status: "NORMAL" },
      { date: "01/25", value: 102, label: "102", status: "HIGH" },
      { date: "06/25", value: 108, label: "108", status: "HIGH" },
      { date: "09/26", value: 114, label: "114", status: "HIGH" },
    ],
  },
  {
    name: "Platelets",
    unit: "x10^3/uL",
    referenceLow: 150,
    referenceHigh: 450,
    points: [
      { date: "10/23", value: 220, label: "220", status: "NORMAL" },
      { date: "06/24", value: 210, label: "210", status: "NORMAL" },
      { date: "01/25", value: 185, label: "185", status: "NORMAL" },
      { date: "09/26", value: 142, label: "142", status: "LOW" },
    ],
  },
];

export function BiomarkerTrendWidget({
  customSeries,
  selectedBiomarker,
  onBiomarkerChange,
}: {
  customSeries?: TrendSeries[];
  selectedBiomarker?: string;
  onBiomarkerChange?: (name: string) => void;
}) {
  const allSeries = customSeries && customSeries.length > 0 ? customSeries : DEFAULT_SERIES;
  const [internalSelected, setInternalSelected] = useState(allSeries[0]?.name || "Cholesterol");

  const currentName = selectedBiomarker ?? internalSelected;
  const activeSeries = useMemo(() => {
    return allSeries.find((s) => s.name === currentName) || allSeries[0] || DEFAULT_SERIES[0];
  }, [allSeries, currentName]);

  const handleChange = (val: string) => {
    setInternalSelected(val);
    onBiomarkerChange?.(val);
  };

  return (
    <div className="rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-md p-4 border border-white/60 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
      {/* Top Header & Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white text-base">Biomarker Trend Tracking</h3>
        <div className="flex items-center gap-3">
          {/* Legend dots */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {activeSeries.name}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Target / Alert
            </span>
          </div>
          {/* Select Dropdown */}
          <select
            value={activeSeries.name}
            onChange={(e) => handleChange(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            aria-label="Select biomarker"
          >
            {allSeries.map((s) => (
              <option key={s.name} value={s.name} className="dark:bg-slate-800 dark:text-slate-100">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-3 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activeSeries.points} margin={{ top: 20, right: 16, left: -20, bottom: 5 }}>
            <CartesianGrid stroke="#64748b" strokeOpacity={0.2} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={{ stroke: "#64748b", strokeOpacity: 0.3 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={{ stroke: "#64748b", strokeOpacity: 0.3 }}
              tickLine={false}
              domain={["dataMin - 10", "dataMax + 20"]}
            />
            {activeSeries.referenceLow != null && activeSeries.referenceHigh != null && (
              <ReferenceArea
                y1={activeSeries.referenceLow}
                y2={activeSeries.referenceHigh}
                fill="#10b981"
                fillOpacity={0.08}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TrendPoint;
                  return (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs shadow-lg">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {data.date}: {data.value} {activeSeries.unit}
                      </p>
                      <p
                        className={`text-[10px] font-medium ${
                          data.status === "HIGH"
                            ? "text-rose-600 dark:text-rose-400"
                            : data.status === "LOW"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        Status: {data.status || "NORMAL"}
                      </p>
                      {activeSeries.referenceLow && activeSeries.referenceHigh ? (
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">
                          Target: {activeSeries.referenceLow}–{activeSeries.referenceHigh} {activeSeries.unit}
                        </p>
                      ) : null}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isAbnormal = payload.status === "HIGH" || payload.status === "LOW";
                return (
                  <g key={`${cx}-${cy}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill={isAbnormal ? "#f43f5e" : "#10b981"}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                    {/* Floating Value Pill */}
                    <g transform={`translate(${cx - 14}, ${cy - 20})`}>
                      <rect
                        width={28}
                        height={14}
                        rx={4}
                        fill={isAbnormal ? "#f43f5e" : "#10b981"}
                      />
                      <text
                        x={14}
                        y={10}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={8.5}
                        fontWeight="bold"
                      >
                        {payload.label || payload.value}
                      </text>
                    </g>
                  </g>
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 px-1">
        <span>Unit: {activeSeries.unit}</span>
        {activeSeries.referenceLow && activeSeries.referenceHigh && (
          <span className="text-emerald-700 font-medium">
            Normal Reference Band: {activeSeries.referenceLow}–{activeSeries.referenceHigh} {activeSeries.unit}
          </span>
        )}
      </div>
    </div>
  );
}
