"use client";

import { useState, useEffect } from "react";
import { 
  FileDown, 
  Volume2, 
  VolumeX, 
  Languages, 
  ShieldCheck, 
  Database, 
  Check, 
  Loader2,
  ExternalLink,
  Code
} from "lucide-react";

export function QuickActionBar({
  patientName = "Ananya Rao",
  summaryText = "Patient Ananya Rao, age 52. Microcytic hypochromic anemia observed with Hemoglobin at 9.2 grams per deciliter. Elevated total cholesterol of 240 and fasting glucose of 108. Statin and dietary intervention recommended.",
  onExportPdf,
  selectedLanguage,
  onLanguageChange,
}: {
  patientName?: string;
  summaryText?: string;
  onExportPdf?: () => void;
  selectedLanguage?: string;
  onLanguageChange?: (lang: string) => void;
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentLang, setCurrentLang] = useState(selectedLanguage || "en-US");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(summaryText);
    utterance.lang = currentLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleExport = () => {
    setIsExporting(true);
    if (onExportPdf) {
      onExportPdf();
    } else {
      window.print();
    }
    setTimeout(() => setIsExporting(false), 1200);
  };

  const languages = [
    { code: "en-US", label: "English (US)", langKey: "en" },
    { code: "te-IN", label: "తెలుగు (Telugu)", langKey: "te" },
    { code: "hi-IN", label: "हिन्दी (Hindi)", langKey: "hi" },
    { code: "es-ES", label: "Español (Spanish)", langKey: "es" },
    { code: "fr-FR", label: "Français (French)", langKey: "fr" },
  ];

  const handleSelectLang = (item: (typeof languages)[number]) => {
    setCurrentLang(item.code);
    onLanguageChange?.(item.langKey);
    setShowLangMenu(false);
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-white/75 dark:bg-slate-900/80 backdrop-blur-md p-2.5 border border-white/60 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2 transition-colors">
        <div className="flex flex-wrap items-center gap-2">
          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition active:scale-98"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            )}
            <span>Export Summary (PDF)</span>
          </button>

          {/* Audio Explainer */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shadow-xs transition active:scale-98 ${
              isPlayingAudio
                ? "bg-teal-600 text-white border-teal-700 shadow-teal-500/20"
                : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Stop Voice Narration</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Audio Explainer</span>
              </>
            )}
          </button>

          {/* Multilingual Translation */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{languages.find((l) => l.code === currentLang)?.label.split(" ")[0] || "Translate"}</span>
            </button>

            {showLangMenu && (
              <div className="absolute bottom-full mb-1 left-0 z-50 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLang(lang)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-slate-700 dark:text-slate-200"
                  >
                    <span>{lang.label}</span>
                    {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Secure Portal Access */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/80 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Secure Portal Access</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>

          {/* Clinical DB API */}
          <button
            type="button"
            onClick={() => setShowApiModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition"
          >
            <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Clinical DB API</span>
          </button>
        </div>
      </div>

      {/* Clinical DB API Preview Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-5 flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-slate-900 dark:text-white">HL7 / FHIR Clinical Record API</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Live REST/FHIR Observation payload synchronized for EHR interoperability (Epic/Cerner format).
            </p>

            <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 border border-slate-800">
              <pre>
{JSON.stringify(
  {
    resourceType: "DiagnosticReport",
    id: "medlens-obs-9281",
    status: "final",
    category: [{ coding: [{ system: "http://loinc.org", code: "LP29684-5", display: "Pathology and Laboratory" }] }],
    subject: { reference: `Patient/${patientName.replace(/\s+/g, "-").toLowerCase()}` },
    effectiveDateTime: new Date().toISOString(),
    result: [
      { code: "2093-3", display: "Cholesterol [Mass/volume] in Serum or Plasma", value: 240, unit: "mg/dL", interpretation: "H" },
      { code: "718-7", display: "Hemoglobin [Mass/volume] in Blood", value: 9.2, unit: "g/dL", interpretation: "L" },
      { code: "1558-6", display: "Fasting Glucose [Mass/volume] in Serum", value: 108, unit: "mg/dL", interpretation: "H" },
    ],
  },
  null,
  2
)}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-teal-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-teal-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
