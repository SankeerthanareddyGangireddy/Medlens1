import { useState, useEffect } from "react";
import { SAFETY_FOOTER } from "@/lib/services/ai/types";
import { Badge, Button, Card } from "@/components/ui";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

export function AISummaryCard({
  content,
  provider,
  createdAt,
}: {
  content?: string | null;
  provider?: string;
  createdAt?: string | Date;
}) {
  const [lang, setLang] = useState<"en" | "hi" | "te">("en");
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSelectLanguage = async (target: "en" | "hi" | "te") => {
    setLang(target);
    if (speaking && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }

    if (target === "en" || !content) return;
    if (translatedMap[target]) return; // already cached

    try {
      setTranslating(true);
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, targetLang: target }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedMap((prev) => ({ ...prev, [target]: data.translatedText }));
      }
    } catch (e) {
      console.error("Translation failed:", e);
    } finally {
      setTranslating(false);
    }
  };

  const currentDisplayContent = lang === "en" ? content : (translatedMap[lang] || content);

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech not supported in this browser.");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const textToSpeak = currentDisplayContent || "";
    if (!textToSpeak) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card className="p-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Patient-friendly summary</h3>
            {provider ? <Badge tone="teal">{provider}</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Describes documented information only. Multi-language translation available.
          </p>
        </div>

        {/* Translation & Voice Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleSelectLanguage("en")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                lang === "en"
                  ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleSelectLanguage("hi")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                lang === "hi"
                  ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => handleSelectLanguage("te")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                lang === "te"
                  ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              తెలుగు (Telugu)
            </button>
          </div>

          {/* Voice Narration Button */}
          <button
            type="button"
            onClick={toggleSpeech}
            className={`p-2 rounded-xl border text-xs transition flex items-center gap-1.5 ${
              speaking
                ? "bg-teal-600 text-white border-teal-700 shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="Listen to summary"
            aria-label="Listen to summary"
          >
            {speaking ? (
              <VolumeX className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            )}
          </button>
        </div>
      </div>

      {/* Summary Content Body */}
      {translating ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          <span>Translating summary into {lang === "hi" ? "हिन्दी (Hindi)" : "తెలుగు (Telugu)"}...</span>
        </div>
      ) : (
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-800 dark:text-slate-200 transition-opacity">
          {currentDisplayContent || "No summary generated yet."}
        </div>
      )}

      <p className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-500 dark:text-slate-400">
        {lang === "hi"
          ? "अस्वीकरण: केवल शैक्षणिक उपयोग के लिए। नैदानिक निदान के लिए योग्य चिकित्सक से परामर्श लें।"
          : lang === "te"
          ? "గమనిక: కేవలం సమాచార అవగాహన కొరకు మాత్రమే. వ్యాధి నిర్ధారణ కొరకు డాక్టర్‌ని సంప్రదించండి."
          : SAFETY_FOOTER}
      </p>
      {createdAt ? <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{String(createdAt)}</p> : null}
    </Card>
  );
}

export function ConflictCard({
  conflict,
  onAction,
}: {
  conflict: {
    id: string;
    description: string;
    severity: string;
    status: string;
    resolution?: string | null;
  };
  onAction?: (action: "KEEP_A" | "KEEP_B" | "RESOLVED") => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-amber-900">⚠ Potential inconsistency</p>
        <Badge tone={conflict.severity === "HIGH" ? "red" : "amber"}>{conflict.severity}</Badge>
      </div>
      <p className="mt-2 text-sm text-slate-700">{conflict.description}</p>
      {conflict.resolution ? <p className="mt-2 text-sm text-slate-500">{conflict.resolution}</p> : null}
      {conflict.status === "OPEN" && onAction ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onAction("KEEP_A")}>
            Keep A
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction("KEEP_B")}>
            Keep B
          </Button>
          <Button size="sm" onClick={() => onAction("RESOLVED")}>
            Mark resolved
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{conflict.status}</p>
      )}
    </Card>
  );
}

export function ClarificationCard({
  item,
}: {
  item: { question: string; type: string; status: string };
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{item.type}</p>
      <p className="mt-1 text-sm text-slate-800">{item.question}</p>
      <p className="mt-2 text-xs text-slate-500">{item.status}</p>
    </Card>
  );
}

export function ReportCard({
  report,
}: {
  report: {
    filename: string;
    documentType: string;
    processingStatus: string;
    reportDate?: string | Date | null;
  };
}) {
  return (
    <Card className="p-4">
      <p className="font-medium">{report.filename}</p>
      <p className="text-sm text-slate-500">{report.documentType}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-teal-800">{report.processingStatus.replaceAll("_", " ")}</p>
    </Card>
  );
}

export function PatientOverviewCard({
  patient,
  age,
}: {
  age: number;
  patient: {
    fullName: string;
    medicalRecordNumber: string;
    sex: string;
    email?: string | null;
    phone?: string | null;
  };
}) {
  return (
    <Card className="p-6">
      <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
      <h2 className="mt-1 text-2xl font-semibold">{patient.fullName}</h2>
      <p className="text-sm text-slate-600">
        {age} years • {patient.sex} • {patient.medicalRecordNumber}
      </p>
      <p className="mt-3 text-sm text-slate-600">
        {patient.email || "No email on file"} • {patient.phone || "No phone on file"}
      </p>
    </Card>
  );
}
