"use client";

import { useState } from "react";
import { 
  FileCheck, 
  AlertTriangle, 
  BookOpen, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  HeartPulse
} from "lucide-react";

export type AbnormalMetric = {
  name: string;
  value: string | number;
  unit: string;
  reference: string;
  status: "HIGH" | "LOW";
  clinicalNote?: string;
};

export type JargonTerm = {
  term: string;
  fullName: string;
  simpleExplanation: string;
  clinicalSignificance: string;
};

const DEFAULT_ABNORMAL_METRICS: AbnormalMetric[] = [
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

const DEFAULT_JARGON: JargonTerm[] = [
  {
    term: "RBC",
    fullName: "Red Blood Cells",
    simpleExplanation: "The microscopic delivery trucks in your blood that carry oxygen from your lungs to every organ.",
    clinicalSignificance: "Low numbers mean less oxygen delivery, causing fatigue and shortness of breath.",
  },
  {
    term: "HDL",
    fullName: "High-Density Lipoprotein",
    simpleExplanation: "Known as the 'good' cholesterol. It acts like a street sweeper, removing excess fat from blood vessels.",
    clinicalSignificance: "Higher values (> 50 mg/dL) protect against arterial plaque buildup.",
  },
  {
    term: "LDL",
    fullName: "Low-Density Lipoprotein",
    simpleExplanation: "Known as 'bad' cholesterol. When too high, it deposits plaque along artery walls, narrowing them.",
    clinicalSignificance: "Keeping this below 100 mg/dL reduces the risk of heart attacks and stroke.",
  },
  {
    term: "Hematocrit",
    fullName: "Percentage of Red Blood Cells",
    simpleExplanation: "The proportion of your total blood volume that consists of oxygen-carrying red blood cells.",
    clinicalSignificance: "Directly mirrors hemoglobin levels to diagnose anemia or dehydration.",
  },
];

export function StructuredSummaryWidget({
  patientName = "Ananya Rao",
  patientAge = 52,
  patientSex = "Female",
  abnormalItems = DEFAULT_ABNORMAL_METRICS,
  jargonList = DEFAULT_JARGON,
  currentLang = "en",
  onSelectBiomarker,
}: {
  patientName?: string;
  patientAge?: number | string;
  patientSex?: string;
  abnormalItems?: AbnormalMetric[];
  jargonList?: JargonTerm[];
  currentLang?: "en" | "hi" | "te";
  onSelectBiomarker?: (name: string) => void;
}) {
  const [jargonQuery, setJargonQuery] = useState("");
  const [expandedJargon, setExpandedJargon] = useState<string | null>("RBC");

  const labels = {
    en: {
      title: "Structured Summary",
      sub: "Synthesized clinical breakdown",
      validated: "Validated",
      metrics: "Patient Metrics",
      age: "Age",
      gender: "Gender",
      status: "Status",
      attention: "Attention",
      abnormal: "Abnormal Values",
      focusNote: "Click to focus trend",
      jargon: "Jargon Explanations",
      plainEnglish: "Plain English",
      searchPlaceholder: "Search terms (e.g. RBC, HDL, Hematocrit)...",
      high: "HIGH",
      low: "LOW",
    },
    hi: {
      title: "संरचित सारांश",
      sub: "नैदानिक विश्लेषण रिपोर्ट",
      validated: "सत्यापित",
      metrics: "रोगी विवरण",
      age: "उम्र",
      gender: "लिंग",
      status: "स्थिति",
      attention: "समीक्षा आवश्यक",
      abnormal: "असामान्य परीक्षण",
      focusNote: "ट्रेंड देखने के लिए क्लिक करें",
      jargon: "चिकित्सा शब्दावली का सरल अर्थ",
      plainEnglish: "सरल भाषा",
      searchPlaceholder: "शब्दावली खोजें (जैसे RBC, HDL, ग्लूकोज)...",
      high: "उच्च",
      low: "निम्न",
    },
    te: {
      title: "నివేదిక సంక్షిప్త సారాంశం",
      sub: "క్లినికల్ విశ్లేషణ వివరాలు",
      validated: "ధృవీకరించబడింది",
      metrics: "రోగి వివరాలు",
      age: "వయస్సు",
      gender: "లింగం",
      status: "పరిస్థితి",
      attention: "శ్రద్ధ అవసరం",
      abnormal: "అసాధారణ ఫలితాలు",
      focusNote: "ట్రెండ్ కోసం క్లిక్ చేయండి",
      jargon: "వైద్య పదాల సరళ వివరణ",
      plainEnglish: "సులభమైన భాష",
      searchPlaceholder: "పదాలను వెతకండి (ఉదా: RBC, HDL, గ్లూకోజ్)...",
      high: "అధికం",
      low: "తక్కువ",
    },
  }[currentLang] || {
    title: "Structured Summary",
    sub: "Synthesized clinical breakdown",
    validated: "Validated",
    metrics: "Patient Metrics",
    age: "Age",
    gender: "Gender",
    status: "Status",
    attention: "Attention",
    abnormal: "Abnormal Values",
    focusNote: "Click to focus trend",
    jargon: "Jargon Explanations",
    plainEnglish: "Plain English",
    searchPlaceholder: "Search terms (e.g. RBC, HDL, Hematocrit)...",
    high: "HIGH",
    low: "LOW",
  };

  const filteredJargon = jargonList.filter(
    (item) =>
      item.term.toLowerCase().includes(jargonQuery.toLowerCase()) ||
      item.fullName.toLowerCase().includes(jargonQuery.toLowerCase()) ||
      item.simpleExplanation.toLowerCase().includes(jargonQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Container Header */}
      <div className="rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-md p-4 border border-white/60 dark:border-slate-800 shadow-sm flex flex-col gap-3 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/20">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">{labels.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{labels.sub}</p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-medium border border-sky-200/60 dark:border-sky-800">
            {labels.validated}
          </span>
        </div>

        {/* Section 1: Patient Metrics */}
        <div className="bg-slate-50/80 dark:bg-slate-950/70 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{labels.metrics}</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{patientName}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">{labels.age}</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{patientAge}</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">{labels.gender}</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{patientSex}</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">{labels.status}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <HeartPulse className="w-3 h-3" />
                {labels.attention}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Abnormal Values Chips & Details */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>{labels.abnormal}</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/60">
                {abnormalItems.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{labels.focusNote}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {abnormalItems.map((item, idx) => {
              const isHigh = item.status === "HIGH";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectBiomarker?.(item.name)}
                  className={`p-2.5 rounded-xl border text-left transition relative group overflow-hidden ${
                    isHigh
                      ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100/60 dark:hover:bg-rose-900/40"
                      : "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100/60 dark:hover:bg-amber-900/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate pr-1">
                      {item.name}
                    </span>
                    {isHigh ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-200/60 dark:bg-rose-900/60 px-1 rounded">
                        <ArrowUpRight className="w-3 h-3" />
                        {labels.high}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-1 rounded">
                        <ArrowDownRight className="w-3 h-3" />
                        {labels.low}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-baseline gap-1">
                    <span className={`text-base font-bold tracking-tight ${isHigh ? "text-rose-900 dark:text-rose-200" : "text-amber-900 dark:text-amber-200"}`}>
                      {item.value}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.unit}</span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Ref: {item.reference}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Jargon Explanations */}
        <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{labels.jargon}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{labels.plainEnglish}</span>
          </div>

          {/* Quick Search for medical terms */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={jargonQuery}
              onChange={(e) => setJargonQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full text-xs pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Jargon Accordion / Cards list */}
          <div className="space-y-1.5 overflow-y-auto max-h-[190px] pr-1">
            {filteredJargon.map((item) => {
              const isExpanded = expandedJargon === item.term;
              return (
                <div
                  key={item.term}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedJargon(isExpanded ? null : item.term)}
                    className="w-full text-left px-2.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800">
                        {item.term}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]">
                        {item.fullName}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-2.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
                      <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                        {item.simpleExplanation}
                      </p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5">
                        💡 Significance: {item.clinicalSignificance}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
