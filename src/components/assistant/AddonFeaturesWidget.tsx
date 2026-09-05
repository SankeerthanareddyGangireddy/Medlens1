"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Pill
} from "lucide-react";

export type MedicationItem = {
  id: string;
  name: string;
  dosage: string;
  indication: string;
  status: "SAFE" | "WARNING" | "MONITOR";
  details?: string;
};

export type ActionItem = {
  id: string;
  task: string;
  dueDate: string;
  completed: boolean;
  category: "MEDICATION" | "LIFESTYLE" | "LAB" | "FOLLOWUP";
};

const DEFAULT_MEDICATIONS: MedicationItem[] = [
  {
    id: "med-1",
    name: "Atorvastatin",
    dosage: "20 mg / night",
    indication: "Total Cholesterol reduction",
    status: "SAFE",
    details: "No adverse interactions with current profile.",
  },
  {
    id: "med-2",
    name: "Metformin",
    dosage: "500 mg / twice daily",
    indication: "Fasting Glucose regulation",
    status: "SAFE",
    details: "Renal function (eGFR) within safe tolerance.",
  },
  {
    id: "med-3",
    name: "Ferrous Fumarate",
    dosage: "210 mg / morning",
    indication: "Low Hemoglobin recovery",
    status: "MONITOR",
    details: "Take 2h apart from dairy or antacids for absorption.",
  },
];

const DEFAULT_ACTIONS: ActionItem[] = [
  {
    id: "act-1",
    task: "Daily 30-min aerobic walk (Cardiovascular)",
    dueDate: "Daily",
    completed: true,
    category: "LIFESTYLE",
  },
  {
    id: "act-2",
    task: "Iron supplement + Vitamin C with breakfast",
    dueDate: "Today",
    completed: false,
    category: "MEDICATION",
  },
  {
    id: "act-3",
    task: "Repeat Lipid Profile & CBC in 6 weeks",
    dueDate: "Oct 18",
    completed: false,
    category: "LAB",
  },
  {
    id: "act-4",
    task: "Review cholesterol trend with Dr. Sharma",
    dueDate: "Oct 22",
    completed: false,
    category: "FOLLOWUP",
  },
];

export function AddonFeaturesWidget() {
  const [meds, setMeds] = useState<MedicationItem[]>(DEFAULT_MEDICATIONS);
  const [actions, setActions] = useState<ActionItem[]>(DEFAULT_ACTIONS);
  const [newMedInput, setNewMedInput] = useState("");
  const [newActionInput, setNewActionInput] = useState("");
  const [showAddMed, setShowAddMed] = useState(false);
  const [activeDay, setActiveDay] = useState(5); // Friday

  // Mini calendar week days (e.g. current week)
  const weekDays = [
    { day: "M", date: 15, hasEvent: true },
    { day: "T", date: 16, hasEvent: false },
    { day: "W", date: 17, hasEvent: true },
    { day: "T", date: 18, hasEvent: false },
    { day: "F", date: 19, hasEvent: true },
    { day: "S", date: 20, hasEvent: true },
    { day: "S", date: 21, hasEvent: false },
  ];

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedInput.trim()) return;
    const isWarning = newMedInput.toLowerCase().includes("grapefruit") || newMedInput.toLowerCase().includes("ibuprofen");
    const newMed: MedicationItem = {
      id: `med-${Date.now()}`,
      name: newMedInput.trim(),
      dosage: "As directed",
      indication: "Patient added supplement/med",
      status: isWarning ? "WARNING" : "SAFE",
      details: isWarning
        ? "Potential interaction: Consult physician before pairing."
        : "Safety confirmed against patient biomarkers.",
    };
    setMeds([newMed, ...meds]);
    setNewMedInput("");
    setShowAddMed(false);
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionInput.trim()) return;
    const newAction: ActionItem = {
      id: `act-${Date.now()}`,
      task: newActionInput.trim(),
      dueDate: "This week",
      completed: false,
      category: "LIFESTYLE",
    };
    setActions([...actions, newAction]);
    setNewActionInput("");
  };

  return (
    <div className="rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-md p-4 border border-white/60 dark:border-slate-800 shadow-sm flex flex-col gap-4 transition-colors">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-teal-500 to-sky-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Add-on Features</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-medium border border-teal-200/60 dark:border-teal-800">
          AI Synchronized
        </span>
      </div>

      {/* Dual Section Grid: Interaction Checker (Left) + Action Planner (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left Column: Interaction Checker */}
        <div className="flex flex-col rounded-xl bg-white/80 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 p-3 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Interaction Checker</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Cross-reference with lab biomarkers</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddMed(!showAddMed)}
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium flex items-center gap-1 hover:underline"
              type="button"
            >
              <Plus className="w-3.5 h-3.5" />
              Check Drug
            </button>
          </div>

          {/* Status highlight pill */}
          <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">No Contraindications Detected</span>
          </div>

          {showAddMed && (
            <form onSubmit={handleAddMed} className="mb-2.5 flex gap-1.5">
              <input
                type="text"
                value={newMedInput}
                onChange={(e) => setNewMedInput(e.target.value)}
                placeholder="Enter drug or supplement (e.g. Aspirin)..."
                className="text-xs flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition"
              >
                Scan
              </button>
            </form>
          )}

          {/* Medications list */}
          <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
            {meds.map((med) => (
              <div
                key={med.id}
                className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition text-xs flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2">
                  <Pill className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{med.name}</span>
                      <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">({med.dosage})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{med.indication}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    med.status === "SAFE"
                      ? "bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : med.status === "WARNING"
                      ? "bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      : "bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {med.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Action Planner */}
        <div className="flex flex-col rounded-xl bg-white/80 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800 p-3 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Action Planner</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Adherence & clinical milestones</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {actions.filter((a) => a.completed).length}/{actions.length} Done
            </span>
          </div>

          {/* Mini weekly calendar strip */}
          <div className="grid grid-cols-7 gap-1 mb-2.5">
            {weekDays.map((item, idx) => {
              const isSelected = activeDay === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveDay(idx)}
                  className={`flex flex-col items-center py-1 rounded-lg text-center transition ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs font-semibold"
                      : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider">{item.day}</span>
                  <span className="text-xs mt-0.5">{item.date}</span>
                  {item.hasEvent && (
                    <span
                      className={`h-1 w-1 rounded-full mt-0.5 ${
                        isSelected ? "bg-white" : "bg-indigo-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Tasks list */}
          <div className="space-y-1.5 overflow-y-auto max-h-[135px] pr-1">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => toggleAction(action.id)}
                className={`w-full text-left p-1.5 rounded-lg border transition flex items-start gap-2 ${
                  action.completed
                    ? "bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-500"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {action.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5 hover:text-indigo-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs truncate ${
                      action.completed ? "line-through text-slate-400 dark:text-slate-500" : "font-medium"
                    }`}
                  >
                    {action.task}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{action.dueDate}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Quick add action input */}
          <form onSubmit={handleAddAction} className="mt-2 flex gap-1">
            <input
              type="text"
              value={newActionInput}
              onChange={(e) => setNewActionInput(e.target.value)}
              placeholder="Add personal health goal..."
              className="text-xs flex-1 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-slate-800 dark:bg-indigo-600 text-white rounded-md hover:bg-slate-900 dark:hover:bg-indigo-700 transition shrink-0"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
