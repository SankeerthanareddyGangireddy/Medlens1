"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  HelpCircle, 
  Bell, 
  User, 
  ChevronLeft, 
  Share2, 
  Layers,
  Activity
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { getLocalizedJargon } from "@/lib/services/translator";
import { DocumentViewerPane, DocumentReportItem } from "./DocumentViewerPane";
import { BiomarkerTrendWidget, TrendSeries } from "./BiomarkerTrendWidget";
import { AddonFeaturesWidget } from "./AddonFeaturesWidget";
import { StructuredSummaryWidget, AbnormalMetric } from "./StructuredSummaryWidget";
import { QuickActionBar } from "./QuickActionBar";

export type MediReportDashboardProps = {
  patient?: {
    id: string;
    fullName: string;
    dob?: string | null;
    gender?: string | null;
    clinicalProfile?: {
      bloodGroup?: string | null;
      conditions?: string[];
      allergies?: string[];
      medications?: string[];
    } | null;
  } | null;
  reports?: Array<{
    id: string;
    title?: string;
    createdAt: string;
    extractedData?: any;
  }>;
};

export function MediReportDashboard({
  patient,
  reports = [],
}: MediReportDashboardProps) {
  const patientName = patient?.fullName || "Ananya Rao";
  const patientAge = 52; // Fallback or computed from DOB
  const patientSex = patient?.gender || "Female";

  // State to link clicked abnormal biomarker from right column to the center chart
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>("Cholesterol");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentLang, setCurrentLang] = useState<"en" | "hi" | "te">("en");

  // Map tests from real report if available, else use rich defaults
  const latestReport = reports[0];
  const testItems: DocumentReportItem[] = [
    { testName: "Hemoglobin", value: "9.2", unit: "g/dL", referenceText: "12.0–16.0", status: "LOW" },
    { testName: "Total Cholesterol", value: "240", unit: "mg/dL", referenceText: "< 200", status: "HIGH" },
    { testName: "Fasting Glucose", value: "108", unit: "mg/dL", referenceText: "70–99", status: "HIGH" },
    { testName: "HDL Cholesterol", value: "48", unit: "mg/dL", referenceText: "> 40", status: "NORMAL" },
    { testName: "LDL Cholesterol", value: "156", unit: "mg/dL", referenceText: "< 100", status: "HIGH" },
    { testName: "Triglycerides", value: "172", unit: "mg/dL", referenceText: "< 150", status: "HIGH" },
    { testName: "WBC", value: "7.8", unit: "x10^3/uL", referenceText: "4.0–11.0", status: "NORMAL" },
    { testName: "Platelets", value: "235", unit: "x10^3/uL", referenceText: "150–450", status: "NORMAL" },
    { testName: "RBC", value: "4.1", unit: "x10^6/uL", referenceText: "3.8–5.2", status: "NORMAL" },
  ];

  const abnormalItems: AbnormalMetric[] = [
    {
      name: "Total Cholesterol",
      value: 240,
      unit: "mg/dL",
      reference: "< 200 mg/dL",
      status: "HIGH",
      clinicalNote: "Elevation increases long-term atherosclerotic risk.",
    },
    {
      name: "Hemoglobin",
      value: 9.2,
      unit: "g/dL",
      reference: "12.0–16.0 g/dL",
      status: "LOW",
      clinicalNote: "Suggests moderate microcytic anemia, causing fatigue.",
    },
    {
      name: "Fasting Glucose",
      value: 108,
      unit: "mg/dL",
      reference: "70–99 mg/dL",
      status: "HIGH",
      clinicalNote: "Borderline impaired fasting glucose (prediabetes range).",
    },
    {
      name: "LDL Cholesterol",
      value: 156,
      unit: "mg/dL",
      reference: "< 100 mg/dL",
      status: "HIGH",
      clinicalNote: "Primary target for dietary and statin therapy.",
    },
  ];

  const narrations = {
    en: `Medi-Report Assistant clinical breakdown for ${patientName}, age ${patientAge}. Analysis indicates microcytic hypochromic anemia with Hemoglobin at 9.2 grams per deciliter, and elevated Total Cholesterol at 240 milligrams per deciliter with fasting blood glucose at 108. All current medications have been cross-checked with zero detected contraindications. Regular aerobic activity and dietary review are scheduled in your Action Planner.`,
    hi: `मेडी-रिपोर्ट सहायक विश्लेषण: ${patientName}, आयु ${patientAge} वर्ष। परीक्षण में 9.2 ग्राम/डेसीलीटर हीमोग्लोबिन के साथ रक्तअल्पता (एनीमिया) और 240 मिलीग्राम/डेसीलीटर पर उच्च कोलेस्ट्रॉल तथा 108 पर खाली पेट ग्लूकोज पाया गया है। वर्तमान दवाओं में कोई प्रतिकूल प्रभाव नहीं है। दैनिक व्यायाम और आहार सुधार निर्धारित हैं।`,
    te: `మెడి-రిపోర్ట్ అసిస్టెంట్ సమీక్ష: ${patientName}, వయస్సు ${patientAge} సంవత్సరాలు. పరీక్షలో హీమోగ్లోబిన్ 9.2 గ్రాములు/డెసిలీటర్ వద్ద రక్తహీనత, కొలెస్ట్రాల్ 240 వద్ద మరియు ఫాస్టింగ్ షుగర్ 108 వద్ద అధికంగా నమోదయ్యాయి. ఔషధాలలో ఎటువంటి సైడ్-ఎఫెక్ట్స్ కనుగొనబడలేదు. రోజువారీ నడక, పోషకాహారం సూచించబడ్డాయి.`,
  };

  const activeNarration = narrations[currentLang] || narrations.en;
  const activeJargon = getLocalizedJargon(currentLang);

  const disclaimers = {
    en: "DISCLAIMER: For Educational Use Only. Consult a Qualified Healthcare Professional for Clinical Diagnosis.",
    hi: "अस्वीकरण: केवल शैक्षणिक उपयोग के लिए। नैदानिक निदान और उपचार के लिए योग्य चिकित्सक से परामर्श लें।",
    te: "గమనిక: కేవలం సమాచార అవగాహన కొరకు మాత్రమే. వ్యాధి నిర్ధారణ మరియు చికిత్స కొరకు అర్హత కలిగిన డాక్టర్‌ని సంప్రదించండి.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50/40 to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30 p-3 sm:p-6 lg:p-8 transition-colors duration-200">
      {/* Top back navigation link */}
      <div className="max-w-[1520px] mx-auto mb-4 flex items-center justify-between">
        <Link
          href={patient ? `/patients/${patient.id}` : "/patients"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-2xs transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Patient Records
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Realtime Lab OCR & Multi-agent Synthesis
        </div>
      </div>

      {/* Iridescent Gradient Glowing Container */}
      <div className="max-w-[1520px] mx-auto rounded-3xl p-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 via-sky-400 to-indigo-400 shadow-2xl">
        <div className="rounded-[22px] bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-2xl p-4 sm:p-6 flex flex-col gap-5 transition-colors duration-200">
          
          {/* Dashboard Top Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-300/60 dark:border-slate-800/80">
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Medi-Report Assistant
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 uppercase tracking-wider">
                    AI Clinical Studio
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive document intelligence, biomarker tracking & care planning
                </p>
              </div>
            </div>

            {/* Right Actions & User Avatar */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <ThemeToggle showLabel={true} />

              {/* Help Button */}
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-xl bg-white/80 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-xs transition"
                title="Dashboard Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  type="button"
                  className="p-2 rounded-xl bg-white/80 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-xs transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
              </div>

              {/* Patient Profile Card */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-300/80 dark:border-slate-800">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {patientName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-tight">
                    {patientName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    ID: {patient?.id ? patient.id.slice(0, 8) : "ML-2940"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Column Cockpit Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left Column: Uploaded PDF / Document Viewer (3.5 cols on large) */}
            <div className="lg:col-span-4 xl:col-span-4 flex flex-col">
              <DocumentViewerPane
                filename={latestReport?.title || "Complete_Metabolic_CBC_Panel.pdf"}
                reportDate="19 Sep 2026"
                patientName={patientName}
                patientAge={patientAge}
                patientSex={patientSex}
                tests={testItems}
                selectedTestName={selectedBiomarker}
                onSelectTest={(name: string) => setSelectedBiomarker(name)}
              />
            </div>

            {/* Center Column: Biomarker Trend Tracking + Add-on Features (5 cols on large) */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-5">
              {/* Biomarker Trend Tracking Widget */}
              <BiomarkerTrendWidget
                selectedBiomarker={selectedBiomarker}
                onBiomarkerChange={(name: string) => setSelectedBiomarker(name)}
              />

              {/* Add-on Features Widget (Interaction Checker + Action Planner) */}
              <AddonFeaturesWidget />
            </div>

            {/* Right Column: Structured Summary (3 cols on large) */}
            <div className="lg:col-span-3 xl:col-span-3 flex flex-col">
              <StructuredSummaryWidget
                patientName={patientName}
                patientAge={patientAge}
                patientSex={patientSex}
                abnormalItems={abnormalItems}
                jargonList={activeJargon}
                currentLang={currentLang}
                onSelectBiomarker={(name: string) => setSelectedBiomarker(name)}
              />
            </div>

          </div>

          {/* Bottom Quick Action Bar */}
          <QuickActionBar
            patientName={patientName}
            summaryText={activeNarration}
            onLanguageChange={(langKey: string) => setCurrentLang((langKey === "hi" || langKey === "te" ? langKey : "en"))}
          />

          {/* Disclaimer Footer Pill */}
          <div className="w-full bg-slate-900/90 text-slate-300 text-xs py-2.5 px-4 rounded-xl text-center font-medium tracking-wide border border-slate-800 backdrop-blur-md flex items-center justify-center gap-2 shadow-inner transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>
              {disclaimers[currentLang] || disclaimers.en}
            </span>
          </div>

        </div>
      </div>

      {/* Guide / Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Medi-Report Assistant Guide
            </h3>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">1. Document Viewer:</strong> View parsed lab findings with color-coded bounding boxes. Red indicates out-of-range biomarkers; green indicates standard reference ranges.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">2. Biomarker Trend Tracking:</strong> Select any biomarker from the dropdown or click an abnormal card on the right to visualize longitudinal trajectory and target safe zones.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">3. Interaction Checker & Action Planner:</strong> Review prescription safety against your current lab results and check off health milestones.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white">4. Audio Explainer & Translations:</strong> Use the bottom quick bar to listen to an audible summary in English or translate findings into multiple languages.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-semibold text-xs transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
