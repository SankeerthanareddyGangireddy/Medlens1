"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  USER_PROVIDED: "User provided",
  REPORT_EXTRACTED: "Extracted from report",
  AI_GENERATED: "AI generated",
  USER_VERIFIED: "Verified by user",
};

export function ProvenanceBadge({
  sourceType,
  filename,
  page,
  sourceText,
  confidence,
}: {
  sourceType: string;
  filename?: string | null;
  page?: number | null;
  sourceText?: string | null;
  confidence?: number | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="rounded-full"
        aria-label={`Provenance: ${labels[sourceType] ?? sourceType}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Badge tone={sourceType === "USER_PROVIDED" ? "blue" : sourceType === "USER_VERIFIED" ? "green" : "teal"}>
          {labels[sourceType] ?? sourceType}
        </Badge>
      </button>
      {open ? (
        <div
          role="dialog"
          className="absolute z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</p>
          <p className="mt-1 text-sm text-slate-900">{filename ?? "Patient record"}</p>
          {page ? <p className="text-sm text-slate-600">Page: {page}</p> : null}
          {confidence != null ? (
            <p className="text-xs text-slate-500">Extraction confidence: {Math.round(confidence * 100)}% (not clinical certainty)</p>
          ) : null}
          {sourceText ? (
            <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">Extracted text: “{sourceText}”</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const band = confidence >= 0.9 ? "HIGH" : confidence >= 0.7 ? "MEDIUM" : "LOW";
  const tone = band === "HIGH" ? "green" : band === "MEDIUM" ? "amber" : "red";
  return (
    <span className="inline-flex flex-col">
      <Badge tone={tone}>
        {band === "HIGH" ? "High confidence" : band === "MEDIUM" ? "Medium confidence" : "Low confidence"} {pct}%
      </Badge>
      <span className="mt-0.5 text-[10px] text-slate-500">Extraction quality, not correctness</span>
    </span>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  const tone = status === "VERIFIED" ? "green" : status === "FLAGGED" ? "red" : status === "EDITED" ? "blue" : "amber";
  return <Badge tone={tone}>{status.replace("_", " ")}</Badge>;
}

export function LabStatusBadge({ status }: { status: string }) {
  const tone = status === "HIGH" ? "red" : status === "LOW" ? "amber" : status === "NORMAL" ? "green" : "slate";
  const label = status === "NOT_ASSESSED" ? "Not assessed" : status;
  return <Badge tone={tone}>{label}</Badge>;
}

export function ProcessingStatus({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2">
      {["PROCESSING", "EXTRACTING", "VALIDATING"].includes(status) ? (
        <span className="h-1.5 w-16 origin-left rounded-full bg-teal-600 pulse-bar" />
      ) : null}
      <Badge
        tone={status === "FAILED" ? "red" : status === "VERIFIED" ? "green" : status === "READY_FOR_REVIEW" ? "amber" : "teal"}
        className={cn(status === "FAILED" && "uppercase")}
      >
        {status.replaceAll("_", " ")}
      </Badge>
    </div>
  );
}
