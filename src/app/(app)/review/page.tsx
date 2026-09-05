"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReviewPanel } from "@/components/ReviewPanel";
import { ClarificationCard } from "@/components/cards";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

export default function ReviewQueuePage() {
  const [data, setData] = useState<{ tests: any[]; clarifications: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/review-queue");
    const json = await res.json();
    if (!res.ok) setError(json.error);
    else setData(json);
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Review queue</h1>
      <p className="text-sm text-slate-600">Low-confidence values automatically enter this queue. Confidence is extraction quality, not clinical certainty.</p>
      {!data.tests.length && !data.clarifications.length ? (
        <EmptyState title="Some fields require manual verification." body="Nothing is waiting right now. Load the demo patient to see a low-confidence Folate result." />
      ) : null}
      {data.tests.map((t) => (
        <div key={t.id} className="space-y-2">
          <Link className="text-sm text-teal-800 hover:underline" href={`/patients/${t.patientId}/review`}>
            {t.patient.fullName}
          </Link>
          <ReviewPanel test={t} onChanged={load} />
        </div>
      ))}
      {data.clarifications.map((c) => (
        <ClarificationCard key={c.id} item={c} />
      ))}
    </div>
  );
}
