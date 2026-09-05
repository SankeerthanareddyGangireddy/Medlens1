"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Array<{ id: string; fullName: string; medicalRecordNumber: string; sex: string }>>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    medicalRecordNumber: "",
    dateOfBirth: "1988-01-01",
    sex: "Female",
    medications: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else setPatients(data.patients);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    async function fetchPatients() {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (active) {
          if (!res.ok) setError(data.error);
          else setPatients(data.patients);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Error loading patients");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchPatients();
    return () => {
      active = false;
    };
  }, [q]);

  async function createPatient(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        medications: form.medications ? form.medications.split(",").map((s) => s.trim()) : [],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm({ ...form, fullName: "", medicalRecordNumber: "", medications: "" });
    load();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-sm text-slate-600">Search by name or patient ID. New entries are marked user provided.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <Input placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>
      {error ? <ErrorState message={error} /> : null}
      <Card className="p-5">
        <h2 className="font-semibold">Create patient</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={createPatient}>
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="mrn">Patient ID</Label>
            <Input id="mrn" required value={form.medicalRecordNumber} onChange={(e) => setForm({ ...form, medicalRecordNumber: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" required value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="sex">Sex</Label>
            <Input id="sex" required value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="meds">Medications (comma separated, user provided)</Label>
            <Input id="meds" value={form.medications} onChange={(e) => setForm({ ...form, medications: e.target.value })} />
          </div>
          <Button type="submit">Save patient</Button>
        </form>
      </Card>
      {loading ? (
        <LoadingState />
      ) : patients.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {patients.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`}>
              <Card className="p-5 hover:border-teal-200">
                <p className="font-semibold">{p.fullName}</p>
                <p className="text-sm text-slate-500">{p.medicalRecordNumber} • {p.sex}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No patients yet." body="Create a record or load the demo patient from the dashboard." />
      )}
    </div>
  );
}
