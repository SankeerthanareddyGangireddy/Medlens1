"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AISummaryCard, ClarificationCard, ConflictCard, PatientOverviewCard, ReportCard } from "@/components/cards";
import { LabDetail, LabResultsTable, type LabRow } from "@/components/LabResultsTable";
import { LabTrendChart } from "@/components/LabTrendChart";
import { AuditLog, Timeline } from "@/components/Timeline";
import { ReviewPanel } from "@/components/ReviewPanel";
import { SourceViewer } from "@/components/states";
import { ErrorState, LoadingState } from "@/components/states";
import { Badge, Button, Card } from "@/components/ui";
import { ProvenanceBadge } from "@/components/badges";
import { calculateAge, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const tabs = ["Overview", "Reports", "Lab Results", "Timeline", "AI Summary", "Review", "Audit History"] as const;

export default function PatientPage({ defaultTab }: { defaultTab?: string }) {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<(typeof tabs)[number]>(
    (defaultTab as (typeof tabs)[number]) || "Overview",
  );
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LabRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/patients/${params.id}`);
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else setPatient(data.patient);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error} />;
  if (!patient) return <LoadingState label="Loading patient" />;

  const age = calculateAge(new Date(patient.dateOfBirth));
  const pending = patient.tests.filter((t: any) => t.verificationStatus === "PENDING" || t.confidence < 0.7);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PatientOverviewCard patient={patient} age={age} />
        <div className="flex flex-wrap gap-2">
          <Link href={`/assistant?patientId=${patient.id}`}>
            <Button className="bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Medi-Report Assistant</span>
            </Button>
          </Link>
          <a href={`/api/export/pdf?patientId=${patient.id}`}>
            <Button variant="outline">Export Patient Summary → PDF</Button>
          </a>
          <a href={`/api/export/csv?patientId=${patient.id}`}>
            <Button variant="outline">Export Lab Results → CSV</Button>
          </a>
          <Button
            onClick={async () => {
              await fetch("/api/summaries/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientId: patient.id }),
              });
              setMessage("Summary generated.");
              load();
            }}
          >
            Refresh AI summary
          </Button>
        </div>
      </div>
      {message ? <p className="text-sm text-teal-800">{message}</p> : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Patient sections">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={cn(
              "rounded-full px-4 py-2 text-sm",
              tab === t ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
            )}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-semibold">Clinical information (user provided)</h3>
            <InfoList label="Symptoms" items={patient.symptoms} />
            <InfoList label="Existing conditions" items={patient.conditions} />
            <InfoList label="Allergies" items={patient.allergies} />
            <InfoList label="Medications" items={patient.medications} />
            <p className="mt-3 text-sm text-slate-600">{patient.notes}</p>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold">Report-extracted medications</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {patient.medicationRecords.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span>{m.name}</span>
                  <ProvenanceBadge sourceType={m.sourceType} sourceText={m.sourceText} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      {tab === "Reports" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {patient.documents.map((d: any) => (
            <Link key={d.id} href={`/patients/${patient.id}/reports`}>
              <ReportCard report={d} />
            </Link>
          ))}
        </div>
      ) : null}

      {tab === "Lab Results" ? (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <LabResultsTable tests={patient.tests} onSelect={setSelected} />
          <div className="space-y-4">
            <LabDetail test={selected} />
            <LabTrendChart tests={patient.tests} />
          </div>
        </div>
      ) : null}

      {tab === "Timeline" ? <Timeline events={patient.timelineEvents} /> : null}

      {tab === "AI Summary" ? (
        <AISummaryCard
          content={patient.summaries[0]?.content}
          provider={patient.summaries[0]?.provider}
          createdAt={patient.summaries[0]?.createdAt}
        />
      ) : null}

      {tab === "Review" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SourceViewer
            filename={pending[0]?.document.filename ?? patient.documents[0]?.filename ?? "Source"}
            text={patient.documents.find((d: any) => d.id === pending[0]?.documentId)?.extractedText ?? patient.documents[0]?.extractedText}
          />
          <div className="space-y-4">
            {pending.length ? (
              pending.map((t: any) => <ReviewPanel key={t.id} test={t} onChanged={load} />)
            ) : (
              <Card className="p-5 text-sm text-slate-600">No fields are waiting for review.</Card>
            )}
            {patient.conflicts.map((c: any) => (
              <ConflictCard
                key={c.id}
                conflict={c}
                onAction={async (action) => {
                  await fetch(`/api/patients/${patient.id}/conflicts/${c.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action }),
                  });
                  load();
                }}
              />
            ))}
            {patient.clarifications.map((c: any) => (
              <ClarificationCard key={c.id} item={c} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "Audit History" ? <AuditLog logs={patient.auditLogs} /> : null}

      <p className="text-xs text-slate-400">DOB {formatDate(patient.dateOfBirth)}</p>
    </div>
  );
}

function InfoList({ label, items }: { label: string; items: Array<{ id: string; name: string; sourceType: string }> }) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span>{item.name}</span>
            <Badge tone="blue">{item.sourceType.replace("_", " ")}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
