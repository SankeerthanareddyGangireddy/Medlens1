"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MediReportDashboard } from "@/components/assistant/MediReportDashboard";
import { LoadingState, ErrorState } from "@/components/states";

function AssistantPageContent() {
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");

  const [patient, setPatient] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        let targetId = patientIdParam;

        // If no patient ID in URL, fetch first available patient
        if (!targetId) {
          const listRes = await fetch("/api/patients");
          if (listRes.ok) {
            const listData = await listRes.json();
            if (listData.patients && listData.patients.length > 0) {
              targetId = listData.patients[0].id;
            }
          }
        }

        if (targetId) {
          const res = await fetch(`/api/patients/${targetId}`);
          if (res.ok) {
            const data = await res.json();
            setPatient(data.patient);
            setReports(data.patient?.reports || []);
          }
        }
      } catch (err: any) {
        console.error("Error loading patient for assistant:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [patientIdParam]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingState label="Initializing Medi-Report Assistant..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return <MediReportDashboard patient={patient} reports={reports} />;
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <LoadingState label="Loading Medi-Report Assistant..." />
        </div>
      }
    >
      <AssistantPageContent />
    </Suspense>
  );
}
