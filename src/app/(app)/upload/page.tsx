"use client";

import { useEffect, useState } from "react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ErrorState, LoadingState } from "@/components/states";

export default function UploadPage() {
  const [patients, setPatients] = useState<Array<{ id: string; fullName: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patients")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) setError(data.error);
        else setPatients(data.patients);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Upload medical report</h1>
      <p className="text-sm text-slate-600">Processing extracts documented values without inventing reference ranges.</p>
      <UploadDropzone patients={patients} />
    </div>
  );
}
