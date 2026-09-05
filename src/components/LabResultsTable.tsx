"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/utils";
import { formatReferenceRange as formatRange } from "@/lib/services/reference-range";
import { ConfidenceBadge, LabStatusBadge, ProvenanceBadge, VerificationBadge } from "@/components/badges";
import { Card, Input } from "@/components/ui";
import { EmptyState } from "@/components/states";

export type LabRow = {
  id: string;
  testName: string;
  value: string | null;
  unit: string | null;
  referenceLow: number | null;
  referenceHigh: number | null;
  referenceText: string | null;
  labStatus: string;
  reportDate: string | Date | null;
  sourcePage: number | null;
  sourceText: string | null;
  confidence: number;
  sourceType: string;
  verificationStatus: string;
  document: { filename: string; documentType: string };
};

export function LabResultsTable({
  tests,
  onSelect,
}: {
  tests: LabRow[];
  onSelect?: (test: LabRow) => void;
}) {
  const [testName, setTestName] = useState("");
  const [status, setStatus] = useState("");
  const [verification, setVerification] = useState("");

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      if (testName && !t.testName.toLowerCase().includes(testName.toLowerCase())) return false;
      if (status && t.labStatus !== status) return false;
      if (verification && t.verificationStatus !== verification) return false;
      return true;
    });
  }, [tests, testName, status, verification]);

  if (!tests.length) {
    return <EmptyState title="No laboratory results yet." body="Upload a report to extract documented values." />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-3">
        <Input placeholder="Filter by test name" value={testName} onChange={(e) => setTestName(e.target.value)} aria-label="Filter by test name" />
        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="LOW">LOW</option>
          <option value="NORMAL">NORMAL</option>
          <option value="HIGH">HIGH</option>
          <option value="NOT_ASSESSED">NOT_ASSESSED</option>
        </select>
        <select className="h-10 rounded-lg border border-slate-200 px-3 text-sm" value={verification} onChange={(e) => setVerification(e.target.value)} aria-label="Filter by verification">
          <option value="">All verification</option>
          <option value="PENDING">PENDING</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="FLAGGED">FLAGGED</option>
          <option value="EDITED">EDITED</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Test</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Reference range</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Verification</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                onClick={() => onSelect?.(t)}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{t.testName}</td>
                <td className="px-4 py-3">{t.value ?? "—"}</td>
                <td className="px-4 py-3">{t.unit ?? "—"}</td>
                <td className="px-4 py-3">
                  {t.referenceLow == null && t.referenceHigh == null && !t.referenceText
                    ? "Not provided"
                    : formatRange(t)}
                </td>
                <td className="px-4 py-3">
                  <LabStatusBadge status={t.labStatus} />
                </td>
                <td className="px-4 py-3">
                  <ProvenanceBadge
                    sourceType={t.sourceType}
                    filename={t.document.filename}
                    page={t.sourcePage}
                    sourceText={t.sourceText}
                    confidence={t.confidence}
                  />
                </td>
                <td className="px-4 py-3">
                  <VerificationBadge status={t.verificationStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function LabDetail({ test }: { test: LabRow | null }) {
  if (!test) return null;
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold">{test.testName}</h3>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {test.value ?? "—"} <span className="text-base font-normal text-slate-500">{test.unit}</span>
      </p>
      <dl className="mt-4 grid gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Reference range</dt>
          <dd>
            {test.referenceLow == null && test.referenceHigh == null && !test.referenceText
              ? "Not provided"
              : formatRange(test)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd>
            <LabStatusBadge status={test.labStatus} />
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Source</dt>
          <dd>
            {test.document.documentType} — {test.sourcePage ? `Page ${test.sourcePage}` : test.document.filename}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Report date</dt>
          <dd>{formatDate(test.reportDate)}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <ConfidenceBadge confidence={test.confidence} />
      </div>
      {test.sourceText ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">“{test.sourceText}”</p>
      ) : null}
    </Card>
  );
}
