"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Timeline } from "@/components/Timeline";
import { EmptyState, LoadingState } from "@/components/states";

export default function GlobalTimelinePage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/patients");
      const data = await res.json();
      const list = data.patients ?? [];
      setPatients(list);
      if (list[0]) {
        const tl = await fetch(`/api/patients/${list[0].id}/timeline`);
        const json = await tl.json();
        setEvents(json.events ?? []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (!patients.length) return <EmptyState title="No timeline yet." body="Load the demo patient to see a chronology of documented events." />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Timeline</h1>
      <p className="text-sm text-slate-600">
        Showing {patients[0].fullName}.{" "}
        <Link className="text-teal-800 underline" href={`/patients/${patients[0].id}/timeline`}>
          Open patient timeline
        </Link>
      </p>
      <Timeline events={events} />
    </div>
  );
}
