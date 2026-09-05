"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LayoutDashboard, LogOut, Search, Settings, Stethoscope, Upload, Users, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeProvider";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistant", label: "Medi-Report Assistant", icon: Sparkles, badge: "AI" },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/reports", label: "Reports", icon: Stethoscope },
  { href: "/review", label: "Review Queue", icon: Bell },
  { href: "/timeline", label: "Timeline", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ patients: Array<{ id: string; fullName: string }>; reports: Array<{ id: string; filename: string; patientId: string }> }>({
    patients: [],
    reports: [],
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ patients: [], reports: [] });
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-200">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex md:flex-col transition-colors duration-200">
          <div className="px-5 py-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-700 dark:bg-teal-600 text-sm font-bold text-white shadow-xs">ML</span>
              <span>
                <span className="block text-sm font-semibold tracking-wide text-slate-900 dark:text-white">MEDLENS</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">Clinical information intelligence</span>
              </span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3" aria-label="Main">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-teal-50 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300 dark:border dark:border-teal-800/40 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-gradient-to-r from-teal-500 to-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 px-4 py-3 backdrop-blur transition-colors duration-200">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
              <Input
                className="pl-9 dark:bg-slate-800/90 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Search patients or reports"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                aria-label="Search patients or reports"
              />
              {open && (results.patients.length || results.reports.length) ? (
                <div className="absolute mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {results.patients.map((p) => (
                    <button
                      key={p.id}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/patients/${p.id}`);
                      }}
                    >
                      {p.fullName}
                    </button>
                  ))}
                  {results.reports.map((r) => (
                    <button
                      key={r.id}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/patients/${r.patientId}/reports`);
                      }}
                    >
                      {r.filename}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">Demo clinician</span>
              <ThemeToggle />
              <Button
                variant="ghost"
                className="dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  router.push("/login");
                }}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main id="main" className="flex-1 px-4 py-6 md:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
