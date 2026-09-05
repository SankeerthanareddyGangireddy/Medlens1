"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { ProcessingStatus } from "@/components/badges";
import { Button, Card } from "@/components/ui";

export function UploadDropzone({
  patients,
  defaultPatientId,
}: {
  patients: Array<{ id: string; fullName: string }>;
  defaultPatientId?: string;
}) {
  const [patientId, setPatientId] = useState(defaultPatientId ?? patients[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if ((!patientId || !patients.some((p) => p.id === patientId)) && patients.length > 0) {
      setPatientId(defaultPatientId ?? patients[0].id);
    }
  }, [patients, defaultPatientId, patientId]);

  function handleFile(f: File | null) {
    setFile(f);
    setError(null);
    setDone(false);
    setStatus("Idle");
    setProgress(0);
    if (f && f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function upload() {
    if (!file || !patientId) return;
    setError(null);
    setDone(false);
    setStatus("UPLOADED");
    setProgress(20);
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", "Clinical document");
    setStatus("PROCESSING");
    setProgress(45);
    try {
      const res = await fetch(`/api/patients/${patientId}/reports`, { method: "POST", body: form });
      setProgress(80);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to extract text from this document.");
        setStatus("FAILED");
        return;
      }
      setProgress(100);
      setStatus(data.document?.processingStatus ?? "READY_FOR_REVIEW");
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Network error while uploading report.");
      setStatus("FAILED");
    }
  }

  return (
    <Card className="p-6">
      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:bg-slate-100"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = e.dataTransfer.files[0];
          if (dropped) handleFile(dropped);
        }}
      >
        <Upload className="h-8 w-8 text-teal-700" aria-hidden />
        <p className="mt-3 text-sm font-medium text-slate-800">Drop any image or report file here</p>
        <p className="text-xs text-slate-500">Supports images (PNG, JPG, JPEG, WEBP), PDFs, and text documents.</p>
        <input
          type="file"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {patients.length === 0 ? (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium">No patient record selected yet.</p>
            <p className="text-xs text-amber-700">Load the demo patient or create one to attach this report.</p>
          </div>
          <Button
            type="button"
            className="text-xs whitespace-nowrap"
            onClick={async () => {
              const res = await fetch("/api/demo/load", { method: "POST" });
              const data = await res.json();
              if (data.patient) {
                window.location.reload();
              }
            }}
          >
            Load Demo Patient
          </Button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          aria-label="Select patient"
          disabled={patients.length === 0}
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
        <Button onClick={upload} disabled={!file || !patientId || status === "PROCESSING"}>
          {status === "PROCESSING" ? "Processing..." : "Process report"}
        </Button>
      </div>

      {file ? (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 text-sm">
          <div className="flex items-start gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Document Preview" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
            ) : null}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-slate-500">{formatBytes(file.size)}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <ProcessingStatus status={status} />
            {patientId && (
              <span className="text-xs text-slate-500">
                Patient: {patients.find((p) => p.id === patientId)?.fullName ?? patientId}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {done && patientId ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">Extraction finished!</p>
          <p className="text-xs text-emerald-700 mt-0.5">Laboratory values, observations, and timeline events are ready.</p>
          <div className="mt-3 flex gap-2">
            <a
              href={`/patients/${patientId}`}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-700 px-3 text-xs font-medium text-white hover:bg-emerald-800"
            >
              View Patient Records
            </a>
            <a
              href={`/patients/${patientId}/review`}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
            >
              Clinical Review Queue
            </a>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
