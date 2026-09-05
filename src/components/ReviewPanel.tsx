"use client";

import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { ConfidenceBadge, LabStatusBadge } from "@/components/badges";
import { formatReferenceRange } from "@/lib/services/reference-range";

export function ReviewPanel({
  test,
  onChanged,
}: {
  test: {
    id: string;
    testName: string;
    value: string | null;
    unit: string | null;
    referenceLow: number | null;
    referenceHigh: number | null;
    referenceText: string | null;
    observation: string | null;
    reportDate: string | Date | null;
    confidence: number;
    labStatus: string;
  };
  onChanged: () => void;
}) {
  const [form, setForm] = useState({
    testName: test.testName,
    value: test.value ?? "",
    unit: test.unit ?? "",
    referenceLow: test.referenceLow?.toString() ?? "",
    referenceHigh: test.referenceHigh?.toString() ?? "",
    referenceText: test.referenceText ?? "",
    observation: test.observation ?? "",
    reportDate: test.reportDate ? String(test.reportDate).slice(0, 10) : "",
  });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function act(action: "VERIFY" | "FLAG" | "REVERT") {
    const res = await fetch(`/api/tests/${test.id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Saved." : data.error || "Unable to update.");
    onChanged();
  }

  async function saveEdit() {
    const res = await fetch(`/api/tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testName: form.testName,
        value: form.value,
        unit: form.unit,
        referenceLow: form.referenceLow === "" ? null : Number(form.referenceLow),
        referenceHigh: form.referenceHigh === "" ? null : Number(form.referenceHigh),
        referenceText: form.referenceText || null,
        observation: form.observation || null,
        reportDate: form.reportDate || null,
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Correction saved. Original extraction was preserved." : data.error || "Unable to update.");
    setEditing(false);
    onChanged();
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{test.testName}</h3>
          <p className="text-2xl font-semibold">
            {test.value} <span className="text-base font-normal text-slate-500">{test.unit}</span>
          </p>
        </div>
        <LabStatusBadge status={test.labStatus} />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Reference: {formatReferenceRange(test)}
      </p>
      <div className="mt-2">
        <ConfidenceBadge confidence={test.confidence} />
      </div>
      {editing ? (
        <div className="mt-4 grid gap-3">
          <div>
            <Label htmlFor="testName">Test name</Label>
            <Input id="testName" value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="value">Value</Label>
              <Input id="value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="low">Reference low</Label>
              <Input id="low" value={form.referenceLow} onChange={(e) => setForm({ ...form, referenceLow: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="high">Reference high</Label>
              <Input id="high" value={form.referenceHigh} onChange={(e) => setForm({ ...form, referenceHigh: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="range">Reference text</Label>
            <Input id="range" value={form.referenceText} onChange={(e) => setForm({ ...form, referenceText: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={form.reportDate} onChange={(e) => setForm({ ...form, reportDate: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="obs">Observation</Label>
            <Input id="obs" value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} />
          </div>
          <Button onClick={saveEdit}>Save correction</Button>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => act("VERIFY")}>✓ Verify</Button>
        <Button variant="outline" onClick={() => setEditing(true)}>
          ✏ Edit
        </Button>
        <Button variant="outline" onClick={() => act("FLAG")}>
          ⚠ Flag
        </Button>
        <Button variant="ghost" onClick={() => act("REVERT")}>
          ↩ Revert
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-teal-800">{message}</p> : null}
    </Card>
  );
}
