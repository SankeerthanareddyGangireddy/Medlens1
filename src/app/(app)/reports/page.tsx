"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Input } from "@/components/ui";
import { ProcessingStatus } from "@/components/badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);
        const data = await res.json();
        if (active) {
          if (!res.ok) setError(data.error);
          else setReports(data.reports);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error loading reports");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchReports();
    return () => {
      active = false;
    };
  }, [q, type]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <Input placeholder="Document name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Document name" />
        <Input placeholder="Report type" value={type} onChange={(e) => setType(e.target.value)} aria-label="Report type" />
        <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm text-white" type="submit">
          Filter
        </button>
      </form>
      {error ? <ErrorState message={error} /> : null}
      {loading ? (
        <LoadingState />
      ) : reports.length ? (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link key={r.id} href={`/patients/${r.patientId}/reports`}>
              <Card className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{r.filename}</p>
                  <p className="text-sm text-slate-500">
                    {r.patient.fullName} • {r.documentType} • {formatDate(r.reportDate)}
                  </p>
                </div>
                <ProcessingStatus status={r.processingStatus} />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No reports uploaded yet." body="Use Upload or Load Demo Patient to populate this list." />
      )}
    </div>
  );
}
