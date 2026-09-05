"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { ErrorState, LoadingState } from "@/components/states";
import { ConflictCard } from "@/components/cards";
import { formatDate } from "@/lib/utils";

type Dashboard = {
  stats: {
    patients: number;
    reports: number;
    awaitingVerification: number;
    extractionIssues: number;
    itemsNeedReview: number;
  };
  recentPatients: Array<{ id: string; fullName: string; medicalRecordNumber: string }>;
  recentReports: Array<{ id: string; filename: string; processingStatus: string; patient: { id: string; fullName: string } }>;
  conflicts: Array<{ id: string; description: string; severity: string; status: string; patient: { id: string } }>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    if (!res.ok) setError(json.error || "Unable to load dashboard.");
    else setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function loadDemo() {
    setBusy(true);
    const res = await fetch("/api/demo/load", { method: "POST" });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Unable to load demo patient.");
      return;
    }
    router.push(`/patients/${json.patient.id}`);
  }

  if (loading) return <LoadingState label="Loading dashboard" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const stats = [
    { label: "Total patients", value: data.stats.patients },
    { label: "Reports processed", value: data.stats.reports },
    { label: "Reports awaiting verification", value: data.stats.awaitingVerification },
    { label: "Extraction issues", value: data.stats.extractionIssues },
  ];

  return (
    <div className="fade-in mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">MedLens</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Clinical information dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            MedLens turns messy medical documents into a structured, traceable patient record.
          </p>
        </div>
        <Button onClick={loadDemo} disabled={busy}>
          {busy ? "Loading demo…" : "Load Demo Patient"}
        </Button>
      </div>

      <Card className="border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-950">
        {data.stats.itemsNeedReview} items need review
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold">Recent patients</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.recentPatients.map((p) => (
              <li key={p.id}>
                <Link className="text-teal-800 hover:underline" href={`/patients/${p.id}`}>
                  {p.fullName}
                </Link>
                <span className="block text-xs text-slate-500">{p.medicalRecordNumber}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Recent reports</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.recentReports.map((r) => (
              <li key={r.id}>
                <Link className="text-teal-800 hover:underline" href={`/patients/${r.patient.id}/reports`}>
                  {r.filename}
                </Link>
                <span className="block text-xs text-slate-500">{r.patient.fullName} • {r.processingStatus}</span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-3">
          <h2 className="font-semibold">Recent alerts / conflicts</h2>
          {data.conflicts.length ? (
            data.conflicts.map((c) => (
              <ConflictCard
                key={c.id}
                conflict={c}
                onAction={() => router.push(`/patients/${c.patient.id}?tab=review`)}
              />
            ))
          ) : (
            <Card className="p-5 text-sm text-slate-600">No open inconsistencies.</Card>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400">{formatDate(new Date())} • Demo workspace uses synthetic records only.</p>
    </div>
  );
}
