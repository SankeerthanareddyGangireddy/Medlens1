"use client";

import { useState } from "react";
import { UploadCloud, FileText, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui";

export type DocumentReportItem = {
  testName: string;
  value: string | number | null;
  unit: string | null;
  referenceText: string | null;
  status: "NORMAL" | "HIGH" | "LOW" | "NOT_ASSESSED";
  page?: number;
};

export function DocumentViewerPane({
  filename,
  reportDate,
  patientName,
  patientAge,
  patientSex,
  tests,
  onSelectTest,
  selectedTestName,
}: {
  filename?: string;
  reportDate?: string;
  patientName?: string;
  patientAge?: number | string;
  patientSex?: string;
  tests: DocumentReportItem[];
  onSelectTest?: (testName: string) => void;
  selectedTestName?: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3;

  // Split or filter tests for page view simulation
  const pageTests = tests.length > 0 ? tests : [
    { testName: "Hemoglobin", value: "9.2", unit: "g/dL", referenceText: "12.0–16.0", status: "LOW" as const },
    { testName: "Hematocrit", value: "31.4", unit: "%", referenceText: "36.0–46.0", status: "LOW" as const },
    { testName: "Total Cholesterol", value: "240", unit: "mg/dL", referenceText: "< 200", status: "HIGH" as const },
    { testName: "Fasting Glucose", value: "108", unit: "mg/dL", referenceText: "70–99", status: "HIGH" as const },
    { testName: "HDL Cholesterol", value: "48", unit: "mg/dL", referenceText: "> 40", status: "NORMAL" as const },
    { testName: "LDL Cholesterol", value: "156", unit: "mg/dL", referenceText: "< 100", status: "HIGH" as const },
    { testName: "Triglycerides", value: "172", unit: "mg/dL", referenceText: "< 150", status: "HIGH" as const },
    { testName: "WBC", value: "7.8", unit: "x10^3/uL", referenceText: "4.0–11.0", status: "NORMAL" as const },
    { testName: "Platelets", value: "235", unit: "x10^3/uL", referenceText: "150–450", status: "NORMAL" as const },
    { testName: "RBC", value: "4.1", unit: "x10^6/uL", referenceText: "3.8–5.2", status: "NORMAL" as const },
  ];

  return (
    <div className="flex flex-col h-full rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-md p-4 border border-white/60 dark:border-slate-800 shadow-sm transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Uploaded PDF</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Structuring OCR progress...
          </p>
        </div>
        <Badge className="bg-sky-500/15 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 text-xs px-2.5 py-0.5 flex items-center gap-1 font-medium">
          <UploadCloud className="h-3.5 w-3.5" />
          Uploaded
        </Badge>
      </div>

      {/* Simulated Document Paper */}
      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 p-4 shadow-sm text-[11px] leading-relaxed select-none transition-colors">
          {/* Paper Header */}
          <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2 mb-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs tracking-tight">
                Lab Results - {reportDate || "10/26/26"}
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded px-1.5 py-0.2 font-mono">
                OCR: High Confidence
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <p>Patient: <span className="text-slate-800 dark:text-slate-200 font-medium">{patientName || "Ananya Rao"}</span></p>
              <p>Gender: <span className="text-slate-800 dark:text-slate-200 font-medium">{patientSex || "Female"}</span></p>
              <p>Age: <span className="text-slate-800 dark:text-slate-200 font-medium">{patientAge || "42"}</span></p>
              <p>Source: <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{filename || "Blood_Panel.pdf"}</span></p>
            </div>
          </div>

          {/* Highlights Header */}
          <div className="flex items-center justify-between py-1 mb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wider">
              Structured Highlights
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">Values & Reference Bounds</span>
          </div>

          {/* Test Table with OCR Bounding Box styles */}
          <div className="space-y-1">
            <div className="grid grid-cols-12 text-[9px] font-semibold text-slate-400 dark:text-slate-500 pb-1">
              <span className="col-span-5">Test Name</span>
              <span className="col-span-3 text-right">Value</span>
              <span className="col-span-4 text-right">Reference</span>
            </div>
            {pageTests.slice(0, 9).map((t) => {
              const isSelected = selectedTestName === t.testName;
              const isAbnormal = t.status === "HIGH" || t.status === "LOW";
              return (
                <div
                  key={t.testName}
                  onClick={() => onSelectTest?.(t.testName)}
                  className={`grid grid-cols-12 items-center rounded-md px-1.5 py-1 cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-teal-500 bg-teal-50/80 dark:bg-teal-950/70"
                      : isAbnormal
                      ? "bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 hover:bg-rose-100/50 dark:hover:bg-rose-900/40"
                      : "bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                  }`}
                >
                  <div className="col-span-5 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                    {isAbnormal ? (
                      <AlertTriangle className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                    ) : (
                      <CheckCircle className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="truncate">{t.testName}</span>
                  </div>
                  <div className="col-span-3 text-right font-mono font-semibold">
                    <span
                      className={`inline-block px-1 rounded ${
                        t.status === "HIGH"
                          ? "bg-rose-500 text-white text-[10px]"
                          : t.status === "LOW"
                          ? "bg-amber-500 text-white text-[10px]"
                          : "text-slate-900 dark:text-slate-200"
                      }`}
                    >
                      {t.value ?? "—"} {t.unit ? <span className="text-[8px] font-normal">{t.unit}</span> : ""}
                    </span>
                  </div>
                  <div className="col-span-4 text-right text-[9px] text-slate-500 dark:text-slate-400 truncate">
                    {t.referenceText || "Not provided"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 dark:text-slate-500 italic">
            * Bounding boxes indicate verified OCR extracted text coordinates.
          </div>
        </div>
      </div>

      {/* Pagination & Button Footer */}
      <div className="mt-3 pt-2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((page) => (
              <span
                key={page}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  currentPage === page ? "bg-teal-600 w-3" : "bg-slate-300 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-white text-xs font-semibold shadow-sm hover:from-sky-700 hover:to-teal-700 transition flex items-center justify-center gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          Uploaded PDF
        </button>
      </div>
    </div>
  );
}
